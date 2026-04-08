---
name: calc-12195
description: >
  Calcula forças de fixação de carga segundo EN 12195-1. Activa para cálculo amarração, forças fixação, cintas, tensão amarração.
---

# calc-12195 — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Verificação EN 12642
- Dimensionamento pontos amarração
- Certificação carroçaria para transporte seguro

## Norma: EN 12195-1
- Forças de inércia: 0.8g frontal, 0.5g lateral, 0.5g traseiro (standard)
- Coeficiente atrito: μ (aço/madeira=0.3, aço/borracha=0.6)
- Força amarração necessária = (F_inércia - μ × m × g) / (μ_cinta + sin α)
- Número de cintas = F_total / capacidade_cinta
