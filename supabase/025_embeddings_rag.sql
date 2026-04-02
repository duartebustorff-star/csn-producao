-- Migration 025: RAG embeddings com pgvector
-- CSN Opus S36 — Retrieval Augmented Generation
-- Dependencia: extensao pgvector (vector 0.8.0)

-- 1. Activar extensao pgvector
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Tabela embeddings
CREATE TABLE IF NOT EXISTS embeddings (
  id            BIGSERIAL PRIMARY KEY,
  documento_id  INTEGER REFERENCES documentos(id) ON DELETE CASCADE,
  fornecedor_id INTEGER REFERENCES fornecedores(id) ON DELETE SET NULL,
  conteudo_texto TEXT NOT NULL,
  embedding     extensions.vector(1536) NOT NULL,
  modelo        TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  metadata      JSONB DEFAULT '{}',
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indice HNSW para pesquisa semantica (cosine distance)
CREATE INDEX idx_embeddings_hnsw ON embeddings
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Indices auxiliares
CREATE INDEX idx_embeddings_documento   ON embeddings(documento_id);
CREATE INDEX idx_embeddings_fornecedor  ON embeddings(fornecedor_id);
CREATE INDEX idx_embeddings_modelo      ON embeddings(modelo);
CREATE INDEX idx_embeddings_criado_em   ON embeddings(criado_em DESC);

-- 5. Comentarios para documentacao
COMMENT ON TABLE embeddings IS 'RAG: vector embeddings dos documentos CSN para pesquisa semantica (ISO 22400 L3-DOC)';
COMMENT ON COLUMN embeddings.embedding IS 'Vector 1536 dims — OpenAI text-embedding-3-small ou compativel';
COMMENT ON COLUMN embeddings.conteudo_texto IS 'Texto extraido do PDF/email usado para gerar o embedding';
COMMENT ON COLUMN embeddings.metadata IS 'JSONB: tipo_doc, pagina, chunk_index, tokens, origem, etc.';
