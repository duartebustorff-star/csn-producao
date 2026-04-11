#!/usr/bin/env node
/**
 * ingest-inventor-docs.mjs
 * ========================
 * Ingere chunks_COMPLETO.json (Autodesk Inventor 2026 Local Help)
 * para a tabela knowledge_inventor no Supabase, e gera embeddings
 * via Voyage AI (voyage-3, 1024 dims).
 *
 * Uso:
 *   node scripts/ingest-inventor-docs.mjs                 (upsert + embeddings)
 *   node scripts/ingest-inventor-docs.mjs --rows-only     (apenas upsert, sem embeddings)
 *   node scripts/ingest-inventor-docs.mjs --embeddings-only (apenas re-gerar embeddings)
 *
 * Requer em .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   VOYAGE_API_KEY
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// ---------- env loading (simples, sem depender de dotenv) ----------
function loadEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "..", "..", "..", ".env.local"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const txt = fs.readFileSync(p, "utf8");
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
      return p;
    }
  }
  return null;
}
const envPath = loadEnv();
if (envPath) console.log(`[env] loaded ${envPath}`);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERRO: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em falta");
  process.exit(1);
}
if (!VOYAGE_API_KEY) {
  console.error("ERRO: VOYAGE_API_KEY em falta");
  process.exit(1);
}

// ---------- args ----------
const args = new Set(process.argv.slice(2));
const ROWS_ONLY = args.has("--rows-only");
const EMB_ONLY = args.has("--embeddings-only");

const JSON_PATH = "C:/Users/Utilizador/Downloads/chunks_COMPLETO.json";
const TABLE = "knowledge_inventor";
const ROW_BATCH = 500;
const EMB_BATCH = 128;       // Voyage aceita ate 128 inputs por call
const CONTENT_MAX_CHARS = 30000; // guard-rail para content gigante

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ---------- helpers ----------
function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function voyageEmbed(texts) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-3",
      input: texts,
      input_type: "document",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage API ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();
  // devolve na mesma ordem do input
  return data.data.map((d) => d.embedding);
}

// ---------- step 1: upsert rows (sem embedding) ----------
async function upsertRows() {
  console.log(`[rows] a ler ${JSON_PATH}...`);
  const raw = fs.readFileSync(JSON_PATH, "utf8");
  const chunks = JSON.parse(raw);
  console.log(`[rows] ${chunks.length} chunks carregados`);

  const rows = chunks.map((c) => ({
    id: c.id,
    source: c.source ?? null,
    url: c.url ?? null,
    title: c.title ?? null,
    section: c.section ?? null,
    category: c.category ?? null,
    tags: Array.isArray(c.tags) ? c.tags : null,
    content: (c.content ?? "").slice(0, CONTENT_MAX_CHARS),
    code_snippets: c.code_snippets ?? [],
  }));

  const batches = chunkArray(rows, ROW_BATCH);
  let inserted = 0;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const { error } = await supabase
      .from(TABLE)
      .upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`[rows] batch ${i + 1}/${batches.length} ERRO:`, error.message);
      throw error;
    }
    inserted += batch.length;
    console.log(`[rows] ${inserted}/${rows.length} upserted (batch ${i + 1}/${batches.length})`);
  }
  console.log(`[rows] done (${inserted} rows)`);
}

// ---------- step 2: gerar embeddings para rows sem embedding ----------
async function generateEmbeddings() {
  console.log(`[emb] a procurar rows sem embedding...`);
  // Pagina 1000 a 1000 ate nao haver mais
  let totalProcessed = 0;
  while (true) {
    const { data: rows, error } = await supabase
      .from(TABLE)
      .select("id, title, content")
      .is("embedding", null)
      .limit(1000);
    if (error) {
      console.error(`[emb] select ERRO:`, error.message);
      throw error;
    }
    if (!rows || rows.length === 0) {
      console.log(`[emb] nao ha mais rows por processar`);
      break;
    }
    console.log(`[emb] lote de ${rows.length} rows`);

    const batches = chunkArray(rows, EMB_BATCH);
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      // Prepend title ao content para dar mais contexto ao embedding
      const texts = batch.map((r) => {
        const t = r.title ? `${r.title}\n\n` : "";
        const c = (r.content ?? "").slice(0, 8000); // voyage-3 aceita ate 32k tokens, mas 8k chars e seguro
        return `${t}${c}`;
      });

      let embeddings;
      try {
        embeddings = await voyageEmbed(texts);
      } catch (e) {
        console.error(`[emb] Voyage ERRO no batch ${i + 1}/${batches.length}:`, e.message);
        // backoff simples e retry 1x
        await new Promise((r) => setTimeout(r, 5000));
        embeddings = await voyageEmbed(texts);
      }

      // Update row-by-row (Supabase nao suporta update em bulk com valores diferentes via API standard)
      // Mas para 7419 rows isto chega. Em alternativa usariamos um RPC batch.
      for (let j = 0; j < batch.length; j++) {
        const id = batch[j].id;
        const emb = embeddings[j];
        const { error: upErr } = await supabase
          .from(TABLE)
          .update({ embedding: emb })
          .eq("id", id);
        if (upErr) {
          console.error(`[emb] update ${id} ERRO:`, upErr.message);
          throw upErr;
        }
      }
      totalProcessed += batch.length;
      console.log(`[emb] ${totalProcessed} embeddings feitos (batch ${i + 1}/${batches.length} do lote)`);
    }
  }
  console.log(`[emb] done (${totalProcessed} embeddings)`);
}

// ---------- main ----------
(async () => {
  try {
    if (!EMB_ONLY) await upsertRows();
    if (!ROWS_ONLY) await generateEmbeddings();
    console.log("OK");
  } catch (e) {
    console.error("FALHA:", e);
    process.exit(1);
  }
})();
