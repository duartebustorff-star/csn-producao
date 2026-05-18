-- 014_fams_extraction_status.sql
-- Adiciona coluna `extraction_status` à tabela public.fams para rastrear o
-- estado da última extracção automática do PDF.
--
-- Estados possíveis:
--   'ok'         — parsing completo (texto extraível, regex match nos campos esperados)
--   'needs_ocr'  — PDF é scan/imagem; texto não extraível por pdfplumber/pymupdf
--   'partial'    — parsing parcial (texto extraível mas alguns campos falharam)
--   'failed'     — erro de download ou excepção no parser
--
-- Aplicar com (Supabase MCP):
--   apply_migration(name='014_fams_extraction_status', query=<conteúdo deste ficheiro>)

ALTER TABLE public.fams
  ADD COLUMN IF NOT EXISTS extraction_status text
  CHECK (extraction_status IN ('ok', 'needs_ocr', 'partial', 'failed'));

COMMENT ON COLUMN public.fams.extraction_status IS
'Estado da última extracção automática do PDF: ok | needs_ocr | partial | failed.';

-- Backfill: marcar como needs_ocr as 7 FAMs em que o texto não é parseável
-- — 6 são scans imagem (0 chars extraídos), 1 tem texto CID-encoded
-- (font subset sem mapeamento Unicode, devolve gibberish (cid:N)(cid:M)…):
UPDATE public.fams
SET extraction_status = 'needs_ocr'
WHERE numero_homologacao_nacional || '/' || extensao IN (
  '201010003292/1066',  -- RENAULT VN      (27 KB, scan)
  '201010003297/4141',  -- RENAULT NP8 B7  (665 KB, scan)
  '201110003900/0705',  -- MERCEDES 906A35 (344 KB, scan)
  '201519004470/0007',  -- MITSUBISHI L200 (489 KB, scan)
  '202010003210/0041',  -- ISUZU NTF       (517 KB, scan)
  '202010003211/0062',  -- ISUZU NTP       (519 KB, scan)
  '202110006569/3166'   -- PEUGEOT Y       (97 KB, CID-encoded)
);

-- Para as restantes 13 FAMs, marcar como 'ok' (serão re-processadas pelo
-- extractor com --commit logo a seguir; o status fica confirmado na altura).
UPDATE public.fams
SET extraction_status = 'ok'
WHERE extraction_status IS NULL;
