---
name: reconciliacao-bancaria
description: >
  Reconcilia movimentos bancários com facturas e-fatura. Activa para reconciliação, comparar banco com facturas, movimentos por identificar.
---

# reconciliacao-bancaria — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Reconciliação mensal
- Movimentos por identificar
- Diferenças banco vs facturação

## Processo
1. Ler movimentos_bancarios (BPI + Novo Banco)
2. Cruzar com efatura por ATCUD
3. Identificar: pagamentos de clientes, pagamentos a fornecedores, salários, impostos, outros
4. Listar movimentos não reconciliados
5. Sugerir classificação

## Regras
- ATCUD é a chave de matching
- Distinguir conta_origem (BPI vs Novo Banco)
- Nunca alterar dados — apenas sugerir classificação
