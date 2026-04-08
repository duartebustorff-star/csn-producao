---
name: cash-flow-forecast
description: >
  Gera previsões de cash flow para CSN. Activa quando mencionar cash flow, tesouraria, previsão de caixa, liquidez, fluxo de caixa.
---

# cash-flow-forecast — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Pedido de previsão de tesouraria
- Análise de liquidez
- "Quanto dinheiro vamos ter no fim do mês"

## Estrutura
1. Saldo inicial (BPI + Novo Banco)
2. Entradas previstas: facturas por receber (InvoiceXpress), adiantamentos obras
3. Saídas previstas: salários (3 trabalhadores), fornecedores, renda, seguros, impostos
4. Saldo projectado semana a semana (4-8 semanas)

## Fontes de dados
- movimentos_bancarios (841 registos BPI + NB)
- efatura (4409 registos, ~1.5M€)
- recibos_vencimento (45 registos)

## Regras
- Nunca inventar valores — dados reais do Supabase
- Distinguir contas BPI e Novo Banco (conta_origem)
- Alertar se saldo projectado < 5.000€
