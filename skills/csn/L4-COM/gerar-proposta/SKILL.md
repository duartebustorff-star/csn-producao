---
name: gerar-proposta
description: >
  Gera proposta comercial PDF a partir de lead qualificada. Usa esta skill quando a Marta ou o Duarte precisarem de enviar proposta a cliente, quando o utilizador mencionar "proposta", "orçamento", "quotation", "proposta comercial", "enviar preço". Integra com dados do chassis, tipo de carroçaria e tabela de preços.
---

# Gerar Proposta Comercial

**Código interno:** CSN-L4-COM-PROP-2026
**Nível ISA-95:** L4-BPL (COM)
**Camada:** C3 (Agente Comercial)
**Persona de saída:** Marta (C2)

## Objectivo

Gerar proposta comercial profissional em PDF a partir de dados da lead. A proposta é o documento que o cliente recebe com especificação técnica resumida + preço + condições.

## Estrutura da proposta

### Cabeçalho
- Logo CSN + dados empresa
- Nº proposta: CSN-PROP-[ano]-[seq]
- Data + validade (30 dias padrão)
- Cliente: nome, empresa, NIF

### Especificação técnica
- Chassis: marca, modelo, PMA
- Tipo de carroçaria: basculante / estrado / caixa aberta / caixa fechada
- Dimensões úteis: C × L × A
- Opções incluídas (ex: portas laterais, olhais amarração, kit hidráulico)
- Normas aplicáveis: EN 1090, EN 12642 L/XL

### Preço
- Valor base carroçaria
- Opções adicionais (itemizadas)
- Total s/ IVA
- IVA (23%)
- Total c/ IVA

### Condições
- Prazo de entrega estimado
- Condições de pagamento (50% entrada + 50% entrega, ou conforme cliente)
- Garantia: 2 anos estrutural
- Transporte: incluído/não incluído

### Rodapé
- "Carroçaria fabricada conforme EN 1090 + EN ISO 3834"
- "Certificação EN 12642 L/XL disponível"
- Contacto Marta

## Inputs

- lead_id (puxa todos os dados da lead)
- tipo_preco (tabela interna de preços base por tipo)
- opcoes_selecionadas (array)
- condicoes_pagamento (texto livre ou template)
- prazo_entrega_semanas

## Output

- PDF profissional com layout CSN
- Código: CSN-L4-COM-PROP-[ano]-[seq]
- Registo na tabela leads (estado → "proposta_enviada", proposta_url)

## Regra Bandeira

Preço nunca calculado automaticamente sem validação humana (Duarte aprova). O skill prepara a proposta com preço base da tabela — Duarte ajusta antes de enviar.