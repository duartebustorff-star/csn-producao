-- CSN Produção — CRM, Leads, DAV, FAM, Parque
-- Correr DEPOIS dos migrations anteriores
-- ATENÇÃO: apaga e recria obras/fases/notas_obra

-- ============================================
-- LIMPAR TABELAS ANTIGAS (dependências primeiro)
-- ============================================

DROP TABLE IF EXISTS notas_obra CASCADE;
DROP TABLE IF EXISTS timetracking CASCADE;
DROP TABLE IF EXISTS fases_obra CASCADE;
DROP TABLE IF EXISTS obras CASCADE;

-- ============================================
-- TABELA: leads
-- ============================================

CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  cliente TEXT NOT NULL,
  cliente_final TEXT,
  tipo_carrocaria TEXT NOT NULL,
  tipo_taipais TEXT,
  dimensoes TEXT,
  veiculo_marca TEXT,
  veiculo_modelo TEXT,
  veiculo_designacao TEXT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(10,2),
  num_homologacao TEXT,
  notas_encomenda TEXT[],
  estado TEXT DEFAULT 'ganha',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON leads FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA: obras (reestruturada)
-- ============================================

CREATE TABLE obras (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id),
  vin TEXT UNIQUE,
  matricula TEXT,
  lugar_parque INTEGER,
  estado TEXT DEFAULT 'espera_documentacao',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_obras_lead ON obras(lead_id);
CREATE INDEX idx_obras_vin ON obras(vin);
CREATE INDEX idx_obras_estado ON obras(estado);
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON obras FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA: fases_obra (recriada)
-- ============================================

CREATE TABLE fases_obra (
  id SERIAL PRIMARY KEY,
  obra_id TEXT REFERENCES obras(id) ON DELETE CASCADE,
  fase_numero INTEGER NOT NULL,
  nome TEXT NOT NULL,
  estado TEXT DEFAULT 'pendente',
  responsavel TEXT REFERENCES colaboradores(id),
  horas_estimadas NUMERIC(6,2) DEFAULT 0,
  horas_reais NUMERIC(6,2) DEFAULT 0,
  notas TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(obra_id, fase_numero)
);

CREATE INDEX idx_fases_obra_id ON fases_obra(obra_id);
CREATE INDEX idx_fases_responsavel ON fases_obra(responsavel);
ALTER TABLE fases_obra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON fases_obra FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA: notas_obra (recriada)
-- ============================================

