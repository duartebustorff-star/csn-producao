---
name: rentabilidade-obra
description: >
  Calcula rentabilidade por obra/carroçaria. Activa para rentabilidade, margem por obra, custo real, lucro por carroçaria, quanto ganhei nesta obra.
---

# rentabilidade-obra — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Análise de rentabilidade por obra específica
- Comparação margens entre obras
- "Quanto ganhei no basculante do JAP?"

## Estrutura
1. Receita: valor facturado (InvoiceXpress)
2. Custos directos: material (cert 3.1 → obra), horas trabalho (timer × custo/hora)
3. Custos indirectos: proporção custos fixos por obra
4. Margem bruta e líquida
5. Comparação com margem-alvo

## Fontes
- obras + fases_obra (tempos)
- efatura (custos matéria-prima)
- movimentos_bancarios (pagamentos)
- recibos_vencimento (custo hora)
