-- CSN Produção — SGQ Mínimo ISO 9001:2015
-- Migration: 010_sgq_minimo_iso9001.sql
-- Correr DEPOIS dos migrations anteriores (001 a 009)
-- Cobre APENAS o mínimo obrigatório para auditoria TÜV Rheinland

-- ============================================
-- 1. NÃO-CONFORMIDADES E AÇÕES CORRETIVAS
--    Cláusula 10.2 — Obrigatório
--    Regista: o que correu mal, porquê, o que se fez
-- ============================================

CREATE TABLE IF NOT EXISTS nao_conformidades (
  id SERIAL PRIMARY KEY,

  -- Identificação
  codigo TEXT UNIQUE NOT NULL,              -- Ex: NC-2026-001
  data_detecao DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Origem
  origem TEXT NOT NULL CHECK (origem IN (
    'producao',        -- Detectada durante produção
    'inspecao',        -- Detectada em inspeção
    'cliente',         -- Reclamação do cliente
    'auditoria',       -- Encontrada em auditoria interna
    'fornecedor'       -- Material/serviço não conforme
  )),

  -- Descrição
  descricao TEXT NOT NULL,                  -- O que aconteceu
  obra_id TEXT REFERENCES obras(id),        -- Obra afetada (se aplicável)

  -- Tratamento imediato
  acao_imediata TEXT,                       -- Correção imediata (conter o problema)

  -- Análise de causa
  causa_raiz TEXT,                          -- Porquê (5 Porquês simples)

  -- Ação corretiva
  acao_corretiva TEXT,                      -- O que se fez para não repetir
  responsavel TEXT REFERENCES colaboradores(id),
  prazo DATE,

  -- Verificação de eficácia
  eficaz BOOLEAN,                           -- A ação resultou?
  verificado_por TEXT REFERENCES colaboradores(id),
  data_verificacao DATE,

  -- Estado
  estado TEXT DEFAULT 'aberta' CHECK (estado IN ('aberta', 'em_tratamento', 'fechada')),

  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nc_estado ON nao_conformidades(estado);
CREATE INDEX IF NOT EXISTS idx_nc_obra ON nao_conformidades(obra_id);
ALTER TABLE nao_conformidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON nao_conformidades FOR ALL USING (true) WITH CHECK (true);

-- Sequência para gerar códigos automáticos
CREATE SEQUENCE IF NOT EXISTS nc_seq START 1;

-- ============================================
-- 2. AUDITORIAS INTERNAS
--    Cláusula 9.2 — Obrigatório
--    Mínimo 1x/ano cobrindo todos os processos
-- ============================================

CREATE TABLE IF NOT EXISTS auditorias_internas (
  id SERIAL PRIMARY KEY,

  -- Identificação
  codigo TEXT UNIQUE NOT NULL,              -- Ex: AI-2026-001
  data_auditoria DATE NOT NULL,
  auditor TEXT NOT NULL,                    -- Quem auditou (pode ser externo)

  -- Âmbito
  processos_auditados TEXT[] NOT NULL,      -- Ex: {'producao', 'compras', 'qualidade'}

  -- Resultados
  conformidades TEXT,                       -- O que está bem
  nao_conformidades_encontradas TEXT,       -- O que não está bem
  observacoes TEXT,                         -- Melhorias sugeridas

  -- Referência a NCs criadas
  nc_ids INTEGER[],                         -- IDs das NCs geradas pela auditoria

  -- Conclusão
  conclusao TEXT CHECK (conclusao IN ('conforme', 'conforme_com_observacoes', 'nao_conforme')),

  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE auditorias_internas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON auditorias_internas FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 3. REVISÃO PELA GESTÃO
--    Cláusula 9.3 — Obrigatório
--    Mínimo 1x/ano — Duarte revê o SGQ
-- ============================================

CREATE TABLE IF NOT EXISTS revisoes_gestao (
  id SERIAL PRIMARY KEY,

  -- Identificação
  codigo TEXT UNIQUE NOT NULL,              -- Ex: RG-2026-001
  data_revisao DATE NOT NULL,
  participantes TEXT[] NOT NULL,            -- Ex: {'Duarte'}

  -- Entradas da revisão (o que se analisou)
  estado_acoes_anteriores TEXT,             -- Ponto de situação de ações passadas
  alteracoes_contexto TEXT,                 -- Mudanças internas/externas relevantes
  desempenho_qualidade TEXT,                -- Resumo: NCs, reclamações, fornecedores
  resultados_auditorias TEXT,               -- Resumo das auditorias internas
  satisfacao_clientes TEXT,                 -- Resumo feedback clientes
  riscos_oportunidades TEXT,                -- Riscos identificados

  -- Saídas da revisão (decisões tomadas)
  decisoes TEXT NOT NULL,                   -- O que se decidiu
  recursos_necessarios TEXT,                -- Recursos a alocar
  acoes_melhoria TEXT,                      -- Melhorias a implementar

  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE revisoes_gestao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON revisoes_gestao FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 4. EQUIPAMENTOS E CALIBRAÇÃO
--    Cláusula 7.1.5 — Obrigatório para equipamentos de medição
--    Lista de equipamentos + manutenção + calibração
-- ============================================

CREATE TABLE IF NOT EXISTS equipamentos (
  id SERIAL PRIMARY KEY,

  -- Identificação
  codigo TEXT UNIQUE NOT NULL,              -- Ex: EQ-001
  nome TEXT NOT NULL,                       -- Ex: 'Máquina de soldar MAG', 'Fita métrica 5m'
  tipo TEXT CHECK (tipo IN ('producao', 'medicao', 'seguranca')),
  localizacao TEXT,                         -- Ex: 'Oficina principal'

  -- Calibração (só para equipamentos de medição)
  requer_calibracao BOOLEAN DEFAULT false,
  ultima_calibracao DATE,
  proxima_calibracao DATE,
  certificado_calibracao TEXT,              -- URL ou referência do certificado

  -- Manutenção
  ultima_manutencao DATE,
  proxima_manutencao DATE,

  -- Estado
  ativo BOOLEAN DEFAULT true,

  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE equipamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON equipamentos FOR ALL USING (true) WITH CHECK (true);

-- Registos de manutenção/calibração
CREATE TABLE IF NOT EXISTS manutencoes (
  id SERIAL PRIMARY KEY,
  equipamento_id INTEGER REFERENCES equipamentos(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('manutencao', 'calibracao', 'reparacao')),
  data_realizada DATE NOT NULL DEFAULT CURRENT_DATE,
  realizado_por TEXT NOT NULL,              -- Quem fez (pode ser externo)
  descricao TEXT,
  certificado_url TEXT,                     -- Para calibrações
  proxima_data DATE,                        -- Próxima manutenção/calibração prevista
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manut_equip ON manutencoes(equipamento_id);
ALTER TABLE manutencoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON manutencoes FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. AVALIAÇÃO DE FORNECEDORES
--    Cláusula 8.4 — Obrigatório
--    Lista de fornecedores aprovados + avaliação simples
-- ============================================

CREATE TABLE IF NOT EXISTS fornecedores (
  id SERIAL PRIMARY KEY,

  nome TEXT NOT NULL,
  contacto TEXT,
  tipo_fornecimento TEXT,                   -- Ex: 'chapa', 'tinta', 'perfis', 'parafusos'

  -- Avaliação simples (1-5 ou aprovado/não aprovado)
  aprovado BOOLEAN DEFAULT true,
  nota_qualidade INTEGER CHECK (nota_qualidade BETWEEN 1 AND 5),  -- 1=mau, 5=excelente
  nota_prazo INTEGER CHECK (nota_prazo BETWEEN 1 AND 5),
  ultima_avaliacao DATE,

  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON fornecedores FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 6. SATISFAÇÃO DO CLIENTE / RECLAMAÇÕES
--    Cláusula 9.1.2 — Obrigatório
--    Registo de reclamações e feedback
-- ============================================

CREATE TABLE IF NOT EXISTS reclamacoes_clientes (
  id SERIAL PRIMARY KEY,

  -- Identificação
  codigo TEXT UNIQUE NOT NULL,              -- Ex: RC-2026-001
  data_recepcao DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente TEXT NOT NULL,
  obra_id TEXT REFERENCES obras(id),        -- Obra relacionada (se aplicável)

  -- Descrição
  descricao TEXT NOT NULL,                  -- O que o cliente reclamou

  -- Tratamento
  resposta TEXT,                            -- O que se respondeu/fez
  responsavel TEXT REFERENCES colaboradores(id),
  data_resolucao DATE,

  -- Gerou NC?
  nc_id INTEGER REFERENCES nao_conformidades(id),

  -- Estado
  estado TEXT DEFAULT 'aberta' CHECK (estado IN ('aberta', 'em_tratamento', 'fechada')),

  -- Satisfação com a resolução
  cliente_satisfeito BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reclam_estado ON reclamacoes_clientes(estado);
ALTER TABLE reclamacoes_clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON reclamacoes_clientes FOR ALL USING (true) WITH CHECK (true);

CREATE SEQUENCE IF NOT EXISTS rc_seq START 1;

-- ============================================
-- 7. COMPETÊNCIAS E FORMAÇÃO
--    Cláusula 7.2 — Obrigatório
--    Registo de formações de cada colaborador
-- ============================================

CREATE TABLE IF NOT EXISTS formacoes (
  id SERIAL PRIMARY KEY,

  colaborador_id TEXT REFERENCES colaboradores(id) ON DELETE CASCADE,

  -- Formação
  descricao TEXT NOT NULL,                  -- Ex: 'Formação soldadura MAG', 'Segurança no trabalho'
  tipo TEXT CHECK (tipo IN ('interna', 'externa', 'on_the_job')),
  data_formacao DATE NOT NULL,
  duracao_horas NUMERIC(5,1),
  formador TEXT,                            -- Quem deu a formação

  -- Certificado (se aplicável)
  certificado_url TEXT,

  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_formacoes_colab ON formacoes(colaborador_id);
ALTER TABLE formacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON formacoes FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- Mapeamento cláusulas ISO 9001:2015
-- ============================================

-- ============================================
-- 8. CAMPO ADICIONAL: REVISÃO DE REQUISITOS
--    Cláusula 8.2.3 — Obrigatório
--    Evidência de que os requisitos do cliente
--    foram revistos antes de aceitar a encomenda
-- ============================================

ALTER TABLE obras ADD COLUMN IF NOT EXISTS requisitos_revistos BOOLEAN DEFAULT false;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS requisitos_revistos_por TEXT REFERENCES colaboradores(id);
ALTER TABLE obras ADD COLUMN IF NOT EXISTS requisitos_revistos_em TIMESTAMPTZ;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS requisitos_notas TEXT;  -- Notas da revisão (requisitos especiais, normas aplicáveis, etc.)

COMMENT ON COLUMN obras.requisitos_revistos IS 'ISO 9001:2015 — Cláusula 8.2.3 — Confirmação de revisão dos requisitos do cliente antes de aceitar';

-- ============================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- Mapeamento cláusulas ISO 9001:2015
-- ============================================

COMMENT ON TABLE nao_conformidades IS 'ISO 9001:2015 — Cláusula 10.2 / 8.7 — Não-conformidade, ação corretiva e controlo de saídas não conformes';
COMMENT ON TABLE auditorias_internas IS 'ISO 9001:2015 — Cláusula 9.2 — Auditoria interna';
COMMENT ON TABLE revisoes_gestao IS 'ISO 9001:2015 — Cláusula 9.3 — Revisão pela gestão';
COMMENT ON TABLE equipamentos IS 'ISO 9001:2015 — Cláusula 7.1.5 — Recursos de monitorização e medição';
COMMENT ON TABLE manutencoes IS 'ISO 9001:2015 — Cláusula 7.1.5 — Registos de manutenção e calibração';
COMMENT ON TABLE fornecedores IS 'ISO 9001:2015 — Cláusula 8.4 — Controlo de processos fornecidos externamente';
COMMENT ON TABLE reclamacoes_clientes IS 'ISO 9001:2015 — Cláusula 9.1.2 — Satisfação do cliente';
COMMENT ON TABLE formacoes IS 'ISO 9001:2015 — Cláusula 7.2 — Competência';

-- ============================================
-- 9. DOCUMENTOS DO SGQ (Política, Âmbito, Objetivos)
--    Cláusulas 4.3, 5.2, 6.2 — Obrigatório
--    Tudo em Supabase, PDF gerado on-demand
-- ============================================

CREATE TABLE IF NOT EXISTS sgq_documentos (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'politica_qualidade',     -- Cláusula 5.2
    'ambito_sgq',             -- Cláusula 4.3
    'objetivos_qualidade',    -- Cláusula 6.2
    'contexto_organizacao',   -- Cláusula 4.1
    'partes_interessadas',    -- Cláusula 4.2
    'exclusoes'               -- Cláusula 4.3 (não aplicabilidades)
  )),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,       -- Texto completo do documento
  versao INTEGER DEFAULT 1,
  aprovado_por TEXT REFERENCES colaboradores(id),
  data_aprovacao DATE,
  ativo BOOLEAN DEFAULT true,   -- Só a versão ativa é usada para PDF
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sgq_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON sgq_documentos FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE sgq_documentos IS 'ISO 9001:2015 — Documentos obrigatórios do SGQ (Política, Âmbito, Objetivos, Contexto)';

-- Tabela de objetivos individuais (mensuráveis)
CREATE TABLE IF NOT EXISTS sgq_objetivos (
  id SERIAL PRIMARY KEY,
  processo TEXT NOT NULL,             -- Ex: 'qualidade', 'producao', 'logistica', 'rh', 'comercial', 'infraestruturas'
  indicador TEXT NOT NULL,            -- Ex: 'N.º de reclamações de clientes'
  meta TEXT NOT NULL,                 -- Ex: '≤ 1% face à produção'
  acao TEXT,                          -- O que se faz para atingir
  responsavel TEXT REFERENCES colaboradores(id),
  periodicidade TEXT DEFAULT 'mensal', -- mensal, trimestral, semestral, anual
  ano INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sgq_objetivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON sgq_objetivos FOR ALL USING (true) WITH CHECK (true);

-- Registos de monitorização dos objetivos
CREATE TABLE IF NOT EXISTS sgq_objetivos_registos (
  id SERIAL PRIMARY KEY,
  objetivo_id INTEGER REFERENCES sgq_objetivos(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,              -- Ex: '2026-01', '2026-Q1', '2026-S1'
  valor TEXT NOT NULL,                -- Valor medido
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sgq_objetivos_registos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON sgq_objetivos_registos FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE sgq_objetivos IS 'ISO 9001:2015 — Cláusula 6.2 — Objetivos da qualidade mensuráveis';
COMMENT ON TABLE sgq_objetivos_registos IS 'ISO 9001:2015 — Cláusula 6.2 / 9.1.3 — Monitorização dos objetivos';

-- ============================================
-- 10. SEED DATA — Dados reais do SGQ antigo
--     Fonte: Manual da Qualidade_04 (Set 2017)
--     + Objetivos 2023 + Revisão Gestão 2022
-- ============================================

-- Política da Qualidade (baseada no Manual antigo, atualizada)
INSERT INTO sgq_documentos (tipo, titulo, conteudo, versao, aprovado_por, data_aprovacao) VALUES
('politica_qualidade', 'Política da Qualidade', E'A Carlos dos Santos Nascimento, Lda desenvolve as atividades de construção, montagem e reparação de carroçarias de caixa aberta, de contentores e de armações, bem como a montagem de plataformas elevatórias em viaturas de mercadorias.\n\nNo sentido de melhorar continuamente os produtos e serviços desenvolvidos, a empresa estabelece os seguintes compromissos:\n\n1. Colocar a satisfação do cliente no topo das prioridades da nossa estratégia, procurando sempre satisfazer plenamente as suas necessidades e expectativas, assegurando a conformidade com os requisitos aplicáveis.\n\n2. Desenvolver a satisfação, motivação e envolvimento dos colaboradores no processo através da informação e formação adequada.\n\n3. Estabelecer uma relação de cooperação e parceria com os nossos clientes, fornecedores e demais partes interessadas.\n\n4. Assegurar uma dinâmica de Melhoria Contínua em todos os processos, promovendo o cumprimento dos requisitos legais, normativos, os do Sistema de Gestão da Qualidade, bem como outros requisitos que a empresa subscreva.\n\n5. Sermos reconhecidos pela qualidade dos produtos produzidos, montados e reparados na Carlos dos Santos Nascimento, Lda.',
1, 'duarte', CURRENT_DATE);

-- Âmbito do SGQ (do Manual antigo)
INSERT INTO sgq_documentos (tipo, titulo, conteudo, versao, aprovado_por, data_aprovacao) VALUES
('ambito_sgq', 'Âmbito do Sistema de Gestão da Qualidade', E'CONSTRUÇÃO E REPARAÇÃO DE CARROÇARIAS DE CAIXA ABERTA, DE CONTENTORES, DE ARMAÇÕES E MONTAGEM DE PLATAFORMAS ELEVATÓRIAS EM VIATURAS DE MERCADORIAS\n\nInstalações: Rua da Industria, n.º7, Casal do Rodo, 2640-216 Encarnação — Mafra\n\nO SGQ abrange todos os processos da organização: Qualidade, Comercial, Produção, Logística, Gestão de Recursos Humanos e Gestão de Infraestruturas.\n\nPrincipais produtos e serviços:\n- Carroçarias de madeira\n- Carroçarias de estrutura metálica com taipais de madeira\n- Carroçarias de estrutura metálica com taipais de alumínio\n- Armação tipo TIR com cortinas de correr\n- Armação simples tipo TIR\n- Armação simples e tradicional\n- Contentores de alumínio e fibra\n- Montagem de plataformas elevatórias\n- Reparações de todo o tipo de carroçarias',
1, 'duarte', CURRENT_DATE);

-- Exclusão 8.3 (do Manual antigo)
INSERT INTO sgq_documentos (tipo, titulo, conteudo, versao, aprovado_por, data_aprovacao) VALUES
('exclusoes', 'Não Aplicabilidades', E'Cláusula 8.3 — Design e desenvolvimento de produtos e serviços\n\nJustificação: A empresa Carlos dos Santos Nascimento, Lda apenas realiza atividades de produção, montagem e reparação de carroçarias, não resultando destas qualquer atividade de design e desenvolvimento de produtos e serviços. O cliente transmite à empresa os seus requisitos através de uma encomenda.',
1, 'duarte', CURRENT_DATE);

-- Contexto da organização (cl. 4.1)
INSERT INTO sgq_documentos (tipo, titulo, conteudo, versao, aprovado_por, data_aprovacao) VALUES
('contexto_organizacao', 'Contexto da Organização', E'A Carlos dos Santos Nascimento, Lda foi fundada em 1972. Certificada ISO 9001 desde 2013 pela TÜV Rheinland.\n\nQuestões externas:\n- Mercado de carroçarias para viaturas de mercadorias em Portugal e Europa (PT, FR, DE, ES)\n- Exigências regulamentares: EN 1090, EN ISO 3834, EN 12642, Reg. 2018/858, Reg. 2019/2144\n- Concorrência no setor de carroçarias\n- Disponibilidade de matérias-primas (chapa, alumínio, madeira)\n\nQuestões internas:\n- Equipa reduzida (4 colaboradores): Duarte (Gestor), Bohdan (Operador), João António (Operador), José Julio (Operador)\n- Instalações próprias em Casal do Rodo, Mafra — 2 pavilhões\n- Sistema de gestão informatizado (CSN Produção)\n- Know-how acumulado desde 1972',
1, 'duarte', CURRENT_DATE);

-- Partes interessadas (cl. 4.2)
INSERT INTO sgq_documentos (tipo, titulo, conteudo, versao, aprovado_por, data_aprovacao) VALUES
('partes_interessadas', 'Partes Interessadas', E'Partes interessadas internas:\n- Gestão de topo (Duarte) — Requisitos: eficácia do SGQ, rentabilidade\n- Colaboradores (Bohdan, João António, José Julio) — Requisitos: condições de trabalho, formação, segurança\n\nPartes interessadas externas:\n- Clientes — Requisitos: qualidade dos produtos, prazos de entrega, preço\n- Fornecedores — Requisitos: pagamentos atempados, relação comercial estável\n- TÜV Rheinland — Requisitos: cumprimento da ISO 9001:2015\n- Entidades reguladoras (IMT, IPQ) — Requisitos: conformidade legal e regulamentar\n- Comunidade local — Requisitos: emprego, impacto ambiental',
1, 'duarte', CURRENT_DATE);

-- Objetivos da Qualidade (baseados nos objetivos 2023, atualizados para 2026)
INSERT INTO sgq_objetivos (processo, indicador, meta, acao, responsavel, periodicidade, ano) VALUES
('qualidade', 'N.º de reclamações de clientes', '≤ 1% face ao n.º de carroçarias produzidas e reparadas', 'Registar as reclamações recebidas e controlá-las no sistema', 'duarte', 'mensal', 2026),
('qualidade', 'Grau de satisfação de clientes', '≥ 4,5 (escala 1-5)', 'Enviar inquéritos de satisfação após entrega', 'duarte', 'semestral', 2026),
('qualidade', 'N.º de Não Conformidades', '≤ 10 por ano', 'Registar e controlar as NCs, acompanhar ações corretivas', 'duarte', 'mensal', 2026),
('qualidade', 'Manutenção da certificação ISO 9001', 'Manter certificação ativa', 'Realizar auditoria interna e externa, manter SGQ', 'duarte', 'anual', 2026),
('infraestruturas', 'N.º de reparações a equipamentos', '≤ 5 por ano', 'Realizar manutenções preventivas conforme planeado', 'duarte', 'mensal', 2026),
('rh', 'Horas de formação', '≥ 35h total/ano', 'Ministrar formação interna e externa aos colaboradores', 'duarte', 'trimestral', 2026),
('logistica', 'N.º de reclamações a fornecedores', '< 3 por ano', 'Controlar produtos recebidos, reclamar se NC', 'duarte', 'mensal', 2026),
('logistica', 'Avaliação de fornecedores', '≥ 80% aprovados', 'Avaliar fornecedores que afetem conformidade do produto', 'duarte', 'trimestral', 2026),
('producao', 'N.º de NCs na produção', '≤ 5 por ano', 'Controlar a área de produção, registar NCs', 'duarte', 'mensal', 2026),
('comercial', 'Novos clientes', '≥ 15 novos clientes por ano', 'Divulgar empresa, enviar apresentações a potenciais clientes', 'duarte', 'trimestral', 2026);
