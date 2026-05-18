"""Pega no último report do extractor e gera o sumário pedido pelo Duarte."""
from __future__ import annotations

import glob
import json
from pathlib import Path

OUT = Path(__file__).parent / "output"

latest = sorted(OUT.glob("fam_extraction_report_*.json"))[-1]
report = json.loads(latest.read_text(encoding="utf-8"))

# Particionar por status
extracted = [r for r in report['results'] if r['status'] == 'dry_run']
scanned = [r for r in report['results'] if r['status'] == 'scanned']
other = [r for r in report['results']
         if r['status'] not in ('dry_run', 'scanned')]

total_novos = sum(len(r['fields_new']) for r in extracted)
total_alterados = sum(len(r['fields_changed']) for r in extracted)
with_changes = [r for r in extracted if r['fields_changed']]
without_changes = [r for r in extracted if not r['fields_changed']]

output = {
    "source_report": latest.name,
    "summary": {
        "total_fams_db": len(report['results']),
        "fams_extracted": len(extracted),
        "fams_scanned_or_cid": len(scanned),
        "fams_other": len(other),
        "total_campos_novos": total_novos,
        "total_campos_alterados": total_alterados,
        "fams_com_alterados": [f"{r['homologacao']}/{r['extensao']}" for r in with_changes],
        "fams_sem_alterados": [f"{r['homologacao']}/{r['extensao']}" for r in without_changes],
        "fams_scanned": [
            {
                "id": f"{r['homologacao']}/{r['extensao']}",
                "marca": r['marca'],
                "razao": "scan ou CID-encoded — precisa OCR",
            }
            for r in scanned
        ],
    },
    "extracted_fams": [
        {
            "id": f"{r['homologacao']}/{r['extensao']}",
            "marca": r['marca'],
            "fields_extracted": r['fields_extracted'],
            "campos_novos_count": len(r['fields_new']),
            "campos_novos": r['fields_new'],
            "campos_alterados_count": len(r['fields_changed']),
            "campos_alterados": r['fields_changed'],
            "warnings": r['warnings'],
        }
        for r in extracted
    ],
}

out_path = OUT / "dry_run_13_FAMs.json"
out_path.write_text(json.dumps(output, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
print(f"Gravado: {out_path}")

# Imprimir relatório em texto
print()
print("=" * 80)
print("DRY-RUN 19 FAMs (12 extraídas + 7 scanned/cid)")
print("=" * 80)
print()
for r in extracted:
    fid = f"{r['homologacao']}/{r['extensao']}"
    print(f"### FAM {fid}  ({r['marca']})")
    print(f"  Campos extraídos: {r['fields_extracted']}")
    print(f"  Campos novos: {len(r['fields_new'])}")
    print(f"  Campos alterados: {len(r['fields_changed'])}")
    if r['fields_changed']:
        for c in r['fields_changed']:
            print(f"    • {c['field']}")
            o = str(c['old'])
            n = str(c['new'])
            print(f"        actual: {o[:160]}{'…' if len(o) > 160 else ''}")
            print(f"        novo:   {n[:160]}{'…' if len(n) > 160 else ''}")
    if r['warnings']:
        for w in r['warnings']:
            print(f"    ⚠  {w}")
    print()

print("=" * 80)
print("RESUMO")
print("=" * 80)
print(f"Total campos novos: {total_novos}")
print(f"Total campos alterados: {total_alterados}")
def fam_list(rs):
    return ", ".join(f"{r['homologacao']}/{r['extensao']}" for r in rs)
print(f"FAMs com alterados ({len(with_changes)}): {fam_list(with_changes)}")
print(f"FAMs sem alterados ({len(without_changes)}): {fam_list(without_changes)}")
print(f"FAMs scanned/cid ({len(scanned)}): {fam_list(scanned)}")
