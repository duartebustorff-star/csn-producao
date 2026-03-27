# ADR-025 — Faturação Certificada InvoiceXpress

**Data:** 27/03/2026
**Hora (Lisboa):** 14:00 WET (UTC+1 — WEST)
**Estado:** ✅ Aceite
**Sessão:** 24–25
**Fonte:** Decisão arquitectural — migração de Cegid Vendus para InvoiceXpress

---

## Contexto

A CSN precisa de faturação certificada pela AT para emitir faturas, notas de crédito e guias de transporte com ATCUD, assinatura digital e QR code. O sistema não gera documentos fiscais — delega num serviço certificado e guarda apenas metadados e referências.

Foram avaliadas 4 opções: Cegid Vendus Pro, Cegid Invoicing Engine, Masterway e InvoiceXpress. A decisão final recaiu sobre InvoiceXpress após análise de API, custo e funcionalidades.

---

## Decisão

**InvoiceXpress** — serviço de faturação certificada AT (certificado AT nº 192).

**Conta:** carlosdossantosna
**URL base:** `https://carlosdossantosna.app.invoicexpress.com`
**Env vars Vercel:** `INVOICEXPRESS_API_KEY`, `INVOICEXPRESS_ACCOUNT_NAME`

---

## Alternativas Rejeitadas

| Serviço | Motivo rejeição |
|---------|----------------|
| Cegid Vendus Pro | Sem SAF-T automático, API limitada |
| Cegid Invoicing Engine | Enterprise, custo desproporcional |
| Masterway | Sem SAF-T automático, API fraca |

---

## Fluxo

```
CSN Opus (emitir/route.ts)
    → POST /invoices.json na API InvoiceXpress
    → InvoiceXpress gera documento fiscal (ATCUD + QR + assinatura)
    → Devolve ID + número + permalink + PDF
    → CSN Opus guarda metadados na tabela faturas (Supabase)
```

**Princípio:** Faturas no Supabase são metadados e referências externas — nunca documentos fiscais. O documento fiscal vive no InvoiceXpress.

---

## Tabelas Supabase — Migration 015

```sql
clientes_faturacao
    id BIGSERIAL PK
    nome, nif, email, morada
    invoicexpress_client_id TEXT

faturas
    id BIGSERIAL PK
    numero_fatura, invoicexpress_id, invoicexpress_url
    obra_id TEXT FK → obras(id)
    cliente_faturacao_id BIGINT FK → clientes_faturacao(id)
    estado (rascunho/enviada/paga/anulada)
    tipo (fatura/fatura_recibo/nota_credito)
    base_tributavel, iva, total
    data_emissao, data_vencimento
    referencia_interna

notas_credito
    id BIGSERIAL PK
    fatura_original_id BIGINT FK → faturas(id)
    invoicexpress_id TEXT
    motivo, valor_total
```

RLS habilitado nas 3 tabelas com política `allow_all` (admin-only por agora).

---

## API Routes

| Route | Método | Função |
|-------|--------|--------|
| `/api/faturacao/emitir` | POST | Cria fatura no InvoiceXpress + guarda metadados |
| `/api/faturacao/listar` | GET | Lista faturas por obra_id |

---

## Requisitos Legais — CIVA art. 36

Cumpridos pelo InvoiceXpress (não pelo CSN Opus):
- NIF emitente e destinatário
- Número sequencial + série
- ATCUD
- Data de emissão
- Descrição, valor base + IVA + total
- QR code
- Assinatura digital

---

## Histórico de Decisão

1. **Sessão 23:** Decisão inicial Cegid Vendus Pro (cert AT 2230). ADR-025 criado.
2. **Sessão 24:** Reavaliação — InvoiceXpress escolhido (cert AT 192). ADR-025 actualizado. Env vars adicionadas. Routes criadas.
3. **Sessão 25:** Migration 015 executada com nomes `invoicexpress_*`. Código `emitir/route.ts` limpo de referências `masterway_*`.

---

## Consequências

- 3 tabelas criadas no Supabase (migration 015) com nomes `invoicexpress_*`
- 2 API routes operacionais (`emitir` + `listar`)
- Env vars configuradas no Vercel
- Zero referências a `masterway` ou `vendus` no código
- Migration 016 planeada: `movimentos_bancarios`, `fornecedores`, campo IBAN em `colaboradores_rh` e `clientes_faturacao`
- Nível ISA-95: Nível 4 — ERP (Financeiro)
