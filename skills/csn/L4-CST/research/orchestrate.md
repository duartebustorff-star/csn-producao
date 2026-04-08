---
name: orchestrate
code: CSN-L4-CST-RES-012-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Meta-prompt orquestrador — decide que skills de research usar por tarefa
version: 1.0.0
created: 2026-04-08
trigger: Quando o Ag. Research recebe uma tarefa de pesquisa e precisa decidir que skills activar
output_type: mercado | concorrencia | prospeccao
---

# 12 — Orchestrate

Meta-prompt orquestrador que analisa uma tarefa de pesquisa e decide a sequencia optima de skills a executar.

## Prompt Template

```
TAREFA DE PESQUISA: {{tarefa}}
CONTEXTO: CSN, Mafra — carrocarias basculantes/estrados/taipais 3.5T-8.5T
URGENCIA: {{urgencia | "normal"}}
OUTPUT ESPERADO: {{output | "relatorio estruturado"}}

SKILLS DISPONIVEIS:
| Skill | Codigo | Quando usar |
|-------|--------|-------------|
| extract-page | RES-001 | Extrair dados de uma URL especifica |
| deep-research | RES-002 | Investigacao profunda multi-fonte (min 8 fontes) |
| competitive-intel | RES-003 | Analise de concorrente especifico |
| lead-enrich | RES-004 | Enriquecer dados de um lead/empresa |
| extract-tables | RES-005 | Extrair tabelas de paginas/PDFs |
| monitor-changes | RES-006 | Verificar alteracoes em sites monitorizados |
| synthesize | RES-007 | Sintetizar multiplos resultados num relatorio |
| social-mining | RES-008 | Mining redes sociais e noticias |
| discover-api | RES-009 | Descobrir APIs e endpoints publicos |
| organize-data | RES-010 | Limpar e organizar dados brutos |
| validate-data | RES-011 | Validar e fact-check dados |

DECIDE:
1. Que skills sao necessarios para esta tarefa?
2. Em que ordem devem ser executados?
3. Que inputs cada skill precisa?
4. Que dependencias existem entre skills?

OUTPUT — Plano de Execucao:
{
  "tarefa": "string",
  "complexidade": "simples | media | complexa",
  "tempo_estimado": "string — ex: 5min, 30min, 2h",
  "passos": [
    {
      "ordem": 1,
      "skill": "string — nome do skill",
      "codigo": "string — CSN-L4-CST-RES-0XX",
      "input": { ... },
      "depende_de": [N] | [],
      "output_esperado": "string",
      "pode_paralelizar": "boolean"
    }
  ],
  "pipeline_final": "string — skill de finalizacao (tipicamente synthesize ou validate-data)",
  "tipo_research_findings": "string — tipo para gravar na tabela"
}

REGRAS DE ORQUESTRACAO:
- Sempre terminar com validate-data (RES-011) antes de gravar dados finais
- Para tarefas complexas, usar synthesize (RES-007) antes da validacao
- Skills sem dependencias podem correr em paralelo
- Se tarefa envolve concorrente especifico -> competitive-intel obrigatorio
- Se tarefa envolve empresa-alvo -> lead-enrich obrigatorio
- Se tarefa envolve multiplas fontes -> deep-research + synthesize
```

## Pipelines Pre-Definidos

### Pipeline: Prospeccao Nova Empresa
```
lead-enrich -> social-mining -> organize-data -> validate-data
```

### Pipeline: Analise Concorrencial Completa
```
competitive-intel (x5 concorrentes, paralelo)
  -> extract-page (sites concorrentes, paralelo)
  -> social-mining
  -> organize-data
  -> synthesize
  -> validate-data
```

### Pipeline: Estudo de Mercado
```
deep-research -> extract-tables -> social-mining
  -> organize-data -> synthesize -> validate-data
```

### Pipeline: Monitorizacao Periodica
```
monitor-changes (URLs monitorizadas, paralelo)
  -> extract-page (apenas URLs com alteracoes)
  -> organize-data -> validate-data
```

### Pipeline: Enriquecimento em Massa
```
Para cada lead:
  lead-enrich (paralelo, max 5 simultaneos)
-> organize-data -> validate-data
```

## Regras de Execucao

1. Analisar tarefa e escolher pipeline mais adequado
2. Adaptar pipeline se necessario (adicionar/remover passos)
3. Maximizar paralelismo quando possivel
4. SEMPRE terminar com validate-data
5. Gravar plano de execucao antes de comecar
