# CSN Opus — Estado do Sistema
## Sessão 33 | 31 Março 2026

**Código interno:** CSN-L3-DOC-033-2026
**Último commit:** `7a7e5c7` (endpoint /api/kpis/worker)
**Deploy:** csn-producao.vercel.app
**Repo:** duartebustorff-star/csn-producao

---

## DECISÕES ARQUITECTURAIS DA SESSÃO 33

### DECISÃO 1: Obras Internas (Manutenção/Limpeza/Formação)

Criadas 4 obras permanentes com `tipo = 'interna'` para registar trabalho quando não há produção:

| ID | Descrição | Fase |
|---|---|---|
| MNT-001 | Manutenção equipamentos (Bodor, ferramentas, jigs) | em_curso |
| MNT-002 | Limpeza geral (pavilhão, zona soldadura, pintura) | em_curso |
| MNT-003 | Organização (stock, materiais, ferramentas) | em_curso |
| MNT-004 | Formação e instruções de trabalho | em_curso |

**Princípio:** Limpeza e manutenção fazem parte total do processo produtivo. Não são tempo morto — são trabalho produtivo que cumpre ISO 9001 (ambiente de trabalho controlado), EN 1090 (manutenção documentada), e ISO 22400 (Allocation Efficiency = tempo trabalhado / tempo disponível).

Coluna `tipo` adicionada à tabela `obras`: `'producao'` (default) ou `'interna'`.
MESA-11 função 9 (Maintenance Management) passa de NÃO para PARCIAL.

### DECISÃO 2: Conta Corrente por IBAN

Modelo de conta corrente: cruzamento de `recibos_vencimento.liquido` (empresa deve) com `movimentos_bancarios` filtrados pelo IBAN de cada trabalhador (empresa pagou). Match por IBAN na descrição da transferência bancária.

Validação desde Jan 2025:
- Bohdan: recibos €15.700,96, pago €15.261,23, saldo €439,73
- José Júlio: recibos €14.495,71, pago €13.602,79, saldo €892,92
- João António: recibos €16.785,45, pago €16.526,13, saldo €259,32

Saldos positivos = último mês por pagar ou timing transferência. Dados coerentes.

---

## COMMITS DA SESSÃO 33

| # | Hash | Descrição |
|---|---|---|
| 1 | `afe0ede` | Duas Portas — ModeSelector + workerMode + BottomNav por modo |
| 2 | `7a7e5c7` | Endpoint /api/kpis/worker — 6 KPIs ISO 22400 + obras internas MNT |

---

## ALTERAÇÕES EM BASE DE DADOS (sem migration file)

| Alteração | Tipo | Detalhe |
|---|---|---|
| `obras.tipo` | ALTER TABLE | Coluna text NOT NULL DEFAULT 'producao' |
| 4 obras internas | INSERT | MNT-001 a MNT-004, tipo='interna' |
| 4 fases_obra | INSERT | 1 fase por obra interna, estado='em_curso' |
| 2.153 movimentos | INSERT | Extrato BPI Jan 2023 – Fev 2026 em movimentos_bancarios |
| IBANs trabalhadores | UPDATE | Bohdan, José Júlio, João António em colaboradores_rh |
| 3 CITs José Júlio | INSERT | 16/02→08/03/2026, 21 dias baixa contínua |
| CITs falsos Duarte | DELETE | ids 1, 2, 3 apagados |

---

## ESTADO DOS COMPONENTES

### Portal Trabalhador — Duas Portas
- ModeSelector: ecrã pós-login com 2 botões (Produção grande, Pessoal com re-auth PIN) ✔
- page.tsx: workerMode state, sidebar e views adaptam por modo ✔
- BottomNav: 3 conjuntos de tabs (admin 6 / produção 3 / pessoal 2) ✔
- Badge mobile "← mudar" para voltar ao selector ✔
- Admin (Duarte) não vê ModeSelector — fluxo inalterado ✔

### KPIs ISO 22400
- Endpoint `/api/kpis/worker?colaborador_id=X` live ✔
- 6 KPIs: Worker Efficiency, Horas Semana, Horas Mês, Throughput Semana, Throughput Mês, Allocation Efficiency ✔
- Obra actual com progresso (% fases) ✔
- Testado: Bohdan retorna throughput_mes=6 (6 fases concluídas Março) ✔

### Login e Auth
- LoginScreen: ainda versão antiga com nomes hardcoded — BUG pendente
- Auth/pin: funcional via `/api/auth/pin` ✔

### Movimentos Bancários
- 2.153 movimentos BPI importados (Jan 2023 → Fev 2026) ✔
- 103 pagamentos a trabalhadores identificados por IBAN ✔
- IBANs: Bohdan PT50534054241401140900184, José Júlio PT50001000005876211000168, João António PT50004554444037581089412 ✔

### CITs
- José Júlio: 3 CITs (16/02→20/02 inicial + 21/02→27/02 prorrogação + 28/02→08/03 prorrogação) = 21 dias ✔
- CITs falsos do Duarte apagados ✔

---

## NÚMEROS DO SISTEMA

| Recurso | Quantidade |
|---|---|
| Tabelas Supabase | 33 |
| Migrations (files) | 19 |
| Tools/Routes API | 25 |
| ADRs | 27 |
| Skills documentadas | 13 (4 agentes) |
| Movimentos bancários | 2.153 |
| E-fatura registos | 3.928 (50 meses, €1.304.578) |
| Recibos processados | 45 (3 trabalhadores, Jan 2025–Mar 2026) |
| Colaboradores | 4 (3 operadores + 1 admin) |
| Obras produção | 6 (todas entregues) |
| Obras internas | 4 (MNT-001 a MNT-004) |
| CITs | 3 (José Júlio, 21 dias) |
| Commits S33 | 2 |

