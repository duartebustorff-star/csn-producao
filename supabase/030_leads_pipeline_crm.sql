-- Migration 030: alter leads para pipeline CRM
-- ISA-95: L4-COM
-- Código interno: CSN-L4-COM-030-2026
-- Nota: colunas que ja existem (matricula, vin, veiculo_marca, veiculo_modelo,
--        pbt, tara, distancia_entre_eixos, comprimento_ext, largura_ext,
--        altura_ext, veiculo_novo) sao ignoradas.

-- Novos campos CRM pipeline
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ticket_id TEXT REFERENCES tickets(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tipo_veiculo TEXT CHECK (tipo_veiculo IN ('novo', 'usado'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tipo_cliente TEXT CHECK (tipo_cliente IN ('final', 'concessionario', 'oficina'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tipo_trabalho TEXT CHECK (tipo_trabalho IN ('carrocamento_novo', 'substituicao', 'alteracao_tipo', 'reparacao'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_versao TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_pbt DECIMAL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_tara DECIMAL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_entre_eixos INTEGER; -- mm
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_cabine TEXT CHECK (veiculo_cabine IN ('simples', 'dupla'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS veiculo_num_eixos INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS medidas_comprimento INTEGER; -- mm
ALTER TABLE leads ADD COLUMN IF NOT EXISTS medidas_largura INTEGER; -- mm
ALTER TABLE leads ADD COLUMN IF NOT EXISTS medidas_altura INTEGER; -- mm
ALTER TABLE leads ADD COLUMN IF NOT EXISTS material TEXT CHECK (material IN ('aco', 'aluminio', 'misto'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS acessorios JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS payload_calculado DECIMAL; -- PBT - tara - peso_carrocaria
ALTER TABLE leads ADD COLUMN IF NOT EXISTS validacao_resultado JSONB; -- resultado das validacoes
ALTER TABLE leads ADD COLUMN IF NOT EXISTS necessita_inspeccao_imt BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS canal_origem TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS valor_orcamento DECIMAL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS estado_pipeline TEXT DEFAULT 'nova' CHECK (estado_pipeline IN ('nova', 'qualificada', 'orcamentada', 'ganha', 'perdida', 'cancelada'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS api_matricula_response JSONB; -- resposta bruta matricula.co.pt
ALTER TABLE leads ADD COLUMN IF NOT EXISTS api_vin_response JSONB; -- resposta bruta Vincario

CREATE INDEX IF NOT EXISTS idx_leads_ticket ON leads(ticket_id);
CREATE INDEX IF NOT EXISTS idx_leads_cliente ON leads(cliente_id);
CREATE INDEX IF NOT EXISTS idx_leads_estado_pipeline ON leads(estado_pipeline);
CREATE INDEX IF NOT EXISTS idx_leads_matricula ON leads(matricula);
