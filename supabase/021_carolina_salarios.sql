-- Migration 021 — Carolina: Gestão Salarial
-- Tabelas: colaboradores_rh, processamentos_mensais, recibos_vencimento
-- ADR-020 | Nível ISA-95: 4 (ERP — RH)

-- ============================================
-- CLEANUP (re-run safe)
-- ============================================
DROP TABLE IF EXISTS recibos_vencimento CASCADE;
DROP TABLE IF EXISTS processamentos_mensais CASCADE;
DROP TABLE IF EXISTS colaboradores_rh CASCADE;

-- ============================================
-- TABELA: colaboradores_rh
-- Dados salariais separados de colaboradores (produção)
-- ============================================

CREATE TABLE colaboradores_rh (
  id SERIAL PRIMARY KEY,
  colaborador_id TEXT REFERENCES colaboradores(id),
  nome_completo TEXT NOT NULL,
  nif TEXT NOT NULL,
  niss TEXT NOT NULL,
  categoria_profissional TEXT DEFAULT 'Serralheiro civil',
  regime TEXT NOT NULL CHECK (regime IN ('normal', 'reformado')),
  taxa_ss_trabalhador NUMERIC(5,2) NOT NULL,
  taxa_ss_empresa NUMERIC(5,2) DEFAULT 23.75,
  isento_irs BOOLEAN DEFAULT true,
  taxa_irs NUMERIC(5,2) DEFAULT 0,
  tem_km_viatura BOOLEAN DEFAULT false,
  seguradora_at TEXT,
  apolice_at TEXT,
  iban TEXT,
  forma_pagamento TEXT DEFAULT 'transferencia',
  data_admissao DATE,
  notas TEXT,
  nivel_isa95 TEXT DEFAULT 'nivel4_erp',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(colaborador_id)
);

ALTER TABLE colaboradores_rh ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON colaboradores_rh FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA: processamentos_mensais
-- Cada mês processado (controla se já foi fechado)
-- ============================================

CREATE TABLE processamentos_mensais (
  id SERIAL PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  salario_base NUMERIC(10,2) NOT NULL,
  subsidio_alimentacao_diario NUMERIC(6,2) NOT NULL DEFAULT 4.55,
  estado TEXT DEFAULT 'rascunho' CHECK (estado IN ('rascunho', 'processado', 'fechado')),
  processado_por TEXT REFERENCES colaboradores(id),
  processado_em TIMESTAMPTZ,
  notas TEXT,
  nivel_isa95 TEXT DEFAULT 'nivel4_erp',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ano, mes)
);

ALTER TABLE processamentos_mensais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON processamentos_mensais FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA: recibos_vencimento
-- 1 recibo por colaborador por mês (tudo junto)
-- Campos: vencimento, sub alimentação, duod férias, duod natal,
--         KM (variável), desconto SS, IRS, líquido
-- ============================================

CREATE TABLE recibos_vencimento (
  id SERIAL PRIMARY KEY,
  numero_recibo TEXT NOT NULL UNIQUE,
  processamento_id INTEGER REFERENCES processamentos_mensais(id),
  colaborador_rh_id INTEGER NOT NULL REFERENCES colaboradores_rh(id),
  colaborador_id TEXT REFERENCES colaboradores(id),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  dias_uteis INTEGER NOT NULL,
  dias_trabalhados INTEGER NOT NULL,

  -- Valores do recibo
  vencimento_base NUMERIC(10,2) NOT NULL,
  subsidio_alimentacao NUMERIC(10,2) NOT NULL DEFAULT 0,
  duodecimo_ferias NUMERIC(10,2) NOT NULL DEFAULT 0,
  duodecimo_natal NUMERIC(10,2) NOT NULL DEFAULT 0,
  km_viatura NUMERIC(10,2) DEFAULT 0,

  -- Bruto (vencimento + duod férias + duod natal)
  bruto NUMERIC(10,2) NOT NULL,

  -- Descontos
  taxa_ss NUMERIC(5,2) NOT NULL,
  desconto_ss NUMERIC(10,2) NOT NULL,
  taxa_irs NUMERIC(5,2) DEFAULT 0,
  retencao_irs NUMERIC(10,2) DEFAULT 0,

  -- Líquido = bruto - desconto_ss - retencao_irs + sub_alimentacao + km
  liquido NUMERIC(10,2) NOT NULL,

  pdf_url TEXT,
  nivel_isa95 TEXT DEFAULT 'nivel4_erp',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(colaborador_id, ano, mes)
);

CREATE INDEX idx_recibos_colab ON recibos_vencimento(colaborador_id);
CREATE INDEX idx_recibos_periodo ON recibos_vencimento(ano, mes);
ALTER TABLE recibos_vencimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON recibos_vencimento FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED: Colaboradores RH
-- ============================================

INSERT INTO colaboradores_rh (colaborador_id, nome_completo, nif, niss, regime, taxa_ss_trabalhador)
VALUES
  (NULL, 'Bohdan HirskYY', '235388262', '11850252778', 'reformado', 7.5),
  (NULL, 'José Júlio Gomes Duarte de Almeida', '210410850', '11334024469', 'normal', 11),
  (NULL, 'João António Gomes', '318061309', '12170109589', 'normal', 11);

-- João António tem KM viatura
UPDATE colaboradores_rh SET tem_km_viatura = true
WHERE nif = '318061309';

-- ============================================
-- SEED: Processamentos mensais (Out-Dez 2025 + Jan-Mar 2026)
-- 2025: base 870€ | 2026: base 920€
-- ============================================

INSERT INTO processamentos_mensais (ano, mes, salario_base, subsidio_alimentacao_diario, estado) VALUES
  (2025, 10, 870.00, 4.55, 'rascunho'),
  (2025, 11, 870.00, 4.55, 'rascunho'),
  (2025, 12, 870.00, 4.55, 'rascunho'),
  (2026,  1, 920.00, 4.55, 'rascunho'),
  (2026,  2, 920.00, 4.55, 'rascunho'),
  (2026,  3, 920.00, 4.55, 'rascunho');

-- ============================================
-- AUDIT LOG
-- ============================================

INSERT INTO audit_log (entidade_tipo, entidade_id, acao, metadata)
VALUES ('migration', '021', 'CREATE', '{"descricao": "Carolina gestao salarial"}'::jsonb);
