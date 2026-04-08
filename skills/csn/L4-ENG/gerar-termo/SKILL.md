---
name: gerar-termo
description: >
  Gera Termo de Responsabilidade conforme legislação portuguesa para veículos transformados. Usa esta skill quando preparar entrega de veículo, quando o utilizador mencionar "termo", "termo de responsabilidade", "declaração de transformação". Formalização do processo existente em /api/gerar-termo.
---

# Gerar Termo de Responsabilidade

**Código interno:** CSN-L4-ENG-TRM-2026
**Nível ISA-95:** L4-BPL (ENG)
**Camada:** C3 (Agente Engenharia)
**Normas:** Regulamento de Transformação de Veículos (IMT, Jan 2026), DL 99/2005

## Objectivo

Gerar Termo de Responsabilidade que o fabricante de carroçaria emite declarando conformidade da transformação. Documento obrigatório para inspeção e matrícula em Portugal.

## Dados do Termo

### Fabricante
- Denominação: Carlos dos Santos Nascimento, Lda
- NIF: 500 861 790
- Sede: Mafra, Portugal

### Veículo
- Matrícula (se já atribuída)
- VIN
- Marca/Modelo chassis
- Categoria

### Transformação
- Tipo: montagem de carroçaria [tipo]
- Dimensões: comprimento × largura × altura (mm)
- Tara da carroçaria (kg) — da tabela inspecoes
- Distâncias entre eixos — da lead
- PMA não excedido: declaração

### Declaração
"Declara-se sob responsabilidade que a transformação efectuada cumpre todos os requisitos legais aplicáveis e não compromete a segurança nem as características homologadas do veículo base."

## Integração existente

- Route: `/api/gerar-termo` (já operacional)
- Dados: dist_eixo da lead, pesos da tabela inspecoes
- Output: PDF com layout CSN

## Melhorias pendentes

- Validar que TODOS os campos têm fonte real (não estimados)
- Incluir referência ao COC 1ª etapa
- Incluir referência ao ITP da obra (quando implementado)
- Gerar versão para novo regulamento transformação (Jan 2026)

## Regra Bandeira

Tara da carroçaria vem de pesagem real (tabela inspecoes), nunca estimada. Distâncias de eixo vêm da lead (dados do fabricante). Se qualquer valor faltar, o termo não é gerado.