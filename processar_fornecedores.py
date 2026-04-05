"""
CSN Opus — Processamento Automático de Documentos de Fornecedores
CSN-L3-DOC-040-2026 | ISA-95: L3-MOM/DOC

Corre com: python processar_fornecedores.py
Instalar antes: pip install pdfplumber anthropic requests

Faz TUDO sozinho:
1. Lê lista de documentos do Supabase
2. Abre cada PDF do disco
3. Extrai texto e envia ao Claude para classificação/extracção
4. Escreve resultados no Supabase (correspondencia_email, linhas_fatura_fornecedor, certificados_material)
5. Gera relatório final
"""

import os
import sys
import json
import time
import pdfplumber
import anthropic
import requests
from datetime import datetime

# ============================================================
# CONFIGURAÇÃO
# ============================================================

SUPABASE_URL = "https://oysfxhlzilazeznpaafc.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Se não tiver env vars, tenta .env.local do projecto
if not SUPABASE_KEY or not ANTHROPIC_KEY:
    env_path = r"C:\Users\Utilizador\Projectos-AI\csn-producao\.env.local"
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    SUPABASE_KEY = line.split("=", 1)[1].strip('"').strip("'")
                elif line.startswith("ANTHROPIC_API_KEY="):
                    ANTHROPIC_KEY = line.split("=", 1)[1].strip('"').strip("'")

BASE_PATH = r"C:\Users\Utilizador\Desktop\Extratos\CSN-Email-Repositorio"

# Fornecedores de produção (afectam stock)
FORNECEDORES_PRODUCAO = {
    10: "CHAGAS",
    # IDs dos outros fornecedores de produção - preenchidos automaticamente
}

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

# Contadores
stats = {
    "total": 0,
    "processados": 0,
    "erros": 0,
    "atcud_encontrados": 0,
    "efatura_match": 0,
    "linhas_inseridas": 0,
    "cert31_inseridos": 0,
    "skipped": 0,
}
erros_lista = []

# ============================================================
# SUPABASE HELPERS
# ============================================================

