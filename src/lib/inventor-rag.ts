import { getServiceSupabase } from "@/lib/supabase"

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings"
const VOYAGE_MODEL = "voyage-3"
const PER_TABLE_LIMIT = 8

export interface HybridResult {
  id: string
  title: string | null
  content: string | null
  similarity: number
  source_table: "knowledge_inventor" | "inventor_rag"
  category?: string | null
  tipo?: string | null
  // passthrough metadata (not part of the public response contract, but useful
  // for callers that need richer context — e.g. the chat route).
  source?: string | null
  section?: string | null
  url?: string | null
  topicos?: string[] | null
  fonte?: string | null
}

interface KnowledgeInventorRow {
  id: string
  source: string | null
  url: string | null
  title: string | null
  section: string | null
  category: string | null
  tags: string[] | null
  content: string | null
  code_snippets: unknown
  similarity: number
}

interface InventorRagRow {
  chunk_id: string
  titulo: string | null
  content: string | null
  topicos: string[] | null
  fonte: string | null
  tipo: string | null
  similarity: number
}

export async function voyageEmbedQuery(text: string): Promise<number[]> {
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

export async function hybridRetrieve(
  query: string,
  topK: number
): Promise<HybridResult[]> {
  const queryEmbedding = await voyageEmbedQuery(query)
  const supabase = getServiceSupabase()

  const [knowledgeRes, ragRes] = await Promise.all([
    supabase.rpc("match_inventor_docs", {
      query_embedding: queryEmbedding,
      match_count: PER_TABLE_LIMIT,
    }),
    supabase.rpc("match_inventor_rag", {
      query_embedding: queryEmbedding,
      match_count: PER_TABLE_LIMIT,
    }),
  ])

  if (knowledgeRes.error) {
    throw new Error(`match_inventor_docs: ${knowledgeRes.error.message}`)
  }
  if (ragRes.error) {
    throw new Error(`match_inventor_rag: ${ragRes.error.message}`)
  }

  const knowledgeRows = (knowledgeRes.data ?? []) as KnowledgeInventorRow[]
  const ragRows = (ragRes.data ?? []) as InventorRagRow[]

  const merged: HybridResult[] = [
    ...knowledgeRows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      similarity: Number(r.similarity),
      source_table: "knowledge_inventor" as const,
      category: r.category,
      source: r.source,
      section: r.section,
      url: r.url,
    })),
    ...ragRows.map((r) => ({
      id: r.chunk_id,
      title: r.titulo,
      content: r.content,
      similarity: Number(r.similarity),
      source_table: "inventor_rag" as const,
      tipo: r.tipo,
      topicos: r.topicos,
      fonte: r.fonte,
    })),
  ]

  merged.sort((a, b) => b.similarity - a.similarity)
  return merged.slice(0, topK)
}

export function formatChunksForPrompt(chunks: HybridResult[]): string {
  if (chunks.length === 0) return "(nenhum contexto encontrado)"
  return chunks
    .map((c, i) => {
      const title = c.title ?? "(sem título)"
      const src = c.source_table === "knowledge_inventor"
        ? `section=${c.section ?? "n/a"}${c.url ? `, url=${c.url}` : ""}`
        : `tipo=${c.tipo ?? "n/a"}${c.fonte ? `, fonte=${c.fonte}` : ""}`
      const sim = c.similarity.toFixed(3)
      const body = (c.content ?? "").slice(0, 3000)
      return `[${i + 1}] (${c.source_table}) ${title} — ${src} — similarity=${sim}\n${body}`
    })
    .join("\n\n---\n\n")
}
