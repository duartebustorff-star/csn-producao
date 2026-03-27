# ADR-025 — Integração Cegid Vendus para Faturação Certificada AT

**Data:** 2026-03-27
**Estado:** Aceite
**Nível ISA-95:** Nível 4 (ERP)

## Contexto

O CSN Opus é um sistema de gestão de produção (MES/MOM) e não pode ser software de faturação certificado pela Autoridade Tributária (AT). A legislação portuguesa exige que a emissão de faturas, faturas simplificadas e notas de crédito seja feita por software certificado.

Cegid Vendus tem certificado AT n.º 2230, SAF-T automático com comunicação directa à AT, ATCUD, assinatura digital, guias de transporte AT, e API REST documentada. Plano Pro (obrigatório para integração ERP) a 15,83 EUR/mês (plano anual). API key disponível imediatamente após subscrição em APPS > API.

## Decisão

Integrar Cegid Vendus via API REST (plano Pro obrigatório para integração ERP) para emissão de faturas certificadas AT a partir do CSN Opus.

**Fluxo:**

1. CSN Opus envia ordem de faturação (cliente, linhas, valores, obra associada) via POST à API Cegid Vendus.
2. Cegid Vendus valida, gera documento fiscal certificado com ATCUD, assinatura digital e QR Code, e devolve ID do documento e URL do PDF.
3. CSN Opus guarda na tabela `faturas` o ID Cegid Vendus, URL do PDF, estado, e metadados da fatura.
4. SAF-T é comunicado automaticamente à AT pelo Cegid Vendus — sem intervenção manual.

**Credenciais:** API key Cegid Vendus guardada em variável de ambiente `CEGID_VENDUS_API_KEY` (backend only, nunca exposta ao frontend).

## Consequências

- **Faturas no Supabase são metadados e referências externas** — o documento fiscal de verdade vive no Cegid Vendus. A tabela `faturas` guarda: ID Cegid Vendus, número do documento, URL do PDF, estado (emitida/anulada), referência à obra, valores, e timestamps.
- **Sem duplicação fiscal** — o CSN Opus nunca gera documentos fiscais; apenas orquestra o pedido e guarda a referência.
- **SAF-T automático** — comunicação directa à AT sem intervenção manual, incluindo guias de transporte.
- **Dependência externa** — a emissão de faturas depende da disponibilidade da API Cegid Vendus. Em caso de indisponibilidade, o sistema deve guardar o pedido em fila e retentar.
- **Auditoria** — todas as operações de faturação são registadas no `audit_log` para conformidade ISO 9001.
- **Custo controlado** — 15,83 EUR/mês (plano Pro anual), sem custos adicionais por documento.

## Alternativas Consideradas

| Alternativa | Motivo de rejeição |
|---|---|
| Masterway | Conta activa (3,75 EUR/mês) mas sem SAF-T automático via API; não cobre requisitos fiscais completos |
| InvoiceXpress | Custos superiores; migração já abandonada |
| Cegid Invoicing Engine | Enterprise; desnecessário para o volume da CSN |
| Certificação própria do CSN Opus | Processo de certificação AT demorado e fora do âmbito do sistema MES |
| Faturação manual no portal Cegid Vendus | Não escalável; perde rastreabilidade automática obra → fatura |
