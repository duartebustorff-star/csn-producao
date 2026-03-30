# CSN Opus — Estado do Sistema
### Codigo: CSN-L4-ENG-SYS-031-2026
### Produzido: 30/03/2026 (Lisboa)
### Sessao: 31

## Commit: 5a7b9ef · Deploy: csn-producao.vercel.app
## Norma: ISA-95 / IEC 62264

---

## QUADRO CENTRAL — MODULOS OPUS POR NIVEL ISA-95

| Nivel | Sigla | Sistema | Norma | Modulos CSN |
|-------|-------|---------|-------|-------------|
| L4 | BPL | ERP/CRM | ISA-95 Part 4 · B2MML | FIN · COM · ENG · QMS-L4 · CST · RSH |
| L3 | MOM | MES | MESA-11 (11 funcoes) | PRD · QMS · MNT · PER · DOC · INV |
| L2 | SUP | SCADA | IEC 62443 | Portal Producao · Portal RH · Qualidade · Manutencao |
| L1 | SEN | PLC/Sensores | IEC 61131 · EN 17637 | Fotos · GSR · Inspeccao · Dimensional |
| L0 | PHY | Maquinas | EN 1090 · EN 3834 · EN 12642 | Bodor · Weinig · Soldadura · Pintura |

**Personas (abaixo do nucleo):** Luisa→Duarte · Marta→Dealers · Fernando→Workers · Carolina→Workers

---

## Numeros
- **Tabelas:** 33 · **Migrations:** 19 · **Tools:** 24 · **ADRs:** 27 · **Recibos:** 45 · **Obras:** 6 (entregues) · **Agentes:** 11
- **e-Fatura:** 3928 registos (Jan22→Fev26) · 50 meses · 1.304.578€ · **Fornecedores:** 184+ (15 producao)
- **Skills:** 13 (documental 7, RH 3, producao 2, qualidade 1)

---

## MESA-11 Checklist (L3-MES)

| # | Funcao | Estado |
|---|--------|--------|
| 1 | Production Scheduling | ⚠️ PARCIAL |
| 2 | Production Dispatching | ⚠️ PARCIAL |
| 3 | Production Execution | ⚠️ PARCIAL |
| 4 | Production Tracking | ✅ SIM (timer + portal) |
| 5 | Performance Analysis | ❌ NAO |
| 6 | Quality Management | ⚠️ PARCIAL |
| 7 | Maintenance Management | ❌ NAO |
| 8 | Resource Management | ⚠️ PARCIAL (portal RH) |
| 9 | Document Management | ✅ SIM |
| 10 | Data Collection | ⚠️ PARCIAL (portal ponto) |
| 11 | Process Management | ❌ NAO |

**Score:** 2 completas · 6 parciais · 3 em falta

---

## Conformidade ISA-95: 28 req — 10 (36%) conf · 7 (25%) parcial · 11 (39%) n/conf

---

## Codificacao: CSN-L[nivel]-[seccao]-[seq]-[ano]

PRD · QMS · MNT · INV · PER · EQP · MAT · FIN · DOC · RH · COM · ENG

---

## Sessao 31 — 30/03/2026

### ✅ Skills pendentes commitados (7 ficheiros)
- Agente RH: SKILL_RECIBOS, SKILL_FERIAS, SKILL_DADOS_PESSOAIS
- Agente Producao: SKILL_PONTO, SKILL_OBRA_ACTIVA
- Agente Qualidade: SKILL_QUALIFICACOES
- SKILLS_INDEX geral (13 skills, 4 agentes)
- Commit f552663

### ✅ E-fatura completo: Jan 2022 → Fev 2026
- 24 CSVs ingeridos (12 de 2023, 12 de 2022)
- Total: 3928 registos, 50 meses, 1.304.578€
- Constraint corrigida: UNIQUE(atcud, numero_fatura)
- ATCUDs sinteticos para faturas pre-2023 (ATCUD nao obrigatorio)
- Moises e Jesus: 19 faturas com ATCUD truncado JFKZ33MR — resolvido

