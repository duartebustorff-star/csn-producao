---
name: kpi-oee
description: >
  Calcula OEE (Overall Equipment Effectiveness). Activa para OEE, eficiência equipamento, disponibilidade.
---

# kpi-oee — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Dashboard ISO 22400
- Análise produtividade

## Fórmula ISO 22400
- OEE = Disponibilidade × Performance × Qualidade
- Disponibilidade = Tempo produção / Tempo planeado
- Performance = Produção real / Produção teórica
- Qualidade = Peças OK / Peças total
- Dependem de: timer, manutenção, NC
