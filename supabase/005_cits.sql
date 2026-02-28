-- CSN Produção — CITs (Certificados de Incapacidade Temporária)
-- Correr DEPOIS do 004_crm_leads_davs_fams.sql

-- ============================================
-- TABELA: cits
-- ============================================

CREATE TABLE cits (
  id SERIAL PRIMARY KEY,
  colaborador_id TEXT REFERENCES colaboradores(id),
  numero_cit TEXT,
  data_inicio DATE,
  data_fim DATE,
  numero_dias INTEGER,
  motivo TEXT,
  medico_nome TEXT,
  medico_cedula TEXT,
  unidade_saude TEXT,
  nif_utente TEXT,
  nome_utente TEXT,
  nuss TEXT,
  situacao TEXT,
  url_ficheiro TEXT,
  dados_raw JSONB,
  uploaded_by TEXT REFERENCES colaboradores(id),
  ausencia_id INTEGER REFERENCES ausencias(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(numero_cit)
);

CREATE INDEX idx_cits_colaborador ON cits(colaborador_id);
CREATE INDEX idx_cits_datas ON cits(data_inicio, data_fim);
ALTER TABLE cits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON cits FOR ALL USING (true) WITH CHECK (true);
