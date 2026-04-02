-- Migration 025b: Fix vector dimensions for Voyage AI (voyage-3 = 1024 dims)
-- CSN Opus S36 — Altera de 1536 (OpenAI) para 1024 (Voyage AI)

ALTER TABLE embeddings DROP COLUMN embedding;
ALTER TABLE embeddings ADD COLUMN embedding extensions.vector(1024) NOT NULL;

DROP INDEX IF EXISTS idx_embeddings_hnsw;
CREATE INDEX idx_embeddings_hnsw ON embeddings
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Actualizar default do modelo
ALTER TABLE embeddings ALTER COLUMN modelo SET DEFAULT 'voyage-3';

COMMENT ON COLUMN embeddings.embedding IS 'Vector 1024 dims — Voyage AI voyage-3';
