# ADR-002 — Separação: AI Personas vs Autonomous Agents

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

O sistema tinha agentes definidos por módulo funcional (Agente de Qualidade, Agente de Stock, etc.) sem distinção entre agentes que falam com humanos e agentes que trabalham em background. O Sr. Manuel acumulava responsabilidades de produção, comercial e documental. Não havia modelo mental claro para adicionar novos agentes.

## Decisão

Dois tipos de agentes completamente distintos:

**AI Personas** — simulam humanos reais com nome, personalidade e avatar. São a face do sistema. Falam com humanos. Têm acesso controlado e definido.

| Persona | Nome | Âmbito |
|---|---|---|
| Assistente CEO | Luísa | Acesso total |
| Chefe de Produção | Fernando | Workers + produção |
| Agente Comercial | Marta | Clientes + CSN Connect |
| Aftersales | Leonor | Garantias + pós-entrega |
| Fornecedores | Irina | Compras + certificados |

**Autonomous Agents** — trabalham em background sem persona. Nunca falam directamente com humanos. Executam tarefas, processam dados, tomam decisões dentro de regras.

Roteador · Documental · QMS · Stock · Manutenção · KPIs · Compliance

## Razão

Um agente por tarefa seria dezenas de agentes fragmentados sem contexto partilhado. Um único agente para tudo perde foco em contextos longos. A separação Personas/Autónomos resolve ambos os problemas: as personas são especializadas por actor humano, os agentes autónomos são especializados por domínio funcional.

A segurança também melhora — as personas são buffers entre humanos e o sistema. Um cliente que fala com a Marta nunca acede directamente à base de dados.

## Consequências

- O Sr. Manuel é renomeado Fernando e ganha persona com personalidade definida
- As suas tools são redistribuídas pelos agentes autónomos correctos
- Cada nova funcionalidade deve ser classificada primeiro: é uma Persona ou um Agente Autónomo?
- O fluxo é sempre: Humano → AI Persona → Autonomous Agent → Sistema
