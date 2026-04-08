---
name: validate-data
code: CSN-L4-CST-RES-011-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Validacao e fact-check de dados recolhidos — REGRA BANDEIRA sem fonte = NULL
version: 1.0.0
created: 2026-04-08
trigger: Quando dados recolhidos precisam de verificacao independente antes de serem usados
output_type: prospeccao | concorrencia | mercado
---

# 11 — Validate Data

Validacao rigorosa e fact-check de todos os dados recolhidos. Aplicacao estrita da REGRA BANDEIRA.

## REGRA BANDEIRA (Lei Suprema)

**Sem fonte verificavel = NULL. Sem excepcao. Sem "provavelmente". Sem "de acordo com informacao geral".**

Um dado so e VALIDO se:
1. Tem uma URL fonte acessivel, OU
2. Tem uma referencia a documento publico verificavel (ex: DRE n.o X de YYYY-MM-DD), OU
3. Foi extraido directamente de um website com data e URL registados

## Prompt Template

```
Valida os seguintes dados recolhidos:

DADOS A VALIDAR:
{{dados}}

PARA CADA CAMPO DE CADA REGISTO:

1. **Verificar fonte:** A URL/referencia existe e esta acessivel?
2. **Verificar actualidade:** A fonte tem menos de {{max_idade | "2 anos"}}?
3. **Verificar exactidao:** O dado no registo corresponde ao que esta na fonte?
4. **Verificar consistencia:** O dado e consistente com outros campos do mesmo registo?
5. **Cross-check:** Existe uma segunda fonte que confirme?

CLASSIFICACAO POR CAMPO:
- CONFIRMADO: Fonte acessivel + dado corresponde + actualizado
- PROVAVEL: Fonte acessivel mas dado pode estar desactualizado
- DUVIDOSO: Fonte inacessivel ou dado nao corresponde exactamente
- INVALIDO: Sem fonte, ou fonte contradiz o dado
- NULL: Campo deve ser apagado — sem qualquer suporte factual

OUTPUT:
{
  "total_campos_validados": N,
  "resultado": {
    "confirmados": N,
    "provaveis": N,
    "duvidosos": N,
    "invalidos": N,
    "nullificados": N
  },
  "registos": [
    {
      "id": "string",
      "campos": {
        "nome_campo": {
          "valor_original": "any",
          "valor_validado": "any | null",
          "status": "confirmado | provavel | duvidoso | invalido | null",
          "fonte_verificada": "boolean",
          "nota": "string | null"
        }
      }
    }
  ],
  "alertas": [
    {
      "severidade": "critico | alto | medio",
      "mensagem": "string",
      "registo_id": "string",
      "campo": "string"
    }
  ]
}

REGRA BANDEIRA APLICADA:
- Campo sem fonte -> status = "null", valor_validado = null
- Campo com fonte inacessivel -> status = "duvidoso"
- Campo com fonte que contradiz -> status = "invalido", valor_validado = null
- NUNCA promover um campo de "duvidoso" para "confirmado" sem verificacao
```

## Validacoes Especificas CSN

| Campo | Validacao |
|-------|-----------|
| NIF | 9 digitos, checksum valido, verificar em Racius |
| CAE | 5 digitos, existe na lista oficial INE |
| Telefone | Formato PT valido (+351 2XX/9XX) |
| Email | Formato valido, dominio existe |
| Morada | Codigo postal 4 digitos + 3 digitos |
| Volume negocios | Numero positivo, razoavel para o sector |
| Coordenadas | Dentro de Portugal continental |

## Regras de Execucao

1. Validar TODOS os campos, nao apenas os criticos
2. Tentar aceder a fonte original de cada dado
3. Aplicar REGRA BANDEIRA sem excepcao
4. Campos nullificados devem ser actualizados na base de dados
5. Gravar resultado de validacao em `research_findings`
