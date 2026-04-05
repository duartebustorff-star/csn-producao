# ESTADO CSN OPUS — S39
## 05 Abril 2026 | HEAD: pendente commit fecho

### SISTEMA
- **58 tabelas** | **38 migrations** | **49+ routes** | **33 ADRs + ADR-034 proposto** | **11 agentes** | **5 personas**
- **3.019 embeddings** | **Configurador JPM: 363 chassis, 26 carroçarias**
- Deploy: csn-producao.vercel.app | Repo: duartebustorff-star/csn-producao

### S39 — FEITO
1. **CRM Pipeline testado em produção** — Router classificou mensagem, criou TICK-2026-001 (dept=COM, confiança=0.95). Marta respondeu ao ticket.
2. **Router deduplicação** (commit 056d9bb) — 3 níveis: thread_id, mesmo remetente <48h, email match via cliente.
3. **Voz Twilio** (commit 321efc5) — Endpoint Marta voz v2 premium criado mas ABANDONADO (latência Claude > timeout Twilio 5s).
4. **WhatsApp Twilio** (commit 056d9bb) — Endpoint ponte Twilio sandbox → Router+Marta.
5. **Vapi.ai voice agent criado** — Marta CSN (ID 364b98cb), Claude Sonnet 4 + ElevenLabs + Deepgram. BLOQUEADO: nº +351923233644 preso em org Vapi antiga. Email enviado ao suporte.
6. **3 documentos DOC** — DOC-001 (Boas Práticas Testes), DOC-002 (Skills Conformidade), DOC-003 (RAG Agent Claude/Inventor).
7. **Migration 038** — Tabela correspondencia_email criada (21 campos + 9 indexes + mapping ISA-95).
8. **18.169 emails analisados** — INDICE_v4.xlsx: 8 categorias, 6 tipo_doc, 1.155 fornecedores, 3.820 spam, 5 leads. Importação via Cowork EM CURSO.
9. **ADR-034 proposto** — Pipeline de Entrada Unificado (Router one-pass: identificar→processar anexos→criar ticket completo).

### COMMITS S39
```
321efc5 feat: marta voz v2 premium + docs DOC-001 DOC-002 (S39)
0b804c3 feat: marta voz v2 premium + docs DOC-001/002/003 (S39)
056d9bb feat: voz twilio + whatsapp twilio + router deduplicacao (S39)
```

### PENDENTE IMEDIATO (S40)
- [ ] Confirmar importação email Cowork (SELECT count(*) FROM correspondencia_email = 18169)
- [ ] Vapi suporte — esperar resposta para libertar nº +351923233644
- [ ] NEXT_PUBLIC_APP_URL env var no Vercel
- [ ] Confirmar ADR-034
- [ ] Configurador JPM: verificação lado-a-lado Cowork → LARGCHA migration (Opção A)

### PENDENTE FUTURO
- CSN Connect portal (redesign premium)
- COC electrónico IMT (deadline Jul 2026)
- Agente Financeiro + reconciliação bancária (841 movimentos BPI)
- Portal "duas portas" (Produção + Pessoal)
- ISO 22400 worker dashboards
- Obra end-of-cycle automation

### CONTAS/SERVIÇOS
- **Twilio**: trial, +351 923 233 644, Voice+SMS+WhatsApp sandbox
- **Vapi**: org geral@carrocariascsn.pt, 9.19 credits, assistant Marta CSN ready
- **ElevenLabs**: account active, key sk_2ec7...
- **InvoiceXpress**: cert AT 192, account carlosdossantosna, produção activa
