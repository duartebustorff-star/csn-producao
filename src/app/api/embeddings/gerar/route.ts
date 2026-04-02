import { getServiceSupabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

const supabase = getServiceSupabase()

// Voyage-3: max 32K tokens por request, ~120K chars seguro
const MAX_CHUNK_CHARS = 24000
const OVERLAP_CHARS = 500

export async function POST(req: NextRequest) {
  try {
    const { documento_id } = await req.json()

    if (!documento_id) {
      return NextResponse.json({ error: "documento_id required" }, { status: 400 })
    }

    // 1. Buscar documento
    const { data: doc, error: docErr } = await supabase
      .from("documentos")
      .select("id, storage_path, nome_ficheiro, fornecedor_id, tipo_documento")
      .eq("id", documento_id)
      .single()

    if (docErr || !doc) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 })
    }

    if (!doc.storage_path) {
      return NextResponse.json({ error: "Documento sem storage_path" }, { status: 400 })
    }

    // 2. Download do PDF do Storage
    const { data: fileData, error: dlErr } = await supabase
      .storage
      .from("documentos")
      .download(doc.storage_path)

    if (dlErr || !fileData) {
      return NextResponse.json({ error: `Erro download: ${dlErr?.message}` }, { status: 500 })
    }

    // 3. Extrair texto do PDF
    const arrayBuffer = await fileData.arrayBuffer()
    const pdfParse = (await import("pdf-parse")).default
    const parsed = await pdfParse(Buffer.from(arrayBuffer))
    const textoCompleto = parsed.text?.trim()

    if (!textoCompleto || textoCompleto.length < 10) {
      return NextResponse.json({ error: "PDF sem texto extraível" }, { status: 422 })
    }

    // 4. Dividir em chunks se necessário
    const chunks = splitChunks(textoCompleto, MAX_CHUNK_CHARS, OVERLAP_CHARS)

    // 5. Gerar embeddings via Voyage AI
    const voyageKey = process.env.VOYAGE_API_KEY
    if (!voyageKey) {
      return NextResponse.json({ error: "VOYAGE_API_KEY não configurada" }, { status: 500 })
    }

    const embeddingResults: Array<{ id: number; chunk_index: number; tokens: number }> = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]

      const voyageRes = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${voyageKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: [chunk],
          model: "voyage-3",
        }),
      })

      if (!voyageRes.ok) {
        const err = await voyageRes.text()
        return NextResponse.json({ error: `Voyage AI error: ${err}` }, { status: 502 })
      }

      const voyageData = await voyageRes.json()
      const embedding = voyageData.data[0].embedding
      const tokens = voyageData.usage?.total_tokens || 0

      // 6. Guardar na tabela embeddings
      const { data: row, error: insErr } = await supabase
        .from("embeddings")
        .insert({
          documento_id: doc.id,
          fornecedor_id: doc.fornecedor_id,
          conteudo_texto: chunk,
          embedding: JSON.stringify(embedding),
          modelo: "voyage-3",
          metadata: {
            nome_ficheiro: doc.nome_ficheiro,
            tipo_documento: doc.tipo_documento,
            chunk_index: i,
            total_chunks: chunks.length,
            tokens,
            chars: chunk.length,
            paginas_pdf: parsed.numpages,
          },
        })
        .select("id")
        .single()

      if (insErr) {
        return NextResponse.json({ error: `Erro insert: ${insErr.message}` }, { status: 500 })
      }

      embeddingResults.push({ id: row.id, chunk_index: i, tokens })
    }

    return NextResponse.json({
      documento_id: doc.id,
      nome_ficheiro: doc.nome_ficheiro,
      fornecedor_id: doc.fornecedor_id,
      texto_chars: textoCompleto.length,
      paginas: parsed.numpages,
      chunks: embeddingResults.length,
      embeddings: embeddingResults,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Divide texto em chunks com overlap */
function splitChunks(text: string, maxChars: number, overlap: number): string[] {
  if (text.length <= maxChars) return [text]

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    let end = start + maxChars

    if (end < text.length) {
      const lastNewline = text.lastIndexOf("\n", end)
      const lastPeriod = text.lastIndexOf(". ", end)
      const breakPoint = Math.max(lastNewline, lastPeriod)
      if (breakPoint > start + maxChars * 0.5) {
        end = breakPoint + 1
      }
    }

    chunks.push(text.slice(start, end).trim())
    start = end - overlap
  }

  return chunks.filter(c => c.length > 0)
}
