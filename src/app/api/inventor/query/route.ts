import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getServiceSupabase } from "@/lib/supabase"

// ---------- config ----------
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings"
const VOYAGE_MODEL = "voyage-3"
const MATCH_COUNT = 5
const CLAUDE_MODEL = "claude-haiku-4-5-20251001"
const MAX_TOKENS = 1024

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---------- types ----------
interface InventorChunk {
  id: string
  source: string | null
  url: string | null
  title: string | null
  section: string | null
  category: string | null
  tags: string[] | null
  content: string
  code_snippets: unknown
  similarity: number
}

interface QueryBody {
  question?: unknown
}

// ---------- helpers ----------
async function voyageEmbedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) throw new Error("VOYAGE_API_KEY not configured")

  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text],
      input_type: "query",
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Voyage API ${res.status}: ${body.slice(0, 300)}`)
  }

  const data = (await res.json()) as { data: Array<{ embedding: number[] }> }
  if (!data.data?.[0]?.embedding) {
    throw new Error("Voyage API returned no embedding")
  }
  return data.data[0].embedding
}

function buildContext(chunks: InventorChunk[]): string {
  if (chunks.length === 0) return "(nenhum contexto encontrado)"
  return chunks
    .map((c, i) => {
      const title = c.title ?? "(sem título)"
      const section = c.section ?? "n/a"
      const url = c.url ?? ""
      const sim = c.similarity.toFixed(3)
      const content = (c.content ?? "").slice(0, 3000)
      return `[${i + 1}] ${title} (section=${section}, similarity=${sim})\n${url}\n${content}`
    })
    .join("\n\n---\n\n")
}

// ---------- CORS ----------
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

function jsonWithCors(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status, headers: CORS_HEADERS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// ---------- handler ----------
export async function POST(req: NextRequest) {
  let body: QueryBody
  try {
    body = (await req.json()) as QueryBody
  } catch {
    return jsonWithCors({ error: "Invalid JSON body" }, { status: 400 })
  }

  const question = typeof body.question === "string" ? body.question.trim() : ""
  if (!question) {
    return jsonWithCors({ error: "question (string) is required" }, { status: 400 })
  }
  if (question.length > 2000) {
    return jsonWithCors({ error: "question too long (max 2000 chars)" }, { status: 400 })
  }

  // 1. Embed the question
  let queryEmbedding: number[]
  try {
    queryEmbedding = await voyageEmbedQuery(question)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[inventor/query] voyage error:", msg)
    return jsonWithCors({ error: "embedding_failed", detail: msg }, { status: 500 })
  }

  // 2. Vector search via RPC match_inventor_docs
  const supabase = getServiceSupabase()
  const { data: rpcData, error: rpcError } = await supabase.rpc("match_inventor_docs", {
    query_embedding: queryEmbedding,
    match_count: MATCH_COUNT,
  })

  if (rpcError) {
    console.error("[inventor/query] rpc error:", rpcError.message)
    return jsonWithCors(
      { error: "rpc_failed", detail: rpcError.message },
      { status: 500 }
    )
  }

  const chunks = (rpcData ?? []) as InventorChunk[]

  // 3. Call Claude Haiku with the retrieved context
  const systemPrompt =
    "És o Agente Inventor da CSN. Respondes perguntas sobre Autodesk Inventor, iLogic, VB.NET e API usando APENAS o contexto fornecido. Se não encontrares resposta no contexto, diz que não tens informação. Responde em português."

  const userPrompt = `Contexto:\n${buildContext(chunks)}\n\nPergunta: ${question}`

  let answer = ""
  try {
    const completion = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })
    for (const block of completion.content) {
      if (block.type === "text") answer += block.text
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[inventor/query] claude error:", msg)
    return jsonWithCors({ error: "claude_failed", detail: msg }, { status: 500 })
  }

  // 4. Build response
  const sources = chunks.map((c) => ({
    title: c.title,
    section: c.section,
    url: c.url,
    similarity: Number(c.similarity?.toFixed?.(4) ?? c.similarity),
  }))

  return jsonWithCors({
    answer: answer.trim(),
    sources,
  })
}
