---
name: social-mining
code: CSN-L4-CST-RES-008-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Mining de LinkedIn, Reddit, noticias e foruns do sector construcao/transporte PT
version: 1.0.0
created: 2026-04-08
trigger: Quando e necessario recolher sinais sociais, tendencias ou mencoes do sector
output_type: social | prospeccao
---

# 08 — Social Mining

Mining de redes sociais, foruns e noticias para sinais relevantes ao negocio CSN.

## Canais Monitorizados

| Canal | Foco | Queries tipo |
|-------|------|-------------|
| LinkedIn | Decisores, empresas-alvo, tendencias | "terraplanagens Lisboa", "frota basculante" |
| Google News PT | Noticias sector | "construcao civil Portugal", "obras publicas" |
| Foruns construcao | Necessidades de mercado | "basculante", "carrocaria" |
| Reddit r/portugal | Discussoes economia/construcao | "construcao", "transportes" |
| Diario Republica | Concursos publicos | "obras terraplanagens", "veiculos pesados" |
| BASE.gov | Adjudicacoes publicas | Empresas-alvo CSN |

## Prompt Template

```
Pesquisa sinais sociais e noticias relevantes para CSN:

QUERIES: {{queries | queries_default}}
PERIODO: {{periodo | "ultimos 30 dias"}}
CANAIS: {{canais | "todos"}}

QUERIES DEFAULT CSN:
- "basculante" OR "basculantes" site:linkedin.com
- "terraplanagens" "Lisboa" OR "Mafra" OR "Oeste"
- "carrocaria" "veiculos comerciais" Portugal
- "concurso publico" "terraplanagens" OR "demolicoes" OR "inertes"
- "Galucho" OR "Berto Pinto" OR "Inapal" OR "TrailerWin"

Para CADA resultado relevante:
{
  "canal": "linkedin | news | forum | reddit | dre | base_gov",
  "data_publicacao": "ISO 8601 | null",
  "autor": "string | null",
  "titulo": "string",
  "resumo": "string — max 100 palavras",
  "url": "string",
  "tipo_sinal": "oportunidade | ameaca | tendencia | mencao_concorrente | lead_potencial",
  "entidades_mencionadas": ["string"],
  "relevancia_csn": "1-10",
  "accao_sugerida": "string | null"
}

OUTPUT AGREGADO:
{
  "periodo_analise": "string",
  "total_resultados": N,
  "sinais_por_tipo": { "oportunidade": N, ... },
  "top_5_sinais": [...],
  "tendencias_detectadas": ["string"],
  "leads_potenciais": ["string — empresa + razao"]
}

REGRA BANDEIRA: Nao incluir conteudo privado ou que exija login. Apenas dados publicamente acessiveis.
```

## Regras de Execucao

1. Usar WebSearch para pesquisas em canais publicos
2. Filtrar por relevancia >= 5 antes de incluir
3. Priorizar sinais accionaveis sobre informativos
4. Identificar leads potenciais para follow-up
5. Gravar em `research_findings` tipo `social` ou `prospeccao`
