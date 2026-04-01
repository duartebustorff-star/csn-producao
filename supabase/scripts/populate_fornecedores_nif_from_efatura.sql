-- =============================================================================
-- Popular fornecedores.nif a partir de public.efatura
--
-- Regras:
-- 1) Agrega NIFs distintos (9 dígitos) de efatura com um nome representativo.
-- 2) Para cada NIF, procura em fornecedores um registo sem NIF (ou NIF vazio)
--    cujo nome seja "similar" ao da efatura (pg_trgm similarity).
-- 3) Se encontrar, faz UPDATE de fornecedores.nif.
-- 4) NIFs ainda em falta: INSERT com nome, nif, categoria='fornecedor',
--    nivel_isa95='L0-MAT'.
--
-- ANTES DE CORRER: confirma os nomes das colunas na tua tabela efatura e edita
-- o CTE "efatura_fornecedor_raw" se necessário (ex.: emitente_nif / nome_emitente).
--
-- Requer extensão pg_trgm (Supabase: geralmente permitido).
-- Executar no SQL Editor do Supabase ou: psql -f ...
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS nivel_isa95 TEXT;

DROP TABLE IF EXISTS _tmp_efatura_por_nif;
CREATE TEMP TABLE _tmp_efatura_por_nif (
  nif TEXT NOT NULL,
  nome_efatura TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO _tmp_efatura_por_nif (nif, nome_efatura)
WITH efatura_fornecedor_raw AS (
  SELECT
    regexp_replace(COALESCE(nif_emitente::text, ''), '\D', '', 'g') AS nif_digits,
    NULLIF(trim(COALESCE(nome_emitente, '')), '') AS nome_emitente
  FROM efatura
  -- Opcional: só documentos de compra / tipo específico
  -- WHERE tipo_documento = 'FT' ...
)
SELECT
  nif_digits,
  (array_agg(nome_emitente ORDER BY length(nome_emitente) DESC))[1]
FROM efatura_fornecedor_raw
WHERE length(nif_digits) = 9
  AND nome_emitente IS NOT NULL
GROUP BY nif_digits;

WITH candidatos AS (
  SELECT
    e.nif AS e_nif,
    e.nome_efatura,
    f.id AS fornecedor_id,
    similarity(lower(f.nome), lower(e.nome_efatura)) AS sim
  FROM _tmp_efatura_por_nif e
  INNER JOIN fornecedores f
    ON (f.nif IS NULL OR trim(f.nif) = '')
   AND length(trim(f.nome)) >= 3
   AND similarity(lower(f.nome), lower(e.nome_efatura)) >= 0.35
),
ranked AS (
  SELECT
    e_nif,
    nome_efatura,
    fornecedor_id,
    sim,
    row_number() OVER (PARTITION BY e_nif ORDER BY sim DESC) AS rn_by_nif,
    row_number() OVER (PARTITION BY fornecedor_id ORDER BY sim DESC) AS rn_by_forn
  FROM candidatos
),
matches AS (
  SELECT e_nif, nome_efatura, fornecedor_id, sim
  FROM ranked
  WHERE rn_by_nif = 1
    AND rn_by_forn = 1
)
UPDATE fornecedores f
SET
  nif = m.e_nif,
  updated_at = now()
FROM matches m
WHERE f.id = m.fornecedor_id
  AND NOT EXISTS (
    SELECT 1 FROM fornecedores o
    WHERE o.nif = m.e_nif
      AND o.id <> f.id
  );

INSERT INTO fornecedores (nome, nif, categoria, nivel_isa95, aprovado)
SELECT
  e.nome_efatura,
  e.nif,
  'fornecedor',
  'L0-MAT',
  true
FROM _tmp_efatura_por_nif e
WHERE NOT EXISTS (
  SELECT 1 FROM fornecedores f WHERE f.nif = e.nif
);

COMMIT;

-- Verificação manual (correr à parte):
-- SELECT nif, nome, categoria, nivel_isa95 FROM fornecedores WHERE nif IS NOT NULL ORDER BY id DESC LIMIT 30;
