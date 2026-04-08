---
name: pricing-margem
description: >
  Calcula preço de venda e margem por tipo de carroçaria. Activa para pricing, quanto cobro, preço de venda, margem, markup.
---

# pricing-margem — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Definir preço para novo tipo de carroçaria
- Ajustar preços existentes
- Análise de competitividade de preço

## Estrutura
1. Custo matéria-prima: chapa (kg × €/kg), perfil, tubo, Hardox
2. Custo mão-de-obra: horas estimadas × custo/hora
3. Custos indirectos: % sobre directos (energia, desgaste, overhead)
4. Custo total
5. Markup desejado (ex: 30-40%)
6. Preço de venda sugerido
7. Comparação com mercado

## Regras
- Custos reais dos últimos 6 meses (e-fatura)
- Nunca cobrar abaixo do custo total + 15%
- Hardox tem markup diferente de S235
