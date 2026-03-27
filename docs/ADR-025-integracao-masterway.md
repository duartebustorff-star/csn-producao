# ADR-025 — Integração Masterway para Faturação Certificada AT

**Data:** 2026-03-27
**Estado:** Aceite
**Nível ISA-95:** Nível 4 (ERP)

## Contexto

O CSN Opus é um sistema de gestão de produção (MES/MOM) e não pode ser software de faturação certificado pela Autoridade Tributária (AT). A legislação portuguesa exige que a emissão de faturas, faturas simplificadas e notas de crédito seja feita por software certificado.

A Masterway já tem conta ativa (plano a 3,75 EUR/mês), certificação AT válida e uma API REST documentada em https://cloud.masterway.net/?action=api_documentation.

## Decisão

Integrar a Masterway via API REST para emissão de faturas certificadas AT a partir do CSN Opus.

**Fluxo:**

1. CSN Opus envia ordem de faturação (cliente, linhas, valores, obra associada) via POST à API Masterway.
2. Masterway valida, gera documento fiscal certificado com ATCUD e QR Code, e devolve ID do documento e URL do PDF.
3. CSN Opus guarda na tabela `faturas` o ID Masterway, URL do PDF, estado, e metadados da fatura.

**Credenciais:** API key Masterway guardada em variável de ambiente `MASTERWAY_API_KEY` (backend only, nunca exposta ao frontend).

## Consequências

- **Faturas no Supabase são metadados e referências externas** — o documento fiscal de verdade vive na Masterway. A tabela `faturas` guarda: ID Masterway, número do documento, URL do PDF, estado (emitida/anulada), referência à obra, valores, e timestamps.
- **Sem duplicação fiscal** — o CSN Opus nunca gera documentos fiscais; apenas orquestra o pedido e guarda a referência.
- **Dependência externa** — a emissão de faturas depende da disponibilidade da API Masterway. Em caso de indisponibilidade, o sistema deve guardar o pedido em fila e retentar.
- **Auditoria** — todas as operações de faturação são registadas no `audit_log` para conformidade ISO 9001.
- **Custo controlado** — 3,75 EUR/mês, sem custos adicionais por documento.

## Alternativas Consideradas

| Alternativa | Motivo de rejeição |
|---|---|
| InvoiceXpress | Migração já decidida (ver migration 015); custos superiores |
| Certificação própria do CSN Opus | Processo de certificação AT demorado e fora do âmbito do sistema MES |
| Faturação manual no portal Masterway | Não escalável; perde rastreabilidade automática obra → fatura |
