---
name: gerar-itp
description: >
  Gera Inspection Test Plan (ITP) por tipo de obra. Activa para ITP, plano inspecção, inspection test plan, plano de controlo.
---

# gerar-itp — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Novo tipo de carroçaria
- Preparação certificação EN 1090
- Pedido de cliente para plano qualidade

## Norma: EN 1090-2, cláusula 12
## Estrutura por fase de obra
| Fase | Inspecção | Critério | Freq. | Registo | Resp. |
|------|-----------|----------|-------|---------|-------|
| F1 Recepção material | Cert 3.1, visual | EN 10204 | 100% | Ficha recepção | QMS |
| F2 Corte laser | Dimensional | ±1mm | 100% | Relatório | PRD |
| F3 Quinagem | Ângulo, dimensional | ±0.5° | 100% | Relatório | PRD |
| F4 Soldadura | Visual 100%, NDT 5% | EN ISO 5817 C | 100%/5% | Relatório | QMS |
| F5 Montagem | Dimensional geral | Desenho | 100% | Checklist | PRD |
| F6 Pintura | Espessura, aderência | 60-80μm | Amostra | Relatório | QMS |
| F7 Acessórios | Funcional | Spec | 100% | Checklist | PRD |
| F8 Montagem chassis | Binários, alinhamento | Fabricante | 100% | Checklist | PRD |
| F9 Entrega | GSR, luzes, pesagem | Reg/UNECE | 100% | Termo | QMS |
