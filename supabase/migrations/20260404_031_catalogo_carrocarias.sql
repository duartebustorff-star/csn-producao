-- Migration 031: catalogo_carrocarias
-- ISA-95: L4-COM + L0-PHY
-- Mapeado do JPM: tipos, materiais, pesos por modelo

CREATE TABLE IF NOT EXISTS catalogo_carrocarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'basculante_traseira', 'basculante_trilateral', 'estrado',
    'caixa_aberta', 'furgao', 'frigorifico', 'plataforma', 'especial'
  )),
  material TEXT NOT NULL CHECK (material IN ('aco', 'aluminio', 'misto', 'aluminio_madeira')),

  -- Dimensoes interiores
  comprimento_int_mm INTEGER NOT NULL,
  largura_int_mm INTEGER NOT NULL DEFAULT 2000,
  altura_lateral_mm INTEGER,

  -- Pesos (mapeados do JPM)
  peso_carrocaria_kg DECIMAL NOT NULL,
  peso_subframe_kg DECIMAL NOT NULL DEFAULT 0,
  peso_reboque_kg DECIMAL NOT NULL DEFAULT 35,
  peso_total_equipamento_kg DECIMAL GENERATED ALWAYS AS (
    peso_carrocaria_kg + peso_subframe_kg + peso_reboque_kg
  ) STORED,

  -- Compatibilidade chassis
  pbt_categoria TEXT NOT NULL CHECK (pbt_categoria IN ('2T', '3T6', '5T6')),
  entre_eixos_minimo_mm INTEGER,
  entre_eixos_maximo_mm INTEGER,
  cabines_compativeis TEXT[] DEFAULT ARRAY['simples', 'dupla'],
  rodado TEXT DEFAULT 'simples' CHECK (rodado IN ('simples', 'duplo', 'ambos')),

  -- Modelo (referencia interna, equiv. JPM Model 55/75)
  modelo_ref TEXT,

  activo BOOLEAN NOT NULL DEFAULT true,
  nivel_isa95 TEXT NOT NULL DEFAULT 'L0-PHY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cat_carrocarias_tipo ON catalogo_carrocarias(tipo);
CREATE INDEX idx_cat_carrocarias_pbt ON catalogo_carrocarias(pbt_categoria);
CREATE INDEX idx_cat_carrocarias_material ON catalogo_carrocarias(material);

ALTER TABLE catalogo_carrocarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalogo_carrocarias_read" ON catalogo_carrocarias FOR SELECT USING (true);

CREATE TRIGGER set_cat_carrocarias_updated_at
  BEFORE UPDATE ON catalogo_carrocarias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE catalogo_carrocarias IS 'Configurador: catalogo de carrocarias com tipos, materiais, pesos e dimensoes (ISA-95 L0-PHY)';
