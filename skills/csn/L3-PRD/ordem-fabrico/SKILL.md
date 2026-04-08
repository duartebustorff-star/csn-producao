---
name: ordem-fabrico
description: >
  Gera Ordem de Fabrico (OF) a partir de lead aprovada com dados validados. Usa esta skill quando uma lead transitar para produção, quando o utilizador mencionar "ordem de fabrico", "OF", "iniciar produção", "abrir obra", "production order". É o ponto de entrada formal no L3-PRD.
---

# Ordem de Fabrico (OF)

**Código interno:** CSN-L3-PRD-OF-2026
**Nível ISA-95:** L3-MOM (PRD)
**Camada:** C3 (Agente Produção)
**Normas:** ISA-95 Part 3 (Production Operations Management), ISO 9001 §8.5

## Objectivo

Gerar Ordem de Fabrico formal que inicia o processo produtivo. A OF é criada quando uma lead com dados validados transita de COM → PRD. Sem OF, nenhum trabalho de produção pode ser registado.

## Gate de validação (lead → OF)

Antes de gerar OF, TODOS estes campos da lead devem estar preenchidos:

| Campo | Fonte | Obrigatório |
|-------|-------|-------------|
| marca/modelo chassis | lead | ✓ |
| VIN | lead | ✓ |
| tipo_carrocaria | lead | ✓ |
| comprimento_util | lead | ✓ |
| largura_util | lead | ✓ |
| altura_util | lead | ✓ |
| dist_eixo_1_2 | lead | ✓ |
| tara_chassis | inspecao ou fabricante | ✓ |
| pma | lead | ✓ |
| cliente_id | lead | ✓ |

**Se faltar qualquer campo → OF bloqueada, lead devolvida a COM com lista de campos em falta.**

## Conteúdo da OF

- **Número:** CSN-OF-[ano]-[seq] (sequencial anual)
- **Dados do veículo:** chassis, VIN, marca/modelo, PMA
- **Especificação:** tipo carroçaria, dimensões, opções
- **Prazo previsto de entrega**
- **Fases de produção:** corte → soldadura → montagem → pintura → inspecção → entrega
- **WPS aplicáveis** (preenchidos pelo Coord. Soldadura)
- **Material previsto** (BOM base do tipo de carroçaria)
- **Observações comerciais** (da lead)

## Integração

- Cria registo na tabela `obras` com estado "em_producao"
- Liga à lead de origem (lead_id)
- Gera ITP automático (via skill gerar-itp)
- Inicia rastreabilidade (via skill rastrear-material)
- Alimenta dashboard ISO 22400 (throughput, production time)

## Regra Bandeira

Dimensões da OF alimentam directamente o modelo 3D paramétrico. Números errados = carroçaria errada. Gate de validação é inviolável.