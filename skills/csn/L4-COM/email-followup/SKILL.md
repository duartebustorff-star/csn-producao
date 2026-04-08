---
name: email-followup
description: >
  Gera templates de email de seguimento para a persona Marta enviar a leads/clientes. Usa esta skill quando precisar de fazer followup comercial, quando o utilizador mencionar "email cliente", "followup", "seguimento", "relembrar proposta", "contactar lead", "email Marta". Integra com estado da lead no CRM.
---

# Email Follow-up — Templates Marta

**Código interno:** CSN-L4-COM-EMAIL-2026
**Nível ISA-95:** L4-BPL (COM)
**Camada:** C3 (Agente Comercial)
**Persona de saída:** Marta (C2)

## Objectivo

Gerar emails de seguimento comercial contextualizados ao estado da lead no CRM. A Marta (persona C2) é o rosto público — os emails saem sempre em nome dela.

## Templates por estado da lead

### 1. NOVO_CONTACTO — Primeiro contacto
**Assunto:** CSN — Carroçarias para [marca_chassis] | [tipo_carrocaria]
**Tom:** Profissional, acolhedor, directo

Apresentação CSN, confirmação de dados recebidos, próximos passos (recolha de especificações).

### 2. PROPOSTA_ENVIADA — Follow-up 5 dias
**Assunto:** Re: Proposta CSN-PROP-[nº] | [cliente]
**Tom:** Cordial, sem pressão

Confirmar recepção da proposta, disponibilidade para esclarecer dúvidas, sugerir chamada.

### 3. PROPOSTA_PENDENTE — Follow-up 15 dias
**Assunto:** Actualização | Proposta [tipo_carrocaria] para [marca_chassis]
**Tom:** Profissional, criar urgência suave

Relembrar proposta, mencionar prazo de entrega actual, oferecer actualização se especificações mudaram.

### 4. PRODUCAO_INICIADA — Update ao cliente
**Assunto:** A sua [tipo_carrocaria] está em produção | CSN
**Tom:** Entusiasmante, informativo

Informar início de produção, prazo estimado, oferecer foto de progresso.

### 5. PRONTO_ENTREGA — Agendamento
**Assunto:** Veículo pronto | Agendamento de entrega
**Tom:** Celebratório, prático

Confirmar conclusão, agendar entrega, listar documentação incluída (COC, DoP, certificados).

### 6. POS_VENDA — 30 dias após entrega
**Assunto:** Como está a correr? | CSN
**Tom:** Atencioso, abrir porta para referências

Verificar satisfação, pedir feedback, mencionar garantia e assistência.

## Variáveis dinâmicas

Todos os templates usam: {nome_cliente}, {empresa}, {marca_chassis}, {modelo_chassis}, {tipo_carrocaria}, {numero_proposta}, {prazo_entrega}, {nome_vendedor_concessionario}

## Output

- Email texto formatado para copiar/enviar
- Integração futura: envio directo via API Gmail (carrocariascsn@gmail.com)
- Código: CSN-L4-COM-EMAIL-[template]-[ano]

## Regra Bandeira

Nunca enviar email com dados placeholder. Se alguma variável não estiver preenchida na lead, o template bloqueia e indica que campos faltam. Marta nunca envia informação incompleta.