---
name: extract-page
code: CSN-L4-CST-RES-001-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Extraccao estruturada de conteudo de paginas web num schema JSON normalizado
version: 1.0.0
created: 2026-04-08
trigger: Quando o agente precisa de extrair dados estruturados de uma URL especifica
output_type: prospeccao | fabricante | mercado
---

# 01 — Extract Page

Extraccao estruturada de paginas web com output em JSON normalizado para ingestao na tabela `research_findings`.

## Prompt Template

```
Analisa a seguinte pagina web e extrai TODOS os dados relevantes num schema JSON estruturado.

URL: {{url}}
Objectivo: {{objectivo}}
Contexto: CSN — fabricante de carrocarias basculantes/estrados/taipais 3.5T-8.5T, Mafra

Schema de output obrigatorio:
{
  "url": "string — URL fonte",
  "data_extraccao": "ISO 8601",
  "titulo_pagina": "string",
  "entidade": "string | null — empresa/organizacao identificada",
  "nif": "string | null — NIF se disponivel",
  "cae": "string | null — CAE se visivel",
  "contactos": {
    "telefone": "string | null",
    "email": "string | null",
    "morada": "string | null",
    "coordenadas": "string | null"
  },
  "dados_extraidos": [
    {
      "campo": "string — nome do campo",
      "valor": "string — valor extraido",
      "confianca": "alta | media | baixa",
      "fonte_exacta": "string — seccao/elemento onde foi encontrado"
    }
  ],
  "relevancia_csn": "1-10 — relevancia para o negocio CSN",
  "notas": "string | null"
}

REGRA BANDEIRA: Se um campo nao esta visivel na pagina, retorna NULL. Nunca inventar ou inferir dados que nao existam na fonte.
```

## Regras de Execucao

1. Usar WebFetch ou browser MCP para aceder a URL
2. Extrair TODOS os dados visiveis sem inferencia
3. Classificar confianca: alta (texto literal), media (derivado de contexto proximo), baixa (inferido)
4. Campos sem fonte = `null`, sem excepcao
5. Gravar resultado em `research_findings` com tipo adequado

## Exemplos de Uso

- Extrair dados de uma pagina de concorrente (Galucho, Berto Pinto)
- Recolher dados de um fabricante de chassis (Mercedes, FUSO, Renault)
- Capturar informacao de uma empresa-alvo para prospeccao
