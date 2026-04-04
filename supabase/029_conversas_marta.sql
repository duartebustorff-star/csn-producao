-- Migration 029: conversas_marta
-- ISA-95: L4-COM
-- Código interno: CSN-L4-COM-029-2026
-- Historico de mensagens entre Marta e contactos externos

CREATE TABLE IF NOT EXISTS conversas_marta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT REFERENCES tickets(id),
  cliente_id UUID REFERENCES clientes(id),
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'email', 'site', 'telegram', 'app')),
  remetente_externo TEXT, -- telefone ou email
  direcao TEXT NOT NULL CHECK (direcao IN ('entrada', 'saida')),
  conteudo TEXT NOT NULL,
  anexos JSONB DEFAULT '[]'::jsonb,
  step_marta TEXT, -- passo actual: 'identificacao', 'veiculo', 'configuracao', 'contacto', 'verificacao', 'concluido'
  metadata JSONB DEFAULT '{}'::jsonb,
  nivel_isa95 TEXT NOT NULL DEFAULT 'L4-COM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversas_ticket ON conversas_marta(ticket_id);
CREATE INDEX idx_conversas_cliente ON conversas_marta(cliente_id);
CREATE INDEX idx_conversas_canal ON conversas_marta(canal, remetente_externo);

ALTER TABLE conversas_marta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON conversas_marta FOR ALL USING (true) WITH CHECK (true);