def supabase_get(table, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    r = requests.get(url, headers=HEADERS)
    r.raise_for_status()
    return r.json()

def supabase_patch(table, id_col, id_val, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{id_col}=eq.{id_val}"
    r = requests.patch(url, headers=HEADERS, json=data)
    return r.status_code

def supabase_insert(table, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    r = requests.post(url, headers=HEADERS, json=data)
    return r.status_code, r.text

# ============================================================
# PDF TEXT EXTRACTION
# ============================================================

def extrair_texto_pdf(filepath, max_pages=5):
    """Extrai texto das primeiras páginas do PDF."""
    try:
        with pdfplumber.open(filepath) as pdf:
            texto = ""
            for i, page in enumerate(pdf.pages[:max_pages]):
                t = page.extract_text()
                if t:
                    texto += t + "\n"
            return texto.strip()
    except Exception as e:
        return f"ERRO_LEITURA: {str(e)}"

# ============================================================
# CLAUDE EXTRACTION
# ============================================================

def extrair_factura_claude(texto_pdf, fornecedor_nome, fornecedor_id, is_producao):
    """Extrai dados de factura via Claude Haiku."""
    
    prompt_linhas = ""
    if is_producao:
        prompt_linhas = """
Também extrai CADA LINHA da factura como array "linhas":
[{"item_numero": 1, "codigo_produto": "ref", "descricao": "texto", "quantidade": 0.0, "unidade": "kg|m|un|l|m2", "preco_bruto_unitario": 0.0, "desconto_percentagem": 0.0, "preco_liquido_unitario": 0.0, "valor_liquido": 0.0, "taxa_iva": 23}]
Se não conseguires ler um valor → null. NUNCA inventar."""

    prompt = f"""Analisa esta factura do fornecedor {fornecedor_nome} recebida pela CSN (fabricante carroçarias).

TEXTO DO PDF:
{texto_pdf[:3000]}

Extrai os seguintes campos e responde APENAS com JSON (sem markdown):
{{
  "atcud": "código ATCUD se existir (formato XXXXXX-XXXX ou similar), null se não encontrar",
  "numero_fatura": "número da factura (FT, FR, FE, FAT seguido de número)",
  "nif_emitente": "NIF do fornecedor (9 dígitos)",
  "data_emissao": "YYYY-MM-DD",
  "base_tributavel": 0.0,
  "iva": 0.0,
  "total": 0.0{', "linhas": []' if is_producao else ''}
}}
{prompt_linhas}

REGRA: Valores EXACTOS do PDF. Se não encontrares um campo → null."""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(b.text for b in response.content if b.type == "text")
        clean = text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except Exception as e:
        return {"erro": str(e)}


def extrair_cert31_claude(texto_pdf, fornecedor_nome):
    """Extrai dados de certificado 3.1 via Claude Haiku."""
    
    prompt = f"""Analisa este certificado de material 3.1 (EN 10204) do fornecedor {fornecedor_nome}.

TEXTO DO PDF:
{texto_pdf[:4000]}

Um certificado pode conter VÁRIOS materiais/lotes. Para CADA material, extrai e responde com JSON array:
[{{
  "numero_certificado": "nº do certificado",
  "data_certificado": "YYYY-MM-DD",
  "qualidade_aco": "S355J2, S235JR, etc.",
  "forma": "CHAPA|TUBO|PERFIL|BARRA",
  "espessura_mm": 0.0,
  "largura_mm": 0.0,
  "comprimento_mm": 0.0,
  "peso_kg": 0.0,
  "numero_lote": "nº lote",
  "numero_vazamento": "heat number",
  "limite_elastico_mpa": 0.0,
  "resistencia_traccao_mpa": 0.0,
  "alongamento_pct": 0.0,
  "carbono_pct": 0.0,
  "manganes_pct": 0.0,
  "silicio_pct": 0.0,
  "fosforo_pct": 0.0,
  "enxofre_pct": 0.0,
  "ceq_pct": 0.0
}}]

REGRA: Valores EXACTOS do PDF. Se não encontrares → null. NUNCA inventar."""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(b.text for b in response.content if b.type == "text")
        clean = text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except Exception as e:
        return [{"erro": str(e)}]


# ============================================================
# MATCHING e-Fatura
# ============================================================

def match_efatura(atcud=None, nif=None, numero=None):
    """Tenta match com tabela efatura."""
    if atcud:
        result = supabase_get("efatura", f"atcud=eq.{atcud}&select=id")
        if result:
            return result[0]["id"]
    if nif and numero:
        result = supabase_get("efatura", f"nif_emitente=eq.{nif}&numero_fatura=eq.{numero}&select=id")
        if result:
            return result[0]["id"]
    return None

# ============================================================
# PROCESSAMENTO PRINCIPAL
# ============================================================

def processar_documento(doc, fornecedores_producao_ids):
    """Processa um documento individual."""
    doc_id = doc["id"]
    tipo_doc = doc["tipo_doc"]
    nome_ficheiro = doc["nome_ficheiro"]
    pasta = doc["pasta_fornecedor"]
    fornecedor_id = doc["fornecedor_id"]
    fornecedor_nome = doc.get("fornecedor", "Desconhecido")
    
    # Construir caminho
    filepath = os.path.join(BASE_PATH, pasta, nome_ficheiro)
    
    if not os.path.exists(filepath):
        erros_lista.append(f"ID {doc_id}: Ficheiro não encontrado: {filepath}")
        stats["erros"] += 1
        return
    
    # Extrair texto
    texto = extrair_texto_pdf(filepath)
    if texto.startswith("ERRO_LEITURA"):
        erros_lista.append(f"ID {doc_id}: {texto}")
        stats["erros"] += 1
        return
    
    if len(texto) < 20:
        erros_lista.append(f"ID {doc_id}: PDF sem texto legível ({nome_ficheiro})")
        stats["erros"] += 1
        return
    
    is_producao = fornecedor_id in fornecedores_producao_ids
    
    # ---- FAT / FT ----
    if tipo_doc in ("FAT", "FT"):
        dados = extrair_factura_claude(texto, fornecedor_nome, fornecedor_id, is_producao)
        
        if "erro" in dados:
            erros_lista.append(f"ID {doc_id}: Claude erro: {dados['erro']}")
            stats["erros"] += 1
            return
        
        # Update ATCUD em correspondencia_email
        atcud = dados.get("atcud")
        update_data = {}
        if atcud:
            update_data["atcud"] = atcud
            stats["atcud_encontrados"] += 1
        
        # Match com e-Fatura
        efatura_id = match_efatura(
            atcud=atcud,
            nif=dados.get("nif_emitente"),
            numero=dados.get("numero_fatura"),
        )
        if efatura_id:
            update_data["reconciliado_efatura"] = True
            stats["efatura_match"] += 1
        
        if update_data:
            supabase_patch("correspondencia_email", "id", doc_id, update_data)
        
        # Inserir linhas (só produção)
        if is_producao and "linhas" in dados and dados["linhas"]:
            for linha in dados["linhas"]:
                if not linha or "erro" in linha:
                    continue
                row = {
                    "efatura_id": efatura_id,
                    "numero_fatura": dados.get("numero_fatura"),
                    "fornecedor_id": fornecedor_id,
                    "data_fatura": dados.get("data_emissao"),
                    "item_numero": linha.get("item_numero"),
                    "codigo_produto": linha.get("codigo_produto"),
                    "descricao": linha.get("descricao"),
                    "quantidade": linha.get("quantidade"),
                    "unidade": linha.get("unidade"),
                    "preco_bruto_unitario": linha.get("preco_bruto_unitario"),
                    "desconto_percentagem": linha.get("desconto_percentagem"),
                    "preco_liquido_unitario": linha.get("preco_liquido_unitario"),
                    "valor_liquido": linha.get("valor_liquido"),
                    "taxa_iva": linha.get("taxa_iva"),
                    "nivel_isa95": "L0-MAT",
                }
                # Limpar nulls string
                row = {k: v for k, v in row.items() if v is not None}
                status, _ = supabase_insert("linhas_fatura_fornecedor", row)
                if status == 201:
                    stats["linhas_inseridas"] += 1
        
        stats["processados"] += 1
    
    # ---- CERT31 ----
    elif tipo_doc == "CERT31":
        certs = extrair_cert31_claude(texto, fornecedor_nome)
        
        if not isinstance(certs, list):
            certs = [certs]
        
        for cert in certs:
            if "erro" in cert:
                erros_lista.append(f"ID {doc_id}: Claude erro CERT31: {cert['erro']}")
                stats["erros"] += 1
                continue
            
            row = {
                "correspondencia_email_id": doc_id,
                "fornecedor_id": fornecedor_id,
                "numero_certificado": cert.get("numero_certificado"),
                "data_certificado": cert.get("data_certificado"),
                "norma": "EN 10204 3.1",
                "qualidade_aco": cert.get("qualidade_aco"),
                "forma": cert.get("forma"),
                "espessura_mm": cert.get("espessura_mm"),
                "largura_mm": cert.get("largura_mm"),
                "comprimento_mm": cert.get("comprimento_mm"),
                "peso_kg": cert.get("peso_kg"),
                "numero_lote": cert.get("numero_lote"),
                "numero_vazamento": cert.get("numero_vazamento"),
                "limite_elastico_mpa": cert.get("limite_elastico_mpa"),
                "resistencia_traccao_mpa": cert.get("resistencia_traccao_mpa"),
                "alongamento_pct": cert.get("alongamento_pct"),
                "carbono_pct": cert.get("carbono_pct"),
                "manganes_pct": cert.get("manganes_pct"),
                "silicio_pct": cert.get("silicio_pct"),
                "fosforo_pct": cert.get("fosforo_pct"),
                "enxofre_pct": cert.get("enxofre_pct"),
                "ceq_pct": cert.get("ceq_pct"),
                "nivel_isa95": "L0-MAT/L3-QMS",
            }
            row = {k: v for k, v in row.items() if v is not None}
            status, _ = supabase_insert("certificados_material", row)
            if status == 201:
                stats["cert31_inseridos"] += 1
        
        stats["processados"] += 1
    
    # ---- GR / ANEXO ----
    elif tipo_doc in ("GR", "ANEXO"):
        # Registo simples — classificar sub-tipo
        if len(texto) > 50:
            try:
                response = client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=100,
                    messages=[{"role": "user", "content": f"Classifica este documento em 1 palavra (EXTRACTO|ORCAMENTO|ENCOMENDA|GUIA|CERTIFICADO|OUTRO):\n{texto[:500]}"}],
                )
                subtipo = "".join(b.text for b in response.content if b.type == "text").strip()
                supabase_patch("correspondencia_email", "id", doc_id, {"notas": f"SUB-TIPO: {subtipo}"})
            except:
                pass
        stats["processados"] += 1
    
    else:
        stats["skipped"] += 1


def main():
    print("=" * 60)
    print("CSN Opus — Processamento Documental de Fornecedores")
    print(f"Início: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Validar credenciais
    if not SUPABASE_KEY:
        print("ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrada")
        sys.exit(1)
    if not ANTHROPIC_KEY:
        print("ERRO: ANTHROPIC_API_KEY não encontrada")
        sys.exit(1)
    
    # 1. Obter lista de fornecedores de produção
    print("\n[1/4] A identificar fornecedores de produção...")
    producao_dominios = ["chagas.pt", "coprial.pt", "pecol.pt", "polifer.pt", 
                         "madeicentro.pt", "bielco.pt", "silfesan.pt", 
                         "publispeed.com", "multiplacas.pt", "hidraulicentro.pt"]
    
    fornecedores = supabase_get("fornecedores", "select=id,nome,email")
    fornecedores_producao_ids = set()
    for f in fornecedores:
        email = (f.get("email") or "").lower()
        for dom in producao_dominios:
            if dom in email:
                fornecedores_producao_ids.add(f["id"])
                FORNECEDORES_PRODUCAO[f["id"]] = f["nome"]
                break
    
    print(f"   {len(fornecedores_producao_ids)} fornecedores de produção identificados")
    
    # 2. Obter documentos para processar
    print("\n[2/4] A obter lista de documentos...")
    docs = supabase_get(
        "correspondencia_email",
        "fornecedor_id=not.is.null&spam=eq.false&tipo_doc=neq.EMAIL"
        "&select=id,nome_ficheiro,pasta_fornecedor,tipo_doc,fornecedor_id,fornecedor,assunto,data_email"
        "&order=fornecedor_id,tipo_doc"
        "&limit=2000"
    )
    stats["total"] = len(docs)
    print(f"   {len(docs)} documentos para processar")
    
    # Breakdown por tipo
    tipos = {}
    for d in docs:
        t = d.get("tipo_doc", "?")
        tipos[t] = tipos.get(t, 0) + 1
    for t, c in sorted(tipos.items()):
        print(f"   - {t}: {c}")
    
    # 3. Processar
    print(f"\n[3/4] A processar documentos...")
    for i, doc in enumerate(docs):
        pct = int((i + 1) / len(docs) * 100)
        tipo = doc.get("tipo_doc", "?")
        nome = doc.get("nome_ficheiro", "?")[:50]
        print(f"   [{i+1}/{len(docs)}] ({pct}%) {tipo} {nome}", end="")
        
        try:
            processar_documento(doc, fornecedores_producao_ids)
            print(" ✓")
        except Exception as e:
            print(f" ✗ {str(e)[:60]}")
            erros_lista.append(f"ID {doc['id']}: Excepção: {str(e)}")
            stats["erros"] += 1
        
        # Rate limiting: 0.5s entre chamadas
        time.sleep(0.5)
    
    # 4. Relatório
    print(f"\n{'=' * 60}")
    print("RELATÓRIO FINAL")
    print(f"{'=' * 60}")
    print(f"Total documentos:        {stats['total']}")
    print(f"Processados com sucesso: {stats['processados']}")
    print(f"Erros:                   {stats['erros']}")
    print(f"Ignorados:               {stats['skipped']}")
    print(f"ATCUDs encontrados:      {stats['atcud_encontrados']}")
    print(f"Matches e-Fatura:        {stats['efatura_match']}")
    print(f"Linhas factura inseridas: {stats['linhas_inseridas']}")
    print(f"Certificados 3.1:        {stats['cert31_inseridos']}")
    print(f"Fim: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if erros_lista:
        print(f"\nERROS ({len(erros_lista)}):")
        for e in erros_lista[:50]:
            print(f"  - {e}")
        if len(erros_lista) > 50:
            print(f"  ... e mais {len(erros_lista) - 50} erros")
    
    # Guardar relatório
    report_path = os.path.join(os.path.dirname(__file__), "relatorio_processamento.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"CSN Opus — Relatório Processamento Documental\n")
        f.write(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(json.dumps(stats, indent=2))
        f.write(f"\n\nErros:\n")
        for e in erros_lista:
            f.write(f"  - {e}\n")
    print(f"\nRelatório guardado em: {report_path}")


if __name__ == "__main__":
    main()
