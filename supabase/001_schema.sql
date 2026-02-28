-- CSN Produção — Schema completo
-- Correr no Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- ============================================
-- TABELAS
-- ============================================

-- Colaboradores
CREATE TABLE colaboradores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  avatar TEXT DEFAULT '🔧',
  pin TEXT NOT NULL,
  lang TEXT DEFAULT 'pt',
  role TEXT DEFAULT 'worker',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Obras
CREATE TABLE obras (
  id TEXT PRIMARY KEY,
  cliente TEXT NOT NULL,
  tipo TEXT NOT NULL,
  estado TEXT DEFAULT 'espera',
  prioridade INTEGER DEFAULT 0,
  notas TEXT,
  drive_folder_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fases de cada obra
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

-- Timetracking
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

-- Mensagens do chat
CREATE TABLE mensagens (
  id SERIAL PRIMARY KEY,
  colaborador_id TEXT REFERENCES colaboradores(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notas por obra
CREATE TABLE notas_obra (
  id SERIAL PRIMARY KEY,
  obra_id TEXT REFERENCES obras(id) ON DELETE CASCADE,
  colaborador_id TEXT REFERENCES colaboradores(id),
  texto TEXT NOT NULL,
  tipo TEXT DEFAULT 'nota',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_fases_obra_id ON fases_obra(obra_id);
CREATE INDEX idx_fases_responsavel ON fases_obra(responsavel);
CREATE INDEX idx_timetracking_colaborador ON timetracking(colaborador_id);
CREATE INDEX idx_timetracking_obra ON timetracking(obra_id);
CREATE INDEX idx_timetracking_ativo ON timetracking(colaborador_id) WHERE fim IS NULL;
CREATE INDEX idx_mensagens_colaborador ON mensagens(colaborador_id);
CREATE INDEX idx_mensagens_created ON mensagens(created_at DESC);
CREATE INDEX idx_notas_obra ON notas_obra(obra_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE fases_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_obra ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para service_role (o backend usa service_role key)
-- O acesso é controlado pela lógica da app, não pelo RLS
CREATE POLICY "Service role full access" ON colaboradores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON obras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON fases_obra FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON timetracking FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON mensagens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON notas_obra FOR ALL USING (true) WITH CHECK (true);
