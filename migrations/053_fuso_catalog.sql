-- =====================================================================
-- CSN Opus — Migration: FUSO Canter LHD Catalog
-- Sessão: S53 (2026-04-19)
-- File:    migrations/053_fuso_catalog.sql
-- Author:  CSN Opus (sessão S53 fecho FUSO)
--
-- Cria 3 tabelas + 1 view + 35 INSERTs decoder.
-- Idempotente. Pode ser corrida várias vezes sem efeito secundário.
--
-- Schema rationale (decisão arquitectural S52 reafirmada S53):
--   1. fichas_tecnicas_fuso          → chassis diesel (60 variantes)
--   2. fichas_tecnicas_fuso_ecanter  → chassis eléctrico (23 variantes)
--      Tabelas separadas porque o eléctrico não tem motor combustão e
--      o diesel não tem battery/charging — 80% de campos não-overlap.
--   3. fuso_decoder_codigo           → decoder do model_code 12-char
--   4. v_catalogo_fuso (VIEW)        → UNION ALL com coluna 'propulsao'
--                                      para Marta/configurador consultarem
--                                      catálogo unificado.
--
-- REGRA BANDEIRA: campos sem fonte directa nos PDFs FUSO ficam NULL.
-- =====================================================================

BEGIN;

-- =====================================================================
-- 1. TABLE fichas_tecnicas_fuso (DIESEL)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.fichas_tecnicas_fuso (
  id                                    BIGSERIAL PRIMARY KEY,
  fuso_model_code                       VARCHAR(13) NOT NULL UNIQUE,
  model_variant                         BIGINT,
  model_vehicle_type                    VARCHAR(20),
  cab_type                              VARCHAR(50),
  crew                                  SMALLINT,
  plataforma_gvw                        VARCHAR(10),
  propulsao                             VARCHAR(10) DEFAULT 'diesel',

  -- Decoder positions
  code_pos1                             CHAR(1),
  code_pos2                             CHAR(1),
  code_pos3                             CHAR(1),
  code_pos4                             CHAR(1),
  code_pos5                             CHAR(1),
  code_pos6                             CHAR(1),
  code_pos7                             CHAR(1),
  code_pos8                             CHAR(1),
  code_pos9                             CHAR(1),
  code_pos10_13                         VARCHAR(4),

  -- Dimensions [mm]
  wheelbase                             INT,
  overall_length                        INT,
  cab_length                            INT,
  width_overall                         INT,
  cab_width                             INT,
  height_overall_min                    INT,
  height_overall_max                    INT,
  track_width_front                     INT,
  track_width_rear                      INT,
  frame_height                          INT,
  ground_clearance                      INT,
  cab_to_rear_axle                      INT,
  cab_to_end_of_frame                   INT,
  max_body_length                       INT,
  frame_width                           INT,
  front_overhang                        INT,
  rear_overhang                         INT,
  front_axle_to_front_of_body           INT,
  recommended_distance_cab_to_body      INT,

  -- AWD-specific (NULL for 4×2)
  ground_clearance_axle_front           INT,
  ground_clearance_axle_rear            INT,
  approach_angle_deg                    NUMERIC(4,1),
  departure_angle_deg                   NUMERIC(4,1),
  torque_split_4x4                      VARCHAR(20),

  -- Weights [kg]
  empty_weight                          INT,
  empty_weight_front                    INT,
  empty_weight_rear                     INT,
  gvw                                   INT,
  gcw                                   INT,
  axle_load_front                       INT,
  axle_load_rear                        INT,
  chassis_load_bearing_capacity         INT,

  -- Performance
  max_speed_kmh                         INT,
  turning_circle_kerb_m                 NUMERIC(4,1),
  turning_circle_wall_m                 NUMERIC(4,1),

  -- Engine (4P10 diesel)
  engine_code                           VARCHAR(20),
  engine_max_power_kw                   INT,
  engine_max_power_hp                   INT,
  engine_max_torque_nm                  INT,
  emission_class                        VARCHAR(20),

  -- Transmission
  transmission_type                     VARCHAR(20),  -- DUONIC, Manual, Manual AWD
  transmission_gears                    SMALLINT,
  rear_axle_ratio                       NUMERIC(5,3),

  -- Chassis
  front_axle_model                      TEXT,
  rear_axle_model                       TEXT,
  tyres                                 VARCHAR(50),
  wheel_spec                            VARCHAR(50),
  steering_type                         VARCHAR(50),
  steering_detail                       TEXT,
  brake_service                         TEXT,
  brake_front_rear                      TEXT,
  brake_parking                         TEXT,
  suspension                            TEXT,
  frame_type                            TEXT,
  low_voltage_system                    TEXT,
  fuel_tank_capacity_l                  INT,
  adblue_tank_capacity_l                INT,

  -- Provenance
  ficha_valida_em                       VARCHAR(10),  -- "2021-12"
  extraido_de                           TEXT,
  notas                                 TEXT,
  created_at                            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Sanity constraints (regra bandeira)
  CONSTRAINT fuso_model_code_format     CHECK (fuso_model_code ~ '^FE[A-Z][0-9A-Z]{9,10}$'),
  CONSTRAINT propulsao_diesel           CHECK (propulsao = 'diesel'),
  CONSTRAINT wheelbase_positive         CHECK (wheelbase IS NULL OR wheelbase > 0),
  CONSTRAINT gvw_positive               CHECK (gvw IS NULL OR gvw > 0)
);

