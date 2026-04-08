---
name: rastrear-material
description: >
  Rastreia material desde recepção até peça final. Activa para rastreabilidade, lote, certificado 3.1, que material nesta peça. Norma: EN 1090-2 + EN ISO 3834-3.
---

# rastrear-material — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Recepção de material com cert 3.1
- Corte laser (lote → peça)
- Auditoria EN 1090

## Fluxo
1. Recepção: cert 3.1 → registo lote (material, qualidade, espessura, fornecedor)
2. Armazenamento: identificação por lote
3. Corte: lote → peças (nesting AlmaCam)
4. Soldadura: peças → conjunto → obra
5. Consulta: por obra, saber exactamente que material (lote, cert 3.1) foi usado

## Tabela: certificados_material (já existe, 3 registos)
