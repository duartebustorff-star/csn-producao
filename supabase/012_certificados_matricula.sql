-- Migration 012: Tabela certificados_matricula (DUA em cartão)
-- Campos baseados na especificação legal portuguesa (Anexo DUA)
-- Códigos harmonizados EU conforme Directiva

CREATE TABLE IF NOT EXISTS certificados_matricula (
  id                      SERIAL PRIMARY KEY,

  -- Identificação do documento
  numero_documento        TEXT,                        -- Nº sequencial do cartão
  data_emissao            DATE,                        -- (I) Data da matrícula a que se refere o certificado

  -- Dados do veículo
  matricula               TEXT NOT NULL,               -- (A) Número de matrícula
  data_primeira_matricula DATE,                        -- (B) Data da primeira matrícula
  vin                     TEXT,                        -- (E) Número de identificação do veículo
  marca                   TEXT,                        -- (D.1) Marca
  modelo                  TEXT,                        -- (D.2) Modelo / variante / versão
  designacao_comercial    TEXT,                        -- (D.3) Denominação comercial
  categoria_veiculo       TEXT,                        -- (J) Categoria (ex: Ligeiro Mercadorias)
  combustivel             TEXT,                        -- (P.3) Tipo de combustível
  cilindrada              INTEGER,                     -- (P.1) Cilindrada (cm³)
  potencia_kw             NUMERIC(8,2),                -- (P.2) Potência máxima (kW)
  numero_motor            TEXT,                        -- (P.5) Número do motor
  cor                     TEXT,                        -- (R) Cor do veículo
  numero_lugares          INTEGER,                     -- (S.1) Lugares sentados
  numero_lugares_pe       INTEGER,                     -- (S.2) Lugares em pé
  num_eixos               INTEGER,                     -- (L) Número de eixos
  distancia_eixos_mm      INTEGER,                     -- (M) Distância entre eixos (mm)

  -- Massas
  massa_max_tecnica       NUMERIC(8,2),                -- (F.1) Massa máxima técnica (kg)
  massa_servico           NUMERIC(8,2),                -- (G) Massa em serviço com carroçaria (kg)
  massa_max_portugal      NUMERIC(8,2),                -- (F.2) Massa máxima admissível em PT (kg)
  massa_max_conjunto      NUMERIC(8,2),                -- (F.3) Massa máxima conjunto (kg)
  massa_eixo_1            NUMERIC(8,2),                -- (N.1)
  massa_eixo_2            NUMERIC(8,2),                -- (N.2)
  massa_eixo_3            NUMERIC(8,2),                -- (N.3)
  reboque_com_travao      NUMERIC(8,2),                -- (O.1)
  reboque_sem_travao      NUMERIC(8,2),                -- (O.2)

  -- Titular (C.1)
  titular_nome            TEXT,                        -- (C.1.1) Apelido/denominação
  titular_nome2           TEXT,                        -- (C.1.2) Outros nomes
  titular_morada          TEXT,                        -- (C.1.3) Morada
  titular_e_proprietario  BOOLEAN DEFAULT true,        -- (C.4)

  -- Homologação
  cod_homologacao         TEXT,                        -- (K) Número de homologação

  -- Emissões
  co2_gkm                 NUMERIC(8,2),                -- (V.7) CO2 (g/km)
  nivel_sonoro_db         NUMERIC(6,2),                -- (U.1) Nível sonoro dB(A)

  -- Ficheiro
  url_ficheiro            TEXT,                        -- URL da foto/scan no storage
  dados_raw               JSONB,                       -- Dados brutos extraídos pelo Vision

  -- Controlo
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cert_matricula_matricula ON certificados_matricula(matricula);
CREATE INDEX IF NOT EXISTS idx_cert_matricula_vin ON certificados_matricula(vin);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_certificados_matricula_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_certificados_matricula_updated_at
  BEFORE UPDATE ON certificados_matricula
  FOR EACH ROW EXECUTE FUNCTION update_certificados_matricula_updated_at();

-- Constraint: inspeção só pode ser registada se existir DAV ou Certificado de Matrícula
CREATE OR REPLACE FUNCTION matricula_tem_documento(m text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM davs WHERE matricula = m
    UNION
    SELECT 1 FROM certificados_matricula WHERE matricula = m
  );
$$ LANGUAGE sql STABLE;

ALTER TABLE inspecoes
ADD CONSTRAINT inspecao_requer_documento
CHECK (matricula_tem_documento(matricula));
