-- Migration 015 — Faturacao InvoiceXpress
-- Tabelas: clientes_faturacao, faturas, notas_credito
-- ADR-019 | Nivel ISA-95: 4 (ERP)

-- ============================================
-- TABELA: clientes_faturacao
-- ============================================

CREATE TABLE clientes_faturacao (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  nif TEXT NOT NULL,
  email TEXT,
  morada TEXT,
  localidade TEXT,
  codigo_postal TEXT,
  pais TEXT DEFAULT 'PT',
  invoicexpress_client_id TEXT,
  notas TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE clientes_faturacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON clientes_faturacao FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA: faturas
-- ============================================

CREATE TABLE faturas (
  id SERIAL PRIMARY KEY,
  numero_fatura TEXT,
  serie TEXT,
  invoicexpress_id TEXT UNIQUE,
  obra_id TEXT REFERENCES dossie_obra(id),
  cliente_faturacao_id INTEGER REFERENCES clientes_faturacao(id),
  estado TEXT DEFAULT 'rascunho' CHECK (estado IN ('rascunho', 'emitida', 'enviada', 'paga', 'anulada')),
  tipo TEXT DEFAULT 'fatura' CHECK (tipo IN ('fatura', 'fatura_recibo', 'nota_credito')),
  data_emissao DATE,
  data_vencimento DATE,
  base_tributavel NUMERIC(10,2),
  iva NUMERIC(10,2),
  total NUMERIC(10,2),
  pdf_url TEXT,
  invoicexpress_url TEXT,
  referencia_interna TEXT,
  notas TEXT,
  nivel_isa95 TEXT DEFAULT 'nivel4_erp',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_faturas_obra ON faturas(obra_id);
CREATE INDEX idx_faturas_estado ON faturas(estado);
CREATE INDEX idx_faturas_data_emissao ON faturas(data_emissao);

ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON faturas FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA: notas_credito
-- ============================================

CREATE TABLE notas_credito (
  id SERIAL PRIMARY KEY,
  fatura_original_id INTEGER NOT NULL REFERENCES faturas(id),
  invoicexpress_id TEXT UNIQUE,
  numero TEXT,
  motivo TEXT,
  total NUMERIC(10,2),
  data_emissao DATE,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notas_credito ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON notas_credito FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- AUDIT LOG
-- ============================================

INSERT INTO audit_log (entidade_tipo, entidade_id, acao, metadata)
VALUES ('migration', '015', 'CREATE', '{"descricao": "Faturacao InvoiceXpress (clientes_faturacao, faturas, notas_credito)"}'::jsonb);
