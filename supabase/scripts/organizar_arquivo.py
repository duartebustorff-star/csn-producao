#!/usr/bin/env python3
"""
CSN Opus — Organizar arquivo de emails por fornecedor/cliente/tipo
Modo simulacao por defeito. Usar --executar para mover ficheiros.
"""

import os
import sys
import shutil
import re
from pathlib import Path
from collections import defaultdict

# ── Config ──────────────────────────────────────────────────────────
ORIGEM = Path(r"C:\Users\Utilizador\Desktop\Extratos\CSN-Email-Repositorio\POR-TIPO")
DESTINO = Path(r"C:\Users\Utilizador\Desktop\Extratos\CSN-Arquivo-Organizado")

# ── Regras de classificacao por entidade ────────────────────────────
# (padrao case-insensitive no nome do ficheiro, pasta destino)
ENTIDADE_RULES = [
    # Fornecedores
    (r"CHAGAS|F-GIGOT",                     "FORNECEDORES/CHAGAS"),
    (r"PECOL|SANTOS-JOELTOS",               "FORNECEDORES/PECOL"),
    (r"BIELCO",                             "FORNECEDORES/BIELCO"),
    (r"DHOLLANDIA",                         "FORNECEDORES/DHOLLANDIA"),
    (r"\bDAF\b|DAF_",                       "FORNECEDORES/DAF"),
    (r"Volkswagen|WV3",                     "FORNECEDORES/VOLKSWAGEN"),
    (r"MAN_TGS",                            "FORNECEDORES/MAN"),
    (r"Isuzu",                              "FORNECEDORES/ISUZU"),
    # Clientes
    (r"Santogal",                           "CLIENTES/SANTOGAL"),
    (r"MCoutinho|MCOUTINHO",                "CLIENTES/MCOUTINHO"),
    (r"Grupo.JAP|Grupo_JAP",               "CLIENTES/GRUPO-JAP"),
    (r"CSantosVP|C\.Santos",                "CLIENTES/CSANTOS-VP"),
    (r"Caetano.Auto|Caetano_Auto",         "CLIENTES/CAETANO-AUTO"),
    (r"Oneshop",                            "CLIENTES/ONESHOP"),
    # Interno — Financeiro
    (r"BPI_|DetalheMoviment|Extrato_de_Cont","INTERNO/FINANCEIRO/EXTRATOS"),
    (r"IVA_500861790",                      "INTERNO/FINANCEIRO/IVA"),
    (r"Balancete",                          "INTERNO/FINANCEIRO/BALANCETES"),
    # Interno — RH
    (r"Bohdan|Jos__Julio|Jo_o_Gomes|Bruno_Alves|Luisa_Pa|Nuno_Bap|Rodrigo_Neves",
                                            "INTERNO/RH"),
    # Interno — Viaturas
    (r"\bCOC\b|COCPT",                      "INTERNO/VIATURAS/COC"),
    (r"\bDAV_|\bdav_",                      "INTERNO/VIATURAS/DAV"),
    # Interno — Juridico
    (r"Decreto-Lei",                        "INTERNO/JURIDICO"),
]

# Compilar regex
ENTIDADE_COMPILED = [(re.compile(p, re.IGNORECASE), dest) for p, dest in ENTIDADE_RULES]

# ── Regras de tipo documental (dentro de fornecedor/cliente) ────────
TIPO_RULES = [
    (r"_FAT_|_FT_|_FAT\b",     "FATURAS"),
    (r"_GR_",                    "GUIAS"),
    (r"CERT31",                  "CERT31"),
    (r"_NC_",                    "NOTAS_CREDITO"),
    (r"_ANEXO_|_OR_",           "ORCAMENTOS_ANEXOS"),
]

TIPO_COMPILED = [(re.compile(p, re.IGNORECASE), dest) for p, dest in TIPO_RULES]


def classificar_entidade(nome: str) -> str:
    """Classifica ficheiro por entidade (fornecedor/cliente/interno)."""
    for regex, destino in ENTIDADE_COMPILED:
        if regex.search(nome):
            return destino
    return "INTERNO/OUTROS"


def classificar_tipo(nome: str) -> str:
    """Classifica ficheiro por tipo documental."""
    for regex, destino in TIPO_COMPILED:
        if regex.search(nome):
            return destino
    return "OUTROS"


def main():
    executar = "--executar" in sys.argv

    if not ORIGEM.exists():
        print(f"ERRO: Pasta origem nao encontrada: {ORIGEM}")
        sys.exit(1)

    # Recolher todos os ficheiros
    ficheiros = list(ORIGEM.rglob("*"))
    ficheiros = [f for f in ficheiros if f.is_file()]
    print(f"Ficheiros encontrados: {len(ficheiros)}")
    print(f"Origem:  {ORIGEM}")
    print(f"Destino: {DESTINO}")
    print(f"Modo:    {'EXECUTAR — vai mover ficheiros!' if executar else 'SIMULACAO — nada sera movido'}")
    print("-" * 80)

    # Classificar
    contagem = defaultdict(int)
    erros = 0

    for f in ficheiros:
        nome = f.name
        entidade = classificar_entidade(nome)

        # Fornecedores e clientes — subdividir por tipo
        if entidade.startswith("FORNECEDORES/") or entidade.startswith("CLIENTES/"):
            tipo = classificar_tipo(nome)
            pasta_destino = DESTINO / entidade / tipo
        else:
            pasta_destino = DESTINO / entidade

        destino_completo = pasta_destino / nome
        contagem[str(pasta_destino.relative_to(DESTINO))] += 1

        if executar:
            try:
                pasta_destino.mkdir(parents=True, exist_ok=True)
                shutil.copy2(str(f), str(destino_completo))
            except Exception as e:
                print(f"  ERRO: {nome} — {e}")
                erros += 1
                continue
        else:
            print(f"  MOVER: {nome}")
            print(f"      -> {pasta_destino.relative_to(DESTINO)}/")

    # Resumo
    print("-" * 80)
    print(f"\n{'MOVIDOS' if executar else 'A MOVER'} — Resumo por pasta destino:\n")

    for pasta in sorted(contagem.keys()):
        print(f"  {pasta:50s} {contagem[pasta]:>5} ficheiros")

    total = sum(contagem.values())
    print(f"\n  {'─' * 57}")
    print(f"  {'TOTAL':50s} {total:>5} ficheiros")

    if erros > 0:
        print(f"\n  ERROS: {erros}")

    if not executar:
        print(f"\nPara executar: python {sys.argv[0]} --executar")


if __name__ == "__main__":
    main()
