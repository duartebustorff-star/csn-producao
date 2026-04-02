#!/usr/bin/env python3
"""
CSN Opus — Ingest embeddings em batch
Processa PDFs da tabela documentos via /api/embeddings/gerar (Voyage AI)
"""

import os
import sys
import json
import time
import logging
import requests
from datetime import datetime
from pathlib import Path
from supabase import create_client

# ── Config ──────────────────────────────────────────────────────────
BATCH_SIZE = 10
BATCH_PAUSE = 10  # segundos entre batches (rate limit Voyage AI)
API_URL = "https://csn-producao.vercel.app/api/embeddings/gerar"
TIMEOUT = 120  # segundos por request (PDFs grandes)

# ── Carregar .env.local ─────────────────────────────────────────────
def load_env():
    env_path = Path(__file__).resolve().parent.parent.parent / ".env.local"
    if not env_path.exists():
        print(f"ERRO: {env_path} não encontrado")
        sys.exit(1)
    env = {}
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip()
    return env


def main():
    start = time.time()

    # Env
    env = load_env()
    sb_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    sb_key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not sb_url or not sb_key:
        print("ERRO: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em falta")
        sys.exit(1)

    sb = create_client(sb_url, sb_key)

    # Log de erros
    log_path = Path(__file__).resolve().parent / "ingest_errors.log"
    logging.basicConfig(
        filename=str(log_path),
        level=logging.ERROR,
        format="%(asctime)s | %(message)s",
    )

    # ── Buscar documentos pendentes (com paginacao) ────────────────────
    PAGE_SIZE = 1000

    # IDs já processados (paginar tambem)
    done_ids = set()
    offset = 0
    while True:
        resp = sb.table("embeddings") \
            .select("documento_id") \
            .not_.is_("documento_id", "null") \
            .range(offset, offset + PAGE_SIZE - 1) \
            .execute()
        for r in resp.data:
            done_ids.add(r["documento_id"])
        if len(resp.data) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    print(f"Embeddings ja existentes: {len(done_ids)}")

    # Documentos de email com storage_path (paginar)
    all_docs = []
    offset = 0
    while True:
        resp = sb.table("documentos") \
            .select("id, nome_ficheiro, storage_path, fornecedor_id") \
            .eq("origem", "email") \
            .not_.is_("storage_path", "null") \
            .order("id") \
            .range(offset, offset + PAGE_SIZE - 1) \
            .execute()
        all_docs.extend(resp.data)
        if len(resp.data) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    print(f"Total documentos email: {len(all_docs)}")

    todos = [d for d in all_docs if d["id"] not in done_ids]

    total = len(todos)
    if total == 0:
        print("Nenhum documento pendente.")
        return

    total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"Documentos pendentes: {total} | Batches: {total_batches} | Batch size: {BATCH_SIZE}")
    print(f"API: {API_URL}")
    print("-" * 70)

    # ── Processar em batches ─────────────────────────────────────────
    ok_count = 0
    err_count = 0
    chunks_total = 0

    for batch_num in range(total_batches):
        batch_start = batch_num * BATCH_SIZE
        batch = todos[batch_start : batch_start + BATCH_SIZE]

        for doc in batch:
            doc_id = doc["id"]
            nome = doc.get("nome_ficheiro", "?")

            try:
                r = requests.post(
                    API_URL,
                    json={"documento_id": doc_id},
                    timeout=TIMEOUT,
                )

                if r.status_code == 200:
                    data = r.json()
                    n_chunks = data.get("chunks", 0)
                    chunks_total += n_chunks
                    ok_count += 1
                    print(
                        f"  Batch {batch_num+1}/{total_batches} — "
                        f"doc {doc_id} — {nome[:40]} — "
                        f"chunks {n_chunks} — OK"
                    )
                else:
                    err_count += 1
                    err_msg = r.text[:200]
                    print(
                        f"  Batch {batch_num+1}/{total_batches} — "
                        f"doc {doc_id} — ERRO {r.status_code}: {err_msg}"
                    )
                    logging.error(f"doc_id={doc_id} | status={r.status_code} | {err_msg}")

            except Exception as e:
                err_count += 1
                print(
                    f"  Batch {batch_num+1}/{total_batches} — "
                    f"doc {doc_id} — EXCEPTION: {e}"
                )
                logging.error(f"doc_id={doc_id} | exception | {e}")

        # Pausa entre batches
        if batch_num < total_batches - 1:
            time.sleep(BATCH_PAUSE)

    # ── Resumo ───────────────────────────────────────────────────────
    elapsed = time.time() - start
    print("-" * 70)
    print(f"Concluido em {elapsed:.1f}s")
    print(f"  Processados OK: {ok_count}/{total}")
    print(f"  Embeddings criados: {chunks_total}")
    print(f"  Erros: {err_count}")
    if err_count > 0:
        print(f"  Log de erros: {log_path}")


if __name__ == "__main__":
    main()
