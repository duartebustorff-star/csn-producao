# CSN Opus — Estado do Sistema
### Código interno: CSN-L4-ENG-SYS-026-2026

## Última sessão: 26 (28/03/2026)
## Último commit: f008f32
## Deploy: csn-producao.vercel.app ✅
## Norma estruturante: ISA-95 / IEC 62264

---

## Números
- **Tabelas Supabase:** 30
- **Migrations:** 001–016 + 021 (17 executadas)
- **Chat Tools:** 20 (15 produção/comercial + 5 Carolina RH)
- **ADRs:** 25
- **Recibos:** 45 (Jan2025–Mar2026, 3 colaboradores)
- **Obras activas:** 6 (L2026-001-01 a 06)

---

## CODIFICAÇÃO INTERNA DE DOCUMENTOS CSN

Formato: `CSN-L[nível]-[secção]-[seq]-[ano]`

| Código | Secção ISA-95 | Nível | Âmbito |
|--------|--------------|-------|--------|
| PRD | Production Operations | L0–L2 | Termos, checklists obra, fichas fase |
| QMS | Quality Operations | L1–L2 | ITP, relatórios inspecção, NC |
| MNT | Maintenance Operations | L2 | Planos manutenção, registos |
| INV | Inventory Operations | L3 | Certificados material 3.1, encomendas |
| PER | Personnel | L0–L3 | Qualificações soldador, certificados |
| EQP | Equipment | L0–L2 | Fichas equipamento, calibração |
| MAT | Material | L0–L3 | Rastreabilidade lotes, consumos |
| FIN | Financial | L4 | Faturas, movimentos, reconciliação |
| DOC | Document Management | L3 | DAVs, COCs, DoPs, Marcação CE |
| RH | Human Resources | L3 | Recibos, férias, processamentos |
| COM | Commercial | L4 | Propostas, leads, contratos |
| ENG | Engineering | L4 | ADRs, arquitectura, sistema |

### Documentos de fecho de sessão:
- `CSN-L4-ENG-SYS-026-2026` — ESTADO.md (este documento)
- `CSN-L4-ENG-SYS-025-2026` — csn-architecture__25_.html
- `CSN-L4-ENG-CTR-011-2026` — CSN-Controlo-Sistema-v11.pdf

---

## REGISTO DE CONFORMIDADE ISA-95 / IEC 62264

### IEC 62264-1 — Modelos e Terminologia

| Requisito | Estado | Notas |
|-----------|--------|-------|
| Hierarquia funcional (L0–L4) | ✅ SIM | 5 níveis mapeados |
| Hierarquia equipamento | ✅ SIM | 1 site, 4 áreas, 4 work centers |
| Fronteiras entre níveis | ✅ SIM | L3/L4 e L2/L3 claras |
| Fluxo dados entre níveis | ⚠️ PARCIAL | Falta L0→L1→L2 |
| Work Unit identification | ❌ NÃO | Não detalhado |
| Capacidade por Work Center | ❌ NÃO | Não registada |

### IEC 62264-2 — Modelos de Objectos

| Requisito | Estado | Notas |
|-----------|--------|-------|
| Personnel classes | ✅ SIM | Operator, Supervisor, Manager |
| Qualificações pessoal | ❌ NÃO | Faltam cert. soldadura EN 9606 |
| Disponibilidade pessoal | ⚠️ PARCIAL | pedidos_ferias_faltas existe |
| Material classes | ❌ NÃO | Sem tabela materiais |
| Material lot tracking | ❌ NÃO | Crítico EN 1090 |
| Stock actual | ❌ NÃO | |
| Process segments | ✅ SIM | 9 fases em fases_obra |
| Duração estimada vs real | ⚠️ PARCIAL | horas_reais sim, estimadas=0 |

### IEC 62264-3 — Actividades MOM

