---
name: deep-research
code: CSN-L4-CST-RES-002-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Pesquisa profunda multi-fonte com minimo 8 fontes, citacoes e sintese estruturada
version: 1.0.0
created: 2026-04-08
trigger: Quando e necessaria investigacao aprofundada sobre um topico com multiplas fontes
output_type: mercado | concorrencia | norma
---

# 02 — Deep Research

Pesquisa profunda multi-fonte com citacoes verificaveis. Minimo 8 fontes independentes por pesquisa.

## Prompt Template

```
Realiza uma pesquisa profunda sobre o seguinte topico:

TOPICO: {{topico}}
CONTEXTO: CSN, Mafra — carrocarias basculantes/estrados/taipais 3.5T-8.5T
SECTOR: Metalomecânica, veiculos comerciais, construcao civil, transportes
ZONA GEOGRAFICA: {{zona | "Grande Lisboa, Oeste, Alentejo"}}

REQUISITOS:
1. Consulta MINIMO 8 fontes independentes
2. Cada afirmacao deve ter citacao [N] com URL
3. Prioriza fontes PT: INE, IAPMEI, ANTRAM, IMT, INCI, portais sectoriais
4. Inclui dados quantitativos quando disponiveis (volumes, precos, quotas)
5. Identifica tendencias e implicacoes para CSN

OUTPUT:
## Resumo Executivo (max 200 palavras)
## Descobertas Principais
  - Descoberta 1 [1][2]
  - Descoberta 2 [3]
  ...
## Dados Quantitativos
  | Metrica | Valor | Fonte | Data |
## Implicacoes para CSN
  - Oportunidade/Ameaca 1
  ...
## Lacunas de Informacao
  - O que nao foi possivel confirmar
## Fontes
  [1] Titulo — URL — Data acesso
  [2] ...

REGRA BANDEIRA: Sem fonte verificavel = nao incluir. Marcar lacunas explicitamente na seccao propria.
```

## Fontes Prioritarias para CSN

| Tipo | Fontes |
|------|--------|
| Estatistica | INE, Pordata, Eurostat |
| Sector | ANTRAM, AIMMAP, ANECRA, IMT |
| Legislacao | DRE, EUR-Lex |
| Concorrencia | Sites Galucho, Berto Pinto, Inapal, TrailerWin |
| Fabricantes | Mercedes BodyBuilder, FUSO Guidelines, Renault Pro+ |
| Mercado | Standvirtual, CustoJusto, AutoSapo (comerciais usados) |
| Empresas | Portal da Justica, Racius, eInforma |

## Regras de Execucao

1. Planear queries de pesquisa antes de executar (minimo 4 queries distintas)
2. Diversificar fontes — maximo 2 resultados por dominio
3. Verificar datas — descartar fontes com mais de 2 anos salvo dados historicos
4. Cruzar dados entre fontes para validacao
5. Gravar em `research_findings` tipo `mercado` ou `concorrencia`