CREATE INDEX IF NOT EXISTS idx_fuso_diesel_model       ON public.fichas_tecnicas_fuso (model_vehicle_type);
CREATE INDEX IF NOT EXISTS idx_fuso_diesel_wheelbase   ON public.fichas_tecnicas_fuso (wheelbase);
CREATE INDEX IF NOT EXISTS idx_fuso_diesel_gvw         ON public.fichas_tecnicas_fuso (gvw);
CREATE INDEX IF NOT EXISTS idx_fuso_diesel_transmission ON public.fichas_tecnicas_fuso (transmission_type);

COMMENT ON TABLE public.fichas_tecnicas_fuso IS
  'Fichas técnicas FUSO Canter LHD diesel (Euro VI 4P10). Fonte: Technical Data PDFs Dezembro 2021. 60 variantes em S53.';

-- =====================================================================
-- 2. TABLE fichas_tecnicas_fuso_ecanter (ELÉCTRICO)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.fichas_tecnicas_fuso_ecanter (
  id                                    BIGSERIAL PRIMARY KEY,
  fuso_model_code                       VARCHAR(13) NOT NULL UNIQUE,
  model_variant                         BIGINT,
  model_vehicle_type                    VARCHAR(20),
  cab_type                              VARCHAR(50),
  crew                                  SMALLINT,
  battery_variant                       CHAR(1),  -- S, M, L
  plataforma_gvw                        VARCHAR(10),
  propulsao                             VARCHAR(10) DEFAULT 'eCanter',

  code_pos1                             CHAR(1),
  code_pos2                             CHAR(1),
  code_pos3                             CHAR(1),
  code_pos4                             CHAR(1),
  code_pos5                             CHAR(1),
  code_pos6                             CHAR(1),
  code_pos7                             CHAR(1),
  code_pos8                             CHAR(1),
  code_pos9                             CHAR(1),
  code_pos10_13                         VARCHAR(4),

  wheelbase                             INT,
  overall_length                        INT,
  cab_length                            INT,
  width_overall                         INT,
  cab_width                             INT,
  height_overall_min                    INT,
  height_overall_max                    INT,
  track_width_front                     INT,
  track_width_rear                      INT,
  frame_height                          INT,
  ground_clearance                      INT,
  cab_to_rear_axle                      INT,
  cab_to_end_of_frame                   INT,
  max_body_length                       INT,
  frame_width                           INT,
  front_overhang                        INT,
  rear_overhang                         INT,
  front_axle_to_front_of_body           INT,
  recommended_distance_cab_to_body      INT,

  empty_weight                          INT,
  empty_weight_front                    INT,
  empty_weight_rear                     INT,
  gvw                                   INT,
  axle_load_front                       INT,
  axle_load_rear                        INT,
  chassis_load_bearing_capacity         INT,

  max_speed_kmh                         INT,
  turning_circle_kerb_m                 NUMERIC(4,1),
  turning_circle_wall_m                 NUMERIC(4,1),

  -- Electric drive (S40)
  electric_drive_type                   VARCHAR(10),
  peak_output_kw                        INT,
  peak_output_hp                        INT,
  continuous_output_kw                  INT,
  continuous_output_hp                  INT,
  max_torque_nm                         INT,
  continuous_torque_nm                  INT,

  -- mPTO pump
  mpto_pump_torque_nm                   INT,
  mpto_pump_continuous_kw               INT,
  mpto_pump_continuous_torque_nm        INT,
  mpto_pump_max_rpm                     INT,
  mpto_pump_gear_ratio                  NUMERIC(5,3),
  -- mPTO pulley
  mpto_pulley_torque_nm                 INT,
  mpto_pulley_continuous_kw             INT,
  mpto_pulley_continuous_torque_nm      INT,
  mpto_pulley_max_rpm                   INT,

  -- Battery
  battery_capacity_usable_kwh           INT,
  battery_capacity_installed_kwh        INT,
  battery_weight_kg                     INT,
  range_km                              INT,

  -- Charging
  charging_connection                   VARCHAR(50),
  charging_max_ac_kw                    INT,
  charging_max_dc_kw                    INT,
  charging_time_ac_0_100_min            VARCHAR(10),
  charging_time_dc_20_80_min            VARCHAR(10),
  charging_time_dc_5_90_min             VARCHAR(10),

  climbing_ability_pct                  INT,

  front_axle_model                      TEXT,
  rear_axle_model                       TEXT,
  tyres                                 VARCHAR(50),
  wheel_spec                            VARCHAR(50),
  steering_type                         VARCHAR(50),
  steering_detail                       TEXT,
  brake_service                         TEXT,
  brake_front_rear                      TEXT,
  brake_parking                         TEXT,
  suspension                            TEXT,
  frame_type                            TEXT,
  low_voltage_system                    TEXT,

  ficha_valida_em                       VARCHAR(10),
  extraido_de                           TEXT,
  notas                                 TEXT,
  created_at                            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fuso_ec_model_code_format  CHECK (fuso_model_code ~ '^FE[A-Z][0-9A-Z]{9,10}$'),
  CONSTRAINT propulsao_ecanter          CHECK (propulsao = 'eCanter'),
  CONSTRAINT battery_variant_valid      CHECK (battery_variant IN ('S','M','L'))
);

