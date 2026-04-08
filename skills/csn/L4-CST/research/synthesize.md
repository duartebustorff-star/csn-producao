---
name: synthesize
code: CSN-L4-CST-RES-007-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Sintese multi-fonte num relatorio coerente com conclusoes accionaveis
version: 1.0.0
created: 2026-04-08
trigger: Quando existem multiplos resultados de pesquisa que precisam ser sintetizados num relatorio unico
output_type: mercado | concorrencia
---

# 07 — Synthesize

Sintese de multiplas fontes de pesquisa num relatorio coerente com conclusoes accionaveis para CSN.

## Prompt Template

```
Sintetiza os seguintes resultados de pesquisa num relatorio coerente:

FONTES:
{{lista_fontes_com_dados}}

TOPICO: {{topico}}
AUDIENCIA: {{audiencia | "Gestao CSN (Duarte Bustorff)"}}
OBJECTIVO: {{objectivo | "Decisao estrategica informada"}}

ESTRUTURA DO RELATORIO:

## 1. Sumario Executivo (max 150 palavras)
  - Conclusao principal
  - 3 descobertas-chave
  - Recomendacao top-line

## 2. Contexto
  - Porque esta analise foi feita
  - Scope e limitacoes

## 3. Descobertas
  Para cada descoberta:
  - Facto (com citacao [N])
  - Evidencia de suporte
  - Grau de certeza: confirmado | provavel | incerto

## 4. Analise
  - Cruzamento entre fontes
  - Contradicoes encontradas e como foram resolvidas
  - Padroes identificados

## 5. Implicacoes para CSN
  - Oportunidades (com prioridade alta/media/baixa)
  - Ameacas (com severidade alta/media/baixa)
  - Lacunas de informacao restantes

## 6. Recomendacoes
  - Accao 1: [descricao] — Prazo: [curto/medio/longo] — Impacto: [alto/medio/baixo]
  ...

## 7. Fontes
  [1] Titulo — URL — Data — Fiabilidade (alta/media/baixa)
  ...

REGRAS:
- Nao repetir informacao entre seccoes
- Priorizar dados quantitativos sobre qualitativos
- Explicitar contradicoes entre fontes em vez de ignorar
- Max 1500 palavras total

REGRA BANDEIRA: Todas as afirmacoes devem ter citacao. Conclusoes sem suporte factual = remover.
```

## Regras de Execucao

1. Ler TODOS os inputs antes de comecar a sintetizar
2. Identificar contradicoes entre fontes e resolver
3. Priorizar dados quantitativos
4. Manter relatorio abaixo de 1500 palavras
5. Gravar em `research_findings` tipo `mercado` ou `concorrencia`
