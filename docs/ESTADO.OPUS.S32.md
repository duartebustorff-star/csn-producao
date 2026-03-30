# CSN Opus — Estado do Sistema
## Sessão 32 | 30 Março 2026

**Código interno:** CSN-L3-DOC-032-2026
**Último commit:** `53d7a6c` (fix: WorkerRHView simplificado)
**Deploy:** csn-producao.vercel.app
**Repo:** duartebustorff-star/csn-producao

---

## DECISÕES ARQUITECTURAIS DA SESSÃO 32

### DECISÃO 1: Arquitectura "Duas Portas" do Portal do Trabalhador

O portal do trabalhador separa-se em dois modos completamente independentes após o login:

**Fluxo:** Login PIN → Ecrã com 2 botões → Produção (grande, directo) ou Área Pessoal (pequeno, pede PIN outra vez)

**Modo Produção (contexto: trabalho)**
- Chat Fernando (só produção)
- Obras + fases + timer/ponto
- Documentos de produção (upload fotos, checklists)
- Dashboards KPIs produtividade (ISO 22400)
- Processos documentados / instruções de trabalho

**Modo Pessoal (contexto: privado, re-autenticação PIN)**
- Recibos de vencimento (agrupados por ano)
- Férias (pedir, ver saldo, calendário)
- Baixas/CITs (entrega via chat)
- Documentos pessoais (contrato, certificados)
- Dados pessoais (consulta)

**Benchmark:** Factorial HR (factorialhr.pt) — empresa Barcelona, ~$1B valuação, referência para portal self-service do colaborador. CSN adopta a mesma filosofia para o Modo Pessoal mas adiciona o Modo Produção que a Factorial não tem.

**Segurança:** A Área Pessoal exige re-autenticação (PIN outra vez) para proteger dados privados (recibos, dados pessoais). O Modo Produção é directo porque é contexto de trabalho.

### DECISÃO 2: ISO 22400 como norma de KPIs

**Norma adoptada:** ISO 22400-1:2014 + ISO 22400-2:2014
**Título:** Automation systems and integration — Key performance indicators (KPIs) for manufacturing operations management
**Escopo:** 34 KPIs padronizados para MOM (Manufacturing Operations Management), alinhados com ISA-95/IEC 62264.

**KPIs já calculáveis com dados existentes (timetracking + fases_obra):**

| KPI ISO 22400 | Fórmula CSN | Fonte dados | Estado |
|---|---|---|---|
| Worker Efficiency Ratio | horas_estimadas / horas_reais por fase | fases_obra | PRONTO |
| Actual Production Time | SUM(duracao_minutos) por colaborador | timetracking | PRONTO |
| Throughput Rate | fases concluídas / semana | fases_obra.completed_at | PRONTO |
| Production Process Ratio | tempo real obra / tempo estimado | fases_obra agregado | PRONTO |
| Schedule Attainment | obras entregues / planeadas | obras.estado | PRONTO |

**KPIs futuros (precisam de mais dados):**

| KPI ISO 22400 | Necessidade | Quando |
|---|---|---|
| Allocation Efficiency | % tempo em produção vs total disponível | Quando ponto geral existir |
| Setup Ratio | Tempo preparação (F1/F2) vs produção | Separar fases setup vs produção |
| OEE (Bodor laser) | Disponibilidade × Performance × Qualidade | L1 sensores |
| First Pass Yield | % fases sem retrabalho | Quando QMS registar retrabalho |
| Quality Ratio / Scrap Rate | Peças OK vs desperdiçadas | Quando controlo qualidade existir |

**Dashboard do worker (Modo Produção):**
- Gauge: eficiência pessoal (horas estimadas vs reais)
- Barras: fases concluídas por semana
- Barra progresso: obra actual (% fases concluídas)
- Horas do dia: timer activo com fase actual

**Princípio:** O Agente Produção (Camada 3 — núcleo) calcula os KPIs e gera os dashboards. Não é código estático — é o agente autónomo que decide o que mostrar conforme o contexto do colaborador.

