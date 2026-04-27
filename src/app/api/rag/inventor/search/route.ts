import { NextRequest, NextResponse } from "next/server"
import { hybridRetrieve } from "@/lib/inventor-rag"

const DEFAULT_TOP_K = 10
const MAX_TOP_K = 50
const MAX_QUERY_CHARS = 2000

interface SearchBody {
  query?: unknown
  top_k?: unknown
}

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

  try {
    const merged = await hybridRetrieve(query, topK)
    const results = merged.map((c) => {
      const out: Record<string, unknown> = {
        id: c.id,
        title: c.title,
        content: c.content,
        similarity: Number(c.similarity.toFixed(6)),
        source_table: c.source_table,
      }
      if (c.source_table === "knowledge_inventor") {
        out.category = c.category ?? null
      } else {
        out.tipo = c.tipo ?? null
      }
      return out
    })
    return jsonWithCors({ results })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[rag/inventor/search] error:", msg)
    return jsonWithCors({ error: "retrieval_failed", detail: msg }, { status: 500 })
  }
}