CREATE INDEX IF NOT EXISTS idx_fuso_ec_model      ON public.fichas_tecnicas_fuso_ecanter (model_vehicle_type);
CREATE INDEX IF NOT EXISTS idx_fuso_ec_wheelbase  ON public.fichas_tecnicas_fuso_ecanter (wheelbase);
CREATE INDEX IF NOT EXISTS idx_fuso_ec_battery    ON public.fichas_tecnicas_fuso_ecanter (battery_variant);
CREATE INDEX IF NOT EXISTS idx_fuso_ec_gvw        ON public.fichas_tecnicas_fuso_ecanter (gvw);

COMMENT ON TABLE public.fichas_tecnicas_fuso_ecanter IS
  'Fichas técnicas FUSO eCanter LHD (motor S40). Fonte: Technical Data PDFs Outubro 2023. 23 variantes em S53.';

-- =====================================================================
-- 3. TABLE fuso_decoder_codigo
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.fuso_decoder_codigo (
  id                BIGSERIAL PRIMARY KEY,
  posicao           VARCHAR(10) NOT NULL,
  valor             VARCHAR(10) NOT NULL,
  significado       VARCHAR(50),
  descricao         TEXT,
  confianca         VARCHAR(20) NOT NULL DEFAULT 'confirmado',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT decoder_posicao_valor_unique UNIQUE (posicao, valor),
  CONSTRAINT confianca_valid CHECK (confianca IN ('confirmado','inferido','dedutivo'))
);

COMMENT ON TABLE public.fuso_decoder_codigo IS
  'Decoder do FUSO model code 12 chars. 35 mapeamentos confirmados em S53 (todos os pos 8 C/D/E confirmados).';

