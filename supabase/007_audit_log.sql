-- 007: Tabela de auditoria ISO 9001
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  entidade_tipo TEXT NOT NULL,        -- "lead", "obra", "fase_obra", "timer", "ausencia", "nota", "mensagem"
  entidade_id TEXT NOT NULL,
  acao TEXT NOT NULL,                  -- "criar", "atualizar", "eliminar", "mudar_estado"
  campo_alterado TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  utilizador_id TEXT NOT NULL,
  utilizador_nome TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entidade ON audit_log(entidade_tipo, entidade_id);
CREATE INDEX idx_audit_log_utilizador ON audit_log(utilizador_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
