"""
Extractor completo de FAMs (Fichas de Aprovação Modular IMT).

Lê PDFs do Supabase Storage `documentos/FAM_*.pdf`, extrai TODOS os campos
numerados conforme a estrutura legal (directiva 2007/46/CE + sucessoras)
e faz UPDATE em public.fams.

REGRA BANDEIRA: cada valor → fonte directa do PDF ou NULL. Nunca inventar.

Uso:
    py -3 scripts/extract_fams.py                                  # dry-run (todas)
    py -3 scripts/extract_fams.py --commit                         # commit (todas)
    py -3 scripts/extract_fams.py --fam-id 202410007291 --extensao 0108           # dry-run uma
    py -3 scripts/extract_fams.py --fam-id 202410007291 --extensao 0108 --commit  # commit uma
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

import pdfplumber
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# ----------------------------------------------------------------------------
# Setup
# ----------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "scripts" / "output"
PDF_DIR = OUT_DIR / "raw_pdfs"
FAMS_DIR = OUT_DIR / "fams_processadas"
OUT_DIR.mkdir(parents=True, exist_ok=True)
PDF_DIR.mkdir(parents=True, exist_ok=True)
FAMS_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv("C:/Users/Utilizador/Projectos-AI/csn-producao/.env.local")
load_dotenv(REPO_ROOT / ".env.local")

COLUMN_BOUNDARY_X = 313
HEADER_BOTTOM_Y = 195
FOOTER_TOP_Y = 720


def get_supabase() -> Client:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("ERRO: faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
        sys.exit(2)
    return create_client(url, key)


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
def _int(s: str | None) -> int | None:
    if s is None:
        return None
    s = s.strip()
    if not s:
        return None
    try:
        return int(s)
    except ValueError:
        return None


def _float(s: str | None) -> float | None:
    if s is None:
        return None
    s = s.strip().replace(",", ".")
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def _txt(s: str | None) -> str | None:
    """Trim, return None if empty."""
    if s is None:
        return None
    v = s.strip()
    return v if v else None


def _match(pattern: str, text: str, flags: int = re.MULTILINE) -> re.Match | None:
    return re.search(pattern, text, flags)


# ----------------------------------------------------------------------------
# PDF I/O
# ----------------------------------------------------------------------------
def download_pdf(url: str, dest: Path) -> Path:
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    dest.write_bytes(r.content)
    return dest


@dataclass
class Zones:
    header: str = ""
    left: str = ""
    right: str = ""
    footer: str = ""
    full: str = ""


def extract_zones(pdf_path: Path) -> Zones | None:
    """Crop PDF in 4 zones: header / left-col / right-col / footer.
    Returns None if text is not extractable (scan) or is CID-encoded (font
    subset without unicode mapping) — both cases need OCR.
    """
    with pdfplumber.open(pdf_path) as pdf:
        if not pdf.pages:
            return None
        page = pdf.pages[0]
        full = page.extract_text() or ""
        if len(full.strip()) < 100:
            return None
        # CID-encoded text (e.g. (cid:5)(cid:6)…) is gibberish even if length
        # is large. Detect via marker frequency or absence of "HOMOLOGAÇÃO".
        if '(cid:' in full or 'HOMOLOGA' not in full.upper():
            return None
        header = page.crop((0, 0, page.width, HEADER_BOTTOM_Y)).extract_text() or ""
        left = page.crop((0, HEADER_BOTTOM_Y, COLUMN_BOUNDARY_X, FOOTER_TOP_Y)).extract_text() or ""
        right = page.crop((COLUMN_BOUNDARY_X, HEADER_BOTTOM_Y, page.width, FOOTER_TOP_Y)).extract_text() or ""
        footer = page.crop((0, FOOTER_TOP_Y, page.width, page.height)).extract_text() or ""
    return Zones(header=header, left=left, right=right, footer=footer, full=full)


# ----------------------------------------------------------------------------
# Parsers
# ----------------------------------------------------------------------------
def parse_header(text: str) -> dict[str, Any]:
    """Extracts: numero_homologacao_nacional, extensao, numero_homologacao_ce,
    situacao, data_despacho.
    """
    out: dict[str, Any] = {}

    # N.º DE HOMOLOGAÇÃO NACIONAL 202410007291 extensão0108 SITUAÇÃO: REGULAR
    m = _match(r'HOMOLOGA[ÇC][ÃA]O[ \t]+NACIONAL[ \t]+(\d+)[ \t]+extens[ãa]o[ \t]*(\w+)[ \t]+SITUA[ÇC][ÃA]O[ \t]*:[ \t]*(\w+)', text)
    if m:
        out['numero_homologacao_nacional'] = m.group(1).strip()
        out['extensao'] = m.group(2).strip()
        out['situacao'] = m.group(3).strip()

    # Line above "N.º DE HOMOLOGAÇÃO CE" — value typically printed on previous line, like e2*2018/858*00075*01
    # The header text often is:
    #   e2*2018/858*00075*01
    #   N.º DE HOMOLOGAÇÃO CE DESPACHO EM:2024-11-08
    # So we grab the line preceding the CE label.
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    for i, line in enumerate(lines):
        if re.search(r'HOMOLOGA[ÇC][ÃA]O[ \t]+CE', line):
            if i > 0 and re.match(r'^[a-z0-9]+\*', lines[i - 1], re.IGNORECASE):
                out['numero_homologacao_ce'] = lines[i - 1]
            m_desp = re.search(r'DESPACHO[ \t]+EM[ \t]*:[ \t]*(\d{4}-\d{2}-\d{2})', line)
            if m_desp:
                out['data_despacho'] = m_desp.group(1)
            break

    return out


def parse_left(text: str) -> dict[str, Any]:
    """Parse left column (Características Gerais + Pesos + Motor)."""
    out: dict[str, Any] = {}

    # 0.1 MARCA <marca...> <codigo>?
    m = _match(r'^[ \t]*0\.1[ \t]+MARCA[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_0_1_marca'] = _txt(m.group(1))
        out['campo_0_1_marca_codigo'] = _txt(m.group(2))

    # 0.2 MODELO <modelo...> <codigo>?
    m = _match(r'^[ \t]*0\.2[ \t]+MODELO[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_0_2_modelo'] = _txt(m.group(1))
        out['campo_0_2_modelo_codigo'] = _txt(m.group(2))

    # VARIANTE <texto>
    m = _match(r'^[ \t]*VARIANTE[ \t]+(.+?)[ \t]*$', text)
    if m:
        out['variante'] = _txt(m.group(1))

    # VERSÃO <texto>
    m = _match(r'^[ \t]*VERS[ÃA]O[ \t]+(.+?)[ \t]*$', text)
    if m:
        out['versao'] = _txt(m.group(1))

    # 0.2.1 DESIGN. COMERCIAL <texto> <codigo>?
    m = _match(r'^[ \t]*0\.2\.1[ \t]+DESIGN\.?[ \t]+COMERCIAL[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_0_2_1_designacao_comercial'] = _txt(m.group(1))
        out['campo_0_2_1_designacao_codigo'] = _txt(m.group(2))

    # 0.4 CATEGORIA <cat> <codigo>? — sometimes on its own then "TIPO" on next line
    m = _match(r'^[ \t]*0\.4[ \t]+CATEGORIA[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_0_4_categoria'] = _txt(m.group(1))
        out['campo_0_4_categoria_codigo'] = _txt(m.group(2))

    # TIPO <texto> <codigo>? (only if NOT preceded by other label keyword)
    m = _match(r'^[ \t]*TIPO[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['tipo'] = _txt(m.group(1))
        out['tipo_codigo'] = _txt(m.group(2))

    # CÓDIGO CE <code>
    m = _match(r'^[ \t]*C[ÓO]DIGO[ \t]+CE[ \t]+(.+?)[ \t]*$', text)
    if m:
        out['codigo_ce'] = _txt(m.group(1))

    # 0.5 FABRICANTE <nome...> <codigo>?
    m = _match(r'^[ \t]*0\.5[ \t]+FABRICANTE[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_0_5_fabricante'] = _txt(m.group(1))
        out['campo_0_5_fabricante_codigo'] = _txt(m.group(2))

    # 0.6 CLASSE <texto>?
    m = _match(r'^[ \t]*0\.6[ \t]+CLASSE[ \t]*(.+?)?[ \t]*$', text)
    if m:
        out['campo_0_6_classe'] = _txt(m.group(1))

    # 0.7 TIPO DE MÁQUINA <texto>?
    m = _match(r'^[ \t]*0\.7[ \t]+TIPO[ \t]+DE[ \t]+M[ÁA]QUINA[ \t]*(.+?)?[ \t]*$', text)
    if m:
        out['campo_0_7_tipo_maquina'] = _txt(m.group(1))

    # 1 N.º de Eixos F <f> R <r> T <t>
    m = _match(r'^[ \t]*1[ \t]+N\.?[ \t]*º?[ \t]*de[ \t]+Eixos[ \t]+F[ \t]*(\d*)[ \t]+R[ \t]*(\d*)[ \t]+T[ \t]*(\d*)[ \t]*$', text, re.MULTILINE | re.IGNORECASE)
    if m:
        out['campo_1_eixos_f'] = _int(m.group(1))
        out['campo_1_eixos_r'] = _int(m.group(2))
        out['campo_1_eixos_t'] = _int(m.group(3))

    # N.º de Rodas F <f> R <r> T <t> (no leading number)
    m = _match(r'^[ \t]*N\.?[ \t]*º?[ \t]*de[ \t]+Rodas[ \t]+F[ \t]*(\d*)[ \t]+R[ \t]*(\d*)[ \t]+T[ \t]*(\d*)[ \t]*$', text, re.MULTILINE | re.IGNORECASE)
    if m:
        out['campo_1_rodas_f'] = _int(m.group(1))
        out['campo_1_rodas_r'] = _int(m.group(2))
        out['campo_1_rodas_t'] = _int(m.group(3))

    # 2 N.º de Eixos Motores F <f>? R <r>?
    m = _match(r'^[ \t]*2[ \t]+N\.?[ \t]*º?[ \t]*de[ \t]+Eixos[ \t]+Motores[ \t]+F[ \t]*(\S*)[ \t]*R[ \t]*(\S*)[ \t]*$', text, re.MULTILINE | re.IGNORECASE)
    if m:
        out['campo_2_eixos_motores_f'] = _txt(m.group(1))
        out['campo_2_eixos_motores_r'] = _txt(m.group(2))

    # 3 Distância entre Eixos <n>
    m = _match(r'^[ \t]*3[ \t]+Dist[âa]ncia[ \t]+entre[ \t]+Eixos[ \t]+(\d+)[ \t]*$', text)
    if m:
        out['campo_3_distancia_entre_eixos'] = _int(m.group(1))

    # 5 Largura de Via <resto> + possibly next 2 lines (Mínima / Máxima)
    # Capture raw string of all 3 sub-lines.
    m = re.search(
        r'^[ \t]*5[ \t]+Largura[ \t]+de[ \t]+Via[ \t]+(.+?)[ \t]*(?:\n[ \t]*M[íi]nima[ \t]+(.+?))?[ \t]*(?:\n[ \t]*M[áa]xima[ \t]+(.+?))?[ \t]*$',
        text, re.MULTILINE | re.DOTALL
    )
    if m:
        parts = [f"eixos:{m.group(1).strip()}"]
        if m.group(2): parts.append(f"min:{m.group(2).strip()}")
        if m.group(3): parts.append(f"max:{m.group(3).strip()}")
        out['campo_5_largura_via'] = " | ".join(parts) if parts else None

    # 6.1 Comprimento <n>
    m = _match(r'^[ \t]*6\.1[ \t]+Comprimento[ \t]+(\d+)[ \t]*$', text)
    if m:
        out['campo_6_1_comprimento'] = _int(m.group(1))

    # 7.1 Largura <n>
    m = _match(r'^[ \t]*7\.1[ \t]+Largura[ \t]+(\d+)[ \t]*$', text)
    if m:
        out['campo_7_1_largura'] = _int(m.group(1))

    # 8 Altura <n>
    m = _match(r'^[ \t]*8[ \t]+Altura[ \t]+(\d+)[ \t]*$', text)
    if m:
        out['campo_8_altura'] = _int(m.group(1))

    # 9.1 Dist. Eixo-Apoio <texto>?
    m = _match(r'^[ \t]*9\.1[ \t]+Dist\.?[ \t]+Eixo-Apoio[ \t]*(.+?)?[ \t]*$', text)
    if m:
        out['campo_9_1_dist_eixo_apoio'] = _txt(m.group(1))

    # 9.2 Dist. Eixo-Frente/Frente <texto>?
    m = _match(r'^[ \t]*9\.2[ \t]+Dist\.?[ \t]+Eixo[-/]?Frente.*?[ \t]*(\S+)?[ \t]*$', text)
    if m:
        # Be careful: label always present; value is anything after "Frente/Frente"
        # Use a separate regex to grab text after literal "Eixo-Frente/Frente"
        m2 = _match(r'^[ \t]*9\.2[ \t]+Dist\.?[ \t]+Eixo-Frente\/Frente[ \t]+(.+?)[ \t]*$', text)
        if m2:
            out['campo_9_2_dist_eixo_frente'] = _txt(m2.group(1))

    # 11 Eixo Ret. à Retaguarda <texto>?
    m = _match(r'^[ \t]*11[ \t]+Eixo[ \t]+Ret\.?[ \t]+[àa][ \t]+Retaguarda[ \t]+(.+?)[ \t]*$', text)
    if m:
        out['campo_11_eixo_ret_retaguarda'] = _txt(m.group(1))

    # 11.1 Dist. Eixos Consecutivos 1-2<n>? 2-3<n>? 3-4<n>?
    # Glued or spaced: "1-24215 2-3 3-4" or "1-2 4215 2-3 3-4"
    m = _match(
        r'^[ \t]*11\.1[ \t]+Dist\.?[ \t]+Eixos[ \t]+Consecutivos[ \t]+1-2[ \t]*(\d*)[ \t]+2-3[ \t]*(\d*)[ \t]+3-4[ \t]*(\d*)[ \t]*$',
        text
    )
    if m:
        parts = []
        if m.group(1): parts.append(f"1-2:{m.group(1)}")
        if m.group(2): parts.append(f"2-3:{m.group(2)}")
        if m.group(3): parts.append(f"3-4:{m.group(3)}")
        out['campo_11_1_dist_eixos_consecutivos'] = " ".join(parts) if parts else None

    # 11.2 Avanço do Prato Máx. <n>? Min. <n>?
    m = _match(r'^[ \t]*11\.2[ \t]+Avan[çc]o[ \t]+do[ \t]+Prato[ \t]+M[áa]x\.?[ \t]*(\S*)[ \t]*Min\.?[ \t]*(\S*)[ \t]*$', text)
    if m:
        out['campo_11_2_avanco_prato_max'] = _txt(m.group(1))
        out['campo_11_2_avanco_prato_min'] = _txt(m.group(2))

    # 12.1 Tara F <f>? R <r>? T <t>?
    m = _match(r'^[ \t]*12\.1[ \t]+Tara[ \t]+F[ \t]*(\S*)[ \t]+R[ \t]*(\S*)[ \t]+T[ \t]*(\d*)[ \t]*$', text)
    if m:
        out['campo_12_1_tara_f'] = _txt(m.group(1))
        out['campo_12_1_tara_r'] = _txt(m.group(2))
        out['campo_12_1_tara_t'] = _int(m.group(3))

    # 14.1 Peso Bruto (TOTAL) <n>
    m = _match(r'^[ \t]*14\.1[ \t]+Peso[ \t]+Bruto[ \t]+\(TOTAL\)[ \t]+(\d+)[ \t]*$', text)
    if m:
        out['campo_14_1_peso_bruto_total'] = _int(m.group(1))

    # 14.2 Distribuição do PB Frente <f>? Retaguarda <r>?
    m = _match(r'^[ \t]*14\.2[ \t]+Distribui[çc][ãa]o[ \t]+do[ \t]+PB[ \t]+Frente[ \t]*(\S*)[ \t]*Retaguarda[ \t]*(\S*)[ \t]*$', text)
    if m:
        out['campo_14_2_distribuicao_pb_frente'] = _txt(m.group(1))
        out['campo_14_2_distribuicao_pb_retaguarda'] = _txt(m.group(2))

    # 14.3 Máximo Admissível 1F0<n>? 2R0<n>? 3 <n>? 4 <n>?
    m = _match(r'^[ \t]*14\.3[ \t]+M[áa]ximo[ \t]+Admiss[íi]vel[ \t]+(.+?)[ \t]*$', text)
    if m:
        out['campo_14_3_maximo_admissivel'] = _txt(m.group(1))

    # 14.4 Peso Máx. Disp. Engate <texto>?
    m = _match(r'^[ \t]*14\.4[ \t]+Peso[ \t]+M[áa]x\.?[ \t]+Disp\.?[ \t]+Engate[ \t]*(.+?)?[ \t]*$', text)
    if m:
        out['campo_14_4_peso_max_disp_engate'] = _txt(m.group(1))

    # 17 Peso Bruto Rebocável com Travão <n>? sem Travão <n>?
    m = _match(r'^[ \t]*17[ \t]+Peso[ \t]+Bruto[ \t]+Reboc[áa]vel[ \t]+com[ \t]+Trav[ãa]o[ \t]*(\d*)[ \t]+sem[ \t]+Trav[ãa]o[ \t]*(\d*)[ \t]*$', text)
    if m:
        out['campo_17_peso_rebocavel_com_travao'] = _int(m.group(1))
        out['campo_17_peso_rebocavel_sem_travao'] = _int(m.group(2))

    # 18 Peso Bruto Conjunto <n>?
    m = _match(r'^[ \t]*18[ \t]+Peso[ \t]+Bruto[ \t]+Conjunto[ \t]*(\d*)[ \t]*$', text)
    if m:
        out['campo_18_peso_bruto_conjunto'] = _int(m.group(1))

    # Motor section:
    # Homologação <n> Extensão <ext>
    m = _match(r'^[ \t]*Homologa[çc][ãa]o[ \t]+(\d+)[ \t]+Extens[ãa]o[ \t]+(\S+)[ \t]*$', text)
    if m:
        out['campo_motor_homologacao'] = m.group(1)
        out['campo_motor_extensao'] = m.group(2)

    # 20 Marca <marca...> <codigo>?
    m = _match(r'^[ \t]*20[ \t]+Marca[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_20_marca'] = _txt(m.group(1))
        out['campo_20_marca_codigo'] = _txt(m.group(2))

    # 21 Modelo <texto...>
    m = _match(r'^[ \t]*21[ \t]+Modelo[ \t]+(.+?)[ \t]*$', text)
    if m:
        out['campo_21_modelo'] = _txt(m.group(1))

    # 23 N.º de Cilindros <n>?
    m = _match(r'^[ \t]*23[ \t]+N\.?[ \t]*º?[ \t]*de[ \t]+Cilindros[ \t]+(\d+)[ \t]*$', text)
    if m:
        out['campo_23_num_cilindros'] = _int(m.group(1))

    # 24 Cilindrada <n>?
    m = _match(r'^[ \t]*24[ \t]+Cilindrada[ \t]+(\d+)[ \t]*$', text)
    if m:
        out['campo_24_cilindrada'] = _int(m.group(1))

    # 25 Combustível / Energia <texto> <codigo>?
    m = _match(r'^[ \t]*25[ \t]+Combust[íi]vel[ \t]*/[ \t]*Energia[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_25_combustivel'] = _txt(m.group(1))
        out['campo_25_combustivel_codigo'] = _txt(m.group(2))

    # 26 Potência Máxima <n> Kw a <n> rpm
    m = _match(r'^[ \t]*26[ \t]+Pot[êe]ncia[ \t]+M[áa]xima[ \t]+(.+?)[ \t]*$', text)
    if m:
        out['campo_26_potencia_maxima'] = _txt(m.group(1))

    # 27 %Máx. Biocombustível <n>?
    m = _match(r'^[ \t]*27[ \t]+%M[áa]x\.?[ \t]+Biocombust[íi]vel[ \t]+(.+?)[ \t]*$', text)
    if m:
        out['campo_27_max_biocombustivel'] = _txt(m.group(1))

    return out


def parse_right(text: str) -> dict[str, Any]:
    """Parse right column (Transmissão + Caixa + Emissões)."""
    out: dict[str, Any] = {}

    # 28 Caixa de Velocidades <tipo> <codigo>?
    m = _match(r'^[ \t]*28[ \t]+Caixa[ \t]+de[ \t]+Velocidades[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_28_caixa_velocidades'] = _txt(m.group(1))
        out['campo_28_codigo'] = _txt(m.group(2))

    # 32 Pneumáticos Frente <pneu>
    m = _match(r'^[ \t]*32[ \t]+Pneum[áa]ticos[ \t]+Frente[ \t]+(.+?)[ \t]*$', text)
    if m:
        out['campo_32_pneumaticos_frente'] = _txt(m.group(1))

    # 32.1 Retaguarda <pneu>
    m = _match(r'^[ \t]*32\.1[ \t]+Retaguarda[ \t]+(.+?)[ \t]*$', text)
    if m:
        out['campo_32_1_pneumaticos_retaguarda'] = _txt(m.group(1))

    # 33 Suspensão Frente <tipo> <codigo>?
    m = _match(r'^[ \t]*33[ \t]+Suspens[ãa]o[ \t]+Frente[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_33_suspensao_frente'] = _txt(m.group(1))
        out['campo_33_codigo'] = _txt(m.group(2))

    # 33.1 Retaguarda <tipo> <codigo>?
    m = _match(r'^[ \t]*33\.1[ \t]+Retaguarda[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_33_1_suspensao_retaguarda'] = _txt(m.group(1))
        out['campo_33_1_codigo'] = _txt(m.group(2))

    # 35 Travões Serviço <tipo> <codigo>?
    m = _match(r'^[ \t]*35[ \t]+Trav[õo]es[ \t]+Servi[çc]o[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_35_travoes_servico'] = _txt(m.group(1))
        out['campo_35_codigo'] = _txt(m.group(2))

    # 36 Estacionamento <tipo> <codigo>?
    m = _match(r'^[ \t]*36[ \t]+Estacionamento[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_36_travoes_estacionamento'] = _txt(m.group(1))
        out['campo_36_codigo'] = _txt(m.group(2))

    # 37 Tipo <tipo> <codigo>?
    m = _match(r'^[ \t]*37[ \t]+Tipo[ \t]+(.+?)(?:[ \t]+(\d+))?[ \t]*$', text)
    if m:
        out['campo_37_tipo_caixa'] = _txt(m.group(1))
        out['campo_37_codigo'] = _txt(m.group(2))

    # 37.1 Categoria Europeia <texto>?
    m = _match(r'^[ \t]*37\.1[ \t]+Categoria[ \t]+Europeia[ \t]+(.+?)[ \t]*$', text)
    if m:
        out['campo_37_1_categoria_europeia'] = _txt(m.group(1))

    # 37.2 Comprimento Exterior Máx. <n>? Min. <n>?
    m = _match(r'^[ \t]*37\.2[ \t]+Comprimento[ \t]+Exterior[ \t]+M[áa]x\.?[ \t]*(\d*)[ \t]*Min\.?[ \t]*(\d*)[ \t]*$', text)
    if m:
        out['campo_37_2_comprimento_exterior_max'] = _int(m.group(1))
        out['campo_37_2_comprimento_exterior_min'] = _int(m.group(2))

    # 37.3 Comprimento Interior Máx. <v>? Min. <v>?
    m = _match(r'^[ \t]*37\.3[ \t]+Comprimento[ \t]+Interior[ \t]+M[áa]x\.?[ \t]*(\S*)[ \t]*Min\.?[ \t]*(\S*)[ \t]*$', text)
    if m:
        out['campo_37_3_comprimento_interior_max'] = _txt(m.group(1))
        out['campo_37_3_comprimento_interior_min'] = _txt(m.group(2))

    # 37.4 Total <v>?
    m = _match(r'^[ \t]*37\.4[ \t]+Total[ \t]*(.+?)?[ \t]*$', text)
    if m:
        out['campo_37_4_total'] = _txt(m.group(1))

    # 37.5 Altura Interior Máx. <v>? Min. <v>?
    m = _match(r'^[ \t]*37\.5[ \t]+Altura[ \t]+Interior[ \t]+M[áa]x\.?[ \t]*(\S*)[ \t]*Min\.?[ \t]*(\S*)[ \t]*$', text)
    if m:
        out['campo_37_5_altura_interior_max'] = _txt(m.group(1))
        out['campo_37_5_altura_interior_min'] = _txt(m.group(2))

    # 37.6 Largura Exterior Máx. <n>? Min. <v>?
    m = _match(r'^[ \t]*37\.6[ \t]+Largura[ \t]+Exterior[ \t]+M[áa]x\.?[ \t]*(\d*)[ \t]*(?:Min\.?[ \t]*(\S*))?[ \t]*$', text)
    if m:
        out['campo_37_6_largura_exterior_max'] = _int(m.group(1))
        out['campo_37_6_largura_exterior_min'] = _txt(m.group(2))

    # 37.7 Avanço Centro Gravidade Máx. <v>? Min. <v>?
    # Note the PDF often has "GravidadeMáx." glued.
    m = _match(r'^[ \t]*37\.7[ \t]+Avan[çc]o[ \t]+Centro[ \t]+Gravidade[ \t]*M[áa]x\.?[ \t]*(\S*)[ \t]*Min\.?[ \t]*(\S*)[ \t]*$', text)
    if m:
        out['campo_37_7_avanco_centro_gravidade_max'] = _txt(m.group(1))
        out['campo_37_7_avanco_centro_gravidade_min'] = _txt(m.group(2))

    # 37.8 Avanço cg/calculo Máx. <v>? Min. <v>?
    m = _match(r'^[ \t]*37\.8[ \t]+Avan[çc]o[ \t]+cg[/]?c[áa]lculo[ \t]+M[áa]x\.?[ \t]*(\S*)[ \t]*Min\.?[ \t]*(\S*)[ \t]*$', text)
    if m:
        out['campo_37_8_avanco_cg_calculo_max'] = _txt(m.group(1))
        out['campo_37_8_avanco_cg_calculo_min'] = _txt(m.group(2))

    # 41 N.º de Portas <n>?
    m = _match(r'^[ \t]*41[ \t]+N\.?[ \t]*º?[ \t]*de[ \t]+Portas[ \t]*(\d*)[ \t]*$', text)
    if m:
        out['campo_41_num_portas'] = _int(m.group(1))

    # 42.1 Lotação Total <n>?
    m = _match(r'^[ \t]*42\.1[ \t]+Lota[çc][ãa]o[ \t]+Total[ \t]*(\d*)[ \t]*$', text)
    if m:
        out['campo_42_1_lotacao_total'] = _int(m.group(1))

    # 42.2 Sentada F <f>? M <m>? R <r>?
    m = _match(r'^[ \t]*42\.2[ \t]+Sentada[ \t]+F[ \t]*(\d*)[ \t]+M[ \t]*(\S*)[ \t]+R[ \t]*(\S*)[ \t]*$', text)
    if m:
        out['campo_42_2_sentada_f'] = _int(m.group(1))
        out['campo_42_2_sentada_m'] = _txt(m.group(2))
        out['campo_42_2_sentada_r'] = _txt(m.group(3))

    # 42.3 Em Pé <v>?
    m = _match(r'^[ \t]*42\.3[ \t]+Em[ \t]+P[ée][ \t]*(.+?)?[ \t]*$', text)
    if m:
        out['campo_42_3_em_pe'] = _txt(m.group(1))

    # 45 Nível Sonoro Estacionário <db> dB (A) a <rpm> rpm
    m = _match(r'^[ \t]*45[ \t]+N[íi]vel[ \t]+Sonoro[ \t]+Estacion[áa]rio[ \t]+([\d.,]+)[ \t]+dB[ \t]*\(A\)[ \t]+a[ \t]+(\d+)[ \t]+rpm[ \t]*$', text)
    if m:
        out['campo_45_nivel_sonoro_estacionario_db'] = _float(m.group(1))
        out['campo_45_nivel_sonoro_estacionario_rpm'] = _int(m.group(2))

    # 45.1 Nível Sonoro em Movim. <db> dB (A)
    m = _match(r'^[ \t]*45\.1[ \t]+N[íi]vel[ \t]+Sonoro[ \t]+em[ \t]+Movim\.?[ \t]+([\d.,]+)[ \t]+dB[ \t]*\(A\)[ \t]*$', text)
    if m:
        out['campo_45_1_nivel_sonoro_movimento'] = _float(m.group(1))

    # 46.1 Emissões — sub-rows: CO (Tipo I), CO (Tipo II), HC, NOx, HC+NOx, Partículas
    # 46.1 Emissões CO (Tipo I) <v>g / Km
    m = _match(r'^[ \t]*46\.1[ \t]+Emiss[õo]es[ \t]+CO[ \t]*\(Tipo[ \t]*I\)[ \t]+([\d.,]+)?[ \t]*g[ \t]*/[ \t]*Km[ \t]*$', text)
    if m:
        out['campo_46_1_co_tipo_i'] = _float(m.group(1))

    # CO (Tipo II) <v>%
    m = _match(r'^[ \t]*CO[ \t]*\(Tipo[ \t]*II\)[ \t]+(.+?)?[ \t]*%[ \t]*$', text)
    if m:
        out['campo_46_1_co_tipo_ii'] = _txt(m.group(1))

    # HC <v>?g / Km
    m = _match(r'^[ \t]*HC[ \t]+([\d.,]+)?[ \t]*g[ \t]*/[ \t]*Km[ \t]*$', text)
    if m:
        out['campo_46_1_hc'] = _float(m.group(1))

    # NOx <v>?g / Km
    m = _match(r'^[ \t]*NOx[ \t]+([\d.,]+)?[ \t]*g[ \t]*/[ \t]*Km[ \t]*$', text)
    if m:
        out['campo_46_1_nox'] = _float(m.group(1))

    # HC+NOx <v>?g / Km
    m = _match(r'^[ \t]*HC\+NOx[ \t]+(.+?)?[ \t]*g[ \t]*/[ \t]*Km[ \t]*$', text)
    if m:
        out['campo_46_1_hc_nox'] = _txt(m.group(1))

    # Partículas <v>?g / Km
    m = _match(r'^[ \t]*Part[íi]culas[ \t]+([\d.,]+)?[ \t]*g[ \t]*/[ \t]*Km[ \t]*$', text)
    if m:
        out['campo_46_1_particulas'] = _float(m.group(1))

    # 46.2 CO2 — block:
    # 46.2 CO2 Combustível I Combustível II
    #      <combustivel_label, e.g. GASOLEO>
    # Urbano <n>g / Km <n>g / Km
    # Extra Urbano <n>g / Km <n>g / Km
    # Combinado <n>g / Km <n>g / Km
    m = _match(r'^[ \t]*Urbano[ \t]+([\d.,]+)?[ \t]*g[ \t]*/[ \t]*Km[ \t]+(\S*)[ \t]*g[ \t]*/[ \t]*Km[ \t]*$', text)
    if m:
        out['campo_46_2_co2_urbano_comb1'] = _float(m.group(1))
        out['campo_46_2_co2_urbano_comb2'] = _txt(m.group(2))

    m = _match(r'^[ \t]*Extra[ \t]+Urbano[ \t]+(\S*)[ \t]*g[ \t]*/[ \t]*Km[ \t]+(\S*)[ \t]*g[ \t]*/[ \t]*Km[ \t]*$', text)
    if m:
        out['campo_46_2_co2_extra_urbano_comb1'] = _txt(m.group(1))
        out['campo_46_2_co2_extra_urbano_comb2'] = _txt(m.group(2))

    m = _match(r'^[ \t]*Combinado[ \t]+(\S*)[ \t]*g[ \t]*/[ \t]*Km[ \t]+(\S*)[ \t]*g[ \t]*/[ \t]*Km[ \t]*$', text)
    if m:
        out['campo_46_2_co2_combinado_comb1'] = _txt(m.group(1))
        out['campo_46_2_co2_combinado_comb2'] = _txt(m.group(2))

    # 46.3 Cons. Combustível Urb. <n>l / 100 Km
    m = _match(r'^[ \t]*46\.3[ \t]+Cons\.?[ \t]+Combust[íi]vel[ \t]+Urb\.?[ \t]+([\d.,]+)?[ \t]*l[ \t]*/[ \t]*100[ \t]+Km[ \t]*$', text)
    if m:
        out['campo_46_3_consumo_urbano'] = _float(m.group(1))

    # Extra Urbano <n>l / 100 Km (only when in this section)
    m = _match(r'^[ \t]*Extra[ \t]+Urbano[ \t]+([\d.,]+)?[ \t]*l[ \t]*/[ \t]*100[ \t]+Km[ \t]*$', text)
    if m:
        out['campo_46_3_consumo_extra_urbano'] = _txt(m.group(1))

    m = _match(r'^[ \t]*Combinado[ \t]+([\d.,]+)?[ \t]*l[ \t]*/[ \t]*100[ \t]+Km[ \t]*$', text)
    if m:
        out['campo_46_3_consumo_combinado'] = _txt(m.group(1))

    # 46.4 Redução Emissão CO 2 <v>?g / Km
    m = _match(r'^[ \t]*46\.4[ \t]+Redu[çc][ãa]o[ \t]+Emiss[ãa]o[ \t]+CO[ \t]*2?[ \t]+(.+?)?[ \t]*g[ \t]*/[ \t]*Km[ \t]*$', text)
    if m:
        out['campo_46_4_reducao_emissao_co2'] = _txt(m.group(1))

    # 46.5 Tecnologia Inovativa <v>?
    m = _match(r'^[ \t]*46\.5[ \t]+Tecnologia[ \t]+Inovativa[ \t]*(.+?)?[ \t]*$', text)
    if m:
        out['campo_46_5_tecnologia_inovativa'] = _txt(m.group(1))

    # 46.6 Autonomia baterias Valor <v>? Km
    m = _match(r'^[ \t]*46\.6[ \t]+Autonomia[ \t]+baterias[ \t]+Valor[ \t]*(.+?)?[ \t]*Km[ \t]*$', text)
    if m:
        out['campo_46_6_autonomia_baterias'] = _txt(m.group(1))

    # 46.7 Fonte <v>?
    m = _match(r'^[ \t]*46\.7[ \t]+Fonte[ \t]*(.+?)?[ \t]*$', text)
    if m:
        out['campo_46_7_fonte'] = _txt(m.group(1))

    return out


def parse_footer(text: str) -> dict[str, Any]:
    """Parse footer: 50 - Anotações + UNIDADES.
    Anotações pode ocupar várias linhas (wrap). Juntamos tudo num único texto
    com espaço entre linhas — separadores ' ; ' já existem no source quando há
    sub-items independentes.
    """
    out: dict[str, Any] = {}
    m = re.search(r'50[ \t]*-[ \t]*Anota[çc][õo]es[ \t]*\n(.+?)(?:\n[ \t]*UNIDADES|\Z)', text, re.DOTALL)
    if m:
        body = m.group(1).strip()
        # Colapsar quebras de linha em espaço único, e múltiplos espaços em 1.
        body = re.sub(r'\s+', ' ', body).strip()
        out['campo_50_anotacoes'] = _txt(body)
    return out


def parse_all(zones: Zones) -> dict[str, Any]:
    """Run all sub-parsers and merge. Validations are done separately."""
    out: dict[str, Any] = {}
    out.update(parse_header(zones.header))
    out.update(parse_left(zones.left))
    out.update(parse_right(zones.right))
    out.update(parse_footer(zones.footer))
    return out


# ----------------------------------------------------------------------------
# Validation (informational, non-blocking)
# ----------------------------------------------------------------------------
def validate(fields: dict[str, Any]) -> list[str]:
    warnings: list[str] = []
    wb = fields.get('campo_3_distancia_entre_eixos')
    if wb is not None and not (1500 < wb < 6000):
        warnings.append(f"WB {wb}mm fora do esperado (1500-6000)")
    tara = fields.get('campo_12_1_tara_t')
    pbt = fields.get('campo_14_1_peso_bruto_total')
    if tara is not None and pbt is not None and tara > pbt:
        warnings.append(f"Tara ({tara}) > PBT ({pbt})")
    f_tara = fields.get('campo_12_1_tara_f')
    r_tara = fields.get('campo_12_1_tara_r')
    if f_tara and r_tara and tara:
        try:
            if abs(int(f_tara) + int(r_tara) - int(tara)) > 50:
                warnings.append(f"Tara F+R ≠ T (F={f_tara} R={r_tara} T={tara})")
        except (ValueError, TypeError):
            pass
    return warnings


# ----------------------------------------------------------------------------
# DB update
# ----------------------------------------------------------------------------
# Whitelist of columns we may write to (column names in `fams`).
WRITABLE_COLUMNS = {
    'numero_homologacao_ce', 'situacao', 'data_despacho',
    'campo_0_1_marca', 'campo_0_1_marca_codigo',
    'campo_0_2_modelo', 'campo_0_2_modelo_codigo',
    'variante', 'versao',
    'campo_0_2_1_designacao_comercial', 'campo_0_2_1_designacao_codigo',
    'campo_0_4_categoria', 'campo_0_4_categoria_codigo',
    'tipo', 'tipo_codigo', 'codigo_ce',
    'campo_0_5_fabricante', 'campo_0_5_fabricante_codigo',
    'campo_0_6_classe', 'campo_0_7_tipo_maquina',
    'campo_1_eixos_f', 'campo_1_eixos_r', 'campo_1_eixos_t',
    'campo_1_rodas_f', 'campo_1_rodas_r', 'campo_1_rodas_t',
    'campo_2_eixos_motores_f', 'campo_2_eixos_motores_r',
    'campo_3_distancia_entre_eixos',
    'campo_5_largura_via',
    'campo_6_1_comprimento', 'campo_7_1_largura', 'campo_8_altura',
    'campo_9_1_dist_eixo_apoio', 'campo_9_2_dist_eixo_frente',
    'campo_11_eixo_ret_retaguarda',
    'campo_11_1_dist_eixos_consecutivos',
    'campo_11_2_avanco_prato_max', 'campo_11_2_avanco_prato_min',
    'campo_12_1_tara_f', 'campo_12_1_tara_r', 'campo_12_1_tara_t',
    'campo_14_1_peso_bruto_total',
    'campo_14_2_distribuicao_pb_frente', 'campo_14_2_distribuicao_pb_retaguarda',
    'campo_14_3_maximo_admissivel', 'campo_14_4_peso_max_disp_engate',
    'campo_17_peso_rebocavel_com_travao', 'campo_17_peso_rebocavel_sem_travao',
    'campo_18_peso_bruto_conjunto',
    'campo_motor_homologacao', 'campo_motor_extensao',
    'campo_20_marca', 'campo_20_marca_codigo',
    'campo_21_modelo',
    'campo_23_num_cilindros', 'campo_24_cilindrada',
    'campo_25_combustivel', 'campo_25_combustivel_codigo',
    'campo_26_potencia_maxima', 'campo_27_max_biocombustivel',
    'campo_28_caixa_velocidades', 'campo_28_codigo',
    'campo_32_pneumaticos_frente', 'campo_32_1_pneumaticos_retaguarda',
    'campo_33_suspensao_frente', 'campo_33_codigo',
    'campo_33_1_suspensao_retaguarda', 'campo_33_1_codigo',
    'campo_35_travoes_servico', 'campo_35_codigo',
    'campo_36_travoes_estacionamento', 'campo_36_codigo',
    'campo_37_tipo_caixa', 'campo_37_codigo',
    'campo_37_1_categoria_europeia',
    'campo_37_2_comprimento_exterior_max', 'campo_37_2_comprimento_exterior_min',
    'campo_37_3_comprimento_interior_max', 'campo_37_3_comprimento_interior_min',
    'campo_37_4_total',
    'campo_37_5_altura_interior_max', 'campo_37_5_altura_interior_min',
    'campo_37_6_largura_exterior_max', 'campo_37_6_largura_exterior_min',
    'campo_37_7_avanco_centro_gravidade_max', 'campo_37_7_avanco_centro_gravidade_min',
    'campo_37_8_avanco_cg_calculo_max', 'campo_37_8_avanco_cg_calculo_min',
    'campo_41_num_portas',
    'campo_42_1_lotacao_total',
    'campo_42_2_sentada_f', 'campo_42_2_sentada_m', 'campo_42_2_sentada_r',
    'campo_42_3_em_pe',
    'campo_45_nivel_sonoro_estacionario_db', 'campo_45_nivel_sonoro_estacionario_rpm',
    'campo_45_1_nivel_sonoro_movimento',
    'campo_46_1_co_tipo_i', 'campo_46_1_co_tipo_ii',
    'campo_46_1_hc', 'campo_46_1_nox', 'campo_46_1_hc_nox', 'campo_46_1_particulas',
    'campo_46_2_co2_urbano_comb1', 'campo_46_2_co2_extra_urbano_comb1', 'campo_46_2_co2_combinado_comb1',
    'campo_46_2_co2_urbano_comb2', 'campo_46_2_co2_extra_urbano_comb2', 'campo_46_2_co2_combinado_comb2',
    'campo_46_3_consumo_urbano', 'campo_46_3_consumo_extra_urbano', 'campo_46_3_consumo_combinado',
    'campo_46_4_reducao_emissao_co2', 'campo_46_5_tecnologia_inovativa',
    'campo_46_6_autonomia_baterias', 'campo_46_7_fonte',
    'campo_50_anotacoes',
}


@dataclass
class FamResult:
    id: int
    homologacao: str
    extensao: str
    marca: str | None
    status: str
    fields_extracted: int = 0
    fields_new: list[str] = field(default_factory=list)
    fields_changed: list[dict] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    error: str | None = None
    updated: bool = False


def diff_existing(current: dict, parsed: dict) -> tuple[dict, list[str], list[dict]]:
    """Return (update_payload, new_fields, changed_fields).
    Never overwrite existing non-null values with None — only fill blanks or
    update real changes.
    """
    payload: dict[str, Any] = {}
    new_fields: list[str] = []
    changed: list[dict] = []
    for k, new_v in parsed.items():
        if k not in WRITABLE_COLUMNS:
            continue
        old_v = current.get(k)
        if new_v is None:
            # Don't blank existing values.
            continue
        if old_v is None:
            payload[k] = new_v
            new_fields.append(k)
        elif str(old_v).strip() != str(new_v).strip():
            payload[k] = new_v
            changed.append({"field": k, "old": old_v, "new": new_v})
    return payload, new_fields, changed


def process_fam(sb: Client, row: dict, commit: bool, save_artifacts: bool = True) -> FamResult:
    homol = row['numero_homologacao_nacional']
    ext = row['extensao']
    result = FamResult(
        id=row['id'], homologacao=homol, extensao=ext,
        marca=row.get('campo_0_1_marca'), status='pending',
    )

    pdf_path = PDF_DIR / f"FAM_{homol}_{ext}.pdf"
    try:
        download_pdf(row['url_ficheiro'], pdf_path)
    except Exception as e:
        result.status = 'download_error'
        result.error = str(e)
        return result

    try:
        zones = extract_zones(pdf_path)
    except Exception as e:
        result.status = 'extract_error'
        result.error = str(e)
        return result

    if zones is None:
        result.status = 'scanned'
        return result

    if save_artifacts:
        (FAMS_DIR / f"FAM_{homol}_{ext}_raw.txt").write_text(
            f"=== HEADER ===\n{zones.header}\n\n=== LEFT ===\n{zones.left}\n\n"
            f"=== RIGHT ===\n{zones.right}\n\n=== FOOTER ===\n{zones.footer}",
            encoding="utf-8"
        )

    try:
        parsed = parse_all(zones)
    except Exception as e:
        result.status = 'parse_error'
        result.error = str(e)
        return result

    result.fields_extracted = sum(1 for v in parsed.values() if v is not None)
    result.warnings = validate(parsed)

    if save_artifacts:
        (FAMS_DIR / f"FAM_{homol}_{ext}_fields.json").write_text(
            json.dumps(parsed, indent=2, ensure_ascii=False, default=str),
            encoding="utf-8"
        )

    payload, new_fields, changed = diff_existing(row, parsed)
    result.fields_new = new_fields
    result.fields_changed = changed

    if not payload:
        result.status = 'no_changes'
        return result

    if commit:
        # Add dados_raw and updated_at
        payload['dados_raw'] = parsed
        payload['updated_at'] = datetime.utcnow().isoformat()
        try:
            sb.table('fams').update(payload).eq('id', row['id']).execute()
            result.updated = True
            result.status = 'committed'
        except Exception as e:
            result.status = 'commit_error'
            result.error = str(e)
    else:
        result.status = 'dry_run'

    return result


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Re-extrai todas as FAMs e actualiza DB.")
    ap.add_argument('--commit', action='store_true', help='Aplicar UPDATE; default é dry-run')
    ap.add_argument('--fam-id', help='Filtrar por numero_homologacao_nacional')
    ap.add_argument('--extensao', help='Filtrar por extensão (requer --fam-id)')
    args = ap.parse_args()

    sb = get_supabase()

    q = sb.table('fams').select('*').order('numero_homologacao_nacional')
    if args.fam_id:
        q = q.eq('numero_homologacao_nacional', args.fam_id)
    if args.extensao:
        q = q.eq('extensao', args.extensao)

    rows = q.execute().data
    if not rows:
        print("Nenhuma FAM encontrada com esses filtros.", file=sys.stderr)
        sys.exit(1)

    mode = "COMMIT" if args.commit else "DRY-RUN"
    print(f"\n=== {mode}  ({len(rows)} FAM{'s' if len(rows) != 1 else ''}) ===\n")

    results: list[FamResult] = []
    for r in rows:
        res = process_fam(sb, r, commit=args.commit)
        results.append(res)
        line = (
            f"  {res.id:>3}  {res.homologacao}/{res.extensao}  "
            f"{(res.marca or '-'):<14}  "
            f"campos={res.fields_extracted:>3}  "
            f"novos={len(res.fields_new):>2}  "
            f"alterados={len(res.fields_changed):>2}  "
            f"{res.status}"
        )
        if res.error:
            line += f"  ERR: {res.error[:80]}"
        print(line)
        for w in res.warnings:
            print(f"      ⚠  {w}")

    # Report
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = OUT_DIR / f"fam_extraction_report_{ts}.json"
    report = {
        "timestamp": ts,
        "mode": mode,
        "total": len(results),
        "committed": sum(1 for r in results if r.updated),
        "scanned_skipped": sum(1 for r in results if r.status == 'scanned'),
        "errors": sum(1 for r in results if r.error),
        "results": [
            {
                "id": r.id,
                "homologacao": r.homologacao,
                "extensao": r.extensao,
                "marca": r.marca,
                "status": r.status,
                "fields_extracted": r.fields_extracted,
                "fields_new": r.fields_new,
                "fields_changed": r.fields_changed,
                "warnings": r.warnings,
                "error": r.error,
                "updated": r.updated,
            }
            for r in results
        ],
    }
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    print(f"\nRelatório: {report_path}")

    if not args.commit:
        print("\nPara aplicar UPDATEs, re-corre com --commit")


if __name__ == "__main__":
    main()
