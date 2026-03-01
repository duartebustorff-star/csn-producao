-- 006: Tabela de inspecoes automoveis (Controlauto)
-- Relatorios de inspecao periodica com dados de frenometro/opacimetro/ripometro

CREATE TABLE inspecoes (
  id SERIAL PRIMARY KEY,
  matricula TEXT NOT NULL,
  data_inspecao TIMESTAMPTZ,
  centro_inspecao TEXT,
  codigo_imt TEXT,
  linha TEXT,
  inspetor TEXT,
  peso_estatico_total INTEGER,
  peso_dinamico_total INTEGER,
  peso_estatico_eixo1_total INTEGER,
  peso_estatico_eixo1_esq INTEGER,
  peso_estatico_eixo1_dir INTEGER,
  peso_estatico_eixo2_total INTEGER,
  peso_estatico_eixo2_esq INTEGER,
  peso_estatico_eixo2_dir INTEGER,
  peso_dinamico_eixo1_total INTEGER,
  peso_dinamico_eixo1_esq INTEGER,
  peso_dinamico_eixo1_dir INTEGER,
  peso_dinamico_eixo2_total INTEGER,
  peso_dinamico_eixo2_esq INTEGER,
  peso_dinamico_eixo2_dir INTEGER,
  forca_travagem_servico NUMERIC,
  eficiencia_travao_servico_estatica NUMERIC,
  eficiencia_travao_servico_dinamica NUMERIC,
  forca_travagem_estacionamento NUMERIC,
  eficiencia_travao_estacionamento NUMERIC,
  opacidade_k NUMERIC,
  combustivel TEXT,
  ripometro_eixo1 NUMERIC,
  deficiencias JSONB,
  resultado TEXT,
  url_ficheiro TEXT,
  dados_raw JSONB,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(matricula, data_inspecao)
);

CREATE INDEX idx_inspecoes_matricula ON inspecoes(matricula);
CREATE INDEX idx_inspecoes_data ON inspecoes(data_inspecao);
ALTER TABLE inspecoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON inspecoes FOR ALL USING (true) WITH CHECK (true);
