# CSN Opus — Estado do Sistema
### Codigo: CSN-L4-ENG-SYS-026-2026

## Ultima sessao: 26 (28/03/2026) · Commit: 07baf0d · Deploy: csn-producao.vercel.app
## Norma: ISA-95 / IEC 62264

---

## QUADRO CENTRAL — MODULOS OPUS POR NIVEL ISA-95

| Nivel | Sigla | Sistema | Norma | Modulos CSN |
|-------|-------|---------|-------|-------------|
| L4 | BPL | ERP/CRM | ISA-95 Part 4 · B2MML | FIN · COM · ENG · QMS-L4 · CST · RSH |
| L3 | MOM | MES | MESA-11 (11 funcoes) | PRD · QMS · MNT · PER · DOC · INV |
| L2 | SUP | SCADA | IEC 62443 | Portal Producao · Qualidade · Manutencao |
| L1 | SEN | PLC/Sensores | IEC 61131 · EN 17637 | Fotos · GSR · Inspeccao · Dimensional |
| L0 | PHY | Maquinas | EN 1090 · EN 3834 · EN 12642 | Bodor · Weinig · Soldadura · Pintura |

**Personas (abaixo do nucleo):** Luisa→Duarte · Marta→Dealers · Fernando→Workers · Carolina→Workers

---

## Numeros
- **Tabelas:** 30 · **Migrations:** 17 · **Tools:** 20 · **ADRs:** 25 · **Recibos:** 45 · **Obras:** 6

---

## MESA-11 Checklist (L3-MES)

| # | Funcao | Estado |
|---|--------|--------|
| 1 | Production Scheduling | ⚠️ PARCIAL |
| 2 | Production Dispatching | ⚠️ PARCIAL |
| 3 | Production Execution | ⚠️ PARCIAL |
| 4 | Production Tracking | ✅ SIM |
| 5 | Performance Analysis | ❌ NAO |
| 6 | Quality Management | ⚠️ PARCIAL |
| 7 | Maintenance Management | ❌ NAO |
| 8 | Resource Management | ⚠️ PARCIAL |
| 9 | Document Management | ✅ SIM |
| 10 | Data Collection | ⚠️ PARCIAL |
| 11 | Process Management | ❌ NAO |

**Score:** 2 completas · 6 parciais · 3 em falta

---

## Conformidade ISA-95

| Parte IEC 62264 | Req. | Conf. | Parcial | N/Conf. |
|-----------------|------|-------|---------|---------|
| Parte 1 — Modelos | 6 | 3 | 1 | 2 |
| Parte 2 — Objectos | 8 | 2 | 2 | 4 |
| Parte 3 — MOM | 10 | 2 | 3 | 5 |
| Parte 4 — Integracao | 4 | 3 | 1 | 0 |
| **TOTAL** | **28** | **10 (36%)** | **7 (25%)** | **11 (39%)** |

---

## Codificacao: CSN-L[nivel]-[seccao]-[seq]-[ano]

PRD (Production) · QMS (Quality) · MNT (Maintenance) · INV (Inventory) · PER (Personnel) · EQP (Equipment) · MAT (Material) · FIN (Financial) · DOC (Documents) · RH (HR) · COM (Commercial) · ENG (Engineering)

---

## Sessao 26

- **P1 ✅** InvoiceXpress testado (L4-FIN) — Vesauto NIF 501316272, 2100€+IVA
- **P2 ✅** Migration 016 (L4-FIN) — fornecedores + movimentos_bancarios + IBAN
- **P3 ✅** 5 Carolina tools (L3-RH) — recibos, ferias, saldo, dados, resumo

## Commits: 15e5c01 · ff60961 · 930a94e · f008f32

---

## Pendentes por nivel

### L0-PHY
- [ ] Qualificacao soldadores EN 9606-1 → CSN-L0-PER-xxx
- [ ] Qualificacao WPS EN 15614-1 → CSN-L0-PRD-xxx

### L1-SEN
- [ ] Checklist GSR → CSN-L1-QMS-xxx
- [ ] Inspeccao visual EN 17637 → CSN-L1-QMS-xxx

### L2-SUP
- [ ] Portal Producao Sr. Manuel → CSN-L2-PRD-PRT
- [ ] Agente Qualidade → CSN-L2-QMS-AGT
- [ ] Agente Manutencao → CSN-L2-MNT-AGT

### L3-MOM
- [ ] Agente RH 11o agente → CSN-L3-RH-AGT
- [ ] Pipeline documental → CSN-L3-DOC
- [ ] Tabela materiais + lotes → CSN-L3-MAT

### L4-BPL
- [ ] Apagar fatura duplicada IX 253708521
- [ ] Remover CEGID_VENDUS_API_KEY
- [ ] NIF na tabela leads → CSN-L4-COM
- [ ] BPI ingestion → CSN-L4-FIN
- [ ] COC Electronico IMT jul/2026 → CSN-L4-DOC
- [ ] Dashboards por departamento → CSN-L4-ENG
