-- CSN Produção — Campos de contacto e veículo na tabela leads
-- Necessário para criação automática de leads via chat

-- Campos de contacto
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacto_nome TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacto_telefone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacto_email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacto_email_empresa TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS empresa TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS morada TEXT;

-- Campos do veículo
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_novo BOOLEAN;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS matricula TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vin TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pbt NUMERIC(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tara NUMERIC(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rodado TEXT;

-- Equipamentos (já existem no TypeScript mas faltam na tabela SQL)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS plataforma_elevatoria BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS grua_coluna BOOLEAN DEFAULT false;
