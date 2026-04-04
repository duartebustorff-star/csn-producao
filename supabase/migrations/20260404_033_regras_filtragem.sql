-- Migration 033: regras_filtragem
-- ISA-95: L4-COM
-- Mapeado do JPM: que tipo carrocaria + material e compativel com que

CREATE TABLE IF NOT EXISTS regras_filtragem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Condicao
  pbt_categoria TEXT,  -- null = aplica a todas
  tipo_carrocaria TEXT NOT NULL,
  material TEXT NOT NULL,

  -- Resultado
  permitido BOOLEAN NOT NULL DEFAULT true,
  motivo TEXT,

  nivel_isa95 TEXT NOT NULL DEFAULT 'L4-COM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE regras_filtragem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regras_filtragem_read" ON regras_filtragem FOR SELECT USING (true);

-- Regras do JPM (seed data)
INSERT INTO regras_filtragem (pbt_categoria, tipo_carrocaria, material, permitido, motivo) VALUES
-- Tribenne: so aluminio (bloqueios)
('2T', 'basculante_trilateral', 'aco', false, 'Basculante trilateral so disponivel em aluminio'),
('3T6', 'basculante_trilateral', 'aco', false, 'Basculante trilateral so disponivel em aluminio'),
('5T6', 'basculante_trilateral', 'aco', false, 'Basculante trilateral so disponivel em aluminio'),
('2T', 'basculante_trilateral', 'misto', false, 'Basculante trilateral so disponivel em aluminio'),
('3T6', 'basculante_trilateral', 'misto', false, 'Basculante trilateral so disponivel em aluminio'),
('5T6', 'basculante_trilateral', 'misto', false, 'Basculante trilateral so disponivel em aluminio'),
('2T', 'basculante_trilateral', 'aluminio_madeira', false, 'Basculante trilateral so disponivel em aluminio'),
('3T6', 'basculante_trilateral', 'aluminio_madeira', false, 'Basculante trilateral so disponivel em aluminio'),
('5T6', 'basculante_trilateral', 'aluminio_madeira', false, 'Basculante trilateral so disponivel em aluminio'),
-- Basculante traseira 5.6-7.5T: so aco
('5T6', 'basculante_traseira', 'aluminio', false, 'Basculante traseira 5.6-7.5T so disponivel em aco'),
('5T6', 'basculante_traseira', 'misto', false, 'Basculante traseira 5.6-7.5T so disponivel em aco'),
('5T6', 'basculante_traseira', 'aluminio_madeira', false, 'Basculante traseira 5.6-7.5T so disponivel em aco'),
-- Estrado: aluminio_madeira permitido
(NULL, 'estrado', 'aluminio_madeira', true, 'Estrado com chao em madeira disponivel'),
-- Basculante traseira 2-3.5T: aco, aluminio, misto permitidos
('2T', 'basculante_traseira', 'aco', true, NULL),
('2T', 'basculante_traseira', 'aluminio', true, NULL),
('2T', 'basculante_traseira', 'misto', true, NULL),
('3T6', 'basculante_traseira', 'aco', true, NULL),
('3T6', 'basculante_traseira', 'aluminio', true, NULL),
('3T6', 'basculante_traseira', 'misto', true, NULL),
('5T6', 'basculante_traseira', 'aco', true, NULL),
-- Estrado: aco e aluminio permitidos
(NULL, 'estrado', 'aco', true, NULL),
(NULL, 'estrado', 'aluminio', true, NULL),
-- Tribenne: so aluminio (positivo)
('2T', 'basculante_trilateral', 'aluminio', true, NULL),
('3T6', 'basculante_trilateral', 'aluminio', true, NULL);

COMMENT ON TABLE regras_filtragem IS 'Configurador: regras de filtragem tipo carrocaria <-> material por PBT (ISA-95 L4-COM)';
