# CSN Opus — Skill & Tool Registry
**Documento:** CSN-L3-DOC-002-2026 | **Versão:** 1.0 | **Data:** 02/04/2026
**ISA-95:** Transversal | **Actualizado:** a cada adição de skill ou tool

---

## Skills

| Data/Hora | Tipo | Caminho | ISA-95 | Estado | Descrição |
|-----------|------|---------|--------|--------|-----------|
| 02/04/2026 00:00 | skill | skills/_global/SKILL.md | Transversal | activo | Contexto CSN, normas, ISA-95 |
| 02/04/2026 16:00 | skill | skills/producao/SKILL.md | L3-PRD | activo | KPIs ISO 22400 (KPI-1..20), 9 fases, metas, escalacao |
| 02/04/2026 16:00 | skill | skills/rh/SKILL.md | L3-PER | activo | KPIs RH/Seguranca (RH-1..4, S-1..8), recibos, CITs, ferias |
| 02/04/2026 00:00 | skill | skills/financeiro/SKILL.md | L4-FIN | planeado | e-Fatura, conta corrente |
| 02/04/2026 00:00 | skill | skills/comercial/SKILL.md | L4-COM | planeado | Leads, DAVs, orçamentos |
| 02/04/2026 00:00 | skill | skills/engenharia/SKILL.md | L4-ENG | planeado | COC, DoP, CE marking |
| 02/04/2026 00:00 | skill | skills/qualidade/SKILL.md | L3-QMS | planeado | EN 1090, EN ISO 3834 |
| 02/04/2026 00:00 | skill | skills/manutencao/SKILL.md | L3-MNT | planeado | Bodor, Fronius, ciclos MNT |
| 02/04/2026 00:00 | skill | skills/inventario/SKILL.md | L3-INV | planeado | Materiais, lotes, consumos |
| 02/04/2026 16:30 | skill | skills/fornecedores/chagas/SKILL.md | L3-DOC | activo | Chagas — aco, perfis, chapa, conta corrente, pipeline docs |
| 02/04/2026 17:00 | skill | skills/fornecedores/dhollandia/SKILL.md | L3-DOC | activo | Dhollandia — tail lifts, 12 faturas 48.773 EUR, EN 1756, escalacao |
| 02/04/2026 00:00 | skill | skills/fornecedores/bielco/SKILL.md | L3-DOC | planeado | Bielco — painéis alumínio |
| 02/04/2026 00:00 | skill | skills/fornecedores/pecol/SKILL.md | L3-DOC | planeado | Pecol — fixações |

---

## Tools (API Routes)

| Data/Hora | Tipo | Rota | ISA-95 | Acesso | Estado | Descrição |
|-----------|------|------|--------|--------|--------|-----------|
| S32 | tool | /api/timer/iniciar | L3-PRD | escrita | activo | Inicia timer de trabalho |
| S32 | tool | /api/timer/parar | L3-PRD | escrita | activo | Para timer de trabalho |
| S32 | tool | /api/timer/foto-fase | L3-PRD | escrita | activo | Upload foto fase activa |
| S32 | tool | /api/obras | L3-PRD | leitura | activo | Lista obras activas |
| S32 | tool | /api/obras/fases | L3-PRD | leitura | activo | Fases por obra |
| S32 | tool | /api/kpis/worker | L3-PRD | leitura | activo | KPIs ISO 22400 por worker |
| S33 | tool | /api/rh/recibos | L3-PER | leitura | activo | Recibos por colaborador |
| S33 | tool | /api/rh/declaracao | L3-PER | leitura | activo | Declaração art. 119 CIRS |
| S33 | tool | /api/rh/ferias | L3-PER | leitura | activo | Férias por colaborador |
| S33 | tool | /api/rh/cits | L3-PER | leitura | activo | CITs por colaborador |
| S34 | tool | /api/roteador | L3-DOC | escrita | activo | Classifica doc via Claude API |
| S34 | tool | /api/documentos | L3-DOC | leitura | activo | Lista documentos indexados |
| S34 | tool | /api/faturacao/emitir | L4-FIN | escrita | activo | Emite fatura InvoiceXpress |
| S34 | tool | /api/faturacao/listar | L4-FIN | leitura | activo | Lista faturas IX |
| S34 | tool | /api/fornecedores/conta-corrente | L4-FIN | leitura | activo | Faturado vs pago por NIF |
| S34 | tool | /api/mnt/001 | L3-MNT | escrita | activo | Ciclo MNT-001 |
| S34 | tool | /api/mnt/002 | L3-MNT | escrita | activo | Ciclo MNT-002 |
| S34 | tool | /api/mnt/003 | L3-MNT | escrita | activo | Ciclo MNT-003 |
| S34 | tool | /api/mnt/004 | L3-MNT | escrita | activo | Ciclo MNT-004 |
| S36 | migration | supabase/025_embeddings_rag.sql | L3-DOC | escrita | activo | pgvector + tabela embeddings (vector 1536, HNSW) |

---

## Pendentes S36

| Prioridade | Tipo | Nome | ISA-95 | Notas |
|-----------|------|------|--------|-------|
| ~~1~~ | ~~skill~~ | ~~skills/_global/SKILL.md~~ | ~~Transversal~~ | ~~Criado S35~~ |
| ~~2~~ | ~~skill~~ | ~~skills/producao/SKILL.md~~ | ~~L3-PRD~~ | ~~Criado S36~~ |
| ~~3~~ | ~~skill~~ | ~~skills/rh/SKILL.md~~ | ~~L3-PER~~ | ~~Criado S36~~ |
| ~~4~~ | ~~skill~~ | ~~skills/fornecedores/chagas/SKILL.md~~ | ~~L3-DOC~~ | ~~Criado S36~~ |
| ~~5~~ | ~~migration~~ | ~~025_embeddings_rag.sql~~ | ~~L3-DOC~~ | ~~Aplicado S36~~ |
| 5 | tool | /api/embeddings | L3-DOC | Endpoint escrita embeddings (por criar) |
| 5 | tool | /api/whatsapp/webhook | Fronteira | Canal WhatsApp entrada |
| 6 | tool | /api/telegram/webhook | Fronteira | Canal Telegram entrada |
| 7 | tool | /api/email/roteador | Fronteira | IMAP automático geral@ |

---

*CSN Opus · duartebustorff-star/csn-producao · 02/04/2026*