### ✅ FK colaboradores_rh ↔ colaboradores
- Coluna colaborador_id (text) adicionada a colaboradores_rh
- Bohdan→bohdan, Jose Julio→jose, Joao Antonio→joao
- Permite auth por PIN unico com acesso a ambas as tabelas

### ✅ Portal trabalhador v2 — live em /portal
- Login por PIN (4 digitos): 1001=Bohdan, 1002=Jose Julio, 1003=Joao Antonio
- Duas portas separadas: Producao (laranja) + RH (azul)
- **Producao:** tab Ponto (timer entrada/saida por obra/fase) + tab Obras (progresso)
- **RH:** tab Recibos (lista + download PDF) + tab Baixas (upload CIT foto/PDF + historico) + tab Dados (perfil mascarado)
- Mobile-first + landscape support
- APIs: /api/auth/pin (POST), /api/rh/recibos-lista (GET), /api/cits/upload (POST), /api/cits/lista (GET)
- Usa APIs existentes: /api/timer, /api/obras
- Commits: 3c6b27c, a63faa3, 0403e53, 5a7b9ef

### ✅ Tab Baixas (CIT) na Carolina
- Upload foto/PDF do CIT via Supabase Storage (bucket documentos)
- Formulario: tipo (inicial/prorrogacao), data inicio, data fim, ficheiro
- Submissao cria CIT + ausencia automatica (pendente aprovacao)
- Historico de baixas visivel no portal
- APIs: /api/cits/upload (POST FormData), /api/cits/lista (GET)
- Commit 5a7b9ef

### ✅ Clarificacao registos_ponto vs timetracking
- timetracking ja faz tudo (associa tempo a obra + fase)
- registos_ponto redundante — nao popular, considerar DROP futuro

## Commits sessao 31: f552663, 3c6b27c, a63faa3, 0403e53, 5a7b9ef

---

## Pendentes sessao 32

### PRIORITARIO — Portal trabalhador (continuacao)
- [ ] Chat Fernando — interface conversa (agenda S30, adiado)

### PRIORITARIO — Ciclo obra
- [ ] Tabela requisicoes + inserir NE897289/NE897290
- [ ] Facturacao Vesauto: 2 facturas × 6300€+IVA
- [ ] Fecho ciclo: F9 → COC → DoP → factura → dossier

### L3-DOC — Skills pendentes
- [ ] SKILL_EFATURA (SKL-101) — ingestao CSV AT + match ATCUD
- [ ] SKILL_DHL (SKL-006) — transitario/importacao
- [ ] Skills Bielco, Silfesan, Dhollandia, Dom Carro, CBE, Multiplacas, etc.

### L3-RH
- [ ] Nome correcto Bohdan + datas admissao 3 colaboradores
- [ ] Processamento Abril 2026
- [ ] Tabela ferias (definida no SKILL_FERIAS, nao criada)

### L0-PER (Bloco B)
- [ ] Popular tabela qualificacoes com dados reais EN 9606
- [ ] Separacao colaboradores vs colaboradores_rh

### INFRA
- [ ] Apagar fatura IX 253708521
- [ ] Cancelar Vendus
- [ ] Docs fecho sessao 30 (PDF controlo + HTML arquitectura) — ficaram pendentes
- [ ] ADR-028 (Portal Trabalhador como sistema satelite)
- [ ] Deploy apos commit

---

## Dados de referencia
- **Vesauto NIF:** 501316272
- **Entreposto NIF:** 501410171
- **Colaboradores:** Bohdan (rh_id=1, colab_id=bohdan, PIN 1001), Jose Julio (rh_id=2, colab_id=jose, PIN 1002), Joao Antonio (rh_id=3, colab_id=joao, PIN 1003)
- **InvoiceXpress:** carlosdossantosna, cert AT 192
- **Repo:** duartebustorff-star/csn-producao
- **Local:** C:\Users\Utilizador\Projectos-AI\csn-producao
- **Email repo:** C:\Users\Utilizador\Desktop\Extratos\CSN-Email-Repositorio
- **Portal:** csn-producao.vercel.app/portal
- **Storage bucket:** documentos (privado)
