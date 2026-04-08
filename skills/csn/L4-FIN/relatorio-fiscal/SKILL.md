---
name: relatorio-fiscal
description: >
  Prepara dados para relatório fiscal trimestral/anual. Activa para IVA, IRC, fiscal, impostos, declaração trimestral, contabilista.
---

# relatorio-fiscal — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Preparação dados para contabilista
- Resumo trimestral IVA
- Dados para IRC

## Estrutura
1. Volume facturação (InvoiceXpress)
2. IVA liquidado vs IVA dedutível
3. Despesas por categoria (efatura)
4. Salários e SS (recibos_vencimento)
5. Investimentos e amortizações

## Regras
- Dados mastigados para a contabilista verificar e assinar
- Formato xlsx com separadores por trimestre
- Legislação fiscal PT
