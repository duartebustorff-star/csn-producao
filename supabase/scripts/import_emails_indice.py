#!/usr/bin/env python3
"""
Importa INDICE_v4.xlsx para CSV compatível com a tabela public.emails_indice (Supabase).

Dependências:
  pip install pandas openpyxl

Caminhos por defeito (Windows):
  Origem:  .../Desktop/Extratos/CSN-Email-Repositorio/INDICE_v4.xlsx
  Destino: .../Desktop/Extratos/emails_indice_import.csv
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("Instala dependências: pip install pandas openpyxl", file=sys.stderr)
    sys.exit(1)

# Ordem e nomes das colunas no CSV (sem id / created_at — geridos pelo Supabase)
OUTPUT_COLUMNS = [
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

DEFAULT_INPUT = Path(
    r"C:\Users\Utilizador\Desktop\Extratos\CSN-Email-Repositorio\INDICE_v4.xlsx"
)
DEFAULT_OUTPUT = Path(r"C:\Users\Utilizador\Desktop\Extratos\emails_indice_import.csv")

# Para cada coluna de destino, lista de cabeçalhos normalizados aceites (após normalize_header)
ALIASES: dict[str, list[str]] = {
    "numero": ["numero", "nº", "no", "nr", "number", "n"],
    "mes": ["mes", "mês", "month"],
    "data_email": [
        "data_email",
        "data",
        "data_do_email",
        "date",
        "data_email_msg",
    ],
    "remetente": ["remetente", "from", "de", "sender"],
    "email_remetente": [
        "email_remetente",
        "email_do_remetente",
        "email_remet",
        "reply_to",
    ],
    "assunto": ["assunto", "subject", "titulo", "título"],
    "codigo_lead": [
        "codigo_lead",
        "ref_lead",
        "cod_lead",
        "codigo_ref",
    ],
    "tipo_doc": ["tipo_doc", "tipo", "tipo_documento", "documento"],
    "categoria": ["categoria", "category", "cat"],
    "nome_ficheiro": [
        "nome_ficheiro",
        "ficheiro",
        "filename",
        "file",
        "anexo",
    ],
    "pasta_lead": ["pasta_lead", "pasta_leads", "lead_folder"],
    "pasta_fornecedor": ["pasta_fornecedor", "pasta_forn", "fornecedor_folder"],
    "pasta_categoria": ["pasta_categoria", "pasta_cat"],
    "fornecedor": ["fornecedor", "supplier", "vendor"],
    "nome_original": ["nome_original", "original", "nome_orig"],
    "tamanho_bytes": [
        "tamanho_bytes",
        "tamanho",
        "size",
        "bytes",
        "tamanho_b",
    ],
    "content_type": ["content_type", "mime", "tipo_mime", "contenttype"],
    "notas": ["notas", "notes", "obs", "observacoes", "observações"],
    "spam": ["spam", "is_spam", "lixo"],
    "contacto_normalizado": [
        "contacto_normalizado",
        "contacto",
        "contact_normalizado",
    ],
    "email_pai": ["email_pai", "parent", "thread_id", "message_id_pai"],
}


def normalize_header(name: str) -> str:
    s = str(name).strip().lower()
    s = s.replace("á", "a").replace("à", "a").replace("ã", "a").replace("â", "a")
    s = s.replace("é", "e").replace("ê", "e")
    s = s.replace("í", "i")
    s = s.replace("ó", "o").replace("ô", "o")
    s = s.replace("ú", "u")
    s = re.sub(r"[^\w]+", "_", s, flags=re.UNICODE)
    s = re.sub(r"_+", "_", s).strip("_")
    return s


def build_column_lookup(df_columns: list) -> dict[str, str]:
    """Mapeia nome normalizado -> nome original na primeira linha do Excel."""
    return {normalize_header(c): str(c) for c in df_columns}


def resolve_source_column(target: str, lookup: dict[str, str]) -> str | None:
    """Devolve o nome original da coluna no Excel para o campo target, ou None."""
    for alias in ALIASES.get(target, [target]):
        a = normalize_header(alias)
        if a in lookup:
            return lookup[a]
    if normalize_header(target) in lookup:
        return lookup[normalize_header(target)]
    return None


def parse_bool_series(series: pd.Series) -> pd.Series:
    def one(x) -> bool:
        if pd.isna(x):
            return False
        if isinstance(x, bool):
            return x
        s = str(x).strip().lower()
        if s in ("1", "true", "sim", "yes", "s", "x"):
            return True
        if s in ("0", "false", "nao", "não", "no", "n", ""):
            return False
        try:
            return bool(int(float(s)))
        except ValueError:
            return False

    return series.map(one)


def format_data_email(series: pd.Series) -> pd.Series:
    out = []
    for x in series:
        if pd.isna(x):
            out.append("")
            continue
        if hasattr(x, "strftime"):
            out.append(x.strftime("%Y-%m-%d"))
            continue
        ts = pd.to_datetime(x, errors="coerce", dayfirst=True)
        if pd.isna(ts):
            out.append("")
        else:
            out.append(ts.strftime("%Y-%m-%d"))
    return pd.Series(out, index=series.index)


def format_tamanho_bytes(series: pd.Series) -> pd.Series:
    def one(x):
        if pd.isna(x) or x == "":
            return ""
        try:
            n = int(float(str(x).replace(",", ".").replace(" ", "")))
            return str(n)
        except ValueError:
            return ""

    return series.map(one)


def main() -> int:
    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT

    if not input_path.is_file():
        print(f"Ficheiro não encontrado: {input_path}", file=sys.stderr)
        return 1

    df = pd.read_excel(input_path, sheet_name=0, engine="openpyxl")
    lookup = build_column_lookup(list(df.columns))

    out_data: dict[str, pd.Series] = {}
    missing: list[str] = []

    for col in OUTPUT_COLUMNS:
        src = resolve_source_column(col, lookup)
        if src is None:
            missing.append(col)
            out_data[col] = pd.Series([""] * len(df), index=df.index)
        else:
            out_data[col] = df[src].copy()

    if missing:
        print(
            "Aviso: colunas sem correspondência no Excel (ficam vazias): "
            + ", ".join(missing),
            file=sys.stderr,
        )
        print("Cabeçalhos encontrados:", list(df.columns), file=sys.stderr)

    out = pd.DataFrame(out_data)

    if "data_email" in out.columns:
        out["data_email"] = format_data_email(out["data_email"])
    if "numero" in out.columns:
        out["numero"] = pd.to_numeric(out["numero"], errors="coerce").apply(
            lambda x: "" if pd.isna(x) else str(int(x))
        )
    if "tamanho_bytes" in out.columns:
        out["tamanho_bytes"] = format_tamanho_bytes(out["tamanho_bytes"])
    if "spam" in out.columns:
        out["spam"] = parse_bool_series(out["spam"]).map(lambda b: "true" if b else "false")

    for c in OUTPUT_COLUMNS:
        if c == "spam":
            continue
        out[c] = out[c].apply(lambda x: "" if pd.isna(x) else str(x).strip())

    out["codigo_lead"] = out["codigo_lead"].apply(
        lambda x: "SEM-REF" if not str(x).strip() else str(x).strip()
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(
        output_path,
        index=False,
        encoding="utf-8-sig",
        lineterminator="\n",
    )

    print(f"Linhas: {len(out)}")
    print(f"CSV guardado: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
