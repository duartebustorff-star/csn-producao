import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings"
const VOYAGE_MODEL = "voyage-3"
const DEFAULT_TOP_K = 8
const MAX_TOP_K = 50
const MAX_QUERY_CHARS = 2000

interface SearchBody {
  query?: unknown
  top_k?: unknown
}

interface MatchRow {
  chunk_id: string
  titulo: string | null
  content: string | null
  topicos: string[] | null
  fonte: string | null
  tipo: string | null
  similarity: number
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

function jsonWithCors(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status, headers: CORS_HEADERS })
}

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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  let body: SearchBody
  try {
    body = (await req.json()) as SearchBody
  } catch {
    return jsonWithCors({ error: "Invalid JSON body" }, { status: 400 })
  }

  const query = typeof body.query === "string" ? body.query.trim() : ""
  if (!query) {
    return jsonWithCors({ error: "query (string) is required" }, { status: 400 })
  }
  if (query.length > MAX_QUERY_CHARS) {
    return jsonWithCors(
      { error: `query too long (max ${MAX_QUERY_CHARS} chars)` },
      { status: 400 }
    )
  }

  let topK = DEFAULT_TOP_K
  if (body.top_k !== undefined) {
    const n = Number(body.top_k)
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
      return jsonWithCors(
        { error: "top_k must be a positive integer" },
        { status: 400 }
      )
    }
    topK = Math.min(n, MAX_TOP_K)
  }

  let queryEmbedding: number[]
  try {
    queryEmbedding = await voyageEmbedQuery(query)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[rag/inventor/search] voyage error:", msg)
    return jsonWithCors({ error: "embedding_failed", detail: msg }, { status: 500 })
  }

  const supabase = getServiceSupabase()
  const { data, error } = await supabase.rpc("match_inventor_rag", {
    query_embedding: queryEmbedding,
    match_count: topK,
  })

  if (error) {
    console.error("[rag/inventor/search] rpc error:", error.message)
    return jsonWithCors(
      { error: "rpc_failed", detail: error.message },
      { status: 500 }
    )
  }

  const rows = (data ?? []) as MatchRow[]
  const results = rows.map((r) => ({
    chunk_id: r.chunk_id,
    titulo: r.titulo,
    content: r.content,
    topicos: r.topicos,
    fonte: r.fonte,
    tipo: r.tipo,
    similarity: Number(r.similarity?.toFixed?.(6) ?? r.similarity),
  }))

  return jsonWithCors({ results })
}
