-- Migration 034: catalogo_acessorios
-- ISA-95: L4-COM

CREATE TABLE IF NOT EXISTS catalogo_acessorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN (
    'grua', 'plataforma_elevatoria', 'pontos_amarracao',
    'escada', 'caixa_ferramentas', 'proteccao_cabine',
    'porta_traseira', 'porta_lateral', 'iluminacao',
    'cofre_cabine', 'pintura', 'reboque', 'outro'
  )),
  peso_kg DECIMAL NOT NULL DEFAULT 0,
  tipos_carrocaria_compativeis TEXT[],
  tipos_carrocaria_incompativeis TEXT[],
  largura_minima_mm INTEGER,
  activo BOOLEAN NOT NULL DEFAULT true,
  nivel_isa95 TEXT NOT NULL DEFAULT 'L4-COM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE catalogo_acessorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalogo_acessorios_read" ON catalogo_acessorios FOR SELECT USING (true);

-- Cofre atras da cabine (como JPM Passo 3) + acessorios base
INSERT INTO catalogo_acessorios (codigo, nome, categoria, peso_kg, tipos_carrocaria_compativeis) VALUES
('ACC-COFRE-STD', 'Cofre atras da cabine standard', 'cofre_cabine', 45,
 ARRAY['basculante_traseira', 'basculante_trilateral', 'estrado', 'caixa_aberta']),
('ACC-PROT-CAB', 'Proteccao de cabine', 'proteccao_cabine', 25,
 ARRAY['basculante_traseira', 'basculante_trilateral', 'estrado', 'caixa_aberta']),
('ACC-AMARR-4', 'Pontos de amarracao (4 unidades)', 'pontos_amarracao', 8,
 ARRAY['estrado', 'caixa_aberta']),
('ACC-ESCADA', 'Escada lateral', 'escada', 12,
 ARRAY['basculante_traseira', 'basculante_trilateral', 'estrado', 'caixa_aberta']),
('ACC-ILUM-LED', 'Iluminacao LED de trabalho', 'iluminacao', 3,
 ARRAY['basculante_traseira', 'basculante_trilateral', 'estrado', 'caixa_aberta']);

COMMENT ON TABLE catalogo_acessorios IS 'Configurador: catalogo de acessorios com pesos e compatibilidade (ISA-95 L4-COM)';