| Actividade | Estado | Notas |
|------------|--------|-------|
| Production: Definition | ✅ SIM | leads + tipo_carrocaria |
| Production: Scheduling | ⚠️ PARCIAL | Sequência sim, datas não |
| Production: Tracking | ✅ SIM | obras + fases_obra |
| Production: Performance | ❌ NÃO | Sem KPIs |
| Maintenance: todas | ❌ NÃO | Agente planeado |
| Quality: Test Definition | ⚠️ PARCIAL | Checklist GSR planeado |
| Quality: NC Management | ❌ NÃO | Exigido ISO 9001 |
| Inventory: Material Receipt | ⚠️ PARCIAL | fornecedores existe |
| Inventory: Consumption | ❌ NÃO | |
| Inventory: Lot Tracking | ❌ NÃO | Crítico EN 1090 |

### IEC 62264-4/5 — Integração

| Requisito | Estado | Notas |
|-----------|--------|-------|
| Isolamento externo | ✅ SIM | Princípio P2 |
| APIs L3↔L4 | ✅ SIM | 9 routes |
| Integridade referencial | ✅ SIM | FKs |
| B2MML / Standards | ⚠️ PARCIAL | JSON, não B2MML |

### Resumo conformidade: 28 requisitos — 10 conformes (36%) · 7 parciais (25%) · 11 não conformes (39%)

---

## Sessão 26 — O que foi feito

### P1 ✅ InvoiceXpress Emitir (L4-FIN)
- Fatura teste: Vesauto NIF 501316272, obra L2026-001-01, 2100€+IVA
- Código fatura: CSN-L4-FIN-001-2026
- Bug davs(*) corrigido (commit f008f32)

### P2 ✅ Migration 016 (L4-FIN)
- fornecedores + movimentos_bancarios + IBAN cols → 30 tabelas

### P3 ✅ 5 Carolina RH Chat Tools (L3-RH)
- consultar_recibos, pedir_ferias, saldo_ferias, dados_pessoais, resumo_rh_mensal

---

## Commits sessão 26
- `15e5c01` — feat: 5 Carolina RH chat tools (L3-RH)
- `ff60961` — fix: audit type gerar_documento (L3-DOC)
- `930a94e` — fix: force rebuild emitir route (L4-FIN)
- `f008f32` — fix: emitir route remover join davs (L4-FIN)

---

## Pendentes por nível ISA-95

### L0 — Processo Físico (PRD/PER/EQP)
- [ ] Qualificação soldadores EN ISO 9606-1 → CSN-L0-PER-xxx-2026
- [ ] Qualificação WPS EN ISO 15614-1 → CSN-L0-PRD-xxx-2026

### L1 — Sensing & Control (QMS)
- [ ] Checklist GSR por obra → CSN-L1-QMS-xxx-2026
- [ ] Inspecção visual soldaduras EN ISO 17637 → CSN-L1-QMS-xxx-2026
- [ ] Controlo dimensional pós-montagem → CSN-L1-QMS-xxx-2026

### L2 — Supervisão (PRD/MNT/QMS)
- [ ] Portal Produção Sr. Manuel → CSN-L2-PRD-xxx-2026
- [ ] Agente Qualidade (ITP, NC) → CSN-L2-QMS-xxx-2026
- [ ] Agente Manutenção preventiva → CSN-L2-MNT-xxx-2026

### L3 — Operações (DOC/RH/INV/MAT)
- [ ] Agente RH 11º agente autónomo → CSN-L3-RH-xxx-2026
- [ ] Pipeline documental end-to-end → CSN-L3-DOC-xxx-2026
- [ ] Tabela materiais + rastreabilidade lotes → CSN-L3-MAT-xxx-2026
- [ ] NORMAS.md no repo root → CSN-L3-DOC-xxx-2026

### L4 — Negócio (FIN/COM/ENG)
- [ ] Apagar fatura duplicada IX 253708521
- [ ] Remover CEGID_VENDUS_API_KEY do Vercel
- [ ] Cancelar Cegid Vendus
- [ ] Campo NIF na tabela leads → CSN-L4-COM-xxx-2026
- [ ] BPI ingestion 841 movimentos → CSN-L4-FIN-xxx-2026
- [ ] COC Eletrónico IMT jul/2026 → CSN-L4-DOC-xxx-2026
- [ ] Production Schedule → CSN-L4-PRD-xxx-2026
- [ ] Dashboards → CSN-L4-ENG-xxx-2026