**MESA-11 update:** Performance Analysis passa de NÃO para PARCIAL com a adopção da ISO 22400.
Score actual: 2 completos, 7 parciais, 2 em falta.

---

## COMMITS DA SESSÃO 32

| # | Hash | Descrição |
|---|---|---|
| 1 | `04a5491` | Login PIN-only (sem selecção nome), auth/pin com fallback admin |
| 2 | `525a8db` | Tab RH para workers — WorkerRHView + BottomNav + page.tsx |
| 3 | `88524c6` | Restaurar page.tsx principal com WorkerRHView e emojis |
| 4 | `53d7a6c` | WorkerRHView simplificado — só recibos sem valor + dados pessoais |

---

## ESTADO DOS COMPONENTES

### Login e Auth
- LoginScreen: PIN-only via `/api/auth/pin` ✓
- Auth/pin: tenta `colaboradores_rh.pin_portal`, fallback `colaboradores.pin` para admin ✓
- PINs: 1001=Bohdan, 1002=José Júlio, 1003=João António, 1234=Duarte (admin)
- **BUG:** LoginScreen.tsx em disco ainda mostra versão antiga com nomes hardcoded e `/api/auth` em vez de `/api/auth/pin`

### Page.tsx (app principal)
- Imports: LoginScreen, Header, BottomNav, ChatView, ObrasView, DashboardView, RHView, WorkerRHView, DocumentosView, LeadsView ✓
- Sidebar desktop: emojis funcionais (💬🏗️📋📂👤📊) ✓
- Worker vê WorkerRHView em vez de RHView ✓

### BottomNav
- Admin: chat, obras, leads, documentos, rh, dashboard (6 tabs) ✓
- Worker: chat, obras, documentos (3 tabs) — **BUG: falta "rh" para workers**
- Este bug torna-se irrelevante com a arquitectura "duas portas" da S33

### WorkerRHView (v2 — deployed)
- Recibos de vencimento (sem valor, clica para PDF) ✓
- Dados pessoais (nome, função, língua, estado) ✓
- Sem secção baixas (entrega é via chat) ✓
- **Pendente:** agrupar recibos por ano (v3 pronta mas não commitada)

### Ficheiros no repo a limpar
- `src/app/portal/` — duplicado, sem uso, apagar na S33

---

## NÚMEROS DO SISTEMA

| Recurso | Quantidade |
|---|---|
| Tabelas Supabase | 33 |
| Migrations | 19 |
| Tools/Routes API | 24 |
| ADRs | 27 |
| Skills documentadas | 13 (4 agentes) |
| E-fatura registos | 3.928 (50 meses, €1.304.578) |
| Recibos processados | 45 (3 trabalhadores, Jan 2025–Mar 2026) |
| Colaboradores | 4 (3 operadores + 1 admin) |
| Obras activas | 6 (todas entregues, facturação pendente) |
| Commits S32 | 4 |
| Storage bucket | documentos (private) |

---

## PENDENTE SESSÃO 33

### PRIORIDADE — Duas Portas
- [ ] Ecrã pós-login com 2 botões (Produção 3× maior, Pessoal pequeno)
- [ ] Re-autenticação PIN para Área Pessoal
- [ ] BottomNav separado por modo (Produção vs Pessoal)
- [ ] Recibos agrupados por ano (WorkerRHView v3)
- [ ] Apagar /portal duplicado
- [ ] Login: nomes da DB (não hardcoded)

### PRIORIDADE — ISO 22400 Dashboards
- [ ] Endpoint /api/kpis/worker — calcular Worker Efficiency, Throughput, horas
- [ ] Dashboard worker no Modo Produção (gauge + barras + progresso)
- [ ] Dashboard gestor com comparação entre workers
- [ ] ADR-028 (Portal Trabalhador)
- [ ] ADR-029 (ISO 22400 KPIs)

### PRIORIDADE — Ciclo obra
- [ ] Tabela requisições + inserir NE897289/NE897290
- [ ] Facturação Vesauto: 2 facturas × 6300€+IVA
- [ ] Fecho ciclo: F9 → COC → DoP → factura → dossier

