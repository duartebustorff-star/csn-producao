# CSN Opus — Estado do Sistema
### Codigo: CSN-L4-ENG-SYS-029-2026
### Produzido: 30/03/2026 (Lisboa)
### Sessao: 29

## Commit: d9976da · Deploy: csn-producao.vercel.app
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
- **Tabelas:** 30 · **Migrations:** 17 · **Tools:** 20 · **ADRs:** 27 · **Recibos:** 45 · **Obras:** 6 (entregues) · **Agentes:** 11

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
| carlos.snascimento@sapo.pt — Inbox | ✅ Completo | 9211 |
| carlos.snascimento@sapo.pt — Recibos | ✅ Completo | 4 |
| carlos.snascimento@sapo.pt — Enviados | ✅ Completo (re-cat destinatario) | 1777 |
| comercial@carrocariascsn.pt | ❌ Sem mailbox | 0 |
| adm@carrocariascsn.pt | ❌ Sem mailbox | 0 |
| duarte.bustorff@gmail.com | ⚠️ Takeout pendente (62K emails) | ~62336 |

**Total arquivado:** 29161 emails (geral 18169 + sapo 10992)
**Email repo:** C:\Users\Utilizador\Desktop\Extratos\CSN-Email-Repositorio

---

## Skills Agente Documental — 3 Camadas

| Série | Camada | Ficheiro | Codigo | Estado |
|-------|--------|----------|--------|--------|
| 000 | 1 — Classifier | SKILL_GERAL.md | CSN-L3-DOC-SKL-000-2026 | ✅ |
| 100 | 1.5 — Tipo doc | SKILL_REQUISICAO.md | CSN-L3-DOC-SKL-100-2026 | ✅ |
| 001 | 2 — Fornecedor | SKILL_CHAGAS.md | CSN-L3-DOC-SKL-001-2026 | ✅ |
| 002 | 2 — Fornecedor | SKILL_COPRIAL.md | CSN-L3-DOC-SKL-002-2026 | ✅ |
| 003 | 2 — Fornecedor | SKILL_PECOL.md | CSN-L3-DOC-SKL-003-2026 | ✅ |
| 004 | 2 — Fornecedor | SKILL_POLIFER.md | CSN-L3-DOC-SKL-004-2026 | ✅ |
| 005 | 2 — Fornecedor | SKILL_MADEICENTRO.md | CSN-L3-DOC-SKL-005-2026 | ✅ |

**Numeracao:** 000=classifier, 1xx=tipos doc, 0xx=fornecedores, 2xx=clientes

---

## Obras — Grupo JAP / Renault Master

| Obra | VIN | Estado | Fases | Facturado |
|------|-----|--------|-------|-----------|
| L2026-001-01 | VF1RDB00075409005 | entregue | 9/9 | ❌ |
| L2026-001-02 | VF1RDB00175408929 | entregue | 9/9 | ❌ |
| L2026-001-03 | VF1RDB00475409010 | entregue | 9/9 | ❌ |
| L2026-001-04 | VF1RDB00875409009 | entregue | 9/9 | ❌ |
| L2026-001-05 | VF1RDB00675408926 | entregue | 9/9 | ❌ |
| L2026-001-06 | VF1RDB00175408932 | entregue | 9/9 | ❌ |

**NEs pendentes:** NE897290 (01-03, 6300€+IVA) + NE897289 (04-06, 6300€+IVA)
**Cliente:** Vesauto NIF 501316272

---

## Sessao 29 — 30/03/2026

### ✅ Documentacao sessao 28 corrigida
- ESTADO_S28.md criado (nova regra 4 docs fecho)
- ESTADO.md corrigido (estava com conteudo sessao 27)
- csn-architecture__27_.html gerada (commit e7ea497)

### ✅ Bloco A — RH fechado
- Recibos verificados: 45 completos, 0 lacunas (Jan25→Mar26)
- nivel_isa95 corrigido de "nivel4_erp" para "L0-PER" (3 colaboradores)
- ADR-027 commitado: Agente RH 11o agente autonomo (commit 640ef27)

### ✅ Bloco C — Ciclo obra actualizado
- 6 obras actualizadas para estado=entregue
- Todas as fases pendentes marcadas concluido
- Notas de encomenda Vesauto analisadas (NE897289/NE897290)
- Notas de encomenda Entreposto analisadas (2025010286986/2024040271286)

### ✅ Agente Documental evoluido
- SKILL_REQUISICAO.md (SKL-100) — reconhecimento de notas de encomenda
- SKILL_INDEX.md reestruturado — 3 camadas (000, 1xx, 0xx/2xx)
- INDEX.md ADRs actualizado — 25→27

### ✅ Email archiving
- SAPO completo: inbox 9211 + recibos 4 + enviados 1777 = 10992
- Enviados re-categorizados por destinatario
- Gmail conectado: 62336 emails, ~200 CSN
- INDICE_v3 e INDICE_SAPO analisados (categorias, tipos, fornecedores)

### ✅ Cowork tasks lancadas
- Limpeza INDICE_v4 (Spam + Contacto Normalizado + Email Pai)
- Re-categorizacao INDICE_SAPO_v2
- Extraccao Gmail (Takeout + limpeza)

## Commits: e7ea497, 640ef27, d9976da

---

## Pendentes sessao 30

### PRIORITARIO — Ciclo obra
- [ ] Tabela requisicoes + inserir NE897289/NE897290
- [ ] Facturacao Vesauto: 2 facturas × 6300€+IVA (precisa matriculas)
- [ ] Fecho ciclo: F9 → COC → DoP → factura → dossier
- [ ] Tabela e-fatura (2022–2026) — compliance AT

### L3-DOC
- [ ] SKILL_GRUPOJAP (Camada 2 cliente — Vesauto + Entreposto)
- [ ] Skills Bielco + Silfesan + Publispeed
- [ ] Tabela documentos (repositorio central)
- [ ] Migration 017 — materiais + lotes + consumos
- [ ] Tools Agente Documental (classificar, associar, registar)

### L3-RH
- [ ] Nome correcto Bohdan + datas admissao 3 colaboradores
- [ ] Processamento Abril 2026

### L0-PER (Bloco B — perfil producao)
- [ ] Tabela qualificacoes (EN 9606, fases habilitadas, equipamento)
- [ ] Separacao colaboradores vs colaboradores_rh

### EMAIL
- [ ] INDICE_v4 (Cowork — limpeza dados)
- [ ] Gmail Takeout + limpeza (Cowork)
- [ ] Ingestao indices no Supabase

### L4-BPL
- [ ] Apagar fatura IX 253708521
- [ ] Cancelar Vendus

---

## Dados de referencia
- **Vesauto NIF:** 501316272
- **Entreposto NIF:** 501410171
- **Colaboradores:** Bohdan (id=1), Jose Julio (id=2), Joao Antonio (id=3)
- **InvoiceXpress:** carlosdossantosna, cert AT 192
- **Repo:** duartebustorff-star/csn-producao
- **Local:** C:\Users\Utilizador\Projectos-AI\csn-producao
- **Email repo:** C:\Users\Utilizador\Desktop\Extratos\CSN-Email-Repositorio
