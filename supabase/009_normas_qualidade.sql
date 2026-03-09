-- CSN Produção — Normas de Qualidade e Certificação
-- Migration: 009_normas_qualidade.sql
-- Correr DEPOIS dos migrations anteriores (001 a 008)
-- Cobre: ISO 9001, EN 1090, EN ISO 3834, EN 12642
-- Mercados: PT, FR, DE, ES

-- ============================================
-- 1. CAMPOS NOVOS NA TABELA obras
-- ============================================

-- Mercado de destino (array: pode ser vários)
ALTER TABLE obras ADD COLUMN IF NOT EXISTS mercado_destino TEXT[] DEFAULT ARRAY['PT'];

-- Nível de resistência estrutural EN 12642 (obrigatório para Alemanha)
-- 'L' = standard, 'XL' = reforçado (quase obrigatório para DE)
ALTER TABLE obras ADD COLUMN IF NOT EXISTS en12642_nivel TEXT CHECK (en12642_nivel IN ('L', 'XL', NULL));

-- Classe de execução estrutural EN 1090 (EXC2 é o padrão para carroçarias)
ALTER TABLE obras ADD COLUMN IF NOT EXISTS classe_execucao TEXT DEFAULT 'EXC2';

-- COC de 2ª etapa emitido?
ALTER TABLE obras ADD COLUMN IF NOT EXISTS coc_emitido BOOLEAN DEFAULT false;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS coc_data DATE;

-- Declaração de Desempenho EN 1090 emitida?
ALTER TABLE obras ADD COLUMN IF NOT EXISTS dop_emitido BOOLEAN DEFAULT false;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS dop_numero TEXT;

-- Marcação CE aplicada?
ALTER TABLE obras ADD COLUMN IF NOT EXISTS marcacao_ce BOOLEAN DEFAULT false;

-- ============================================
-- 2. CAMPOS NOVOS NA TABELA fases_obra
--    (relevantes para fase Soldadura)
-- ============================================

-- Referência ao procedimento de soldadura usado (ex: 'WPS-MAG-01')
ALTER TABLE fases_obra ADD COLUMN IF NOT EXISTS wps_usado TEXT;

-- Lote do consumível de soldadura (rastreabilidade EN ISO 3834)
ALTER TABLE fases_obra ADD COLUMN IF NOT EXISTS lote_consumivel TEXT;

-- Certificado do soldador (EN ISO 9606-1) — pode ser diferente do responsavel
-- Ex: 'EN9606-MAG-PA-001' ou referência interna
ALTER TABLE fases_obra ADD COLUMN IF NOT EXISTS soldador_cert TEXT;

-- ============================================
-- 3. TABELA NOVA: dossie_obra
--    Dossiê de qualidade obrigatório por carroçaria
--    (distinto do audit_log que regista ações do sistema)
-- ============================================

