import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"
import { analyzePdfForRoteador } from "@/lib/pdf-roteador"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/** Claude Sonnet 4 — override com ANTHROPIC_MODEL_ROTEADOR se necessário */
const ROTEADOR_MODEL =
  process.env.ANTHROPIC_MODEL_ROTEADOR?.trim() || "claude-sonnet-4-20250514"

const TIPOS_DOC = [
  "factura_fornecedor",
  "orcamento",
  "pedido_preco",
  "cit",
  "dav",
  "fam",
  "correspondencia",
  "outro",
] as const

type TipoDoc = (typeof TIPOS_DOC)[number]

const ROTEADOR_PROMPT = `És o Agente Documental (roteador L3-DOC) da Carlos dos Santos Nascimento Lda (metalomecânica / carroçarias).
Analisa o documento em anexo e classifica-o para encaminhamento interno.

Responde APENAS com um objeto JSON válido (sem markdown), com esta estrutura exata:
{
  "tipo_documento": "factura_fornecedor"|"orcamento"|"pedido_preco"|"cit"|"dav"|"fam"|"correspondencia"|"outro",
  "entidade": {
    "papel": "fornecedor"|"cliente"|null,
    "nif": "string com 9 dígitos se visível, senão null",
    "nome": "nome comercial ou razão social se identificável, senão null"
  },
  "urgencia": "normal"|"urgente",
  "confianca": 0.0,
  "notas": "uma frase curta em português"
}

Regras de classificação:
- factura_fornecedor: fatura de compra, nota de encomenda com IVA de fornecedor, documento de despesa com NIF de emitente fornecedor.
- orcamento: proposta de preço / orçamento dirigido à CSN ou a um cliente (obras, serviços).
- pedido_preco: pedido de cotação ou consulta de preço (não é fatura nem orçamento formal completo).
- cit: Certificado de Incapacidade Temporária (Segurança Social, baixa médica).
- dav: Declaração Aduaneira de Veículo (AT).
- fam: Folha de Aprovação de Modelo (IMT).
- correspondencia: carta, email impresso, ofício sem ser fatura nem orçamento.
- outro: quando não se encaixa com segurança nos anteriores.

Entidade:
- Se for factura de fornecedor: papel "fornecedor", extrai NIF do emitente se visível.
- Se for orçamento ou pedido de preço para um cliente: papel "cliente", nome do cliente se for o destinatário.
- Caso contrário entidade.papel pode ser null.

Urgência "urgente" se o texto indicar prazo curto, "URGENTE", entrega imediata, ou data limite nos próximos dias.`

type ContentBlock = Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam

function buildFileContent(base64: string, mimeType: string): ContentBlock {
  if (mimeType === "application/pdf") {
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    }
  }
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
      data: base64,
    },
  }
}

function cleanJSON(raw: string): string {
  let s = raw.trim()
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "")
  const start = s.indexOf("{")
  const end = s.lastIndexOf("}")
  if (start !== -1 && end !== -1 && end > start) {
    s = s.substring(start, end + 1)
  }
  return s
}

function normalizeTipo(t: unknown): TipoDoc {
  const s = String(t || "").toLowerCase().trim()
  if (TIPOS_DOC.includes(s as TipoDoc)) return s as TipoDoc
  return "outro"
}

function normalizeUrgencia(u: unknown): "normal" | "urgente" {
  return String(u || "").toLowerCase().trim() === "urgente" ? "urgente" : "normal"
}

function normalizeNif(n: unknown): string | null {
  const s = String(n ?? "")
    .replace(/\D/g, "")
    .slice(0, 12)
  if (s.length === 9) return s
  return null
}

interface Classificacao {
  tipo_documento: TipoDoc
  entidade_tipo: string | null
  entidade_nif: string | null
  entidade_nome: string | null
  urgencia: "normal" | "urgente"
  raw: Record<string, unknown>
}

interface PdfMeta {
  page_count: number
  extracted_text_sample: string
  candidate_nifs: string[]
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada" }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const origem = String(formData.get("origem") || "").trim()
    const tipoEntrada = String(formData.get("tipo_entrada") || "").trim()
    const colaboradorIdRaw = formData.get("colaborador_id")
    const colaboradorId =
      typeof colaboradorIdRaw === "string" && colaboradorIdRaw.trim() ? colaboradorIdRaw.trim() : null

    if (!file || !origem || !tipoEntrada) {
      return NextResponse.json(
        { error: "Campos obrigatórios: file, origem, tipo_entrada" },
        { status: 400 }
      )
    }

    const isImage = file.type.startsWith("image/")
    const isPDF = file.type === "application/pdf"
    if (!isImage && !isPDF) {
      return NextResponse.json({ error: "Apenas imagens ou PDF são suportados" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const fileContent = buildFileContent(base64, file.type)

    let pdfHint = ""
    let pdfMeta: PdfMeta | null = null
    if (isPDF) {
      try {
        const { pageCount, extractedTextSample, candidateNifs } = await analyzePdfForRoteador(arrayBuffer)
        pdfMeta = {
          page_count: pageCount,
          extracted_text_sample: extractedTextSample,
          candidate_nifs: candidateNifs,
        }
        pdfHint = `

Dados auxiliares (pdf-lib: validação do PDF + amostra de texto legível nos bytes; pode estar incompleto):
- Páginas: ${pageCount}
- NIFs com 9 dígitos encontrados no ficheiro (candidatos): ${candidateNifs.length ? candidateNifs.join(", ") : "nenhum"}
- Amostra de texto (primeiros caracteres):
${extractedTextSample.slice(0, 6000)}`
      } catch {
        pdfHint = "\n(Não foi possível pré-analisar o PDF com pdf-lib; classifica só pelo documento em anexo.)"
      }
    }

    const claudeRes = await anthropic.messages.create({
      model: ROTEADOR_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [fileContent, { type: "text", text: ROTEADOR_PROMPT + pdfHint }],
        },
      ],
    })

    const rawText = claudeRes.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(cleanJSON(rawText)) as Record<string, unknown>
    } catch {
      parsed = {
        tipo_documento: "outro",
        entidade: { papel: null, nif: null, nome: null },
        urgencia: "normal",
        confianca: 0,
        notas: "Falha ao interpretar resposta do modelo",
      }
    }

