# CSN Opus — Estado do Sistema
### Codigo: CSN-L4-ENG-SYS-027-2026
### Produzido: 28/03/2026 16:10 (Lisboa)
### Sessao: 27

## Commit: a54d459 · Deploy: csn-producao.vercel.app
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

## Fornecedores de producao (sessao 27)

| Fornecedor | Material | ISA-95 | Email |
|-----------|----------|--------|-------|
| Chagas | Aco, tubos, perfis, aluminio | L0-MAT | chagas.pt |
| Coprial | Gases soldadura (O2, H2, Arco 15) + equipamentos | L0-MAT + L0-EQP | coprial.pt |
| Polifer | Tinta | L0-MAT | — |
| Pecol | Parafusos, colas, silicone, fio solda, consumiveis | L0-MAT | pecol.pt |
| Madeicentro | Madeira / taipais | L0-MAT | — |

---

## Sessao 27 — 28/03/2026

### ✅ Limpeza Vercel
- CEGID_VENDUS_API_KEY removida
- Name/Value removidas — 6 vars limpas

### ✅ ADR-026
- Auditoria ISA-95 dos 25 ADRs
- 13 alinhados · 5 reclassificar · 4 supersedidos · 3 novo ADR
- INDEX.md actualizado

### ✅ Cowork Email Ingestion
- 660 emails Jan-Mar 2026 em PDF
- 994 registos INDICE.xlsx
- 65 leads re-mapeadas
- Tarefa semanal CSN-L3-DOC-TSK-001-2026 criada
- 2025 em curso (Dez feito, Nov-Jan a processar)

### ✅ Mapeamento fornecedores
- 5 fornecedores producao identificados

## Commits: a54d459

---

## Pendentes sessao 28

### PRIORITARIO
- [ ] Migration 017 — materiais + lotes + consumos (MESA #11)
- [ ] Skills Agente Documental por fornecedor (5)
- [ ] Tools Agente Documental (classificar, associar, registar)

### L0-PHY
- [ ] Qualificacao soldadores EN 9606-1
- [ ] Qualificacao WPS EN 15614-1

### L2-SUP
- [ ] Portal Producao Sr. Manuel

### L3-MOM
- [ ] Agente RH 11o agente
- [ ] Pipeline documental end-to-end

### L4-BPL
- [ ] Apagar fatura IX 253708521
- [ ] Cancelar Vendus
- [ ] BPI ingestion · COC Electronico · Dashboards · KPIs

---

## Dados de referencia
- **Vesauto NIF:** 501316272
- **Colaboradores:** Bohdan (id=1), Jose Julio (id=2), Joao Antonio (id=3)
- **InvoiceXpress:** carlosdossantosna, cert AT 192
- **Repo:** duartebustorff-star/csn-producao
- **Local:** C:\Users\Utilizador\Projectos-AI\csn-producao
- **Email repo:** C:\Users\Utilizador\Extratos\CSN-Email-Repositorio
