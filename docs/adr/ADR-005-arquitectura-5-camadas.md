# ADR-005 — Arquitectura de 5 Camadas

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

A arquitectura anterior tinha camadas mal definidas. O frontend falava directamente com a base de dados em alguns casos. Os agentes tinham acesso irrestrito. Não havia modelo de segurança claro nem separação de responsabilidades.

## Decisão

O CSN Opus tem exactamente 5 camadas com responsabilidades e fronteiras definidas:

```
CAMADA 1 — HUMANOS
Duarte, João, Bohdan, José Júlio, Clientes, Fornecedores, Concessionários
Nunca acedem directamente ao sistema.

CAMADA 2 — AI PERSONAS
Luísa · Fernando · Marta · Leonor · Irina
Face humana do sistema. Buffer de segurança. Acesso controlado por persona.

CAMADA 3 — AUTONOMOUS AGENTS
Roteador · Documental · QMS · Stock · Manutenção · KPIs · Compliance
Motor do sistema. Sem persona. Trabalham em background.

CAMADA 4 — SISTEMA (Supabase)
Fonte de verdade. Todos os dados. Todas as evidências de auditoria.

CAMADA 5 — KNOWLEDGE BASE
RAG por domínio. Permanente. Partilhada entre agentes.
```

## Razão

A separação em camadas resolve três problemas:
1. **Segurança** — nenhum humano acede directamente à base de dados
2. **Manutenção** — cada camada pode ser modificada sem afectar as outras
3. **Escalabilidade** — novas personas e agentes encaixam no modelo sem refactoring

## Consequências

- Qualquer nova funcionalidade deve ser classificada na camada correcta antes de ser construída
- A fronteira entre Camada 2 e Camada 3 é clara: Personas falam com humanos, Agentes executam no sistema
- A Camada 4 (Supabase) nunca é acedida directamente por humanos — sempre via agente
- A Camada 5 é permanente — não é apagada quando agentes são substituídos
