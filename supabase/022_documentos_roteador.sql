-- Agente Roteador (L3-DOC) — registo de documentos classificados automaticamente
-- Estado inicial: uploads manuais (origem/tipo_entrada); email/WhatsApp em fase 2

CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  nome_ficheiro TEXT NOT NULL,
  url_ficheiro TEXT,
  storage_path TEXT,
  origem TEXT NOT NULL,
  tipo_entrada TEXT NOT NULL,
  colaborador_id TEXT REFERENCES colaboradores(id) ON DELETE SET NULL,
  tipo_documento TEXT NOT NULL,
  entidade_tipo TEXT,
  entidade_nif TEXT,
  entidade_nome TEXT,
  urgencia TEXT NOT NULL DEFAULT 'normal',
  classificacao JSONB,
  agente TEXT NOT NULL DEFAULT 'L3-DOC',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_documentos_origem ON documentos(origem);
CREATE INDEX IF NOT EXISTS idx_documentos_created ON documentos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documentos_colab ON documentos(colaborador_id);

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON documentos FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE documentos IS 'Documentos de entrada classificados pelo Agente Roteador L3-DOC (upload manual; integrações futuras)';
