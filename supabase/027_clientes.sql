-- Migration 027: clientes
-- ISA-95: L4-COM
-- Código interno: CSN-L4-COM-027-2026

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  whatsapp TEXT UNIQUE,
  empresa TEXT,
  nif TEXT,
  tipo TEXT NOT NULL DEFAULT 'final' CHECK (tipo IN ('final', 'concessionario', 'oficina')),
  verificado BOOLEAN NOT NULL DEFAULT false,
  portal_access BOOLEAN NOT NULL DEFAULT false,
  ver_precos BOOLEAN NOT NULL DEFAULT false,
  canal_origem TEXT CHECK (canal_origem IN ('whatsapp', 'email', 'site', 'telegram', 'app', 'presencial')),
  notas TEXT,
  nivel_isa95 TEXT NOT NULL DEFAULT 'L4-COM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_whatsapp ON clientes(whatsapp);
CREATE INDEX idx_clientes_nif ON clientes(nif);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON clientes FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER set_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
