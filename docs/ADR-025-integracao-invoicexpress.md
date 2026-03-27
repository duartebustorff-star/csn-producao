# ADR-025 — Integração InvoiceXpress — Faturação Certificada AT

**Data:** 2026-03-27
**Estado:** Aceite
**Nível ISA-95:** Nível 4 (ERP)

## Contexto

O CSN Opus é um sistema de gestão de produção (MES/MOM) e não pode ser software de faturação certificado pela Autoridade Tributária (AT). A legislação portuguesa exige que a emissão de faturas, faturas simplificadas e notas de crédito seja feita por software certificado.

InvoiceXpress tem certificado AT n.º 192, ATCUD, assinatura digital, e API REST documentada. CSN já tem conta activa (carlosdossantosna). API key via query parameter, documentação em invoicexpress.com/api-v2/.

## Decisão

Integrar InvoiceXpress via API REST para emissão de faturas certificadas AT a partir do CSN Opus.

**API base:** `https://carlosdossantosna.app.invoicexpress.com`

**Routes implementadas:**

- `POST /api/faturacao/emitir` — recebe `{ obra_id, cliente_nif, items[] }`, cria fatura via InvoiceXpress API (`POST /invoices.json`), guarda metadados no Supabase.
- `GET /api/faturacao/listar?obra_id=X` — lista faturas por obra a partir do Supabase.

**Fluxo:**

1. CSN Opus envia ordem de faturação (cliente NIF, linhas, valores, obra associada) via POST à API InvoiceXpress.
2. InvoiceXpress valida, gera documento fiscal certificado com ATCUD, assinatura digital e QR Code, e devolve ID do documento e permalink do PDF.
3. CSN Opus guarda na tabela `faturas` o ID InvoiceXpress, número do documento, permalink, estado, e metadados da fatura.
4. Fatura é criada em estado `draft` — finalização (state → `finalized`) será implementada em endpoint separado.

**Credenciais:** API key InvoiceXpress guardada em variável de ambiente `INVOICEXPRESS_API_KEY` (backend only, nunca exposta ao frontend).

## Consequências

- **Faturas no Supabase são metadados e referências externas** — o documento fiscal de verdade vive no InvoiceXpress. A tabela `faturas` guarda: ID InvoiceXpress (`masterway_id`), número do documento, permalink, estado (rascunho/emitida/anulada), referência à obra, valores, e timestamps.
- **Sem duplicação fiscal** — o CSN Opus nunca gera documentos fiscais; apenas orquestra o pedido e guarda a referência.
- **SAF-T** — exportação disponível via endpoint `/api/export_saft.json` do InvoiceXpress.
- **Dependência externa** — a emissão de faturas depende da disponibilidade da API InvoiceXpress. Em caso de indisponibilidade, o sistema deve guardar o pedido em fila e retentar.
- **Auditoria** — todas as operações de faturação são registadas no `audit_log` para conformidade ISO 9001.

## Alternativas Rejeitadas

| Alternativa | Motivo de rejeição |
|---|---|
| Cegid Vendus | SAF-T automático, mas CSN já tinha conta InvoiceXpress activa; API InvoiceXpress mais simples; plataforma mais usada em Portugal |
| Masterway | Conta activa (3,75 EUR/mês) mas sem SAF-T automático via API; não cobre requisitos fiscais completos |
| Cegid Invoicing Engine | Enterprise; desnecessário para o volume da CSN |
| Certificação própria do CSN Opus | Processo de certificação AT demorado e fora do âmbito do sistema MES |
| Faturação manual no portal InvoiceXpress | Não escalável; perde rastreabilidade automática obra → fatura |