-- 35 decoder INSERTs (idempotent)
INSERT INTO public.fuso_decoder_codigo (posicao, valor, significado, descricao, confianca) VALUES
  ('1',     'F',    'familia_canter',         'Família Canter — constante',                                                                'confirmado'),
  ('2',     'E',    'tracao_4x2',             'Tracção 4×2',                                                                                'confirmado'),
  ('2',     'G',    'tracao_4x4',             'Tracção 4×4 (AWD)',                                                                          'confirmado'),
  ('3',     'A',    'cabine_standard',        'Cabine Standard (1798mm largura)',                                                           'confirmado'),
  ('3',     'B',    'cabine_comfort',         'Cabine Comfort (1995mm largura)',                                                            'confirmado'),
  ('3',     'C',    'cabine_comfort_wide',    'Cabine Comfort wide/heavy (2098mm largura, 7C18/9C18)',                                      'confirmado'),
  ('4-5',   '01',   'plataforma_3_5T',        'Plataforma 3.5T (3S13/3S15/3C13/3C15/3C15D)',                                                'confirmado'),
  ('4-5',   '51',   'plataforma_6T',          'Plataforma 6T (6S15)',                                                                       'confirmado'),
  ('4-5',   '71',   'plataforma_7_49T',       'Plataforma 7.49T (7C15/7C15D/7C18/7C18D) e 4×4 (6C18/6C18D)',                                'confirmado'),
  ('4-5',   'X1',   'plataforma_8_55T',       'Plataforma 8.55T (9C18)',                                                                    'confirmado'),
  ('4-5',   'VK',   'plataforma_eCanter_4_6T','Plataforma eCanter 4-6T (4S15e/4C15e/6S15e)',                                                'confirmado'),
  ('4-5',   '7K',   'plataforma_eCanter_7T',  'Plataforma eCanter 7C18e (7.49T)',                                                           'confirmado'),
  ('4-5',   'XK',   'plataforma_eCanter_9T',  'Plataforma eCanter 9C18e (8.55T)',                                                           'confirmado'),
  ('6',     'B',    'wheelbase_2500',         'Wheelbase 2500 mm',                                                                          'confirmado'),
  ('6',     'C',    'wheelbase_2800',         'Wheelbase 2800 mm',                                                                          'confirmado'),
  ('6',     'E',    'wheelbase_3400',         'Wheelbase 3400-3415 mm',                                                                     'confirmado'),
  ('6',     'G',    'wheelbase_3850',         'Wheelbase 3850-3865 mm',                                                                     'confirmado'),
  ('6',     'H',    'wheelbase_4450',         'Wheelbase 4300-4450 mm',                                                                     'confirmado'),
  ('6',     'K',    'wheelbase_4750',         'Wheelbase 4750 mm',                                                                          'confirmado'),
  ('7',     'L',    'lhd',                    'LHD (Left-Hand Drive) — único valor no scope CSN',                                           'confirmado'),
  ('8',     '3',    'transmission_duonic',    'Transmissão DUONIC (diesel)',                                                                'confirmado'),
  ('8',     '4',    'transmission_manual',    'Transmissão Manual 5M (diesel)',                                                             'confirmado'),
  ('8',     '6',    'transmission_manual_4x4','Transmissão Manual + AWD (diesel 4×4)',                                                      'confirmado'),
  ('8',     'C',    'battery_S',              'Variante de bateria S (Small) eCanter — confirmado em 4S15e/4C15e/6S15e',                    'confirmado'),
  ('8',     'D',    'battery_M',              'Variante de bateria M (Medium) eCanter',                                                     'confirmado'),
  ('8',     'E',    'battery_L',              'Variante de bateria L (Large) eCanter',                                                      'confirmado'),
  ('9',     'S',    'cabine_single',          'Cabine simples (single cab) — partilha posição com início do sufixo SEU',                    'confirmado'),
  ('9',     'W',    'cabine_crew',            'Cabine dupla (crew cab)',                                                                    'confirmado'),
  ('10-13', 'EUW',  'diesel_motor_130hp',     'Motor 4P10 EUW — 96 kW / 130 hp (3S13, 3C13)',                                               'confirmado'),
  ('10-13', 'EUX',  'diesel_motor_150hp',     'Motor 4P10 EUX — 110 kW / 150 hp (3S15, 3C15, 6S15, 7C15, 7C15D)',                           'confirmado'),
  ('10-13', 'EUY',  'diesel_motor_175hp',     'Motor 4P10 EUY — 129 kW / 175 hp (7C18, 7C18D, 9C18, 6C18 4×4)',                             'confirmado'),
  ('10-13', 'SEU1', 'ecanter_homologacao_6T', 'Sufixo homologação eCanter para plataforma 6S15e (GVW 6000kg)',                              'confirmado'),
  ('10-13', 'SEU2', 'ecanter_homologacao_7T', 'Sufixo homologação eCanter para 7C18e/9C18e (GVW 7490/8550kg)',                              'confirmado'),
  ('10-13', 'SEU3', 'ecanter_homologacao_4T', 'Sufixo homologação eCanter para 4S15e/4C15e (GVW 4150kg, opcional 4000kg para FR)',          'confirmado')
