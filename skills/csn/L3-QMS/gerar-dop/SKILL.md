---
name: gerar-dop
description: >
  Gera Declaração de Desempenho (DoP) conforme EN 1090-1 para marcação CE de estruturas metálicas. Usa esta skill quando uma obra estiver concluída e precisar de DoP, marcação CE, ou quando o utilizador mencionar "declaração de desempenho", "DoP", "declaration of performance", "marcação CE", "CE marking". Cobre EN 1090-1, Reg. (UE) 305/2011 (CPR).
---

# Gerar DoP — Declaração de Desempenho

**Código interno:** CSN-L3-QMS-DOP-2026
**Nível ISA-95:** L3-MOM (QMS)
**Camada:** C3 (Agente QMS)
**Normas:** EN 1090-1:2009+A1:2011, Regulamento (UE) 305/2011 (CPR)

## Objectivo

Gerar Declaração de Desempenho (DoP) obrigatória para marcação CE conforme EN 1090-1. Cada obra ou lote de carroçarias com estrutura metálica soldada requer DoP individual.

## Campos obrigatórios DoP (Anexo III do CPR)

1. **Código identificação produto:** CSN-DoP-[obra_id]-[ano]
2. **Utilização prevista:** Estrutura de carroçaria para veículo comercial
3. **Fabricante:** Carlos dos Santos Nascimento, Lda — Mafra, Portugal
4. **Sistema AVCP:** Sistema 2+ (EN 1090-1, EXC2)
5. **Norma harmonizada:** EN 1090-1:2009+A1:2011
6. **Organismo notificado:** [nº e nome do organismo certificador]
7. **Desempenho declarado:**
   - Classe de execução: EXC2 (EN 1090-2)
   - Qualidade soldadura: EN ISO 3834-3
   - Tolerâncias: EN 1090-2 classe 1
   - Reacção ao fogo: Classe A1 (aço)
   - Durabilidade: Protecção conforme EN ISO 12944
8. **Assinatura:** Responsável legal CSN

## Inputs necessários

- obra_id
- lista de WPS utilizados
- referência WPQR
- referência certificados soldadores
- classe de tolerância aplicada
- sistema de protecção anticorrosiva

## Output

- DoP em PDF (formato Anexo III do CPR)
- Etiqueta CE para fixar na carroçaria (CSN, EN 1090-1, EXC2, nº DoP, ano)
- Código interno: CSN-L3-QMS-DOP-[obra_id]-[ano]

## Regra Bandeira

Nunca emitir DoP sem WPQR qualificada e certificados de soldador válidos. Se algum documento de suporte estiver em falta, a DoP fica bloqueada com estado "pendente_documentacao".