---
name: calculos-normativos
description: >
  Executa cálculos de distribuição de carga, massas por eixo e verificação de limites conforme Dir. 96/53/CE e Reg. 1230/2012. Usa esta skill quando verificar se um veículo carroçado cumpre limites de peso, quando o utilizador mencionar "distribuição de carga", "peso por eixo", "PMA", "cálculo de massas", "Dir. 96/53", "limites de peso".
---

# Cálculos Normativos — Distribuição de Carga

**Código interno:** CSN-L4-ENG-CALC-2026
**Nível ISA-95:** L4-BPL (ENG)
**Camada:** C3 (Agente Engenharia)
**Normas:** Dir. 96/53/CE, Reg. 1230/2012, DL 99/2005 (PT)

## Objectivo

Calcular distribuição de massas por eixo e verificar conformidade com limites legais. Resultado alimenta o COC e o Termo de Responsabilidade.

## Fórmulas base (veículo 2 eixos)

```
P_total = Tara_chassis + Tara_carrocaria + Carga_util
P_eixo_traseiro = (Tara_chassis × CG_chassis + Tara_carrocaria × CG_carrocaria + Carga × CG_carga) / Distancia_entre_eixos
P_eixo_dianteiro = P_total - P_eixo_traseiro
```

## Limites legais (Dir. 96/53/CE)

| Categoria | PMA máx | Eixo simples máx | Eixo duplo máx |
|-----------|---------|-------------------|----------------|
| N1 (≤3.5t) | 3.500 kg | 10.000 kg | — |
| N2 (3.5-12t) | 12.000 kg | 10.000 kg | 11.500-19.000 kg |
| N3 (>12t) | 26.000 kg (2 eixos) | 10.000 kg | 11.500-19.000 kg |

## Limites dimensionais

| Dimensão | Limite |
|----------|--------|
| Comprimento total | 12.000 mm (rígido) |
| Largura | 2.550 mm (2.600 mm refrigerados) |
| Altura | 4.000 mm |

## Inputs

- Tara chassis (pesagem ou ficha fabricante)
- Tara carroçaria (pesagem real — tabela inspecoes)
- Distância entre eixos (lead)
- Posição CG chassis (Body Builder Guidelines)
- Posição CG carroçaria (cálculo ou medição)
- Carga útil pretendida

## Output

- Relatório PDF com:
  - Esquema do veículo com cotas
  - Tabela de massas (tara, carga, total por eixo)
  - Verificação vs limites (CONFORME / NÃO CONFORME)
  - Margem disponível por eixo (kg e %)
- Código: CSN-L4-ENG-CALC-[obra_id]-[ano]

## Regra Bandeira

Tara de carroçaria SEMPRE de pesagem real, nunca estimada. CG do chassis vem do BBG do fabricante (extraído pelo skill analise-fabricante). Se CG não disponível, usar método simplificado com margem de segurança de 10%.