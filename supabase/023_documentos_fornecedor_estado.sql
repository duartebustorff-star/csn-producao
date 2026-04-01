-- Roteador L3-DOC: NIF em fornecedores + colunas documentos (tipo, estado, data_entrada, fornecedor_id)

-- NIF para cruzamento com facturas de fornecedor (índice único parcial)
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS nif TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_fornecedores_nif_unique
  ON fornecedores (nif)
  WHERE nif IS NOT NULL AND trim(nif) <> '';

COMMENT ON COLUMN fornecedores.nif IS 'NIF português (9 dígitos); usado pelo Agente Roteador para identificar fornecedor em facturas';

ALTER TABLE documentos ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'classificado';
UPDATE documentos SET estado = 'classificado' WHERE estado IS NULL;
ALTER TABLE documentos ALTER COLUMN estado SET NOT NULL;
ALTER TABLE documentos ALTER COLUMN estado SET DEFAULT 'classificado';

ALTER TABLE documentos ADD COLUMN IF NOT EXISTS data_entrada TIMESTAMPTZ DEFAULT now();
UPDATE documentos SET data_entrada = COALESCE(data_entrada, created_at) WHERE data_entrada IS NULL;
ALTER TABLE documentos ALTER COLUMN data_entrada SET NOT NULL;
ALTER TABLE documentos ALTER COLUMN data_entrada SET DEFAULT now();

ALTER TABLE documentos ADD COLUMN IF NOT EXISTS fornecedor_id INTEGER REFERENCES fornecedores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_documentos_fornecedor ON documentos(fornecedor_id);

ALTER TABLE documentos ADD COLUMN IF NOT EXISTS tipo TEXT;
UPDATE documentos SET tipo = tipo_documento WHERE tipo IS NULL AND tipo_documento IS NOT NULL;
UPDATE documentos SET tipo = 'outro' WHERE tipo IS NULL;
ALTER TABLE documentos ALTER COLUMN tipo SET NOT NULL;
ALTER TABLE documentos ALTER COLUMN tipo SET DEFAULT 'outro';

INSERT INTO audit_log (entidade_tipo, entidade_id, acao, metadata)
VALUES ('migration', '023', 'ALTER', '{"descricao": "documentos: estado, data_entrada, fornecedor_id, tipo; fornecedores.nif"}'::jsonb);
