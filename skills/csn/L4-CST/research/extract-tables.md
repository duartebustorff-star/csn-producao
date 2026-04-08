---
name: extract-tables
code: CSN-L4-CST-RES-005-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Extraccao de tabelas e dados tabulares de paginas web e PDFs
version: 1.0.0
created: 2026-04-08
trigger: Quando e necessario extrair dados tabulares de uma pagina web, PDF ou documento
output_type: fabricante | mercado | norma
---

# 05 — Extract Tables

Extraccao de dados tabulares (tabelas HTML, PDFs, imagens de tabelas) para formato estruturado.

## Prompt Template

```
Extrai TODAS as tabelas da seguinte fonte:

FONTE: {{url_ou_ficheiro}}
CONTEXTO: Dados para CSN — carrocarias veiculos comerciais 3.5T-8.5T

Para CADA tabela encontrada, retorna:
{
  "tabela_id": "T1, T2, ...",
  "titulo": "string — titulo ou descricao da tabela",
  "localizacao": "string — seccao da pagina onde se encontra",
  "colunas": ["col1", "col2", ...],
  "linhas": [
    ["val1", "val2", ...],
    ...
  ],
  "unidades": { "coluna": "unidade" },
  "notas": "string | null — notas de rodape ou condicoes",
  "relevancia_csn": "alta | media | baixa",
  "tipo_dados": "especificacao_tecnica | preco | dimensao | peso | regulamentacao | outro"
}

REGRAS:
- Manter formatacao numerica original (nao converter virgulas/pontos)
- Preservar unidades (mm, kg, kN, etc.)
- Celulas vazias = null, nao string vazia
- Se a tabela tem merge de celulas, expandir para formato plano
- Indicar se dados estao truncados ou parciais

REGRA BANDEIRA: Transcricao exacta. Nao arredondar, nao converter, nao inferir valores em celulas vazias.
```

## Casos de Uso CSN

- Tabelas de capacidade de carga de chassis (Mercedes Sprinter, FUSO Canter)
- Tabelas de dimensoes de basculantes (concorrentes)
- Tabelas de precos publicos de chapas/perfis metalicos
- Dados tabulares de estatisticas INE sobre construcao/transportes
- Especificacoes tecnicas de Body Builder Guidelines

## Regras de Execucao

1. Identificar TODAS as tabelas na fonte (nao apenas a primeira)
2. Preservar formatacao numerica original
3. Indicar se dados estao incompletos ou truncados
4. Gravar em `research_findings` com tipo adequado
