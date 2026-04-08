---
name: gerar-coc
description: >
  Gera COC (Certificate of Conformity) multi-etapa 2ª fase conforme Reg. (UE) 2018/858. Usa esta skill quando uma obra estiver pronta para entrega, quando preparar documentação de homologação, ou quando o utilizador mencionar "COC", "certificado de conformidade", "homologação", "multi-stage", "2ª etapa". Deadline COC eletrónico: Julho 2026.
---

# Gerar COC — Certificado de Conformidade Multi-Etapa

**Código interno:** CSN-L4-ENG-COC-2026
**Nível ISA-95:** L4-BPL (ENG)
**Camada:** C3 (Agente Engenharia)
**Normas:** Reg. (UE) 2018/858, Reg. 1230/2012, Dir. 96/53/CE

## Objectivo

Gerar COC de 2ª etapa (fabricante de carroçaria) para cada veículo carroçado. O COC é obrigatório para matrícula do veículo. A partir de Julho 2026, o COC deve ser eletrónico (e-COC via IMT).

## Campos obrigatórios COC 2ª etapa

### Identificação
- Fabricante 2ª etapa: Carlos dos Santos Nascimento, Lda
- NIF: 500 861 790
- Morada: Mafra, Portugal
- Nº homologação: [a obter do IMT]

### Veículo base (do COC 1ª etapa)
- Marca/modelo chassis
- VIN
- Categoria (N1/N2/N3)
- COC 1ª etapa referência

### Transformação 2ª etapa
- Tipo de carroçaria montada
- Dimensões finais: comprimento, largura, altura (mm)
- Massas: tara total, carga útil, PMA
- Distribuição por eixo: massa eixo 1, massa eixo 2 (+ eixo 3 se aplicável)
- Centro de gravidade (se calculado)

### Conformidade
- Iluminação conforme UNECE R48: SIM
- Protecções laterais conforme UNECE R73: SIM
- Para-choques traseiro conforme UNECE R58: SIM
- GSR conforme Reg. 2019/2144: SIM (sistemas chassis não comprometidos)
- Spray suppression conforme Reg. 109/2011: SIM/NA
- EN 12642 L/XL: SIM/NA (código e nº certificado)

## Inputs necessários

- obra_id (dados veículo + dimensões da lead/inspecção)
- COC 1ª etapa (do chassis — fornecido pelo concessionário)
- Resultados do skill calculos-normativos (massas, eixos)
- Resultados inspecção final (checklists R48, R73, R58, GSR)

## Output

- COC PDF conforme formato IMT
- Versão e-COC (XML/JSON) para submissão eletrónica (a partir Jul/2026)
- Código: CSN-L4-ENG-COC-[obra_id]-[ano]

## Regra Bandeira

Massas e dimensões no COC devem vir de medição real (balança + fita) ou cálculo documentado. Nunca copiar valores do fabricante sem verificar. Erro no COC = veículo não matriculável.