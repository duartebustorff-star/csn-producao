-- Migration 036: campos leads + seed data completo JPM
-- ISA-95: L4-COM

-- === LEADS EXTRA FIELDS ===
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_rodado TEXT CHECK (veiculo_rodado IN ('simples', 'duplo'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_balanco_traseiro_mm INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_comprimento_total_mm INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_num_lugares INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_classe_emissao TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_peso_chassis_kg DECIMAL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_peso_auto_preenchido BOOLEAN DEFAULT false;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS carrocaria_catalogo_id UUID REFERENCES catalogo_carrocarias(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS altura_lateral_mm INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cofre_cabine BOOLEAN DEFAULT false;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS peso_eixo_frente_vazio_kg DECIMAL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS peso_eixo_tras_vazio_kg DECIMAL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS peso_eixo_frente_carregado_kg DECIMAL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS peso_eixo_tras_carregado_kg DECIMAL;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS acessorios_ids UUID[];
ALTER TABLE leads ADD COLUMN IF NOT EXISTS peso_total_acessorios_kg DECIMAL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS configuracao_pdf_url TEXT;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS pbt_categoria TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS immatriculavel BOOLEAN;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS config_state_json JSONB;

-- === Fix unique constraint (same chassis in multiple GVWR categories) ===
ALTER TABLE catalogo_chassis DROP CONSTRAINT IF EXISTS chassis_unico;
ALTER TABLE catalogo_chassis ADD CONSTRAINT chassis_unico
  UNIQUE (marca, modelo, variante, pbt_categoria, tipo_cabine, entre_eixos_mm, rodado);

-- === SEED: CHASSIS (all JPM data — 85 entries, 17 brands) ===

INSERT INTO catalogo_chassis (marca, modelo, variante, pbt_categoria, pbt_kg, tipo_cabine, num_lugares, entre_eixos_mm, sufixo_entre_eixos, peso_chassis_kg, peso_auto_preenchido, classe_emissao, electrico) VALUES
-- CITROEN JUMPER (2-3.5T)
('CITROEN', 'JUMPER', NULL, '2T', 3500, 'simples', 3, 3000, NULL, 1580, true, 'Euro 6', false),
('CITROEN', 'JUMPER', NULL, '2T', 3500, 'simples', 3, 3450, NULL, 1635, true, 'Euro 6', false),
('CITROEN', 'JUMPER', NULL, '2T', 3500, 'simples', 3, 4035, 'L3', 1700, true, 'Euro 6', false),
('CITROEN', 'JUMPER', NULL, '2T', 3500, 'dupla', 7, 4035, 'L3', 1850, true, 'Euro 6', false),
-- CITROEN JUMPER (3.6-5.5T)
('CITROEN', 'JUMPER', NULL, '3T6', 4005, 'simples', 3, 3450, NULL, 1750, true, 'Euro 6', false),
('CITROEN', 'JUMPER', NULL, '3T6', 4005, 'simples', 3, 4035, 'L3', 1820, true, 'Euro 6', false),

-- FIAT DUCATO (2-3.5T)
('FIAT', 'DUCATO', NULL, '2T', 3500, 'simples', 3, 3000, NULL, 1590, true, 'Euro 6', false),
('FIAT', 'DUCATO', NULL, '2T', 3500, 'simples', 3, 3450, NULL, 1640, true, 'Euro 6', false),
('FIAT', 'DUCATO', NULL, '2T', 3500, 'simples', 3, 4035, 'L3', 1710, true, 'Euro 6', false),
('FIAT', 'DUCATO', NULL, '3T6', 4250, 'simples', 3, 3450, NULL, 1760, true, 'Euro 6', false),
('FIAT', 'DUCATO', NULL, '3T6', 4250, 'simples', 3, 4035, 'L3', 1830, true, 'Euro 6', false),

-- FORD TRANSIT (2-3.5T) — peso manual
('FORD', 'TRANSIT', NULL, '2T', 3500, 'simples', 3, 3137, 'L1', NULL, false, 'Euro 6', false),
('FORD', 'TRANSIT', NULL, '2T', 3500, 'simples', 3, 3504, 'L2', NULL, false, 'Euro 6', false),
('FORD', 'TRANSIT', NULL, '2T', 3500, 'simples', 3, 3954, 'L3', NULL, false, 'Euro 6', false),
('FORD', 'TRANSIT', NULL, '2T', 3500, 'simples', 3, 4522, 'L5', NULL, false, 'Euro 6', false),
('FORD', 'TRANSIT', NULL, '2T', 3500, 'dupla', 6, 3504, 'L2', NULL, false, 'Euro 6', false),
('FORD', 'TRANSIT', NULL, '2T', 3500, 'dupla', 6, 3954, 'L3', NULL, false, 'Euro 6', false),
-- FORD TRANSIT (3.6-5.5T)
('FORD', 'TRANSIT', NULL, '3T6', 4250, 'simples', 3, 3504, 'L2', NULL, false, 'Euro 6', false),
('FORD', 'TRANSIT', NULL, '3T6', 4250, 'simples', 3, 3954, 'L3', NULL, false, 'Euro 6', false),
-- FORD E-TRANSIT (3.6-5.5T)
('FORD', 'E-TRANSIT', NULL, '3T6', 4250, 'simples', 3, 3504, 'L2', NULL, false, 'Euro 6', true),

-- FUSO CANTER (all categories)
('FUSO', 'CANTER 4C', NULL, '2T', 3500, 'simples', 3, 2500, NULL, NULL, false, 'Euro 6', false),
('FUSO', 'CANTER 4S', NULL, '2T', 3500, 'simples', 3, 2800, NULL, NULL, false, 'Euro 6', false),
('FUSO', 'CANTER 4C', NULL, '3T6', 5200, 'simples', 3, 2500, NULL, NULL, false, 'Euro 6', false),
('FUSO', 'CANTER 4S', NULL, '3T6', 5200, 'simples', 3, 2800, NULL, NULL, false, 'Euro 6', false),
('FUSO', 'CANTER 4C', NULL, '5T6', 7500, 'simples', 3, 2500, NULL, NULL, false, 'Euro 6', false),
('FUSO', 'CANTER 4S', NULL, '5T6', 7500, 'simples', 3, 2800, NULL, NULL, false, 'Euro 6', false),

-- IVECO DAILY (2-3.5T)
('IVECO', 'DAILY', NULL, '2T', 3500, 'simples', 3, 3000, NULL, 2020, true, 'Euro 6', false),
('IVECO', 'DAILY', NULL, '2T', 3500, 'simples', 3, 3450, NULL, 2077, true, 'Euro 6', false),
-- IVECO DAILY (3.6-5.5T)
('IVECO', 'DAILY', NULL, '3T6', 5200, 'simples', 3, 3000, NULL, 2150, true, 'Euro 6', false),
('IVECO', 'DAILY', NULL, '3T6', 5200, 'simples', 3, 3450, NULL, 2200, true, 'Euro 6', false),
('IVECO', 'DAILY 35S17 W', NULL, '3T6', 3500, 'simples', 3, 3450, NULL, NULL, false, 'Euro 6', false),
('IVECO', 'DAILY 55S17 W', NULL, '3T6', 5500, 'simples', 3, 3450, NULL, NULL, false, 'Euro 6', false),
('IVECO', 'E-DAILY', NULL, '3T6', 5200, 'simples', 3, 3000, NULL, NULL, false, 'Euro 6', true),
-- IVECO DAILY (5.6-7.5T)
('IVECO', 'DAILY', NULL, '5T6', 7000, 'simples', 3, 3450, NULL, NULL, false, 'Euro 6', false),
('IVECO', 'DAILY', NULL, '5T6', 7000, 'simples', 3, 3750, NULL, NULL, false, 'Euro 6', false),
('IVECO', 'DAILY', NULL, '5T6', 7000, 'simples', 3, 4100, NULL, 3200, false, 'Euro 6', false),
('IVECO', 'DAILY', NULL, '5T6', 7000, 'dupla', 6, 3750, NULL, NULL, false, 'Euro 6', false),

-- MAN TGE (all categories)
('MAN', 'TGE', NULL, '2T', 3500, 'simples', 3, 3640, NULL, NULL, false, 'Euro 6', false),
('MAN', 'TGE', NULL, '2T', 3500, 'simples', 3, 4490, NULL, NULL, false, 'Euro 6', false),
('MAN', 'TGE', NULL, '3T6', 4250, 'simples', 3, 3640, NULL, NULL, false, 'Euro 6', false),
('MAN', 'TGE', NULL, '3T6', 4250, 'simples', 3, 4490, NULL, NULL, false, 'Euro 6', false),
('MAN', 'TGE', NULL, '5T6', 5500, 'simples', 3, 3640, NULL, NULL, false, 'Euro 6', false),
('MAN', 'TGE', NULL, '5T6', 5500, 'simples', 3, 4490, NULL, NULL, false, 'Euro 6', false),

-- MERCEDES SPRINTER (2-3.5T) — peso manual
('MERCEDES', 'SPRINTER', NULL, '2T', 3500, 'simples', 3, 3250, NULL, NULL, false, 'Euro 6', false),
('MERCEDES', 'SPRINTER', NULL, '2T', 3500, 'simples', 3, 3665, NULL, NULL, false, 'Euro 6', false),
('MERCEDES', 'SPRINTER', NULL, '2T', 3500, 'simples', 3, 3924, NULL, NULL, false, 'Euro 6', false),
('MERCEDES', 'SPRINTER', NULL, '2T', 3500, 'simples', 3, 4325, NULL, NULL, false, 'Euro 6', false),
('MERCEDES', 'SPRINTER', NULL, '2T', 3500, 'dupla', 6, 3665, NULL, NULL, false, 'Euro 6', false),
('MERCEDES', 'SPRINTER', NULL, '2T', 3500, 'dupla', 6, 3924, NULL, NULL, false, 'Euro 6', false),
-- MERCEDES ESPRINTER
('MERCEDES', 'ESPRINTER', NULL, '2T', 3500, 'simples', 3, 3665, NULL, NULL, false, 'Euro 6', true),
('MERCEDES', 'ESPRINTER', NULL, '3T6', 4250, 'simples', 3, 3665, NULL, NULL, false, 'Euro 6', true),
-- MERCEDES SPRINTER (3.6-5.5T)
('MERCEDES', 'SPRINTER', NULL, '3T6', 4100, 'simples', 3, 3665, NULL, NULL, false, 'Euro 6', false),
('MERCEDES', 'SPRINTER', NULL, '3T6', 4100, 'simples', 3, 3924, NULL, NULL, false, 'Euro 6', false),

-- NISSAN INTERSTAR (2-3.5T, 3.6-5.5T)
('NISSAN', 'INTERSTAR', NULL, '2T', 3500, 'simples', 3, 3185, 'L1', 1920, true, 'Euro 6', false),
('NISSAN', 'INTERSTAR', NULL, '2T', 3500, 'simples', 3, 3585, 'L2', 1980, true, 'Euro 6', false),
('NISSAN', 'INTERSTAR EV', NULL, '2T', 3500, 'simples', 3, 3585, 'L2', NULL, false, 'Euro 6', true),
('NISSAN', 'INTERSTAR', NULL, '3T6', 4000, 'simples', 3, 3585, 'L2', NULL, false, 'Euro 6', false),
('NISSAN', 'INTERSTAR EV', NULL, '3T6', 4000, 'simples', 3, 3585, 'L2', NULL, false, 'Euro 6', true),

-- OPEL MOVANO (2-3.5T, 3.6-5.5T)
('OPEL', 'MOVANO X250', NULL, '2T', 3500, 'simples', 3, 3185, 'L1', 1920, true, 'Euro 6', false),
('OPEL', 'MOVANO X250', NULL, '2T', 3500, 'simples', 3, 3585, 'L2', 1980, true, 'Euro 6', false),
('OPEL', 'MOVANO X250', NULL, '3T6', 4000, 'simples', 3, 3585, 'L2', NULL, false, 'Euro 6', false),

-- PEUGEOT BOXER (2-3.5T, 3.6-5.5T)
('PEUGEOT', 'BOXER', NULL, '2T', 3500, 'simples', 3, 3000, NULL, 1585, true, 'Euro 6', false),
('PEUGEOT', 'BOXER', NULL, '2T', 3500, 'simples', 3, 3450, NULL, 1640, true, 'Euro 6', false),
('PEUGEOT', 'BOXER', NULL, '2T', 3500, 'simples', 3, 4035, 'L3', 1705, true, 'Euro 6', false),
('PEUGEOT', 'BOXER', NULL, '3T6', 4005, 'simples', 3, 3450, NULL, 1755, true, 'Euro 6', false),
('PEUGEOT', 'BOXER', NULL, '3T6', 4005, 'simples', 3, 4035, 'L3', 1825, true, 'Euro 6', false),

-- RENAULT MASTER XDD (2-3.5T, 3.6-5.5T)
('RENAULT', 'MASTER XDD', NULL, '2T', 3500, 'simples', 3, 3185, 'L1', 1920, true, 'Euro 6', false),
('RENAULT', 'MASTER XDD', NULL, '2T', 3500, 'simples', 3, 3585, 'L2', 1980, true, 'Euro 6', false),
('RENAULT', 'MASTER XDD', NULL, '2T', 3500, 'simples', 3, 4035, 'L3', 2040, true, 'Euro 6', false),
('RENAULT', 'MASTER XDD EV', NULL, '2T', 3500, 'simples', 3, 3585, 'L2', NULL, false, 'Euro 6', true),
('RENAULT', 'MASTER XDD', NULL, '3T6', 4000, 'simples', 3, 3585, 'L2', 2050, true, 'Euro 6', false),
('RENAULT', 'MASTER XDD', NULL, '3T6', 4000, 'simples', 3, 4035, 'L3', 2120, true, 'Euro 6', false),
('RENAULT', 'MASTER XDD EV', NULL, '3T6', 4000, 'simples', 3, 3585, 'L2', NULL, false, 'Euro 6', true),

-- RENAULT TRUCKS MASTER XDD (same platform as Renault)
('RENAULT TRUCKS', 'MASTER XDD', NULL, '2T', 3500, 'simples', 3, 3185, 'L1', 1920, true, 'Euro 6', false),
('RENAULT TRUCKS', 'MASTER XDD', NULL, '2T', 3500, 'simples', 3, 3585, 'L2', 1980, true, 'Euro 6', false),
('RENAULT TRUCKS', 'MASTER XDD', NULL, '2T', 3500, 'simples', 3, 4035, 'L3', 2040, true, 'Euro 6', false),
('RENAULT TRUCKS', 'MASTER XDD EV', NULL, '2T', 3500, 'simples', 3, 3585, 'L2', NULL, false, 'Euro 6', true),
('RENAULT TRUCKS', 'MASTER XDD', NULL, '3T6', 4000, 'simples', 3, 3585, 'L2', 2050, true, 'Euro 6', false),
('RENAULT TRUCKS', 'MASTER XDD EV', NULL, '3T6', 4000, 'simples', 3, 3585, 'L2', NULL, false, 'Euro 6', true),

-- TOYOTA PROACE MAX (2-3.5T, 3.6-5.5T)
('TOYOTA', 'PROACE MAX', NULL, '2T', 3500, 'simples', 3, 3450, NULL, NULL, false, 'Euro 6', false),
('TOYOTA', 'PROACE MAX', NULL, '3T6', 4005, 'simples', 3, 3450, NULL, NULL, false, 'Euro 6', false),

-- VOLKSWAGEN CRAFTER (2-3.5T, 3.6-5.5T)
('VOLKSWAGEN', 'CRAFTER', '2017', '2T', 3500, 'simples', 3, 3640, NULL, NULL, false, 'Euro 6', false),
('VOLKSWAGEN', 'CRAFTER', '2017', '2T', 3500, 'simples', 3, 4490, NULL, NULL, false, 'Euro 6', false),
('VOLKSWAGEN', 'CRAFTER', '2017', '3T6', 4250, 'simples', 3, 3640, NULL, NULL, false, 'Euro 6', false),
('VOLKSWAGEN', 'CRAFTER', '2017', '3T6', 4250, 'simples', 3, 4490, NULL, NULL, false, 'Euro 6', false);

-- === SEED: CARROCARIAS (JPM data — 26 configs) ===

INSERT INTO catalogo_carrocarias (codigo, nome, tipo, material, comprimento_int_mm, largura_int_mm, altura_lateral_mm, peso_carrocaria_kg, peso_subframe_kg, pbt_categoria, entre_eixos_minimo_mm, entre_eixos_maximo_mm, modelo_ref) VALUES
-- Basculantes traseiras aco (2-3.5T)
('BT-ACO-2560-2T', 'Basculante traseira aco 2560mm', 'basculante_traseira', 'aco', 2560, 2000, 400, 520, 35, '2T', 2800, 3500, '55'),
('BT-ACO-2860-2T', 'Basculante traseira aco 2860mm', 'basculante_traseira', 'aco', 2860, 2000, 400, 567, 35, '2T', 3000, 4035, '55'),
('BT-ACO-3010-2T', 'Basculante traseira aco 3010mm', 'basculante_traseira', 'aco', 3010, 2000, 400, 556, 35, '2T', 3000, 4035, '55'),
('BT-ACO-3160-2T', 'Basculante traseira aco 3160mm', 'basculante_traseira', 'aco', 3160, 2000, 400, 604, 35, '2T', 3200, 4500, '55'),
('BT-ACO-3460-2T', 'Basculante traseira aco 3460mm', 'basculante_traseira', 'aco', 3460, 2000, 400, 640, 35, '2T', 3450, 4800, '55'),
('BT-ACO-3900-2T', 'Basculante traseira aco 3900mm', 'basculante_traseira', 'aco', 3900, 2000, 400, 690, 38, '2T', 3900, 5000, '55'),
-- Basculantes traseiras aluminio (2-3.5T)
('BT-ALU-2560-2T', 'Basculante traseira aluminio 2560mm', 'basculante_traseira', 'aluminio', 2560, 2000, 400, 320, 35, '2T', 2800, 3500, '55'),
('BT-ALU-2860-2T', 'Basculante traseira aluminio 2860mm', 'basculante_traseira', 'aluminio', 2860, 2000, 400, 350, 35, '2T', 3000, 4035, '55'),
('BT-ALU-3160-2T', 'Basculante traseira aluminio 3160mm', 'basculante_traseira', 'aluminio', 3160, 2000, 400, 385, 35, '2T', 3200, 4500, '55'),
('BT-ALU-3460-2T', 'Basculante traseira aluminio 3460mm', 'basculante_traseira', 'aluminio', 3460, 2000, 400, 415, 35, '2T', 3450, 4800, '55'),
-- Basculante traseira misto (2-3.5T)
('BT-MIX-3160-2T', 'Basculante traseira mista aluminio 3160mm', 'basculante_traseira', 'misto', 3160, 2000, 400, 490, 35, '2T', 3200, 4500, '55'),
-- Tribenne aluminio (2-3.5T) — SO aluminio
('TRIB-ALU-2860-2T', 'Tribenne aluminio 2860mm', 'basculante_trilateral', 'aluminio', 2860, 2000, 400, 420, 35, '2T', 3000, 4035, '55'),
('TRIB-ALU-3160-2T', 'Tribenne aluminio 3160mm', 'basculante_trilateral', 'aluminio', 3160, 2000, 400, 440, 35, '2T', 3200, 4500, '55'),
('TRIB-ALU-3260-2T', 'Tribenne aluminio 3260mm', 'basculante_trilateral', 'aluminio', 3260, 2000, 400, 446, 35, '2T', 3200, 4500, '55'),
('TRIB-ALU-3460-2T', 'Tribenne aluminio 3460mm', 'basculante_trilateral', 'aluminio', 3460, 2000, 400, 465, 35, '2T', 3450, 4800, '55'),
-- Estrados aco (2-3.5T)
('EST-ACO-3020-2T', 'Estrado aco 3020mm', 'estrado', 'aco', 3020, 2000, NULL, 410, 35, '2T', 3000, 4035, '55'),
('EST-ACO-3220-2T', 'Estrado aco 3220mm', 'estrado', 'aco', 3220, 2000, NULL, 439, 35, '2T', 3200, 4500, '55'),
('EST-ACO-3520-2T', 'Estrado aco 3520mm', 'estrado', 'aco', 3520, 2000, NULL, 470, 35, '2T', 3450, 4800, '55'),
-- Estrados aluminio (2-3.5T)
('EST-ALU-3220-2T', 'Estrado aluminio 3220mm', 'estrado', 'aluminio', 3220, 2000, NULL, 310, 35, '2T', 3200, 4500, '55'),
('EST-ALU-3520-2T', 'Estrado aluminio 3520mm', 'estrado', 'aluminio', 3520, 2000, NULL, 340, 35, '2T', 3450, 4800, '55'),
-- Estrado aluminio chao madeira (2-3.5T)
('EST-ALM-3220-2T', 'Estrado aluminio c/ chao madeira 3220mm', 'estrado', 'aluminio_madeira', 3220, 2000, NULL, 350, 35, '2T', 3200, 4500, '55'),
-- Basculantes traseiras aco (3.6-5.5T)
('BT-ACO-3160-3T6', 'Basculante traseira aco 3160mm 3.6-5.5T', 'basculante_traseira', 'aco', 3160, 2000, 400, 650, 40, '3T6', 3200, 4500, '55'),
('BT-ACO-3460-3T6', 'Basculante traseira aco 3460mm 3.6-5.5T', 'basculante_traseira', 'aco', 3460, 2000, 400, 700, 40, '3T6', 3450, 4800, '55'),
-- Basculantes traseiras aco (5.6-7.5T) — SO aco
('BT-ACO-3460-5T6', 'Basculante traseira aco 3460mm 7.5T', 'basculante_traseira', 'aco', 3460, 2080, 500, 850, 40, '5T6', 3450, 4500, '75'),
('BT-ACO-4060-5T6', 'Basculante traseira aco 4060mm 7.5T', 'basculante_traseira', 'aco', 4060, 2080, 500, 900, 40, '5T6', 3750, 5000, '75'),
('BT-ACO-4560-5T6', 'Basculante traseira aco 4560mm 7.5T', 'basculante_traseira', 'aco', 4560, 2080, 500, 923, 40, '5T6', 3750, 5000, '75');
