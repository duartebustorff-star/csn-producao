---
name: rastrear-material
description: >
  Rastreia materiais desde a recepção (certificado 3.1) até à peça final na obra. Usa esta skill quando receber material, associar lotes a peças, verificar rastreabilidade de uma obra, ou quando o utilizador mencionar "rastreabilidade", "lote", "certificado 3.1", "material tracing", "que material está na obra X". Cobre EN 1090-2 §6.2, EN ISO 3834-3.
---

# Rastrear Material

**Código interno:** CSN-L3-PRD-MAT-2026
**Nível ISA-95:** L3-MOM (PRD/INV)
**Camada:** C3 (Agente Produção + Agente Inventário)
**Normas:** EN 1090-2 §6.2, EN ISO 3834-3, EN 10204 (certificados 3.1)

## Objectivo

Manter rastreabilidade completa: fornecedor → lote → certificado 3.1 → peça → junta soldada → obra. Requisito EN 1090-2 para EXC2. Sem rastreabilidade, a DoP e marcação CE ficam bloqueadas.

## Fluxo

```
Fornecedor entrega material
    ↓
Recepção: verificar cert. 3.1 vs encomenda
    ↓
Registar na tabela certificados_material (mig039)
    ↓
Atribuir lote interno (CSN-MAT-[ano]-[seq])
    ↓
Corte: marcar peças com nº lote (marcador/etiqueta)
    ↓
Soldadura: registar que soldador soldou que junta com que lote
    ↓
Ficha de rastreabilidade por obra (completa)
```

## Dados por registo

| Campo | Tipo | Fonte |
|-------|------|-------|
| lote_interno | TEXT | CSN-MAT-[ano]-[seq] |
| fornecedor | TEXT | tabela fornecedores |
| certificado_3_1_id | UUID | tabela certificados_material |
| qualidade_aco | TEXT | cert. 3.1 (ex: S355J2) |
| espessura_mm | NUMERIC | cert. 3.1 |
| dimensoes | TEXT | cert. 3.1 |
| obra_id | TEXT | quando cortado para obra |
| pecas | JSONB | [{peca, quantidade, desenho}] |
| soldador_id | TEXT | quem soldou |
| wps_ref | TEXT | WPS utilizado |

## Consultas típicas

- "Que material está na obra OBR-2026-015?" → lista lotes + certs
- "Onde foi usado o lote CSN-MAT-2026-0042?" → lista obras + peças
- "Que soldador fez as juntas da obra X?" → rastreabilidade soldadura
- "O cert. 3.1 do fornecedor Y está conforme?" → verificação documental

## Regra Bandeira

Material sem certificado 3.1 válido não pode entrar em produção. Peça sem lote atribuído não pode ser soldada. Qualquer quebra na cadeia de rastreabilidade bloqueia a DoP.