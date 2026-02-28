import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getServiceSupabase } from "@/lib/supabase"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CIT_PROMPT = `Analisa esta imagem de um Certificado de Incapacidade Temporária para o Trabalho (CIT / baixa médica portuguesa). Extrai em JSON: { "colaborador_nome": string|null, "niss": string|null, "data_inicio": "YYYY-MM-DD"|null, "data_fim": "YYYY-MM-DD"|null, "numero_dias": number|null, "classificacao": "DN"|"DD"|"T"|"AF"|"DP"|"AT"|"RC"|"IG"|null, "inicial_ou_prorrogacao": "inicial"|"prorrogacao"|null, "medico_nome": string|null, "instituicao": string|null }. Se não conseguires ler algum campo, coloca null. Responde APENAS com o JSON, sem markdown.`

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const colaboradorId = formData.get("colaborador_id") as string
    const tipo = formData.get("tipo") as string || "outro"
    const descricao = formData.get("descricao") as string | null
    const uploadedBy = formData.get("uploaded_by") as string

    if (!file || !colaboradorId || !uploadedBy) {
      return NextResponse.json({ error: "Faltam campos obrigatórios" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // 1. Upload do ficheiro para Supabase Storage
    const fileExt = file.name.split(".").pop() || "bin"
    const fileName = `${colaboradorId}/${Date.now()}_${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from("documentos-rh")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: "Erro ao guardar ficheiro" }, { status: 500 })
    }

    // 2. Gerar URL (signed, 1 year)
    const { data: urlData } = await supabase.storage
      .from("documentos-rh")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365)

    const url = urlData?.signedUrl || ""

    // 3. Se for baixa_medica, usar Claude Vision para extrair dados do CIT
    let dadosExtraidos = null

    if (tipo === "baixa_medica" && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      try {
        const base64 = fileBuffer.toString("base64")
        const mediaType = file.type.startsWith("image/")
          ? file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp"
          : "image/png" // fallback for PDF pages

        // Only process images directly, PDFs would need conversion
        if (file.type.startsWith("image/")) {
          const visionResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: { type: "base64", media_type: mediaType, data: base64 },
                  },
                  { type: "text", text: CIT_PROMPT },
                ],
              },
            ],
          })

          const responseText = visionResponse.content
            .filter((b): b is Anthropic.TextBlock => b.type === "text")
            .map((b) => b.text)
            .join("")

          try {
            dadosExtraidos = JSON.parse(responseText)
          } catch {
            // If JSON parsing fails, store raw response
            dadosExtraidos = { raw_response: responseText }
          }
        }
      } catch (err) {
        console.error("Vision extraction error:", err)
        // Continue without extraction — document still gets saved
      }
    }

    // 4. Registar na tabela documentos_rh
    const { data: doc, error: insertError } = await supabase
      .from("documentos_rh")
      .insert({
        colaborador_id: colaboradorId,
        tipo,
        nome_ficheiro: file.name,
        descricao,
        url,
        dados_extraidos: dadosExtraidos,
        uploaded_by: uploadedBy,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: "Erro ao registar documento" }, { status: 500 })
    }

    // 5. Se extraiu dados de CIT com datas, criar ausência automaticamente
    let ausencia = null
    if (
      dadosExtraidos &&
      dadosExtraidos.data_inicio &&
      dadosExtraidos.data_fim &&
      tipo === "baixa_medica"
    ) {
      const { data: ausenciaData } = await supabase
        .from("ausencias")
        .insert({
          colaborador_id: colaboradorId,
          data_inicio: dadosExtraidos.data_inicio,
          data_fim: dadosExtraidos.data_fim,
          tipo: "baixa",
          notas: `CIT extraído automaticamente — ${dadosExtraidos.numero_dias || "?"} dias`,
          documento_rh_id: doc.id,
          aprovado: true,
        })
        .select()
        .single()

      ausencia = ausenciaData
    }

    return NextResponse.json({ documento: doc, ausencia, dados_extraidos: dadosExtraidos })
  } catch (error) {
    console.error("RH upload error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