CREATE TABLE IF NOT EXISTS dossie_obra (
  id SERIAL PRIMARY KEY,
  obra_id TEXT REFERENCES obras(id) ON DELETE CASCADE,

  -- Tipo de documento/registo
  -- Valores possíveis conforme normas:
  tipo TEXT NOT NULL CHECK (tipo IN (
    'cert_material',        -- Certificado 3.1 de chapa/perfil/tubo (EN 1090)
    'ficha_rastreabilidade',-- Rastreabilidade: material → peça → soldador → WPS
    'inspecao_visual',      -- Inspeção visual 100% soldaduras (EN ISO 17637 / EN ISO 5817 nível C)
    'relatorio_ndt',        -- Ensaios não destrutivos 5-10% soldaduras críticas
    'controlo_dimensional', -- Medições: comprimento, largura, altura, esquadrias
    'registo_fotografico',  -- Fotos das fases críticas (jig, soldadura, montagem, pintura)
    'verificacao_chassis',  -- Checklist AEB, câmaras, luzes, protecções laterais (Reg. 2019/2144)
    'dop',                  -- Declaração de Desempenho EN 1090
    'marcacao_ce',          -- Etiqueta CE aplicada
    'coc_2etapa',           -- Certificado de Conformidade multi-etapa (Reg. 2018/858)
    'cert_en12642',         -- Certificado EN 12642 L ou XL
    'termo_responsabilidade'-- Declaração de responsabilidade (requisito PT)
  )),

  estado TEXT DEFAULT 'pendente' CHECK (estado IN ('pendente', 'ok', 'nao_aplicavel')),

  -- Quem é responsável por este registo
  responsavel TEXT REFERENCES colaboradores(id),

  -- Notas / observações
  notas TEXT,

  -- Ficheiro associado (no Supabase Storage ou Google Drive)
  ficheiro_url TEXT,
  ficheiro_drive_id TEXT,

  -- Data de conclusão do registo
  concluido_em TIMESTAMPTZ,
  concluido_por TEXT REFERENCES colaboradores(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dossie_obra_id ON dossie_obra(obra_id);
CREATE INDEX IF NOT EXISTS idx_dossie_tipo ON dossie_obra(tipo);
CREATE INDEX IF NOT EXISTS idx_dossie_estado ON dossie_obra(estado);

ALTER TABLE dossie_obra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON dossie_obra FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 4. TABELA NOVA: certificacoes_empresa
--    Certificações ao nível da empresa (não por obra)
--    Ex: ISO 9001, EN 1090, soldadores certificados, WPS
-- ============================================

CREATE TABLE IF NOT EXISTS certificacoes_empresa (
  id SERIAL PRIMARY KEY,

  tipo TEXT NOT NULL CHECK (tipo IN (
    'iso_9001',           -- Sistema de Gestão da Qualidade
    'en_1090',            -- Execução de estruturas em aço + Marcação CE
    'en_iso_3834',        -- Qualidade de soldadura
    'en_12642',           -- Resistência estrutural (nível empresa, não por obra)
    'wps',                -- Procedimento de Soldadura Qualificado
    'soldador_en9606',    -- Certificado soldador manual (EN ISO 9606-1)
    'operador_en14732',   -- Certificado operador robot (EN ISO 14732)
    'coordenador_soldadura' -- IWS ou IWT para EXC2
  )),

  -- Descrição / identificação
  nome TEXT NOT NULL,           -- Ex: 'ISO 9001:2015', 'WPS-MAG-01', 'João António EN9606'
  numero_certificado TEXT,
  entidade_emissora TEXT,       -- Bureau Veritas, TÜV, APCER, SGS, laboratório...

  -- Validade
  data_emissao DATE,
  data_validade DATE,           -- NULL = sem prazo (ex: EN 1090 empresa)
  ativo BOOLEAN DEFAULT true,

  -- Referências específicas
  colaborador_id TEXT REFERENCES colaboradores(id), -- para certificados de pessoa (soldador, coordenador)
  processo_soldadura TEXT,      -- para WPS: 'MAG', 'MIG', 'TIG', 'Robot'
  classe_execucao TEXT,         -- para EN 1090: 'EXC2'

  -- Documento
  ficheiro_url TEXT,
  notas TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certs_tipo ON certificacoes_empresa(tipo);
CREATE INDEX IF NOT EXISTS idx_certs_validade ON certificacoes_empresa(data_validade);
CREATE INDEX IF NOT EXISTS idx_certs_colaborador ON certificacoes_empresa(colaborador_id);

ALTER TABLE certificacoes_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON certificacoes_empresa FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. ATUALIZAR audit_log: novas entidades
-- ============================================

-- O audit_log já existe (007). As novas entidades a registar:
-- 'dossie_obra', 'certificacao_empresa', 'coc', 'dop'
-- Não é necessário alterar a tabela — o campo entidade_tipo é TEXT livre.
-- Apenas documentar os novos valores aqui:

COMMENT ON TABLE audit_log IS
'Registo de auditoria ISO 9001. Entidades: lead, obra, fase_obra, timer, ausencia, nota, mensagem, dossie_obra, certificacao_empresa, coc, dop';

-- ============================================
-- 6. FUNÇÃO: criar dossie automático ao criar obra
--    Cria os registos pendentes de cada novo tipo
-- ============================================

CREATE OR REPLACE FUNCTION criar_dossie_obra(p_obra_id TEXT, p_responsavel_id TEXT DEFAULT 'duarte')
RETURNS void AS $$
BEGIN
  INSERT INTO dossie_obra (obra_id, tipo, estado, responsavel) VALUES
    (p_obra_id, 'cert_material',         'pendente', p_responsavel_id),
    (p_obra_id, 'ficha_rastreabilidade', 'pendente', p_responsavel_id),
    (p_obra_id, 'inspecao_visual',       'pendente', p_responsavel_id),
    (p_obra_id, 'relatorio_ndt',         'pendente', p_responsavel_id),
    (p_obra_id, 'controlo_dimensional',  'pendente', p_responsavel_id),
    (p_obra_id, 'registo_fotografico',   'pendente', p_responsavel_id),
    (p_obra_id, 'verificacao_chassis',   'pendente', p_responsavel_id),
    (p_obra_id, 'dop',                   'pendente', p_responsavel_id),
    (p_obra_id, 'marcacao_ce',           'pendente', p_responsavel_id),
    (p_obra_id, 'coc_2etapa',            'pendente', p_responsavel_id),
    (p_obra_id, 'termo_responsabilidade','pendente', p_responsavel_id)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. SEED: Certificações da empresa (exemplos)
--    Substituir com dados reais quando disponíveis
-- ============================================

INSERT INTO certificacoes_empresa (tipo, nome, processo_soldadura, classe_execucao, ativo, notas) VALUES
  ('wps', 'WPS-MAG-01', 'MAG', 'EXC2', true, 'A qualificar — WPQR necessário'),
  ('wps', 'WPS-MIG-01', 'MIG', 'EXC2', true, 'A qualificar — WPQR necessário'),
  ('iso_9001', 'ISO 9001:2015', NULL, NULL, false, 'A implementar — Fase 1 roadmap'),
  ('en_1090', 'EN 1090-1/-2 EXC2', NULL, 'EXC2', false, 'A certificar — Fase 3 roadmap'),
  ('en_iso_3834', 'EN ISO 3834-3', NULL, NULL, false, 'A certificar com EN 1090')
ON CONFLICT DO NOTHING;

-- Certificados dos soldadores (a preencher com dados reais)
INSERT INTO certificacoes_empresa (tipo, nome, colaborador_id, processo_soldadura, ativo, notas) VALUES
  ('soldador_en9606', 'EN ISO 9606-1 — João António', 'joao', 'MAG', false, 'A certificar — Fase 2 roadmap'),
  ('soldador_en9606', 'EN ISO 9606-1 — Bohdan', 'bohdan', 'MAG', false, 'A certificar — Fase 2 roadmap')
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. SEED: Dossie para obras de teste existentes
-- ============================================

SELECT criar_dossie_obra('L2026-001-01');
SELECT criar_dossie_obra('L2026-001-02');
SELECT criar_dossie_obra('L2026-001-03');
SELECT criar_dossie_obra('L2026-001-04');
SELECT criar_dossie_obra('L2026-001-05');
SELECT criar_dossie_obra('L2026-001-06');
