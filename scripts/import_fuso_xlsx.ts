/**
 * scripts/import_fuso_xlsx.ts
 *
 * Lê docs/fornecedores/fuso/CSN_FUSO_Catalog_S52_v3.xlsx e faz upsert
 * (ON CONFLICT DO UPDATE por fuso_model_code) nas tabelas:
 *   - fichas_tecnicas_fuso (sheet Diesel_60)
 *   - fichas_tecnicas_fuso_ecanter (sheet eCanter_23)
 *
 * Idempotente. Pode ser corrido múltiplas vezes — re-importa sempre o
 * estado actual do xlsx. NÃO apaga linhas que existam na BD mas não no xlsx
 * (apaga manualmente se necessário).
 *
 * REGRA BANDEIRA: célula vazia no xlsx → NULL na BD. Sem defaults.
 *
 * Uso:
 *   pnpm tsx scripts/import_fuso_xlsx.ts
 *   ou
 *   npx tsx scripts/import_fuso_xlsx.ts
 *
 * Variáveis de ambiente esperadas (em .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (não a anon key — precisa permissão de upsert)
 */

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERRO: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em falta em .env.local');
  process.exit(1);
}

const XLSX_PATH = path.resolve(
  process.cwd(),
  'docs/fornecedores/fuso/CSN_FUSO_Catalog_S52_v3.xlsx'
);

if (!fs.existsSync(XLSX_PATH)) {
  console.error(`ERRO: ficheiro não encontrado: ${XLSX_PATH}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

/**
 * Converte o valor de uma célula para o tipo correcto.
 * Strings vazias/null/undefined → null (REGRA BANDEIRA).
 * Strings numéricas → number.
 */
function normalize(value: unknown): unknown {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'null') return null;
    return trimmed;
  }
  return value;
}

function rowsFromSheet(wb: XLSX.WorkBook, sheetName: string): Record<string, unknown>[] {
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" não encontrada`);
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    blankrows: false,
  });
  return raw.map((r) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) out[k] = normalize(v);
    return out;
  });
}

async function upsertBatch(
  table: 'fichas_tecnicas_fuso' | 'fichas_tecnicas_fuso_ecanter',
  rows: Record<string, unknown>[]
): Promise<void> {
  if (rows.length === 0) {
    console.log(`  ${table}: 0 linhas — skip`);
    return;
  }
  console.log(`  ${table}: a inserir ${rows.length} linhas...`);
  const { error, count } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'fuso_model_code', count: 'exact' });
  if (error) {
    console.error(`  ✗ ERRO em ${table}:`, error.message);
    throw error;
  }
  console.log(`  ✓ ${table}: ${count ?? rows.length} linhas upserted`);
}

async function main(): Promise<void> {
  console.log(`\nCSN FUSO Catalog Import\n${'='.repeat(60)}`);
  console.log(`Source: ${XLSX_PATH}`);
  console.log(`Target: ${SUPABASE_URL}\n`);

  const wb = XLSX.readFile(XLSX_PATH);
  console.log(`Sheets disponíveis: ${wb.SheetNames.join(', ')}\n`);

  // --- Diesel ---
  const dieselSheet = wb.SheetNames.find((s) => s.startsWith('Diesel'));
  if (!dieselSheet) throw new Error('Sheet Diesel_* não encontrada');
  const dieselRows = rowsFromSheet(wb, dieselSheet);
  console.log(`Sheet ${dieselSheet}: ${dieselRows.length} linhas lidas`);
  await upsertBatch('fichas_tecnicas_fuso', dieselRows);

  // --- eCanter ---
  const ecSheet = wb.SheetNames.find((s) => s.startsWith('eCanter'));
  if (!ecSheet) throw new Error('Sheet eCanter_* não encontrada');
  const ecRows = rowsFromSheet(wb, ecSheet);
  console.log(`Sheet ${ecSheet}: ${ecRows.length} linhas lidas`);
  await upsertBatch('fichas_tecnicas_fuso_ecanter', ecRows);

  // --- Verification ---
  const { count: dCount } = await supabase
    .from('fichas_tecnicas_fuso')
    .select('*', { count: 'exact', head: true });
  const { count: eCount } = await supabase
    .from('fichas_tecnicas_fuso_ecanter')
    .select('*', { count: 'exact', head: true });
  const { data: viewRows } = await supabase
    .from('v_catalogo_fuso')
    .select('propulsao', { count: 'exact', head: false })
    .limit(1);

  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION:');
  console.log(`  fichas_tecnicas_fuso         : ${dCount ?? '?'} rows  (expected 60)`);
  console.log(`  fichas_tecnicas_fuso_ecanter : ${eCount ?? '?'} rows  (expected 23)`);
  console.log(`  v_catalogo_fuso              : ${(dCount ?? 0) + (eCount ?? 0)} rows  (expected 83)`);
  console.log('='.repeat(60));

  if ((dCount ?? 0) !== 60 || (eCount ?? 0) !== 23) {
    console.warn('\n⚠ Contagens não bateram com o esperado — verificar.');
    process.exit(2);
  }
  console.log('\n✓ Import bem-sucedido.');
}

main().catch((err) => {
  console.error('\n✗ ERRO FATAL:', err);
  process.exit(1);
});
