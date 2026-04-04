-- Migration 032: catalogo_chassis
-- ISA-95: L4-COM
-- Mapeado do JPM: marcas, modelos, entre-eixos, pesos chassis

CREATE TABLE IF NOT EXISTS catalogo_chassis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  variante TEXT,

  -- Categoria PBT (como JPM)
  pbt_categoria TEXT NOT NULL CHECK (pbt_categoria IN ('2T', '3T6', '5T6')),
  pbt_kg DECIMAL NOT NULL,

  -- Cabine
  tipo_cabine TEXT NOT NULL CHECK (tipo_cabine IN ('simples', 'dupla')),
  num_lugares INTEGER NOT NULL DEFAULT 3,

  -- Entre-eixos disponiveis
  entre_eixos_mm INTEGER NOT NULL,
  sufixo_entre_eixos TEXT,

  -- Peso do chassis (quando conhecido)
  peso_chassis_kg DECIMAL,
  peso_auto_preenchido BOOLEAN DEFAULT false,

  -- Classificacao ambiental
  classe_emissao TEXT DEFAULT 'Euro 6',

  -- Tipo de rodado
  rodado TEXT DEFAULT 'simples' CHECK (rodado IN ('simples', 'duplo')),

  -- Electrico?
  electrico BOOLEAN DEFAULT false,

  activo BOOLEAN NOT NULL DEFAULT true,
  nivel_isa95 TEXT NOT NULL DEFAULT 'L4-COM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chassis_unico UNIQUE (marca, modelo, variante, pbt_categoria, tipo_cabine, entre_eixos_mm, rodado)
);

CREATE INDEX idx_cat_chassis_marca ON catalogo_chassis(marca);
CREATE INDEX idx_cat_chassis_pbt ON catalogo_chassis(pbt_categoria);
CREATE INDEX idx_cat_chassis_modelo ON catalogo_chassis(marca, modelo);

ALTER TABLE catalogo_chassis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalogo_chassis_read" ON catalogo_chassis FOR SELECT USING (true);

COMMENT ON TABLE catalogo_chassis IS 'Configurador: catalogo de chassis com marcas, modelos, entre-eixos e pesos (ISA-95 L4-COM)';
