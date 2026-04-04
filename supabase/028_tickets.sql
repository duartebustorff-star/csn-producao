-- Migration 028: tickets
-- ISA-95: L3-MOM (Router)
-- Código interno: CSN-L3-MOM-028-2026

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY, -- TICK-2026-001
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'email', 'site', 'telegram', 'app', 'carta', 'presencial')),
  remetente TEXT, -- email ou telefone
  remetente_tipo TEXT CHECK (remetente_tipo IN ('cliente', 'fornecedor', 'entidade', 'colaborador', 'desconhecido')),
  cliente_id UUID REFERENCES clientes(id),
  assunto TEXT,
  corpo TEXT,
  classificacao TEXT, -- lead_orcamento, estado_obra, factura, certificado, cit, reclamacao, etc.
  departamento TEXT NOT NULL CHECK (departamento IN ('COM', 'PRD', 'DOC', 'PER', 'FIN', 'QMS', 'MNT', 'INV', 'ENG', 'ATT')),
  estado TEXT NOT NULL DEFAULT 'aberto' CHECK (estado IN ('aberto', 'em_tratamento', 'aguarda_cliente', 'resolvido', 'arquivado')),
  lead_id TEXT REFERENCES leads(id),
  obra_id TEXT, -- FK obras (quando evolui COM->PRD)
  assigned_to TEXT, -- agente ou 'duarte'
  url_pdf TEXT, -- email convertido em PDF
  anexos JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  nivel_isa95 TEXT NOT NULL DEFAULT 'L3-MOM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_tickets_departamento ON tickets(departamento);
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_cliente_id ON tickets(cliente_id);
CREATE INDEX idx_tickets_lead_id ON tickets(lead_id);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON tickets FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER set_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Sequencia para ID legivel
CREATE SEQUENCE IF NOT EXISTS tickets_seq START 1;

-- Funcao para gerar TICK-YYYY-NNN
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TICK-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('tickets_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