### Outros pendentes
- [ ] Skills: Bielco, Silfesan, Dhollandia, SKILL_EFATURA, SKILL_DHL
- [ ] Nome correcto Bohdan + datas admissão
- [ ] Processamento Abril 2026
- [ ] Tabela férias
- [ ] Apagar factura IX 253708521 + cancelar Vendus
- [ ] Architecture HTML (pendente desde S27)
- [ ] PDF controlo (pendente desde S30)
- [ ] ESTADO.OPUS.S31 e S32 para commit

---

## QUADRO CENTRAL — NORMAS GOVERNANTES POR NIVEL ISA-95

| Nivel | Sigla | Normas Governantes |
|-------|-------|--------------------|
| L4 | BPL | ISA-95 Part 4 / B2MML · **ISO 9001** (qualidade) · **ISO 14001** (ambiente) · ISO 31000 (risco) |
| L3 | MOM | MESA-11 · **ISO 22400** (34 KPIs MOM) · **ISO 45001** (seguranca trabalho) · ISO 55001 (activos) |
| L2 | SUP | IEC 62443 (ciberseguranca) · **ISO 50001** (energia — Bodor 60kW) |
| L1 | SEN | IEC 61131 · EN 17637 (inspeccao visual soldadura) |
| L0 | PHY | EN 1090 (estruturas aco) · EN ISO 3834 (soldadura) · EN 12642 (resist. estrutural) |

**Trio certificacao PRR/Portugal 2030:** ISO 9001 + ISO 14001 + ISO 45001
**Norma KPIs producao:** ISO 22400-1:2014 + ISO 22400-2:2014 (34 KPIs + 4 energia)
**Norma KPIs energia:** ISO 50001 + ISO 22400 emenda 2017

---

## ISA-95 — TABELA DE CONFORMIDADE

| Nível | Módulo | Estado |
|---|---|---|
| L4-BPL | FIN (facturação InvoiceXpress) | OPERACIONAL |
| L4-BPL | COM (leads + Marta) | OPERACIONAL |
| L4-BPL | ENG (DAVs, FAMs, homologação) | OPERACIONAL |
| L3-MOM | PRD (obras, fases, templates) | OPERACIONAL |
| L3-MOM | QMS (inspeções) | PARCIAL |
| L3-MOM | MNT (manutenção) | PLANEADO |
| L3-MOM | PER (timetracking, timer) | OPERACIONAL |
| L3-MOM | DOC (Agente Documental, 5 skills) | OPERACIONAL |
| L3-MOM | INV (e-fatura 3928 registos) | OPERACIONAL |
| L3-RH | Recibos, CITs, ausências | OPERACIONAL |
| L0-PER | Perfis produção (Fernando) | PLANEADO |
| L2-SUP | SCADA | FUTURO |
| L1-SEN | Sensores Bodor | FUTURO |
| L0-PHY | Bodor laser, Weinig | ACTIVO |

---

## MESA-11 — ESTADO DE CONFORMIDADE

| Função MESA | Estado | Notas |
|---|---|---|
| 1. Resource Allocation | PARCIAL | colaboradores + obras |
| 2. Operations/Detail Scheduling | PARCIAL | fases_obra com estimativas |
| 3. Dispatching Production | PARCIAL | timer + atribuição |
| 4. Document Control | COMPLETO | Agente Documental + skills |
| 5. Data Collection/Acquisition | PARCIAL | timetracking + e-fatura |
| 6. Labor Management | COMPLETO | recibos + CITs + ausências |
| 7. Quality Management | PARCIAL | inspecções |
| 8. Process Management | PARCIAL | 9 fases template |
| 9. Maintenance Management | NÃO | planeado |
| 10. Product Tracking | PARCIAL | VIN + estados obra |
| 11. Performance Analysis | PARCIAL | ISO 22400 adoptada, dados existem |

**Score:** 2 completos, 7 parciais, 2 em falta

---

*Gerado: 30/03/2026 23:30 | Sessão 32 | CSN-L3-DOC-032-2026*
