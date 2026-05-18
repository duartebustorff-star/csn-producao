# scripts/

Utilitários standalone para tarefas de manutenção fora do ciclo Next.js.
Cada script é independente; corre via Python ou Node conforme aplicável.

---

## `extract_fams.py` — Re-extracção de Fichas de Aprovação Modular (FAM/IMT)

Lê os PDFs das FAMs guardados em `documentos/FAM_*.pdf` no Supabase Storage,
extrai ~91 campos numerados (directiva 2007/46/CE) e faz UPDATE em
`public.fams`.

**REGRA BANDEIRA:** cada valor → fonte directa do PDF ou NULL. Sem inferência,
cálculo ou lookup externo.

### Como funciona

1. `pdfplumber` abre o PDF e faz crop em 4 zonas (`extract_zones`):
   - Header (y < 195): nº homologação, situação, CE, despacho
   - Coluna esquerda (x < 313, y 195–720): Características Gerais + Pesos + Motor
   - Coluna direita (x ≥ 313, y 195–720): Transmissão + Caixa + Emissões
   - Footer (y ≥ 720): 50 - Anotações
2. Cada zona é parseada por regex line-by-line (anchors `^N`/`^N.M` MULTILINE,
   horizontal-only whitespace `[ \t]+` para não saltar linhas).
3. `diff_existing()` calcula payload: só preenche NULLs e substitui quando o
   novo valor difere — **nunca apaga** um valor existente com NULL.
4. UPDATE: payload + `dados_raw` (jsonb com extracção completa) + `updated_at`.

### Como correr

```powershell
# Dry-run em todas as FAMs (mostra o que ia mudar, sem escrever):
py -3 scripts/extract_fams.py

# Aplicar UPDATEs:
py -3 scripts/extract_fams.py --commit

# Uma só FAM:
py -3 scripts/extract_fams.py --fam-id 202410007291 --extensao 0108
py -3 scripts/extract_fams.py --fam-id 202410007291 --extensao 0108 --commit
```

Necessita `.env.local` na raiz com `NEXT_PUBLIC_SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY`.

Dependências: `pdfplumber`, `pymupdf` (fallback), `supabase`, `requests`,
`python-dotenv`. Instalar via `py -3 -m pip install --user <pkg>`.

### Outputs

Tudo em `scripts/output/`:
- `fams_processadas/FAM_<homol>_<ext>_raw.txt` — texto das 4 zonas
- `fams_processadas/FAM_<homol>_<ext>_fields.json` — dict parseado
- `fam_extraction_report_<timestamp>.json` — sumário com novos/alterados/erros
  por FAM

### `extraction_status` (coluna em `public.fams`, migration 014)

| Valor | Significado |
|---|---|
| `ok` | Texto extraível, parsing completo (≥ 70 campos numa FAM "normal") |
| `needs_ocr` | PDF é scan/imagem (0 chars) ou tem CID-encoded fonts (gibberish) |
| `partial` | Texto extraível mas alguns campos críticos falharam (reservado, ainda não usado) |
| `failed` | Erro de download ou excepção no parser (reservado) |

### Campos que podem ficar NULL **legitimamente**

Estes campos costumam estar **vazios no source** das FAMs PT para
chassis-cabina comerciais (3.5–8.5T):

- `campo_9_1_dist_eixo_apoio`, `campo_9_2_dist_eixo_frente` — overhangs do
  veículo final; definem-se **após** carroçamento. Os limites pós-carroçaria
  aparecem em `campo_50_anotacoes` quando aplicáveis.
- `campo_41_num_portas` — alguns IMT deixam-no em branco para chassis-cabina
  (Citroen Y, Peugeot Y observados).
- `campo_46_2_co2_combinado_comb1`/`comb2`, `campo_46_3_consumo_combinado` —
  FAMs PT antigas tipicamente só preenchem Urbano (alguns também Extra
  Urbano para Citroen/Peugeot WLTP); Combinado quase sempre vazio.
- `campo_12_1_tara_f`/`r` — só `tara_t` (total) costuma estar preenchido.
- `campo_14_2_distribuicao_pb_frente`/`retaguarda` — frequentemente vazios; o
  `campo_14_3_maximo_admissivel` traz os limites por eixo (`1F0...2R0...`).

Não tratar estes NULLs como erros do extractor sem antes verificar o source
em `scripts/output/fams_processadas/FAM_*_raw.txt`.

### Como tratar as 7 FAMs com `extraction_status='needs_ocr'`

| FAM | Marca | Modelo | Razão |
|---|---|---|---|
| 201010003292/1066 | RENAULT | VN | Scan imagem (27 KB) |
| 201010003297/4141 | RENAULT | NP8 B7 | Scan imagem (665 KB) |
| 201110003900/0705 | MERCEDES | 906A35 | Scan imagem (344 KB) |
| 201519004470/0007 | MITSUBISHI | L200 | Scan imagem (489 KB) |
| 202010003210/0041 | ISUZU | NTF | Scan imagem (517 KB) |
| 202010003211/0062 | ISUZU | NTP | Scan imagem (519 KB) |
| 202110006569/3166 | PEUGEOT | Y | CID-encoded text (font subset sem Unicode) |

Para os 6 scans: usar **Tesseract** (`pytesseract` em Python) ou **Claude
Vision** (já disponível no projecto via `ANTHROPIC_API_KEY`). Para o CID:
fonte original do IMT, normalmente possível re-pedir o PDF; alternativa é
render do PDF para PNG e correr pela mesma via OCR.

Após OCR: aplicar o mesmo `parse_*` em `extract_fams.py` ao texto OCRado
(adicionar `--source-text <ficheiro>`) e marcar `extraction_status='ok'`.

---

## `build_dry_run_report.py`

Pega no último `fam_extraction_report_*.json` e gera
`scripts/output/dry_run_13_FAMs.json` mais um sumário em consola.
Útil para revisão pré-commit.

```powershell
py -3 scripts/build_dry_run_report.py
```

---

## `migrations/014_fams_extraction_status.sql`

Migration aplicada (via Supabase MCP `apply_migration` em 2026-05-18) que
adicionou a coluna `extraction_status` à `public.fams` e fez backfill das 7
FAMs `needs_ocr`. Mantida como referência histórica — para novas migrations
adicionar a `supabase/migrations/`.

---

## Outros scripts neste directório

- `generate-controlo-pdf.mjs`, `generate-controlo-s35.mjs`,
  `generate-controlo-s58.mjs` — geradores de PDF de controlo de qualidade
- `ingest-inventor-docs.mjs`, `embed-inventor-rag.mjs` — pipeline de RAG sobre
  documentos Autodesk Inventor
- `import_fuso_xlsx.ts` — importação de fichas técnicas FUSO via XLSX
- `gerar_pdfs_auditoria.py` — relatórios de auditoria interna ISO 9001
