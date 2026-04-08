---
name: alerta-manutencao
description: >
  Gera alertas de manutenção por horas ou data. Activa para alerta manutenção, manutenção vencida, equipamento precisa manutenção.
---

# alerta-manutencao — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Automático baseado em horas de utilização ou calendário
- Dashboard Fernando

## Lógica
- Se horas_acumuladas > limite_horas → alerta
- Se data_actual > data_próxima_manutenção → alerta
- Notificação: Fernando (C2) + Duarte