    const tipoDoc = normalizeTipo(parsed.tipo_documento)
    const urgencia = normalizeUrgencia(parsed.urgencia)
    const ent = (parsed.entidade && typeof parsed.entidade === "object"
      ? parsed.entidade
      : {}) as Record<string, unknown>
    const papel = ent.papel != null ? String(ent.papel) : null
    const entidadeTipo =
      papel === "fornecedor" || papel === "cliente" ? papel : null
    const entidadeNif = ent.nif != null ? normalizeNif(ent.nif) : null
    const entidadeNome = ent.nome != null && String(ent.nome).trim() ? String(ent.nome).trim() : null

    const classificacao: Classificacao = {
      tipo_documento: tipoDoc,
      entidade_tipo: entidadeTipo,
      entidade_nif: entidadeNif,
      entidade_nome: entidadeNome,
      urgencia,
      raw: {
        ...parsed,
        agente: "L3-DOC",
        modelo: ROTEADOR_MODEL,
        pdf_meta: pdfMeta,
      },
    }

    const supabase = getServiceSupabase()

    let fornecedorId: number | null = null
    let fornecedorNome: string | null = null
    if (tipoDoc === "factura_fornecedor") {
      let nifLookup = entidadeNif
      if (!nifLookup && pdfMeta?.candidate_nifs.length === 1) {
        nifLookup = pdfMeta.candidate_nifs[0]
      }
      if (nifLookup) {
        const { data: forn } = await supabase
          .from("fornecedores")
          .select("id, nome")
          .eq("nif", nifLookup)
          .maybeSingle()
        if (forn) {
          fornecedorId = forn.id
          fornecedorNome = forn.nome
        }
      }
    }

    const dataEntrada = new Date().toISOString()
    const ext = file.name.split(".").pop() || (isPDF ? "pdf" : "jpg")
    const safeName = file.name.replace(/[^\w.\-]/g, "_").slice(0, 120)
    const storagePath = `roteador/${Date.now()}_${safeName || `doc.${ext}`}`

    const { error: upErr } = await supabase.storage
      .from("documentos")
      .upload(storagePath, Buffer.from(arrayBuffer), { contentType: file.type })

    if (upErr) {
      return NextResponse.json({ error: "Erro ao guardar ficheiro" }, { status: 500 })
    }

    const { data: signed } = await supabase.storage
      .from("documentos")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365)

    const urlFicheiro = signed?.signedUrl || ""

    const { data: row, error: insErr } = await supabase
      .from("documentos")
      .insert({
        nome_ficheiro: file.name,
        url_ficheiro: urlFicheiro,
        storage_path: storagePath,
        origem,
        tipo_entrada: tipoEntrada,
        colaborador_id: colaboradorId,
        tipo: classificacao.tipo_documento,
        tipo_documento: classificacao.tipo_documento,
        entidade_tipo: classificacao.entidade_tipo,
        entidade_nif: classificacao.entidade_nif,
        entidade_nome: classificacao.entidade_nome,
        urgencia: classificacao.urgencia,
        estado: "classificado",
        data_entrada: dataEntrada,
        fornecedor_id: fornecedorId,
        classificacao: classificacao.raw,
        agente: "L3-DOC",
      })
      .select("id")
      .single()

    if (insErr) {
      console.error("roteador insert documentos:", insErr)
      return NextResponse.json(
        {
          error: "Erro ao registar documento (executar migrações 022 e 023 em Supabase?)",
          detalhe: insErr.message,
        },
        { status: 500 }
      )
    }

    await audit({
      entidade_tipo: "documento",
      entidade_id: String(row.id),
      acao: "criar",
      utilizador_id: colaboradorId || "sistema",
      metadata: {
        roteador: "L3-DOC",
        tipo_documento: classificacao.tipo_documento,
        tipo: classificacao.tipo_documento,
        fornecedor_id: fornecedorId,
        origem,
        tipo_entrada: tipoEntrada,
        estado: "classificado",
      },
    })

    return NextResponse.json({
      ok: true,
      agente: "L3-DOC",
      modelo: ROTEADOR_MODEL,
      documento_id: row.id,
      classificacao: {
        tipo: classificacao.tipo_documento,
        estado: "classificado",
        data_entrada: dataEntrada,
        entidade: {
          tipo: classificacao.entidade_tipo,
          nif: classificacao.entidade_nif,
          nome: classificacao.entidade_nome,
        },
        fornecedor:
          fornecedorId != null
            ? { id: fornecedorId, nome: fornecedorNome }
            : null,
        urgencia: classificacao.urgencia,
        confianca: typeof parsed.confianca === "number" ? parsed.confianca : null,
        notas: typeof parsed.notas === "string" ? parsed.notas : null,
        pdf_meta: pdfMeta,
      },
      ficheiro: {
        nome: file.name,
        url: urlFicheiro,
        storage_path: storagePath,
      },
      notificacao: `Documento classificado como ${classificacao.tipo_documento} (urgência: ${classificacao.urgencia}).`,
    })
  } catch (e) {
    console.error("roteador error:", e)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