ON CONFLICT (posicao, valor) DO UPDATE
  SET significado = EXCLUDED.significado,
      descricao   = EXCLUDED.descricao,
      confianca   = EXCLUDED.confianca;

-- =====================================================================
-- 4. VIEW v_catalogo_fuso (UNION diesel + eCanter)
-- =====================================================================
DROP VIEW IF EXISTS public.v_catalogo_fuso;
CREATE VIEW public.v_catalogo_fuso AS
  SELECT
    'diesel'::TEXT                          AS propulsao,
    fuso_model_code,
    model_variant,
    model_vehicle_type,
    cab_type,
    crew,
    plataforma_gvw,
    NULL::CHAR(1)                           AS battery_variant,
    wheelbase,
    overall_length,
    width_overall,
    height_overall_min,
    height_overall_max,
    cab_to_rear_axle,
    cab_to_end_of_frame,
    max_body_length,
    front_overhang,
    rear_overhang,
    empty_weight,
    gvw,
    axle_load_front,
    axle_load_rear,
    chassis_load_bearing_capacity,
    max_speed_kmh,
    turning_circle_kerb_m,
    turning_circle_wall_m,
    NULL::INT                               AS battery_capacity_usable_kwh,
    NULL::INT                               AS range_km,
    ficha_valida_em,
    extraido_de
  FROM public.fichas_tecnicas_fuso
  UNION ALL
  SELECT
    'eCanter'::TEXT                         AS propulsao,
    fuso_model_code,
    model_variant,
    model_vehicle_type,
    cab_type,
    crew,
    plataforma_gvw,
    battery_variant,
    wheelbase,
    overall_length,
    width_overall,
    height_overall_min,
    height_overall_max,
    cab_to_rear_axle,
    cab_to_end_of_frame,
    max_body_length,
    front_overhang,
    rear_overhang,
    empty_weight,
    gvw,
    axle_load_front,
    axle_load_rear,
    chassis_load_bearing_capacity,
    max_speed_kmh,
    turning_circle_kerb_m,
    turning_circle_wall_m,
    battery_capacity_usable_kwh,
    range_km,
    ficha_valida_em,
    extraido_de
  FROM public.fichas_tecnicas_fuso_ecanter;

COMMENT ON VIEW public.v_catalogo_fuso IS
  'Catálogo unificado FUSO (diesel + eCanter). 83 variantes totais. Consumido pela Marta, configurador e gate validation.';

-- =====================================================================
-- 5. TRIGGER updated_at (idempotent)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fuso_diesel_updated_at  ON public.fichas_tecnicas_fuso;
CREATE TRIGGER trg_fuso_diesel_updated_at
  BEFORE UPDATE ON public.fichas_tecnicas_fuso
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_fuso_ecanter_updated_at ON public.fichas_tecnicas_fuso_ecanter;
CREATE TRIGGER trg_fuso_ecanter_updated_at
  BEFORE UPDATE ON public.fichas_tecnicas_fuso_ecanter
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;

-- =====================================================================
-- VERIFICATION QUERIES (run after migration)
-- =====================================================================
-- SELECT COUNT(*) AS decoder_rows FROM public.fuso_decoder_codigo;             -- expect 35
-- SELECT COUNT(*) AS diesel_rows  FROM public.fichas_tecnicas_fuso;            -- expect 0 (data via import_fuso_xlsx.ts)
-- SELECT COUNT(*) AS ecanter_rows FROM public.fichas_tecnicas_fuso_ecanter;    -- expect 0
-- SELECT COUNT(*) AS view_rows    FROM public.v_catalogo_fuso;                 -- expect 0 until import