CREATE TABLE notas_obra (
  id SERIAL PRIMARY KEY,
  obra_id TEXT REFERENCES obras(id) ON DELETE CASCADE,
  colaborador_id TEXT REFERENCES colaboradores(id),
  texto TEXT NOT NULL,
  tipo TEXT DEFAULT 'nota',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notas_obra ON notas_obra(obra_id);
ALTER TABLE notas_obra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON notas_obra FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA: timetracking (recriada com FK correta)
-- ============================================

CREATE TABLE timetracking (
  id SERIAL PRIMARY KEY,
  colaborador_id TEXT REFERENCES colaboradores(id),
  obra_id TEXT REFERENCES obras(id),
  fase_obra_id INTEGER REFERENCES fases_obra(id),
  inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fim TIMESTAMPTZ,
  duracao_minutos NUMERIC(8,2),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_timetracking_colaborador ON timetracking(colaborador_id);
CREATE INDEX idx_timetracking_obra ON timetracking(obra_id);
CREATE INDEX idx_timetracking_ativo ON timetracking(colaborador_id) WHERE fim IS NULL;
ALTER TABLE timetracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON timetracking FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA: templates_fases
-- ============================================

CREATE TABLE templates_fases (
  id SERIAL PRIMARY KEY,
  tipo_carrocaria TEXT NOT NULL,
  tipo_taipais TEXT,
  fase_numero INTEGER NOT NULL,
  nome TEXT NOT NULL,
  horas_estimadas NUMERIC(6,2) DEFAULT 0,
  UNIQUE(tipo_carrocaria, tipo_taipais, fase_numero)
);

ALTER TABLE templates_fases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON templates_fases FOR ALL USING (true) WITH CHECK (true);

-- Template: Caixa Aberta + Taipais Madeira
INSERT INTO templates_fases (tipo_carrocaria, tipo_taipais, fase_numero, nome) VALUES
  ('Caixa Aberta', 'Madeira', 1, 'Corte'),
  ('Caixa Aberta', 'Madeira', 2, 'Assemblagem'),
  ('Caixa Aberta', 'Madeira', 3, 'Soldadura'),
  ('Caixa Aberta', 'Madeira', 4, 'Pintura da carroçaria'),
  ('Caixa Aberta', 'Madeira', 5, 'Pintura dos taipais'),
  ('Caixa Aberta', 'Madeira', 6, 'Montagem no veículo'),
  ('Caixa Aberta', 'Madeira', 7, 'Acabamentos'),
  ('Caixa Aberta', 'Madeira', 8, 'Pesagem'),
  ('Caixa Aberta', 'Madeira', 9, 'Termo de responsabilidade');

-- ============================================
-- TABELA: lugares_parque
-- ============================================

CREATE TABLE lugares_parque (
  numero INTEGER PRIMARY KEY,
  obra_id TEXT REFERENCES obras(id),
  ocupado BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lugares_parque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON lugares_parque FOR ALL USING (true) WITH CHECK (true);

-- Criar 50 lugares
INSERT INTO lugares_parque (numero) SELECT generate_series(1, 50);

-- ============================================
-- TABELA: davs
-- ============================================

CREATE TABLE davs (
  id SERIAL PRIMARY KEY,
  numero_dav TEXT NOT NULL,
  data_aceitacao DATE,
  versao INTEGER,
  revisao INTEGER,
  data_documento DATE,
  regime_isv TEXT,
  numero_referencia TEXT,
  operador_nif TEXT,
  operador_nome TEXT,
  proprietario_tipo_id TEXT,
  proprietario_nif TEXT,
  proprietario_nome TEXT,
  proprietario_morada TEXT,
  proprietario_localidade TEXT,
  proprietario_cod_postal TEXT,
  proprietario_pais TEXT,
  declarante_qualidade TEXT,
  declarante_tipo_id_representante TEXT,
  declarante_nif_representante TEXT,
  declarante_nif_sociedade TEXT,
  declarante_tipo_id TEXT,
  declarante_nif TEXT,
  declarante_nome TEXT,
  cod_homologacao TEXT,
  categoria_veiculo TEXT,
  tipo_veiculo_imt TEXT,
  tipo_veiculo_fiscal TEXT,
  marca TEXT,
  modelo TEXT,
  variante TEXT,
  versao_modelo TEXT,
  designacao_comercial TEXT,
  peso_bruto INTEGER,
  tara INTEGER,
  combustivel TEXT,
  cor TEXT,
  tipo_caixa TEXT,
  vin TEXT NOT NULL UNIQUE,
  numero_motor TEXT,
  numero_lugares INTEGER,
  cilindrada INTEGER,
  eixos_motores TEXT,
  comprimento_caixa INTEGER,
  altura_minima_caixa INTEGER,
  antepara_caixa TEXT,
  tipo_testes_co2 TEXT,
  emissao_co2 NUMERIC(8,2),
  reducao_co2_wltp TEXT,
  co2_wltp_apos_reducao TEXT,
  emissao_particulas NUMERIC(10,4),
  autonomia_bateria TEXT,
  caixa_velocidades TEXT,
  veiculo_estado TEXT,
  pais_procedencia TEXT,
  quilometros INTEGER,
  valor_comercial NUMERIC(12,2),
  pvp_primeira_matricula NUMERIC(12,2),
  data_entrada_territorio DATE,
  tipo_entrada TEXT,
  termo_prazo_dav DATE,
  dae_imp_alfandega TEXT,
  dae_imp_ano TEXT,
  dae_imp_numero TEXT,
  data_aceitacao_importacao DATE,
  livre_pratica TEXT,
  numero_livre_pratica TEXT,
  pais_entrada_livre_pratica TEXT,
  data_transmissao DATE,
  quilometros_transmissao INTEGER,
  taxa_iva NUMERIC(5,2),
  isencao_iva TEXT,
  op_nao_tributavel TEXT,
  modo_pagamento TEXT,
  garantia TEXT,
  fundamento_legal TEXT,
  servico_emissor TEXT,
  matricula TEXT,
  data_matricula DATE,
  tabela_isv TEXT,
  total_isv NUMERIC(12,2),
  completo BOOLEAN DEFAULT false,
  url_ficheiro TEXT,
  dados_raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_davs_vin ON davs(vin);
CREATE INDEX idx_davs_cod_homologacao ON davs(cod_homologacao);
CREATE INDEX idx_davs_matricula ON davs(matricula);
ALTER TABLE davs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON davs FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TABELA: fams
-- ============================================

CREATE TABLE fams (
  id SERIAL PRIMARY KEY,
  numero_homologacao_nacional TEXT NOT NULL,
  extensao TEXT NOT NULL,
  numero_homologacao_ce TEXT,
  situacao TEXT,
  data_despacho DATE,
  campo_0_1_marca TEXT,
  campo_0_1_marca_codigo TEXT,
  campo_0_2_modelo TEXT,
  campo_0_2_modelo_codigo TEXT,
  variante TEXT,
  versao TEXT,
  campo_0_2_1_designacao_comercial TEXT,
  campo_0_2_1_designacao_codigo TEXT,
  campo_0_4_categoria TEXT,
  campo_0_4_categoria_codigo TEXT,
  tipo TEXT,
  tipo_codigo TEXT,
  codigo_ce TEXT,
  campo_0_5_fabricante TEXT,
  campo_0_5_fabricante_codigo TEXT,
  campo_0_6_classe TEXT,
  campo_0_7_tipo_maquina TEXT,
  campo_1_eixos_f INTEGER,
  campo_1_eixos_r INTEGER,
  campo_1_eixos_t INTEGER,
  campo_1_rodas_f INTEGER,
  campo_1_rodas_r INTEGER,
  campo_1_rodas_t INTEGER,
  campo_2_eixos_motores_f TEXT,
  campo_2_eixos_motores_r TEXT,
  campo_3_distancia_entre_eixos INTEGER,
  campo_5_largura_via TEXT,
  campo_6_1_comprimento INTEGER,
  campo_7_1_largura INTEGER,
  campo_8_altura INTEGER,
  campo_9_1_dist_eixo_apoio TEXT,
  campo_9_2_dist_eixo_frente TEXT,
  campo_11_eixo_ret_retaguarda TEXT,
  campo_11_1_dist_eixos_consecutivos TEXT,
  campo_11_2_avanco_prato_max TEXT,
  campo_11_2_avanco_prato_min TEXT,
  campo_12_1_tara_f TEXT,
  campo_12_1_tara_r TEXT,
  campo_12_1_tara_t INTEGER,
  campo_14_1_peso_bruto_total INTEGER,
  campo_14_2_distribuicao_pb_frente TEXT,
  campo_14_2_distribuicao_pb_retaguarda TEXT,
  campo_14_3_maximo_admissivel TEXT,
  campo_14_4_peso_max_disp_engate TEXT,
  campo_17_peso_rebocavel_com_travao INTEGER,
  campo_17_peso_rebocavel_sem_travao INTEGER,
  campo_18_peso_bruto_conjunto INTEGER,
  campo_motor_homologacao TEXT,
  campo_motor_extensao TEXT,
  campo_20_marca TEXT,
  campo_20_marca_codigo TEXT,
  campo_21_modelo TEXT,
  campo_23_num_cilindros INTEGER,
  campo_24_cilindrada INTEGER,
  campo_25_combustivel TEXT,
  campo_25_combustivel_codigo TEXT,
  campo_26_potencia_maxima TEXT,
  campo_27_max_biocombustivel TEXT,
  campo_28_caixa_velocidades TEXT,
  campo_28_codigo TEXT,
  campo_32_pneumaticos_frente TEXT,
  campo_32_1_pneumaticos_retaguarda TEXT,
  campo_33_suspensao_frente TEXT,
  campo_33_codigo TEXT,
  campo_33_1_suspensao_retaguarda TEXT,
  campo_33_1_codigo TEXT,
  campo_35_travoes_servico TEXT,
  campo_35_codigo TEXT,
  campo_36_travoes_estacionamento TEXT,
  campo_36_codigo TEXT,
  campo_37_tipo_caixa TEXT,
  campo_37_codigo TEXT,
  campo_37_1_categoria_europeia TEXT,
  campo_37_2_comprimento_exterior_max INTEGER,
  campo_37_2_comprimento_exterior_min INTEGER,
  campo_37_3_comprimento_interior_max TEXT,
  campo_37_3_comprimento_interior_min TEXT,
  campo_37_4_total TEXT,
  campo_37_5_altura_interior_max TEXT,
  campo_37_5_altura_interior_min TEXT,
  campo_37_6_largura_exterior_max INTEGER,
  campo_37_6_largura_exterior_min TEXT,
  campo_37_7_avanco_centro_gravidade_max TEXT,
  campo_37_7_avanco_centro_gravidade_min TEXT,
  campo_37_8_avanco_cg_calculo_max TEXT,
  campo_37_8_avanco_cg_calculo_min TEXT,
  campo_41_num_portas INTEGER,
  campo_42_1_lotacao_total INTEGER,
  campo_42_2_sentada_f INTEGER,
  campo_42_2_sentada_m TEXT,
  campo_42_2_sentada_r TEXT,
  campo_42_3_em_pe TEXT,
  campo_45_nivel_sonoro_estacionario_db NUMERIC(6,1),
  campo_45_nivel_sonoro_estacionario_rpm INTEGER,
  campo_45_1_nivel_sonoro_movimento NUMERIC(6,1),
  campo_46_1_co_tipo_i NUMERIC(8,4),
  campo_46_1_co_tipo_ii TEXT,
  campo_46_1_hc NUMERIC(8,4),
  campo_46_1_nox NUMERIC(8,4),
  campo_46_1_hc_nox TEXT,
  campo_46_1_particulas NUMERIC(10,6),
  campo_46_2_co2_urbano_comb1 NUMERIC(8,1),
  campo_46_2_co2_extra_urbano_comb1 TEXT,
  campo_46_2_co2_combinado_comb1 TEXT,
  campo_46_2_co2_urbano_comb2 TEXT,
  campo_46_2_co2_extra_urbano_comb2 TEXT,
  campo_46_2_co2_combinado_comb2 TEXT,
  campo_46_3_consumo_urbano NUMERIC(6,1),
  campo_46_3_consumo_extra_urbano TEXT,
  campo_46_3_consumo_combinado TEXT,
  campo_46_4_reducao_emissao_co2 TEXT,
  campo_46_5_tecnologia_inovativa TEXT,
  campo_46_6_autonomia_baterias TEXT,
  campo_46_7_fonte TEXT,
  campo_50_anotacoes TEXT,
  url_ficheiro TEXT,
  dados_raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(numero_homologacao_nacional, extensao)
);

CREATE INDEX idx_fams_homologacao ON fams(numero_homologacao_nacional);
ALTER TABLE fams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON fams FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED: Lead L2026-001
-- ============================================

INSERT INTO leads (id, cliente, cliente_final, tipo_carrocaria, tipo_taipais, dimensoes,
  veiculo_marca, veiculo_modelo, veiculo_designacao, quantidade, valor_unitario,
  num_homologacao, notas_encomenda, estado) VALUES
('L2026-001', 'Grupo JAP', 'Frota Sixt Joel Alves', 'Caixa Aberta', 'Madeira',
 '3200x2080mm', 'Renault', 'Master', 'Master Chassis Cabina Dupla Trac.',
 6, 2100.00, '202410007297', ARRAY['NE897289','NE897290'], 'ganha');

-- ============================================
-- SEED: 6 Obras do lead L2026-001
-- ============================================

INSERT INTO obras (id, lead_id, vin, lugar_parque, estado) VALUES
('L2026-001-01', 'L2026-001', 'VF1RDB00075409005', 10, 'producao'),
('L2026-001-02', 'L2026-001', 'VF1RDB00175408929', 11, 'producao'),
('L2026-001-03', 'L2026-001', 'VF1RDB00475409010', 12, 'producao'),
('L2026-001-04', 'L2026-001', 'VF1RDB00875409009', 13, 'producao'),
('L2026-001-05', 'L2026-001', 'VF1RDB00675408926', 14, 'producao'),
('L2026-001-06', 'L2026-001', 'VF1RDB00175408932', 15, 'producao');

-- Atualizar lugares de parque
UPDATE lugares_parque SET ocupado = true, obra_id = 'L2026-001-01' WHERE numero = 10;
UPDATE lugares_parque SET ocupado = true, obra_id = 'L2026-001-02' WHERE numero = 11;
UPDATE lugares_parque SET ocupado = true, obra_id = 'L2026-001-03' WHERE numero = 12;
UPDATE lugares_parque SET ocupado = true, obra_id = 'L2026-001-04' WHERE numero = 13;
UPDATE lugares_parque SET ocupado = true, obra_id = 'L2026-001-05' WHERE numero = 14;
UPDATE lugares_parque SET ocupado = true, obra_id = 'L2026-001-06' WHERE numero = 15;

-- ============================================
-- SEED: Fases das 6 obras
-- ============================================

-- L2026-001-01 (VIN 9005) — Espera pintura (fases 1-3 done, 4 pendente)
INSERT INTO fases_obra (obra_id, fase_numero, nome, estado, responsavel, horas_reais) VALUES
('L2026-001-01', 1, 'Corte', 'concluido', 'bohdan', 6),
('L2026-001-01', 2, 'Assemblagem', 'concluido', 'bohdan', 10),
('L2026-001-01', 3, 'Soldadura', 'concluido', 'joao', 8),
('L2026-001-01', 4, 'Pintura da carroçaria', 'pendente', 'jose', 0),
('L2026-001-01', 5, 'Pintura dos taipais', 'pendente', 'jose', 0),
('L2026-001-01', 6, 'Montagem no veículo', 'pendente', 'bohdan', 0),
('L2026-001-01', 7, 'Acabamentos', 'pendente', 'joao', 0),
('L2026-001-01', 8, 'Pesagem', 'pendente', 'duarte', 0),
('L2026-001-01', 9, 'Termo de responsabilidade', 'pendente', 'duarte', 0);

-- L2026-001-02 (VIN 8929) — Espera pintura (fases 1-3 done, 4 pendente)
INSERT INTO fases_obra (obra_id, fase_numero, nome, estado, responsavel, horas_reais) VALUES
('L2026-001-02', 1, 'Corte', 'concluido', 'bohdan', 5.5),
('L2026-001-02', 2, 'Assemblagem', 'concluido', 'bohdan', 9),
('L2026-001-02', 3, 'Soldadura', 'concluido', 'joao', 7.5),
('L2026-001-02', 4, 'Pintura da carroçaria', 'pendente', 'jose', 0),
('L2026-001-02', 5, 'Pintura dos taipais', 'pendente', 'jose', 0),
('L2026-001-02', 6, 'Montagem no veículo', 'pendente', 'bohdan', 0),
('L2026-001-02', 7, 'Acabamentos', 'pendente', 'joao', 0),
('L2026-001-02', 8, 'Pesagem', 'pendente', 'duarte', 0),
('L2026-001-02', 9, 'Termo de responsabilidade', 'pendente', 'duarte', 0);

-- L2026-001-03 (VIN 9010) — Acabamentos (fases 1-7 done, 8 pendente)
INSERT INTO fases_obra (obra_id, fase_numero, nome, estado, responsavel, horas_reais) VALUES
('L2026-001-03', 1, 'Corte', 'concluido', 'bohdan', 6),
('L2026-001-03', 2, 'Assemblagem', 'concluido', 'bohdan', 11),
('L2026-001-03', 3, 'Soldadura', 'concluido', 'joao', 8),
('L2026-001-03', 4, 'Pintura da carroçaria', 'concluido', 'jose', 5),
('L2026-001-03', 5, 'Pintura dos taipais', 'concluido', 'jose', 4),
('L2026-001-03', 6, 'Montagem no veículo', 'concluido', 'bohdan', 6),
('L2026-001-03', 7, 'Acabamentos', 'concluido', 'joao', 4),
('L2026-001-03', 8, 'Pesagem', 'pendente', 'duarte', 0),
('L2026-001-03', 9, 'Termo de responsabilidade', 'pendente', 'duarte', 0);

-- L2026-001-04 (VIN 9009) — Soldadura em curso
INSERT INTO fases_obra (obra_id, fase_numero, nome, estado, responsavel, horas_reais) VALUES
('L2026-001-04', 1, 'Corte', 'concluido', 'bohdan', 6),
('L2026-001-04', 2, 'Assemblagem', 'concluido', 'bohdan', 10),
('L2026-001-04', 3, 'Soldadura', 'em_curso', 'joao', 3),
('L2026-001-04', 4, 'Pintura da carroçaria', 'pendente', 'jose', 0),
('L2026-001-04', 5, 'Pintura dos taipais', 'pendente', 'jose', 0),
('L2026-001-04', 6, 'Montagem no veículo', 'pendente', 'bohdan', 0),
('L2026-001-04', 7, 'Acabamentos', 'pendente', 'joao', 0),
('L2026-001-04', 8, 'Pesagem', 'pendente', 'duarte', 0),
('L2026-001-04', 9, 'Termo de responsabilidade', 'pendente', 'duarte', 0);

-- L2026-001-05 (VIN 8926) — Acabamentos (fases 1-7 done, 8 pendente)
INSERT INTO fases_obra (obra_id, fase_numero, nome, estado, responsavel, horas_reais) VALUES
('L2026-001-05', 1, 'Corte', 'concluido', 'bohdan', 5.5),
('L2026-001-05', 2, 'Assemblagem', 'concluido', 'bohdan', 10),
('L2026-001-05', 3, 'Soldadura', 'concluido', 'joao', 7),
('L2026-001-05', 4, 'Pintura da carroçaria', 'concluido', 'jose', 5),
('L2026-001-05', 5, 'Pintura dos taipais', 'concluido', 'jose', 3.5),
('L2026-001-05', 6, 'Montagem no veículo', 'concluido', 'bohdan', 5.5),
('L2026-001-05', 7, 'Acabamentos', 'concluido', 'joao', 4),
('L2026-001-05', 8, 'Pesagem', 'pendente', 'duarte', 0),
('L2026-001-05', 9, 'Termo de responsabilidade', 'pendente', 'duarte', 0);

-- L2026-001-06 (VIN 8932) — Não começou (todas pendentes)
INSERT INTO fases_obra (obra_id, fase_numero, nome, estado, responsavel, horas_reais) VALUES
('L2026-001-06', 1, 'Corte', 'pendente', 'bohdan', 0),
('L2026-001-06', 2, 'Assemblagem', 'pendente', 'bohdan', 0),
('L2026-001-06', 3, 'Soldadura', 'pendente', 'joao', 0),
('L2026-001-06', 4, 'Pintura da carroçaria', 'pendente', 'jose', 0),
('L2026-001-06', 5, 'Pintura dos taipais', 'pendente', 'jose', 0),
('L2026-001-06', 6, 'Montagem no veículo', 'pendente', 'bohdan', 0),
('L2026-001-06', 7, 'Acabamentos', 'pendente', 'joao', 0),
('L2026-001-06', 8, 'Pesagem', 'pendente', 'duarte', 0),
('L2026-001-06', 9, 'Termo de responsabilidade', 'pendente', 'duarte', 0);
