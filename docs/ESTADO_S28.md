# CSN Opus — Estado do Sistema
### Codigo: CSN-L4-ENG-SYS-028-2026
### Produzido: 29/03/2026 00:30 (Lisboa)
### Sessao: 28

## Commit: 32644b0 · Deploy: csn-producao.vercel.app
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
- **Tabelas:** 30 · **Migrations:** 17 · **Tools:** 20 · **ADRs:** 26 · **Recibos:** 45 · **Obras:** 6

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

## Conformidade ISA-95: 28 req — 10 (36%) conf · 7 (25%) parcial · 11 (39%) n/conf

---

## Codificacao: CSN-L[nivel]-[seccao]-[seq]-[ano]

PRD · QMS · MNT · INV · PER · EQP · MAT · FIN · DOC · RH · COM · ENG

---

## Fornecedores de producao (8 mapeados)

| Fornecedor | Material | ISA-95 | Email | Skill |
|-----------|----------|--------|-------|-------|
| Chagas | Aco, tubos, perfis, aluminio | L0-MAT | chagas.pt | ✅ |
| Coprial | Gases soldadura (O2, H2, Arco 15) + equip | L0-MAT + L0-EQP | coprial.pt | ✅ |
| Polifer | Tinta | L0-MAT | polifer.pt | ✅ |
| Pecol | Parafusos, colas, fio solda, consumiveis | L0-MAT | pecol.pt | ✅ |
| Madeicentro | Madeira / taipais | L0-MAT | madeicentro.pt | ✅ |
| Bielco | Aluminio, reguas, taipais alu | L0-MAT | bielco.pt | pendente |
| Silfesan | Corte laser, subcontratacao | L0-MAT | silfesan.pt | pendente |
| Publispeed | Chapas impressas aluminio | L0-MAT | publispeed.com | pendente |

---

## Repositorio documental email

| Conta | Estado | Registos |
|-------|--------|----------|
| geral@carrocariascsn.pt | ✅ Completo Ago23-Mar26 | 18169 (INDICE_v3) |
| comercial@carrocariascsn.pt | ❌ Sem mailbox | 0 |
| adm@carrocariascsn.pt | ❌ Sem mailbox | 0 |
| carlos.snascimento@sapo.pt | ⚠️ Em curso (Cowork) | ~1950+ |
| duarte.bustorff@gmail.com | Pendente (pessoal) | — |

**Email repo:** C:\Users\Utilizador\Desktop\Extratos\CSN-Email-Repositorio
**INDICE_v3:** 18169 registos, 11547 PDFs, 1155 fornecedores, 8 categorias

---

## Skills Agente Documental

| Ficheiro | Camada | Codigo |
|----------|--------|--------|
| SKILL_GERAL.md | 1 — Classifier | CSN-L3-DOC-SKL-000-2026 |
| SKILL_CHAGAS.md | 2 — Fornecedor | CSN-L3-DOC-SKL-001-2026 |
| SKILL_COPRIAL.md | 2 — Fornecedor | CSN-L3-DOC-SKL-002-2026 |
| SKILL_PECOL.md | 2 — Fornecedor | CSN-L3-DOC-SKL-003-2026 |
| SKILL_POLIFER.md | 2 — Fornecedor | CSN-L3-DOC-SKL-004-2026 |
| SKILL_MADEICENTRO.md | 2 — Fornecedor | CSN-L3-DOC-SKL-005-2026 |
| SKILL_INDEX.md | Indice | — |

**Arquitectura:** Camada 1 (GERAL) classifica TODOS os docs. Se afecta stock → Camada 2 (FORNECEDOR) extrai materiais.

---

## Sessao 28 — 28-29/03/2026

### ✅ Skills Agente Documental
- 7 ficheiros: SKILL_GERAL + 5 fornecedores + INDEX
- Commit 507a590 (5 skills) + 32644b0 (GERAL)
- Arquitectura duas camadas definida

### ✅ Cowork Email Ingestion (completo)
- geral@ esgotado: Ago 2023 → Mar 2026
- 18169 registos, 11547 PDFs, 5717 anexos descarregados
- INDICE_v3 com coluna Categoria (8 categorias)
- Contas Outlook inactivas confirmadas (sem mailbox)
- Sapo em curso

### ✅ Mapeamento fornecedores expandido
- 8 fornecedores producao (5 com skill, 3 pendentes)
- 1155 fornecedores totais catalogados
- Top personalidades por categoria identificadas

## Commits: 507a590, 32644b0

---

## Pendentes sessao 29

### PRIORITARIO
- [ ] Migration 017 — materiais + lotes + consumos (MESA #11) — guiada por INDICE_v3
- [ ] Tools Agente Documental (classificar_documento, registar_documento, associar_obra)
- [ ] Skills Bielco + Silfesan + Publispeed

### L3-MOM
- [ ] Agente RH 11o agente
- [ ] Pipeline documental end-to-end
- [ ] Ingestao INDICE_v3 no Supabase

### L4-BPL
- [ ] Apagar fatura IX 253708521
- [ ] Cancelar Vendus
- [ ] BPI ingestion · COC Electronico · Dashboards · KPIs

### EMAIL ARCHIVING
- [ ] Sapo (carlos.snascimento@sapo.pt) — Cowork em curso
- [ ] Gmail pessoal (separar area pessoal)

---

## Dados de referencia
- **Vesauto NIF:** 501316272
- **Colaboradores:** Bohdan (id=1), Jose Julio (id=2), Joao Antonio (id=3)
- **InvoiceXpress:** carlosdossantosna, cert AT 192
- **Repo:** duartebustorff-star/csn-producao
- **Local:** C:\Users\Utilizador\Projectos-AI\csn-producao
- **Email repo:** C:\Users\Utilizador\Desktop\Extratos\CSN-Email-Repositorio
