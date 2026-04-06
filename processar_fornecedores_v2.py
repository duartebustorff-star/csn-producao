"""
CSN Opus — Processamento Automático de Documentos v2
Processa os ficheiros EMAIL que EXISTEM no disco.
Claude classifica o conteúdo (factura/certificado/outro).
"""
import os, sys, json, time, re
import pdfplumber
import anthropic
import requests
from datetime import datetime

# CONFIG
SUPABASE_URL = "https://oysfxhlzilazeznpaafc.supabase.co"
SUPABASE_KEY = ""
ANTHROPIC_KEY = ""

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

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}
client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

stats = {"total": 0, "processados": 0, "erros": 0, "facturas": 0, "cert31": 0, "outros": 0, "skipped": 0, "ficheiro_nao_encontrado": 0}
erros = []

def sb_get(table, params=""):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=HEADERS)
    r.raise_for_status()
    return r.json()

def sb_patch(table, id_val, data):
    r = requests.patch(f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{id_val}", headers=HEADERS, json=data)
    return r.status_code

def sb_insert(table, data):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, json=data)
    return r.status_code, r.text

def sb_get_efatura_by_atcud(atcud):
    try:
        result = sb_get("efatura", f"atcud=eq.{atcud}&select=id")
        return result[0]["id"] if result else None
    except:
        return None

def extrair_texto(filepath, max_pages=5):
    try:
        with pdfplumber.open(filepath) as pdf:
            texto = ""
            for page in pdf.pages[:max_pages]:
                t = page.extract_text()
                if t:
                    texto += t + "\n"
            return texto.strip()
    except Exception as e:
        return None

def classificar_e_extrair(texto_pdf, fornecedor_nome):
    """Claude classifica o documento e extrai dados relevantes."""
    prompt = f"""Analisa este documento do fornecedor {fornecedor_nome} recebido pela CSN (fabricante carroçarias).

TEXTO:
{texto_pdf[:4000]}

Classifica e extrai. Responde APENAS com JSON (sem markdown, sem backticks):
{{
  "tipo": "FACTURA" ou "CERTIFICADO_MATERIAL" ou "EXTRATO" ou "PROPOSTA" ou "OUTRO",
  "resumo": "1 frase sobre o que é",
  "factura": {{
    "atcud": "código ATCUD se existir, null se não",
    "numero_fatura": "número (FT/FR/FE/FAT + número), null se não",
    "nif_emitente": "NIF 9 dígitos, null se não",
    "data_emissao": "YYYY-MM-DD, null se não",
    "base_tributavel": 0.0,
    "iva": 0.0,
    "total": 0.0
  }},
  "certificado": {{
    "norma": "EN 10204 3.1 ou outra",
    "material": "tipo de material",
    "qualidade": "S355 etc",
    "lote": "número de lote",
    "espessura_mm": 0.0,
    "fornecedor_origem": "quem produziu"
  }}
}}

Se não for factura, põe factura como null.
Se não for certificado, põe certificado como null.
REGRA: Valores EXACTOS do texto. Se não encontrares → null. NUNCA inventar."""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(b.text for b in response.content if b.type == "text")
        clean = text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except Exception as e:
        return {"erro": str(e)}

