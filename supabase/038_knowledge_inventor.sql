-- Migration 038: knowledge_inventor (RAG Inventor 2026 iLogic docs)
-- Fonte: chunks_COMPLETO.json (7419 chunks, Autodesk Inventor 2026 Local Help)
-- Embeddings: Voyage AI voyage-3 (1024 dims)

-- 1. pgvector ja esta activo (schema extensions), migration 025

-- 2. Tabela
CREATE TABLE IF NOT EXISTS knowledge_inventor (
  id             TEXT PRIMARY KEY,          -- inv2026_000001
  source         TEXT,
  url            TEXT,
  title          TEXT,
  section        TEXT,
  category       TEXT,
  tags           TEXT[],
  content        TEXT NOT NULL,
  code_snippets  JSONB DEFAULT '[]'::jsonb,
  embedding      extensions.vector(1024),   -- Voyage voyage-3
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indice HNSW cosine para pesquisa semantica
CREATE INDEX IF NOT EXISTS idx_knowledge_inventor_hnsw
  ON knowledge_inventor
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Indices auxiliares
CREATE INDEX IF NOT EXISTS idx_knowledge_inventor_section  ON knowledge_inventor(section);
CREATE INDEX IF NOT EXISTS idx_knowledge_inventor_category ON knowledge_inventor(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_inventor_tags_gin ON knowledge_inventor USING GIN (tags);

-- 5. RPC de pesquisa por similaridade cosine
CREATE OR REPLACE FUNCTION match_inventor_docs (
  query_embedding extensions.vector(1024),
  match_count     int DEFAULT 10
)
RETURNS TABLE (
  id            TEXT,
  source        TEXT,
  url           TEXT,
  title         TEXT,
  section       TEXT,
  category      TEXT,
  tags          TEXT[],
  content       TEXT,
  code_snippets JSONB,
  similarity    float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ki.id,
    ki.source,
    ki.url,
    ki.title,
    ki.section,
    ki.category,
    ki.tags,
    ki.content,
    ki.code_snippets,
    1 - (ki.embedding <=> query_embedding) AS similarity
  FROM knowledge_inventor ki
  WHERE ki.embedding IS NOT NULL
  ORDER BY ki.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 6. Comentarios
COMMENT ON TABLE knowledge_inventor IS 'RAG: Autodesk Inventor 2026 Local Help chunks (iLogic, API, Snippets) para Sr. Manuel responder sobre iLogic';
COMMENT ON COLUMN knowledge_inventor.embedding IS 'Voyage AI voyage-3 embedding (1024 dims)';
COMMENT ON FUNCTION match_inventor_docs IS 'Top-k cosine similarity search sobre knowledge_inventor';
