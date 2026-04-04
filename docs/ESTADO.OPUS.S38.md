# ESTADO CSN OPUS — S38
## Fecho de sessão | 04 Abril 2026

---

## MÉTRICAS DO SISTEMA

| Recurso | Quantidade |
|---------|-----------|
| Tabelas Supabase | 41 |
| Migrations | 28 (024 + 4 novas: 027-030) |
| Routes API | 49+ (32+ anteriores + 17 novos CRM) |
| ADRs | 33 (31 + ADR-032 WhatsApp + ADR-033 CRM Pipeline) |
| Agentes nucleus (C3) | 11 |
| Personas (C2) | 5 (Marta, Fernando, Carolina, Luísa, Leonor) |
| Skills | 5 (_global, producao, rh, chagas, dhollandia) |
| Embeddings | 2.927 |
| Fornecedores NIF | 381 |
| Catálogo Chagas | 294 artigos |
| Emails indexados | 18.169 |
| PDFs Storage | 3.333 |
| Recibos | 45 (Jan25-Mar26, 3 colaboradores) |

---

## O QUE FOI FEITO NA S38

### CRM Pipeline — implementação completa

**Migrations aplicadas:**
- M027: `clientes` — verificação por código, tipo (final/concessionário/oficina), canal_origem
- M028: `tickets` — sistema de tickets ISA-95, sequência TICK-YYYY-NNN, departamentos (COM/PRD/DOC/PER/FIN/QMS/MNT/INV/ENG/ATT)
- M029: `conversas_marta` — histórico de conversas por ticket e cliente
- M030: ALTER `leads` — 23 novos campos (pipeline, veículo, configuração, validações, APIs)

**17 endpoints novos (build OK):**

Veículos (lookup chain):
- `POST /api/veiculos/lookup-matricula` — matricula.co.pt (matrícula → VIN + dados básicos, 0.20€/consulta)
- `POST /api/veiculos/lookup-vin` — Vincario (VIN → ~50 campos specs, HMAC auth)
- `POST /api/veiculos/lookup` — cadeia completa matrícula → VIN → specs

Clientes:
- `GET/POST /api/clientes` — CRUD
- `GET/PATCH /api/clientes/[id]` — detalhe + update
- `POST /api/clientes/verificar` — gerar código 6 dígitos
- `POST /api/clientes/confirmar` — confirmar código, marcar verificado=true
- `GET /api/clientes/lookup` — ?whatsapp=X ou ?email=Y

Tickets:
- `GET/POST /api/tickets` — CRUD com filtros (departamento, estado, cliente_id)
- `GET/PATCH /api/tickets/[id]` — detalhe + update estado/departamento
- `POST /api/tickets/evoluir` — evolução automática COM→PRD (cria obra)

Router:
- `POST /api/router/classificar` — classifica mensagem com Claude, cria ticket ISA-95

Leads (extensões):
- `POST /api/leads/qualificar` — cria lead qualificada (3 portões validados)
- `PATCH /api/leads/[id]/estado` — muda estado_pipeline
- `POST /api/leads/[id]/orcamento` — regista orçamento e valor

Marta:
- `POST /api/marta/mensagem` — conversa com contexto e 3 portões bloqueantes
- `GET /api/marta/conversa/[ticket_id]` — histórico conversa

**ADR-033:** CRM Pipeline — CSN-L4-COM-033-2026

### Decisões de arquitectura fechadas

1. **Marta = face pública única** em todos os canais (Camada 2, L4-COM)
2. **Agente Router (C3)** classifica e cria tickets com departamento ISA-95
3. **Tickets ISA-95 completo** — 5 activos (COM/PRD/DOC/PER/FIN) + 4 futuros (QMS/MNT/INV/ENG)
4. **Evolução automática** ticket COM→PRD quando orçamento aceite
5. **APIs veículos:** matricula.co.pt (matrícula→VIN, 0.20€) + Vincario (VIN→specs)
6. **Marta bloqueada por 3 portões** nos canais de mensagem (veículo→configuração→contacto)
7. **Email não passa pela Marta** — Router processa directamente
8. **Verificação de cliente** por código 6 dígitos antes de informação comercial
9. **Cliente conhecido vs novo** — registados vêem preços no configurador

### Personas C2 confirmadas (5)
| Persona | Âmbito | ISA-95 |
|---------|--------|--------|
| Marta | Face pública, todos os canais, CSN Connect | L4-COM |
| Fernando | Chefe produção, workers (substituiu Sr.Manuel) | L0-PER |
| Carolina | RH, recibos, férias, área pessoal | L3-RH |
| Luísa | Assistente CEO, acesso total (Duarte) | L4-BPL |
| Leonor | Aftersales, garantias, reclamações | L4-COM |

---

## ENV VARS NOVAS (adicionar ao Vercel)

```
MATRICULA_API_KEY=        # matricula.co.pt — registar em matricula.co.pt
VINCARIO_API_KEY=         # vindecoder.eu — registar em vindecoder.eu
VINCARIO_API_SECRET=      # vindecoder.eu
```

WhatsApp e Telegram env vars pendentes de sessões anteriores:
```
WHATSAPP_API_TOKEN=       # Meta Business API
WHATSAPP_PHONE_ID=        # Meta Business API
TELEGRAM_BOT_TOKEN=       # Telegram Bot API
```

---

## PENDENTE — BACKLOG

### Prioridade alta (S39+)
- [ ] Testar endpoints CRM em produção (Vercel deploy)
- [ ] Registar contas matricula.co.pt e Vincario (API keys)
- [ ] Configurar WhatsApp Business API (Meta)
- [ ] Configurar Telegram Bot
- [ ] Catálogo Chagas: secções 4 (Chapas ~87) e 5 (Tubos ~200+)
- [ ] Frontend portal produção (workers — Fernando/Carolina)
- [ ] ISO 22400 KPIs dashboards (6 já calculáveis)
- [ ] Endpoint `/api/embeddings/pesquisar` (pesquisa semântica RAG)

### Prioridade média
- [ ] COC electrónico IMT (deadline Julho 2026)
- [ ] Automação fim de obra (COC, DoP, CE marking, factura, dossier)
- [ ] Agente Financeiro + reconciliação bancária (841 movimentos BPI)
- [ ] M017 materiais (dados organizados pelo Cowork → catálogo ↔ materiais)
- [ ] Skills: Pecol, Coprial + 1 ferro

### Pendentes herdados
- [ ] Portal "duas portas" (Produção + Pessoal com re-auth PIN)
- [ ] Recibos 2023-2024 pendentes
- [ ] Bodor smart meter (ISO 50001)
- [ ] Manuais Bodor (RAG)
- [ ] Apagar factura duplicada IX 253708521
- [ ] Cancelar Vendus

---

## COMMITS S38

- S37 HEAD: `092a806` (ou posterior se houve mais commits S37)
- S38: commits do Claude Code (verificar com `git log --oneline -10`)

---

## PRÓXIMA SESSÃO (S39)

1. Deploy Vercel `npx vercel --prod`
2. Testar endpoints CRM com dados reais
3. Registar API keys (matricula.co.pt + Vincario)
4. Catálogo Chagas secções 4+5
5. Frontend — início do portal trabalhador (Fernando/Carolina)
