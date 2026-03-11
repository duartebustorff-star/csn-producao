-- Migration 013: Adicionar colunas de dimensões exteriores separadas à tabela leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS comprimento_ext integer,
  ADD COLUMN IF NOT EXISTS largura_ext integer,
  ADD COLUMN IF NOT EXISTS altura_ext integer;

COMMENT ON COLUMN leads.comprimento_ext IS 'Comprimento exterior da carroçaria em mm';
COMMENT ON COLUMN leads.largura_ext IS 'Largura exterior da carroçaria em mm';
COMMENT ON COLUMN leads.altura_ext IS 'Altura exterior da carroçaria em mm';
