-- CSN Produção — RH, Calendário, Ausências
-- Correr DEPOIS do 001_schema.sql e 002_seed.sql

-- ============================================
-- STORAGE BUCKET para documentos RH
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-rh', 'documentos-rh', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TABELA: documentos_rh
-- ============================================

CREATE TABLE documentos_rh (
  id SERIAL PRIMARY KEY,
  colaborador_id TEXT REFERENCES colaboradores(id),
  tipo TEXT NOT NULL,
  nome_ficheiro TEXT NOT NULL,
  descricao TEXT,
  url TEXT NOT NULL,
  dados_extraidos JSONB,
  uploaded_by TEXT REFERENCES colaboradores(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documentos_rh_colab ON documentos_rh(colaborador_id);
ALTER TABLE documentos_rh ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON documentos_rh FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA: calendario
-- ============================================

CREATE TABLE calendario (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  descricao TEXT,
  colaboradores_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_calendario_data ON calendario(data);
ALTER TABLE calendario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON calendario FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA: ausencias
-- ============================================

CREATE TABLE ausencias (
  id SERIAL PRIMARY KEY,
  colaborador_id TEXT REFERENCES colaboradores(id),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  tipo TEXT NOT NULL,
  notas TEXT,
  documento_rh_id INTEGER REFERENCES documentos_rh(id),
  aprovado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ausencias_colab ON ausencias(colaborador_id);
CREATE INDEX idx_ausencias_datas ON ausencias(data_inicio, data_fim);
ALTER TABLE ausencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON ausencias FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED: Calendário 2026 (feriados + pontes)
-- ============================================

INSERT INTO calendario (data, tipo, descricao, colaboradores_ids) VALUES
  ('2026-01-01', 'feriado', 'Ano Novo', NULL),
  ('2026-01-02', 'ponte', 'Ponte Ano Novo', NULL),
  ('2026-04-03', 'feriado', 'Sexta-feira Santa', NULL),
  ('2026-05-01', 'feriado', 'Dia do Trabalhador', NULL),
  ('2026-05-14', 'feriado', 'Ascensão - Feriado Municipal Mafra', NULL),
  ('2026-05-15', 'ponte', 'Ponte Ascensão', NULL),
  ('2026-06-04', 'feriado', 'Corpo de Deus', NULL),
  ('2026-06-05', 'ponte', 'Ponte Corpo de Deus', NULL),
  ('2026-06-10', 'feriado', 'Dia de Portugal', NULL),
  ('2026-11-30', 'ponte', 'Ponte Restauração', NULL),
  ('2026-12-01', 'feriado', 'Restauração da Independência', NULL),
  ('2026-12-07', 'ponte', 'Ponte Imaculada Conceição', NULL),
  ('2026-12-08', 'feriado', 'Imaculada Conceição', NULL),
  ('2026-12-25', 'feriado', 'Natal', NULL);
