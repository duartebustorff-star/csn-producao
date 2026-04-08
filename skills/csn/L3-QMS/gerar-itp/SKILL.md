---
name: gerar-itp
description: >
  Gera Plano de Inspecção e Ensaio (ITP) por obra ou por tipo de carroçaria. Usa esta skill quando iniciar uma nova obra, preparar documentação para auditoria, ou quando o utilizador mencionar "ITP", "plano de inspecção", "inspection and test plan", "plano de ensaio", "controlo de qualidade por obra". Cobre EN 1090-2 §12, EN ISO 3834-3, EN ISO 5817, EN ISO 17637.
---

# Gerar ITP — Plano de Inspecção e Ensaio

**Código interno:** CSN-L3-QMS-ITP-2026
**Nível ISA-95:** L3-MOM (QMS)
**Camada:** C3 (Agente QMS)
**Normas:** EN 1090-2 §12, EN ISO 3834-3, EN ISO 5817, EN ISO 17637, ISO 9001:2015 §8.5

## Objectivo

Gerar documento ITP para cada obra ou tipo de carroçaria. O ITP define pontos de inspecção, critérios de aceitação, frequência e responsável em cada fase de produção.

## Estrutura do ITP

| Fase | Ponto de Inspecção | Norma/Critério | Método | Frequência | Responsável | Registo |
|------|-------------------|----------------|--------|------------|-------------|---------|
| Recepção material | Cert. 3.1 vs encomenda | EN 10204 | Documental | 100% lotes | Qualidade | Ficha recepção |
| Corte | Dimensões peças | Desenho técnico | Medição | Amostragem 20% | Operador | Check dimensional |
| Soldadura | Aspecto visual cordões | EN ISO 5817 nível C | Visual (EN 17637) | 100% juntas | Coord. Soldadura | Relatório IV |
| Soldadura | NDT juntas críticas | EN ISO 5817 | LP/MT/UT | 5-10% | Lab. externo | Relatório NDT |
| Montagem | Cotas gerais carroçaria | Desenho técnico | Medição | 100% | Qualidade | Controlo dimensional |
| Montagem | Pontos amarração | EN 12640 | Tracção/visual | 100% | Qualidade | Certificado |
| Pintura | Espessura + aderência | Especificação | Medição | Amostragem | Qualidade | Relatório pintura |
| Final | Sensores/AEB/câmaras | Reg. 2019/2144 GSR | Funcional | 100% | Qualidade | Checklist GSR |
| Final | Iluminação | UNECE R48 | Funcional | 100% | Qualidade | Checklist R48 |
| Final | Protecções laterais | UNECE R73 | Visual + medição | 100% | Qualidade | Checklist R73 |
| Final | Para-choques traseiro | UNECE R58 | Visual + medição | 100% | Qualidade | Checklist R58 |

## Inputs necessários

- obra_id (da tabela obras)
- tipo_carrocaria (basculante/estrado/caixa_aberta/caixa_fechada)
- classe_execucao (EXC2 padrão CSN)
- wps_aplicaveis (lista de WPS da obra)

## Output

Documento PDF com:
- Cabeçalho: nº obra, cliente, chassis, tipo carroçaria
- Tabela ITP completa com todas as fases
- Campos de assinatura por ponto de inspecção
- Referências normativas por ponto
- Código interno: CSN-L3-QMS-ITP-[obra_id]-[ano]

## Regra Bandeira

Todos os critérios de aceitação devem referenciar norma específica. Nunca usar critérios genéricos como "conforme" ou "OK" sem referência normativa.