import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { hybridRetrieve, formatChunksForPrompt } from "@/lib/inventor-rag"

// ---------- config ----------
const CONTEXT_CHUNKS = 5
const CLAUDE_MODEL = "claude-haiku-4-5-20251001"
const MAX_TOKENS = 1024

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---------- types ----------
interface QueryBody {
  question?: unknown
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

  // 1. Retrieval: merged top-5 across knowledge_inventor + inventor_rag
  let chunks
  try {
    chunks = await hybridRetrieve(question, CONTEXT_CHUNKS)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[inventor/query] retrieval error:", msg)
    return jsonWithCors({ error: "retrieval_failed", detail: msg }, { status: 500 })
  }

  // 2. Call Claude Haiku with the retrieved context prepended in the system prompt
  const systemPrompt =
    "És o Agente Inventor da CSN. Respondes perguntas sobre Autodesk Inventor, iLogic, VB.NET e API usando APENAS o contexto fornecido abaixo. Se não encontrares resposta no contexto, diz que não tens informação. Responde em português.\n\n" +
    `Contexto (top ${chunks.length} chunks por similaridade):\n${formatChunksForPrompt(chunks)}`

  let answer = ""
  try {
    const completion = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
    })
    for (const block of completion.content) {
      if (block.type === "text") answer += block.text
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[inventor/query] claude error:", msg)
    return jsonWithCors({ error: "claude_failed", detail: msg }, { status: 500 })
  }

  // 3. Build response
  const sources = chunks.map((c) => ({
    title: c.title,
    source_table: c.source_table,
    section: c.section ?? null,
    tipo: c.tipo ?? null,
    url: c.url ?? null,
    similarity: Number(c.similarity.toFixed(4)),
  }))

  return jsonWithCors({
    answer: answer.trim(),
    sources,
  })
}
