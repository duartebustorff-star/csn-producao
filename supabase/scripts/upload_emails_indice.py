#!/usr/bin/env python3
"""
Upload emails_indice_import.csv para a tabela public.emails_indice no Supabase.

Dependências:
  pip install supabase python-dotenv

Uso:
  python supabase/scripts/upload_emails_indice.py
  python supabase/scripts/upload_emails_indice.py "C:\caminho\outro.csv"
"""

from __future__ import annotations

import csv
import math
import sys
from pathlib import Path

try:
    from dotenv import dotenv_values
    from supabase import create_client
except ImportError:
    print(
        "Instala dependências: pip install supabase python-dotenv",
        file=sys.stderr,
    )
    sys.exit(1)

BATCH_SIZE = 500

DEFAULT_CSV = Path(
    r"C:\Users\Utilizador\Desktop\Extratos\emails_indice_import.csv"
)

# Campos que mapeiam directamente do CSV para a tabela
COLUMNS = [
    "numero",
    "mes",
    "data_email",
    "remetente",
    "email_remetente",
    "assunto",
    "codigo_lead",
    "tipo_doc",
    "categoria",
    "nome_ficheiro",
    "pasta_lead",
    "pasta_fornecedor",
    "pasta_categoria",
    "fornecedor",
    "nome_original",
    "tamanho_bytes",
    "content_type",
    "notas",
    "spam",
    "contacto_normalizado",
    "email_pai",
]

INT_FIELDS = {"numero", "tamanho_bytes"}
BOOL_FIELDS = {"spam"}


def clean_row(raw: dict[str, str]) -> dict[str, object]:
    """Converte uma linha CSV num dict limpo para insert no Supabase."""
    row: dict[str, object] = {}
    for col in COLUMNS:
        val = raw.get(col, "").strip()

        if val == "":
            row[col] = None
            continue

        if col in INT_FIELDS:
            try:
                row[col] = int(float(val))
            except (ValueError, OverflowError):
                row[col] = None
        elif col in BOOL_FIELDS:
            row[col] = val.lower() in ("true", "1", "sim", "yes")
        else:
            row[col] = val

    return row


def load_env() -> tuple[str, str]:
    """Lê NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env.local."""
    # Procura .env.local subindo até à raiz do projecto
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
        print("Erro: .env.local não encontrado", file=sys.stderr)
        sys.exit(1)

    env = dotenv_values(env_path)
    url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        print(
            "Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em falta no .env.local",
            file=sys.stderr,
        )
        sys.exit(1)

    return url, key


def main() -> int:
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV

    if not csv_path.is_file():
        print(f"Ficheiro não encontrado: {csv_path}", file=sys.stderr)
        return 1

    # Ler todas as linhas do CSV
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = [clean_row(r) for r in reader]

    total = len(rows)
    if total == 0:
        print("CSV vazio — nada a importar.")
        return 0

    num_batches = math.ceil(total / BATCH_SIZE)
    print(f"CSV: {csv_path.name} — {total} linhas, {num_batches} batches de {BATCH_SIZE}")

    # Ligar ao Supabase
    url, key = load_env()
    supabase = create_client(url, key)

    inserted = 0
    for i in range(num_batches):
        start = i * BATCH_SIZE
        end = min(start + BATCH_SIZE, total)
        batch = rows[start:end]

        print(f"  Batch {i + 1}/{num_batches} ({start + 1}–{end})...", end=" ", flush=True)
        result = supabase.table("emails_indice").insert(batch).execute()
        count = len(result.data) if result.data else 0
        inserted += count
        print(f"OK ({count})")

    print(f"\nTotal inserido: {inserted}/{total}")

    if inserted == total:
        print("Import completo com sucesso.")
    else:
        print(f"AVISO: {total - inserted} linhas não inseridas!", file=sys.stderr)

    return 0 if inserted == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
