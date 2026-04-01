#!/usr/bin/env python3
"""
Upload PDFs referenciados em emails_indice para Supabase Storage (bucket 'documentos')
e insere registos na tabela public.documentos.

Fluxo:
  1. Lê da tabela emails_indice todos os registos com content_type = 'application/pdf'
  2. Localiza o ficheiro físico em CSN-Email-Repositorio (tenta pasta_lead, pasta_fornecedor, pasta_categoria)
  3. Upload para Storage: documentos/email/{fornecedor}/{nome_ficheiro}
  4. Insere na tabela documentos com origem='email', estado='importado'

Dependências:
  pip install supabase python-dotenv

Uso:
  python supabase/scripts/upload_documentos_email.py
"""

from __future__ import annotations

import math
import sys
import time
from pathlib import Path

try:
    from dotenv import dotenv_values
    from supabase import create_client
except ImportError:
    print(
        "Instala dependencias: pip install supabase python-dotenv",
        file=sys.stderr,
    )
    sys.exit(1)

BATCH_SIZE = 50

# Raiz do repositorio de emails com PDFs organizados por pasta
EMAIL_REPO = Path(
    r"C:\Users\Utilizador\Desktop\Extratos\CSN-Email-Repositorio"
)

STORAGE_BUCKET = "documentos"
STORAGE_PREFIX = "email"  # documentos/email/{fornecedor}/{nome_ficheiro}


def load_env() -> tuple[str, str]:
    """Le NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env.local."""
    search = Path(__file__).resolve().parent
    env_path = None
    for _ in range(10):
        candidate = search / ".env.local"
        if candidate.is_file():
            env_path = candidate
            break
        if search.parent == search:
            break
        search = search.parent

    if env_path is None:
        print("Erro: .env.local nao encontrado", file=sys.stderr)
        sys.exit(1)

    env = dotenv_values(env_path)
    url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        print(
            "Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em falta",
            file=sys.stderr,
        )
        sys.exit(1)

    return url, key


def resolve_file(row: dict) -> Path | None:
    """Tenta localizar o PDF fisico usando pasta_lead, pasta_fornecedor, pasta_categoria."""
    nome = row.get("nome_ficheiro", "")
    if not nome:
        return None

    # Ordem por frequencia: pasta_lead (90%), pasta_fornecedor (9%), pasta_categoria (1%)
    for pasta_key in ("pasta_lead", "pasta_fornecedor", "pasta_categoria"):
        pasta = row.get(pasta_key, "")
        if not pasta:
            continue
        full = EMAIL_REPO / pasta / nome
        if full.is_file():
            return full

    return None


def fetch_pdf_rows(supabase) -> list[dict]:
    """Busca todos os registos emails_indice com content_type = application/pdf."""
    all_rows: list[dict] = []
    page_size = 1000
    offset = 0

    while True:
        resp = (
            supabase.table("emails_indice")
            .select(
                "id, nome_ficheiro, fornecedor, tipo_doc, data_email, "
                "pasta_lead, pasta_fornecedor, pasta_categoria"
            )
            .eq("content_type", "application/pdf")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = resp.data or []
        all_rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size

    return all_rows


def main() -> int:
    url, key = load_env()
    supabase = create_client(url, key)

    print("A consultar emails_indice (content_type = application/pdf)...")
    rows = fetch_pdf_rows(supabase)
    total = len(rows)
    print(f"Encontrados: {total} registos PDF")

    if total == 0:
        print("Nada a importar.")
        return 0

    # Resolve ficheiros fisicos
    resolved: list[tuple[dict, Path]] = []
    not_found = 0
    for row in rows:
        fp = resolve_file(row)
        if fp:
            resolved.append((row, fp))
        else:
            not_found += 1

    print(f"Ficheiros localizados: {len(resolved)}/{total} ({not_found} nao encontrados)")

    if not resolved:
        print("Nenhum ficheiro para upload.")
        return 0

    num_batches = math.ceil(len(resolved) / BATCH_SIZE)
    print(f"Upload: {len(resolved)} ficheiros em {num_batches} batches de {BATCH_SIZE}\n")

    uploaded = 0
    inserted = 0
    skipped_upload = 0
    errors = 0
    t0 = time.time()

    for i in range(num_batches):
        start = i * BATCH_SIZE
        end = min(start + BATCH_SIZE, len(resolved))
        batch = resolved[start:end]

        print(f"Batch {i + 1}/{num_batches} ({start + 1}-{end})...", flush=True)

        doc_rows: list[dict] = []

        for row, file_path in batch:
            fornecedor = row.get("fornecedor") or "SEM-FORNECEDOR"
            nome = row["nome_ficheiro"]
            storage_path = f"{STORAGE_PREFIX}/{fornecedor}/{nome}"

            # Upload para Storage
            try:
                with open(file_path, "rb") as f:
                    file_bytes = f.read()

                resp = supabase.storage.from_(STORAGE_BUCKET).upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={
                        "content-type": "application/pdf",
                        "upsert": "true",
                    },
                )
                uploaded += 1
            except Exception as e:
                err_msg = str(e)
                # Se o ficheiro ja existe no Storage, continuar com o insert
                if "Duplicate" in err_msg or "already exists" in err_msg:
                    skipped_upload += 1
                else:
                    errors += 1
                    print(f"    ERRO upload {nome}: {err_msg}", file=sys.stderr)
                    continue

            # Gerar signed URL (1 ano)
            try:
                url_resp = supabase.storage.from_(STORAGE_BUCKET).create_signed_url(
                    storage_path, 60 * 60 * 24 * 365
                )
                signed_url = url_resp.get("signedURL", "") if isinstance(url_resp, dict) else ""
            except Exception:
                signed_url = ""

            # Preparar registo para tabela documentos
            doc_rows.append(
                {
                    "nome_ficheiro": nome,
                    "storage_path": storage_path,
                    "url_ficheiro": signed_url or None,
                    "origem": "email",
                    "tipo_entrada": "pdf",
                    "tipo_documento": row.get("tipo_doc") or "OUTRO",
                    "tipo": row.get("tipo_doc") or "outro",
                    "entidade_nome": fornecedor,
                    "data_entrada": row.get("data_email") or None,
                    "estado": "importado",
                    "agente": "script-import",
                    "classificacao": {"emails_indice_id": row["id"]},
                }
            )

        # Insert batch na tabela documentos
        if doc_rows:
            try:
                result = supabase.table("documentos").insert(doc_rows).execute()
                count = len(result.data) if result.data else 0
                inserted += count
                print(f"  -> {count} documentos inseridos, {uploaded} uploads OK", flush=True)
            except Exception as e:
                errors += 1
                print(f"  -> ERRO insert batch: {e}", file=sys.stderr)

    elapsed = time.time() - t0
    print(f"\n{'='*50}")
    print(f"Concluido em {elapsed:.1f}s")
    print(f"  Uploads Storage:   {uploaded} ({skipped_upload} duplicados ignorados)")
    print(f"  Documentos insert: {inserted}")
    print(f"  Nao encontrados:   {not_found}")
    print(f"  Erros:             {errors}")
    print(f"  Total processado:  {uploaded + skipped_upload + errors}/{len(resolved)}")

    return 0 if errors == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
