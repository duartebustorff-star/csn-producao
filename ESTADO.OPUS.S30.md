# CSN Opus — Estado do Sistema
### Codigo: CSN-L4-ENG-SYS-030-2026
### Produzido: 30/03/2026 (Lisboa)
### Sessao: 30

## Commit: pendente · Deploy: csn-producao.vercel.app
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
- **Tabelas:** 33 · **Migrations:** 19 · **Tools:** 20 · **ADRs:** 27 · **Recibos:** 45 · **Obras:** 6 (entregues) · **Agentes:** 11
- **e-Fatura:** 2615 registos (Nov23→Fev26) · **Fornecedores:** 184+ (15 producao)

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

## Sessao 30 — 30/03/2026

### ✅ Tabela e-fatura (Migration 018)
- Tabela `efatura` criada com match por ATCUD + numero_fatura
- 2615 faturas ingeridas: Nov 2023 → Fev 2026 (26 ficheiros CSV)
- Estado documento: pendente/documentado/entregue_contabilidade/dispensado
- Chave de documento: ATCUD (codigo AT unico)

### ✅ Tabela fornecedores populada
- 184+ fornecedores inseridos do e-fatura
- 15 classificados como producao (L0-MAT/L0-EQP)
- Unique constraint no NIF, colunas categoria + nivel_isa95 adicionadas
- Match 100% efatura ↔ fornecedores via NIF

### ✅ Fornecedores producao classificados (15)
**L0-MAT:** Chagas (33.9K€), Polifer/Isidoro e Silva (6.2K€), Bielco (4.0K€), CBE Mat. Rodoviarios (4.0K€), Acail Gas (3.7K€), Multiplacas (3.1K€), Joeltos (2.5K€), Pecol (1.7K€), Silfesan (987€), Mecanizados Rodriguez (563€), Coprial (520€), Madeicentro (10.4K€), Bezares (908€)
**L0-EQP:** Dhollandia (12.8K€, plataformas elevatorias), Dom Carro (10.1K€, equipamento frio)

### ✅ Dossier Bodor Laser completo
- Fatura comercial Bodor PI20250219799 (60.000€ DAP)
- Bill of Lading TNAA08232 (HMM Algeciras, Qingdao→Lisboa)
- 4 faturas DHL matched no e-fatura via ATCUD:
  - TXI 25S/08744 (17.136€, anulada) — PDF ✅
  - TXI 25S/08745 (799,50€, armazenagem) — PDF ✅
  - TCR 25S/00542 (-17.136€, nota credito) — PDF ✅
  - TXI 25S/12670 (17.136€, corrigida) — PDF ✅
- Custo total: 60.000€ + 17.136€ + 799,50€ = 77.936€

### ✅ Infraestrutura portais (Migration 019)
- pin_portal + portal_activo em colaboradores_rh
- Tabela registos_ponto (entrada/saida por obra e fase)
- Tabela qualificacoes (EN 9606, equipamento, fases habilitadas)
- PINs iniciais: Bohdan=1001, Jose Julio=1002, Joao Antonio=1003

### ✅ Skills agentes criados (6 novos)
**Agente RH (→ Carolina):**
- SKILL_RECIBOS (CSN-L3-RH-SKL-001) — servir recibos por PIN
- SKILL_FERIAS (CSN-L3-RH-SKL-002) — saldo, pedidos, aprovacoes
- SKILL_DADOS_PESSOAIS (CSN-L3-RH-SKL-003) — perfil mascarado

**Agente Producao (→ Fernando):**
- SKILL_PONTO (CSN-L3-PRD-SKL-001) — entrada/saida por obra e fase
- SKILL_OBRA_ACTIVA (CSN-L3-PRD-SKL-002) — estado obras, progresso

**Agente Qualidade (→ Fernando):**
- SKILL_QUALIFICACOES (CSN-L3-QMS-SKL-001) — EN 9606, equipamento, alertas

### ✅ Ranking fornecedores Excel
- CSN-Fornecedores-2025-Ranking.xlsx gerado
- 179 fornecedores, 1237 faturas, 279.992€ total 2025
- Producao: 38.3% (107.373€)

### ✅ Descoberta: APIs ja existentes
- `/api/timer` — ja faz start/stop por obra/fase/colaborador (tabela timetracking)
- `/api/obras` — lista obras com fases e estado
- `/api/rh/recibo` — gera PDF recibo completo
- Falta: autenticacao PIN + pagina trabalhador + chat Fernando

## Commits sessao 30: skills commitados (agente-rh, agente-producao, agente-qualidade + index)

---

## Pendentes sessao 31

### PRIORITARIO — Portal trabalhador
- [ ] API `/api/auth/pin` — autenticacao por PIN
- [ ] Pagina trabalhador mobile-first (botoes entrada/saida que usam /api/timer existente)
- [ ] Chat Fernando — interface conversa com acesso a APIs existentes
- [ ] Clarificar: registos_ponto vs timetracking (possivel redundancia)

### PRIORITARIO — Ciclo obra
- [ ] Tabela requisicoes + inserir NE897289/NE897290
- [ ] Facturacao Vesauto: 2 facturas × 6300€+IVA
- [ ] Fecho ciclo: F9 → COC → DoP → factura → dossier
- [ ] Tabela e-fatura compliance AT (2022-2023 restantes)

### L3-DOC — Skills pendentes
- [ ] SKILL_EFATURA (SKL-101) — ingestao CSV AT + match ATCUD
- [ ] SKILL_DHL (SKL-006) — transitario/importacao
- [ ] Skills Bielco, Silfesan, Dhollandia, Dom Carro, CBE, Multiplacas, Mecanizados Rodriguez, Bezares, Acail, Joeltos
- [ ] Skills por categoria: SKILL_COMBUSTIVEL, SKILL_PORTAGEM, SKILL_SEGUROS

### L3-RH
- [ ] Tabela ferias (definida no SKILL_FERIAS, nao criada)
- [ ] Nome correcto Bohdan + datas admissao 3 colaboradores
- [ ] Processamento Abril 2026

### L0-PER (Bloco B)
- [ ] Popular tabela qualificacoes com dados reais EN 9606
- [ ] Separacao colaboradores vs colaboradores_rh

### INFRA
- [ ] Apagar fatura IX 253708521
- [ ] Cancelar Vendus
- [ ] Docs fecho sessao 30 (PDF controlo + HTML arquitectura)
- [ ] ADR-028 (Agente Producao) + ADR-029 (Agente Qualidade)
- [ ] Deploy apos commit

---

## Dados de referencia
- **Vesauto NIF:** 501316272
- **Entreposto NIF:** 501410171
- **Colaboradores:** Bohdan (id=1, PIN 1001), Jose Julio (id=2, PIN 1002), Joao Antonio (id=3, PIN 1003)
- **InvoiceXpress:** carlosdossantosna, cert AT 192
- **Repo:** duartebustorff-star/csn-producao
- **Local:** C:\Users\Utilizador\Projectos-AI\csn-producao
- **Email repo:** C:\Users\Utilizador\Desktop\Extratos\CSN-Email-Repositorio
- **Bodor Laser:** PI20250219799, 60.000€, SHPR REF 6500145419, BL TNAA08232
