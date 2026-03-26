# ADR-002 — Separação: AI Personas vs Autonomous Agents

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15
**Última actualização:** 26/03/2026

---

## Contexto

O sistema tinha agentes definidos por módulo funcional (Agente de Qualidade, Agente de Stock, etc.) sem distinção entre agentes que falam com humanos e agentes que trabalham em background. O Sr. Manuel acumulava responsabilidades de produção, comercial e documental. Não havia modelo mental claro para adicionar novos agentes.

## Decisão

Dois tipos de agentes completamente distintos:

**AI Personas — 6** — simulam humanos reais com nome, personalidade e avatar. São a face do sistema. Falam com humanos. Têm acesso controlado e definido.

| Persona | Nome | Âmbito | Nível ISA-95 | ADR |
|---|---|---|---|---|
| Assistente CEO | Luísa | Acesso total | Transversal | — |
| Chefe de Produção | Fernando | Workers + produção | Nível 3 MES | ADR-021 |
| Recursos Humanos | Carolina | RH + recibos + férias | Nível 4 ERP | ADR-020 |
| Agente Comercial | Marta | Clientes + CSN Connect | Nível 4 ERP | — |
| Aftersales | Leonor | Garantias + pós-entrega | Nível 4 ERP | — |
| Fornecedores | Irina | Compras + certificados | Nível 4 ERP | — |

**Autonomous Agents — 9** — trabalham em background sem persona. Nunca falam directamente com humanos. Executam tarefas, processam dados, tomam decisões dentro de regras.

| Agente | Função | Nível ISA-95 | ADR | Estado |
|---|---|---|---|---|
| Roteador | Recebe e distribui entradas | Transversal | — | ❌ |
| Documental | DAV/FAM/INSP/CIT → Termo | Nível 3 MES | — | ❌ |
| QMS | NC, inspecções, EN 1090 | Nível 3 MES | — | ❌ |
| Stock | FIFO, alertas, rastreabilidade | Nível 3 MES | ADR-007 | ❌ |
| Manutenção | Equipamentos, plano preventivo | Nível 3 MES | — | ❌ |
| KPIs | OEE, throughput, ISO 22400 | Transversal | — | ❌ |
| Compliance | Auditoria mensal automática | Transversal | ADR-006 | ❌ |
| Inteligência de Marcas | Guardião tabela marcas_veiculo | Nível 4 ERP | ADR-016 | ❌ |
| Research | Pesquisa técnica autónoma | Transversal | ADR-022 | ✅ Funcional |
| FEA | iLogic + Nastran + EN 12642 | Nível 3 MES | ADR-024 | ❌ |

## Razão

Um agente por tarefa seria dezenas de agentes fragmentados sem contexto partilhado. Um único agente para tudo perde foco em contextos longos. A separação Personas/Autónomos resolve ambos os problemas: as personas são especializadas por actor humano, os agentes autónomos são especializados por domínio funcional.

A segurança também melhora — as personas são buffers entre humanos e o sistema. Um cliente que fala com a Marta nunca acede directamente à base de dados.

## Consequências

- O Sr. Manuel é renomeado Fernando e ganha persona com personalidade definida (ADR-021)
- As suas tools são redistribuídas pelos agentes autónomos correctos
- Cada nova funcionalidade deve ser classificada primeiro: é uma Persona ou um Agente Autónomo?
- O fluxo é sempre: Humano → AI Persona → Autonomous Agent → Sistema