---

## PENDENTE SESSÃO 34

### PRIORIDADE — Dashboard Worker (frontend)
- [ ] Componente WorkerDashboard com gauge eficiência + barras throughput + progresso obra
- [ ] Integrar no Modo Produção (consome /api/kpis/worker)
- [ ] Obras internas visíveis no portal (MNT-001 a MNT-004)
- [ ] Timer funcional nas obras internas

### PRIORIDADE — Conta Corrente (frontend)
- [ ] Endpoint /api/rh/conta-corrente (recibos vs pagamentos por IBAN)
- [ ] Vista no Modo Pessoal com saldo e histórico mensal
- [ ] Processamento recibos 2023-2024 (para fechar período completo)

### PRIORIDADE — DocumentosView por Modo
- [ ] Modo Produção: manuais, procedimentos, checklists qualidade
- [ ] Modo Pessoal: documentos pessoais (contrato, certificados)
- [ ] Manual de montagem dentro de cada obra (fotos/vídeos por fase)

### Pendentes herdados
- [ ] LoginScreen: nomes da DB (não hardcoded) — BUG
- [ ] Apagar src/app/portal/ duplicado
- [ ] ADR-028 (Portal Trabalhador) + ADR-029 (ISO 22400 KPIs)
- [ ] Ciclo obra: requisições + faturação Vesauto
- [ ] Skills: Bielco, Silfesan, Dhollandia
- [ ] Architecture HTML (pendente desde S27)
- [ ] Importação INDICE_v4 emails (18.169 registos — tabela emails_indice por criar)
- [ ] CIT José Júlio → criar ausência associada

---

## QUADRO CENTRAL — NORMAS GOVERNANTES POR NÍVEL ISA-95

| Nível | Sigla | Normas Governantes |
|-------|-------|--------------------|
| L4 | BPL | ISA-95 Part 4 / B2MML · **ISO 9001** (qualidade) · **ISO 14001** (ambiente) · ISO 31000 (risco) |
| L3 | MOM | MESA-11 · **ISO 22400** (34 KPIs MOM) · **ISO 45001** (segurança trabalho) · ISO 55001 (activos) |
| L2 | SUP | IEC 62443 (cibersegurança) · **ISO 50001** (energia — Bodor 60kW) |
| L1 | SEN | IEC 61131 · EN 17637 (inspecção visual soldadura) |
| L0 | PHY | EN 1090 (estruturas aço) · EN ISO 3834 (soldadura) · EN 12642 (resist. estrutural) |

**Trio certificação PRR/Portugal 2030:** ISO 9001 + ISO 14001 + ISO 45001
**Norma KPIs produção:** ISO 22400-1:2014 + ISO 22400-2:2014 (34 KPIs + 4 energia)

---

## ISA-95 — TABELA DE CONFORMIDADE

| Nível | Módulo | Estado |
|---|---|---|
| L4-BPL | FIN (faturação InvoiceXpress) | OPERACIONAL |
| L4-BPL | COM (leads + Marta) | OPERACIONAL |
| L4-BPL | ENG (DAVs, FAMs, homologação) | OPERACIONAL |
| L3-MOM | PRD (obras, fases, templates) | OPERACIONAL |
| L3-MOM | QMS (inspecções) | PARCIAL |
| L3-MOM | MNT (manutenção) | **PARCIAL** ← era NÃO |
| L3-MOM | PER (timetracking, timer, KPIs) | OPERACIONAL |
| L3-MOM | DOC (Agente Documental, 5 skills) | OPERACIONAL |
| L3-MOM | INV (e-fatura 3928 + mov. bancários 2153) | OPERACIONAL |
| L3-RH | Recibos, CITs, ausências, conta corrente | OPERACIONAL |
| L0-PER | Perfis produção (Fernando) | PLANEADO |
| L2-SUP | SCADA | FUTURO |
| L1-SEN | Sensores Bodor | FUTURO |
| L0-PHY | Bodor laser, Weinig | ACTIVO |

---

## MESA-11 — ESTADO DE CONFORMIDADE

| Função MESA | Estado | Notas |
|---|---|---|
| 1. Resource Allocation | PARCIAL | colaboradores + obras + obras internas |
| 2. Operations/Detail Scheduling | PARCIAL | fases_obra com estimativas |
| 3. Dispatching Production | PARCIAL | timer + atribuição |
| 4. Document Control | COMPLETO | Agente Documental + skills |
| 5. Data Collection/Acquisition | PARCIAL | timetracking + e-fatura + mov. bancários |
| 6. Labor Management | COMPLETO | recibos + CITs + ausências + conta corrente |
| 7. Quality Management | PARCIAL | inspecções |
| 8. Process Management | PARCIAL | 9 fases template + obras internas |
| 9. Maintenance Management | **PARCIAL** | MNT-001 a MNT-004 criadas ← era NÃO |
| 10. Product Tracking | PARCIAL | VIN + estados obra |
| 11. Performance Analysis | PARCIAL | ISO 22400 endpoint live, 6 KPIs |

**Score:** 2 completos, **9 parciais** ← era 7, **0 em falta** ← era 2

---

*Gerado: 31/03/2026 00:15 | Sessão 33 | CSN-L3-DOC-033-2026*
