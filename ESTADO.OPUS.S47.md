# ESTADO OPUS — Sessão S47 (FECHADA)

**Data:** 09/04/2026  
**HEAD:** de321ea  
**Deploy:** csn-producao.vercel.app  
**Sequência:** S40→S41→S44→S46→S47→**S48 (activa)**

---

## Métricas do Sistema

| Métrica | Valor |
|---------|-------|
| Tabelas | ~79 |
| Migrations | ~55 |
| Agentes (C3) | 11 |
| Personas (C2) | 5 |
| Skills | 236 (127 comunidade + 109 custom) |
| ADRs | 27 |
| KPIs ISO 22400 calculáveis | 11 de 38 |
| ENUMs | 3 (agent_name, session_status, event_type) |
| RPCs | 4 (wake_session, emit_event, sleep_session, get_events) |
| Equipamentos | 10 registados |
| Potencial produção | 5.208h/ano |

---

## Trabalho Realizado S47

### Agente Documental (L3-DOC)
- 4 routes DOC operacionais
- Rota `/api/documentos/processar-ies` — extrai dados IES via Claude API
- IES 2024 inserida: €435k vendas, RL €59k, CP €157k

### Custos e Financeiro
- Custo/hora por colaborador: Bohdan €11.16, João €12.89, José €10.68
- Custos fixos: €112.631/ano = €64.89/h fábrica (1.736h úteis)
- Tabela `custos_fixos` + `contratos` criadas

### Agent Session Log (Anthropic Managed Agents)
- Tabelas `agent_sessions` + `agent_events`
- 3 ENUMs: agent_name, session_status, event_type
- 4 RPCs: wake_session(), emit_event(), sleep_session(), get_events()
- Padrão: cada route API faz wake→emit→sleep

### Novas Tabelas S47
- demonstracao_resultados, ies_declaracoes
- agent_sessions, agent_events
- cartao_unico
- lotes_pre_producao, consumos_pre_producao
- equipamentos, manutencao
- potencial_producao, ajustes_potencial
- custos_fixos, contratos
- nao_conformidades (S46)

### KPIs ISO 22400 — 11 Calculáveis
1. Worker Efficiency (por colaborador)
2. Production Time (por obra)
3. Throughput (obras/mês)
4. Process Ratio
5. Schedule Attainment
6. On-Time Delivery
7. Production Cost per Unit (custos_fixos + custo_hora)
8. Allocation Ratio
9. Utilization Efficiency
10. Setup Ratio
11. Quality Ratio (via nao_conformidades)

**Estruturalmente prontos (faltam registos):** 4 MNT (MTBF, MTTR, availability, corrective maintenance ratio)  
**Dependem smart meter Bodor:** 4 energia (35–38)

---

## Pendente S48

1. **Gerar 7 docs fecho S47** (não foram gerados)
2. Testar processar-ies com IES 2023
3. Worker portal deploy (page.tsx criado, não committed)
4. Ligar wake/emit/sleep a todas as routes
5. Gate docs lead→obra (DAV+FAM novos, Cartão Único usados)
6. Mudar password csnopusprod@gmail.com (comprometida)
7. IES 2023 via processar-ies
8. Delete invoice duplicado InvoiceXpress 253708521
9. Cancelar subscrição Vendus

---

## Stack

| Componente | Tecnologia |
|------------|------------|
| Frontend | Next.js 14 + TypeScript + Tailwind |
| Backend | Supabase (oysfxhlzilazeznpaafc) |
| AI | Claude API (Haiku router, Opus complex) |
| Deploy | Vercel |
| Facturação | InvoiceXpress (cert AT 192) |
| Repo | duartebustorff-star/csn-producao |

---

## Colaboradores

| Nome | PIN | Custo/hora |
|------|-----|------------|
| Bohdan | 1001 | €11.16 |
| José Júlio | 1002 | €10.68 |
| João António | 1003 | €12.89 |
| Duarte (admin) | 1234 | — |

---

## Certificações Alvo (PRR/PT2030)

ISO 9001 + ISO 14001 + ISO 45001 (trio PRR)  
EN 1090 + EN ISO 3834 + EN 12642 (produção)

## Email Sistema

- Sistema: carrocariascsn@gmail.com (Calendar + Gmail Opus)
- Produção: csnopusprod@gmail.com (intake Ag. Documental) — **password comprometida**
- Pessoal Duarte: duarte.bustorff@gmail.com (separado)
