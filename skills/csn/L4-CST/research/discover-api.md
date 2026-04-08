---
name: discover-api
code: CSN-L4-CST-RES-009-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Descoberta de APIs e endpoints publicos em websites relevantes para CSN
version: 1.0.0
created: 2026-04-08
trigger: Quando e necessario identificar APIs ou feeds de dados publicos para automatizar recolha
output_type: mercado | fabricante
---

# 09 — Discover API

Descoberta de APIs publicos, feeds RSS, endpoints REST e fontes de dados estruturados em websites relevantes.

## Prompt Template

```
Analisa o website {{url}} e identifica APIs, endpoints e fontes de dados estruturados:

OBJECTIVO: Encontrar formas automatizaveis de recolher dados relevantes para CSN

VERIFICAR:
1. **APIs documentadas:** /api, /swagger, /docs, /developer, /openapi
2. **Feeds RSS/Atom:** /feed, /rss, sitemap.xml
3. **Endpoints AJAX:** Requests XHR visiveis na navegacao (verificar Network tab)
4. **Dados estruturados:** JSON-LD, microdata, Schema.org no HTML
5. **Ficheiros publicos:** robots.txt, sitemap.xml, feeds
6. **APIs de terceiros:** Google Maps, reCAPTCHA, analytics (identificar, nao explorar)

OUTPUT:
{
  "url_base": "string",
  "data_analise": "ISO 8601",
  "apis_encontradas": [
    {
      "endpoint": "string — URL completa",
      "tipo": "rest | graphql | rss | sitemap | json_ld | ajax",
      "metodo": "GET | POST | null",
      "autenticacao": "nenhuma | api_key | oauth | cookie",
      "formato_resposta": "json | xml | html",
      "descricao": "string — que dados contem",
      "exemplo_uso": "string | null",
      "rate_limit": "string | null — limites conhecidos",
      "relevancia_csn": "alta | media | baixa"
    }
  ],
  "dados_estruturados": {
    "schema_org": ["tipos encontrados"],
    "json_ld": "boolean",
    "open_graph": "boolean"
  },
  "robots_txt": {
    "permite_scraping": "boolean",
    "restricoes": ["string"]
  },
  "recomendacao": "string — melhor abordagem para recolha automatizada"
}

REGRAS:
- Respeitar robots.txt e ToS
- Nao tentar autenticacao ou bypass
- Apenas endpoints publicamente acessiveis
- Documentar rate limits conhecidos

REGRA BANDEIRA: Nao explorar endpoints que requeiram autenticacao. Respeitar restricoes de robots.txt.
```

## APIs Publicas Uteis para CSN

| Servico | URL | Dados |
|---------|-----|-------|
| BASE.gov | base.gov.pt | Contratacao publica |
| INE | ine.pt/api | Estatisticas construcao |
| Portal Financas | — | Consulta NIF (manual) |
| Racius | racius.com | Dados empresariais |
| Google Maps | maps.googleapis.com | Localizacao, reviews |

## Regras de Execucao

1. Verificar robots.txt antes de qualquer analise
2. Documentar apenas endpoints publicos sem autenticacao
3. Respeitar termos de servico
4. Gravar em `research_findings` tipo adequado
