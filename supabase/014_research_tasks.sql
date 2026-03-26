-- Migration 014: Tabela research_tasks (ADR-022 — Agente Research Autónomo)
-- Regista todas as tarefas de pesquisa executadas pelo Agente Research.
-- O agente nunca escreve nas tabelas core — apenas nesta tabela e na pasta _research/.

CREATE TABLE research_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,                    -- RT-2026-001
  tema text NOT NULL,                             -- ex: "MAN TGS bodybuilder guidelines"
  tipo text NOT NULL CHECK (tipo IN (
    'marca', 'legal', 'norma', 'equip', 'mercado', 'tech', 'geral'
  )),
  descricao text,
  solicitado_por text DEFAULT 'sistema',          -- Duarte / sistema / Luísa
  pasta_local text,                               -- _research/RT-2026-001-man-bodybuilder/
  estado text NOT NULL DEFAULT 'pendente' CHECK (estado IN (
    'pendente', 'em_curso', 'concluido', 'incorporado', 'falhado'
  )),
  data_inicio timestamptz,
  data_conclusao timestamptz,
  fontes_consultadas integer DEFAULT 0,
  documentos_encontrados integer DEFAULT 0,
  documentos_descarregados integer DEFAULT 0,
  relatorio_path text,                            -- _research/RT-2026-001/RELATORIO_RT-2026-001.md
  incorporado_rag boolean DEFAULT false,
  incorporado_supabase boolean DEFAULT false,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para consultas frequentes
CREATE INDEX idx_research_tasks_estado ON research_tasks(estado);
CREATE INDEX idx_research_tasks_tipo ON research_tasks(tipo);
CREATE INDEX idx_research_tasks_created ON research_tasks(created_at DESC);

-- Comentários
COMMENT ON TABLE research_tasks IS 'ADR-022: Tarefas do Agente Research autónomo';
COMMENT ON COLUMN research_tasks.codigo IS 'Código único: RT-AAAA-NNN-tema';
COMMENT ON COLUMN research_tasks.tipo IS 'marca|legal|norma|equip|mercado|tech|geral';
COMMENT ON COLUMN research_tasks.estado IS 'pendente→em_curso→concluido→incorporado (ou falhado)';
COMMENT ON COLUMN research_tasks.pasta_local IS 'Caminho relativo na pasta _research/';

-- RLS activado mas sem policies (acesso apenas via service role)
ALTER TABLE research_tasks ENABLE ROW LEVEL SECURITY;
