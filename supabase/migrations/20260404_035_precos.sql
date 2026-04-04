-- Migration 035: precos
-- ISA-95: L4-COM

CREATE TABLE IF NOT EXISTS precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_produto TEXT NOT NULL CHECK (tipo_produto IN ('carrocaria', 'acessorio', 'servico')),
  carrocaria_id UUID REFERENCES catalogo_carrocarias(id),
  acessorio_id UUID REFERENCES catalogo_acessorios(id),
  preco_base DECIMAL NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'EUR',
  tabela TEXT NOT NULL DEFAULT 'publico' CHECK (tabela IN ('publico', 'concessionario', 'especial')),
  valido_desde DATE NOT NULL DEFAULT CURRENT_DATE,
  valido_ate DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  nivel_isa95 TEXT NOT NULL DEFAULT 'L4-COM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_precos_activos ON precos(tipo_produto, activo) WHERE activo = true;

ALTER TABLE precos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "precos_read" ON precos FOR SELECT USING (true);

COMMENT ON TABLE precos IS 'Configurador: tabela de precos por produto (ISA-95 L4-COM)';
