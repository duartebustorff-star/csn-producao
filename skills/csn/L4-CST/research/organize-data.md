---
name: organize-data
code: CSN-L4-CST-RES-010-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Organizacao, deduplicacao e classificacao de dados extraidos de multiplas fontes
version: 1.0.0
created: 2026-04-08
trigger: Quando dados brutos de multiplas fontes precisam de ser limpos, deduplicados e classificados
output_type: prospeccao | mercado | concorrencia
---

# 10 — Organize Data

Organizacao, limpeza, deduplicacao e classificacao de dados extraidos por outros skills de research.

## Prompt Template

```
Organiza e limpa o seguinte conjunto de dados:

DADOS BRUTOS:
{{dados_brutos}}

OPERACOES:
1. **Deduplicacao:** Identificar e mesclar registos duplicados
   - Criterio: mesmo NIF, ou mesmo nome + morada, ou URL identica
   - Ao mesclar: manter dados mais completos e mais recentes

2. **Normalizacao:**
   - NIFs: formato 9 digitos sem espacos
   - Telefones: formato +351 XXX XXX XXX
   - Moradas: Rua, Numero, Codigo Postal, Localidade
   - Datas: ISO 8601
   - Valores monetarios: EUR com 2 decimais
   - CAEs: formato 5 digitos

3. **Classificacao:**
   - Tipo: prospeccao | concorrencia | seo | social | fabricante | mercado | norma
   - Prioridade: alta | media | baixa
   - Qualidade dados: completo | parcial | minimo

4. **Validacao cruzada:**
   - Verificar consistencia entre campos (ex: CAE vs actividade descrita)
   - Marcar inconsistencias como warnings

OUTPUT:
{
  "total_registos_input": N,
  "total_registos_output": N,
  "duplicados_removidos": N,
  "registos_normalizados": N,
  "warnings": [
    {
      "registo_id": "string",
      "campo": "string",
      "mensagem": "string"
    }
  ],
  "dados_organizados": [
    {
      "id": "string — hash unico",
      "tipo": "string",
      "prioridade": "alta | media | baixa",
      "qualidade": "completo | parcial | minimo",
      "dados": { ... },
      "fontes": ["URL"],
      "data_recolha": "ISO 8601"
    }
  ],
  "estatisticas": {
    "por_tipo": { ... },
    "por_prioridade": { ... },
    "por_qualidade": { ... }
  }
}

REGRA BANDEIRA: Ao mesclar duplicados, nunca descartar dados — manter o mais completo. Campos conflitantes = manter ambos com nota.
```

## Regras de Execucao

1. Processar TODOS os registos, sem truncar
2. Ao mesclar duplicados, preservar dados mais completos
3. Normalizar formatos mas nao alterar conteudo
4. Reportar estatisticas de limpeza
5. Gravar resultado limpo em `research_findings`
