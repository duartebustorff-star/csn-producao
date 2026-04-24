#!/usr/bin/env node
/**
 * embed-inventor-rag.mjs
 * ======================
 * Backfill de embeddings Voyage AI (voyage-3, 1024 dims) para a tabela
 * public.inventor_rag. Le chunks em lotes de 100, gera embeddings e
 * escreve de volta na coluna `embedding`. Resumable: filtra embedding IS NULL.
 *
 * Uso:
 *   node scripts/embed-inventor-rag.mjs
 *
 * Requer em .env.local (worktree usa o .env.local do repo pai):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   VOYAGE_API_KEY
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// ---------- env loading ----------
function loadEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    // worktree → .claude/worktrees/<name> → sobe 3 ate ao repo
    path.resolve(process.cwd(), "..", "..", "..", ".env.local"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const txt = fs.readFileSync(p, "utf8");
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        }
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

// ---------- config ----------
const TABLE = "inventor_rag";
const ROW_BATCH = 100;           // batch de leitura/update
const CONTENT_MAX_CHARS = 8000;  // voyage-3 aceita ate 32k tokens; 8k chars e seguro
const UPDATE_CONCURRENCY = 20;   // updates concorrentes por batch
const LOG_EVERY = 1000;
const MAX_RETRIES = 3;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ---------- helpers ----------
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function voyageEmbed(texts) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
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
      return data.data.map((d) => d.embedding);
    } catch (e) {
      lastErr = e;
      const wait = 2000 * attempt;
      console.error(`[voyage] tentativa ${attempt}/${MAX_RETRIES} falhou: ${e.message} — espera ${wait}ms`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

async function updateOne(id, emb) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const { error } = await supabase
      .from(TABLE)
      .update({ embedding: emb })
      .eq("id", id);
    if (!error) return;
    if (attempt === MAX_RETRIES) {
      throw new Error(`update id=${id} falhou: ${error.message}`);
    }
    await sleep(1000 * attempt);
  }
}

async function updateBatch(batch, embeddings) {
  // processa em grupos concorrentes para acelerar roundtrips
  let idx = 0;
  while (idx < batch.length) {
    const slice = batch.slice(idx, idx + UPDATE_CONCURRENCY);
    const embSlice = embeddings.slice(idx, idx + UPDATE_CONCURRENCY);
    await Promise.all(slice.map((r, k) => updateOne(r.id, embSlice[k])));
    idx += UPDATE_CONCURRENCY;
  }
}

function buildText(row) {
  const t = row.titulo ? `${row.titulo}\n\n` : "";
  const c = (row.content ?? "").slice(0, CONTENT_MAX_CHARS);
  return `${t}${c}`;
}

// ---------- main loop ----------
async function main() {
  const startedAt = Date.now();

  // totais iniciais
  const { count: remainingStart, error: cErr } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .is("embedding", null);
  if (cErr) throw cErr;
  console.log(`[start] ${remainingStart} rows sem embedding`);

  let processed = 0;
  let sinceLastLog = 0;
  let lastLoggedAt = Date.now();

  while (true) {
    const { data: rows, error } = await supabase
      .from(TABLE)
      .select("id, titulo, content")
      .is("embedding", null)
      .order("id", { ascending: true })
      .limit(ROW_BATCH);
    if (error) {
      console.error(`[select] ERRO: ${error.message}`);
      throw error;
    }
    if (!rows || rows.length === 0) {
      console.log(`[done] nao ha mais rows sem embedding`);
      break;
    }

    const texts = rows.map(buildText);
    const embeddings = await voyageEmbed(texts);
    if (embeddings.length !== rows.length) {
      throw new Error(`Voyage devolveu ${embeddings.length} embeddings para ${rows.length} inputs`);
    }
    // Sanity check: dim correta
    if (embeddings[0].length !== 1024) {
      throw new Error(`dim inesperada ${embeddings[0].length} (esperado 1024)`);
    }

    await updateBatch(rows, embeddings);

    processed += rows.length;
    sinceLastLog += rows.length;

    if (sinceLastLog >= LOG_EVERY) {
      const now = Date.now();
      const dt = (now - lastLoggedAt) / 1000;
      const rate = sinceLastLog / dt;
      const totalElapsed = (now - startedAt) / 1000;
      const remaining = Math.max(0, remainingStart - processed);
      const etaSec = rate > 0 ? Math.round(remaining / rate) : -1;
      console.log(
        `[progress] ${processed}/${remainingStart} (${((processed / remainingStart) * 100).toFixed(1)}%) ` +
          `— ${rate.toFixed(1)} rows/s — elapsed ${Math.round(totalElapsed)}s — eta ${etaSec}s`
      );
      sinceLastLog = 0;
      lastLoggedAt = now;
    }
  }

  const totalSec = Math.round((Date.now() - startedAt) / 1000);
  console.log(`[done] ${processed} embeddings gerados em ${totalSec}s`);
}

main().catch((e) => {
  console.error("[fatal]", e);
  process.exit(1);
});