def processar_doc(doc):
    doc_id = doc["id"]
    nome = doc.get("nome_ficheiro", "")
    pasta = doc.get("pasta_fornecedor", "")
    fornecedor = doc.get("fornecedor", "desconhecido")
    
    if not pasta or not nome:
        stats["skipped"] += 1
        return
    
    # Construir caminho
    filepath = os.path.join(BASE_PATH, pasta.replace("/", os.sep), nome)
    
    if not os.path.exists(filepath):
        stats["ficheiro_nao_encontrado"] += 1
        return
    
    # Só PDFs
    if not nome.lower().endswith(".pdf"):
        stats["skipped"] += 1
        return
    
    texto = extrair_texto(filepath)
    if not texto or texto.startswith("ERRO") or len(texto) < 50:
        stats["skipped"] += 1
        return
    
    # Claude classifica
    result = classificar_e_extrair(texto, fornecedor)
    
    if "erro" in result:
        stats["erros"] += 1
        erros.append(f"ID {doc_id}: Claude erro: {result['erro'][:80]}")
        return
    
    tipo = result.get("tipo", "OUTRO")
    resumo = result.get("resumo", "")
    
    # Actualizar o registo com classificação
    update = {"tipo_doc_classificado": tipo, "resumo_claude": resumo[:500]}
    
    # Se é factura, extrair dados
    if tipo == "FACTURA" and result.get("factura"):
        fat = result["factura"]
        atcud = fat.get("atcud")
        if atcud:
            update["atcud"] = atcud
            efatura_id = sb_get_efatura_by_atcud(atcud)
            if efatura_id:
                update["efatura_id"] = efatura_id
                stats["facturas"] += 1
        
        # Guardar dados factura no campo jsonb
        update["dados_extraidos"] = json.dumps(fat, ensure_ascii=False)
        stats["facturas"] += 1
    
    elif tipo == "CERTIFICADO_MATERIAL" and result.get("certificado"):
        cert = result["certificado"]
        update["dados_extraidos"] = json.dumps(cert, ensure_ascii=False)
        
        # Inserir na tabela certificados_material
        try:
            cert_data = {
                "fornecedor_id": doc.get("fornecedor_id"),
                "norma": cert.get("norma"),
                "material": cert.get("material"),
                "qualidade_aco": cert.get("qualidade"),
                "numero_lote": cert.get("lote"),
                "espessura_mm": cert.get("espessura_mm"),
                "fornecedor_origem": cert.get("fornecedor_origem"),
                "correspondencia_email_id": doc_id,
                "fonte": "processar_fornecedores_v2",
            }
            # Remove None values
            cert_data = {k: v for k, v in cert_data.items() if v is not None}
            sb_insert("certificados_material", cert_data)
            stats["cert31"] += 1
        except Exception as e:
            erros.append(f"ID {doc_id}: Insert cert erro: {str(e)[:60]}")
    
    else:
        stats["outros"] += 1
    
    # Patch correspondencia_email
    sb_patch("correspondencia_email", doc_id, update)
    stats["processados"] += 1


def main():
    print(f"CSN Opus — Processamento Documental v2")
    print(f"Início: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'=' * 60}")
    
    # Verificar keys
    if not SUPABASE_KEY or not ANTHROPIC_KEY:
        print("ERRO: Faltam SUPABASE_SERVICE_ROLE_KEY ou ANTHROPIC_API_KEY no .env.local")
        sys.exit(1)
    
    # Buscar documentos EMAIL com fornecedor_id, não spam
    print("A carregar documentos da DB...")
    offset = 0
    all_docs = []
    while True:
        batch = sb_get(
            "correspondencia_email",
            "fornecedor_id=not.is.null&spam=eq.false&tipo_doc=eq.EMAIL"
            "&select=id,nome_ficheiro,pasta_fornecedor,tipo_doc,fornecedor_id,fornecedor,assunto,data_email"
            f"&order=id&limit=1000&offset={offset}"
        )
        if not batch:
            break
        all_docs.extend(batch)
        offset += 1000
        if len(batch) < 1000:
            break
    
    stats["total"] = len(all_docs)
    print(f"Total documentos EMAIL com fornecedor: {stats['total']}")
    
    if stats["total"] == 0:
        print("Nenhum documento para processar.")
        return
    
    # Processar
    for i, doc in enumerate(all_docs):
        pct = f"{(i+1)*100//stats['total']}%"
        nome = (doc.get("nome_ficheiro") or "?")[:50]
        print(f"  [{i+1}/{stats['total']}] ({pct}) {nome}", end="", flush=True)
        
        try:
            processar_doc(doc)
            print(" ✓")
        except Exception as e:
            print(f" ✗ {str(e)[:50]}")
            erros.append(f"ID {doc['id']}: {str(e)[:80]}")
            stats["erros"] += 1
        
        time.sleep(0.3)
    
    # Relatório
    print(f"\n{'=' * 60}")
    print("RELATÓRIO FINAL")
    print(f"{'=' * 60}")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    
    if erros:
        print(f"\nERROS ({len(erros)}):")
        for e in erros[:30]:
            print(f"  - {e}")
    
    # Guardar
    report = os.path.join(os.path.dirname(os.path.abspath(__file__)), "relatorio_v2.txt")
    with open(report, "w", encoding="utf-8") as f:
        f.write(f"CSN Opus — Relatório v2\nData: {datetime.now()}\n\n")
        f.write(json.dumps(stats, indent=2))
        f.write(f"\n\nErros:\n")
        for e in erros:
            f.write(f"  - {e}\n")
    print(f"\nRelatório: {report}")


if __name__ == "__main__":
    main()
