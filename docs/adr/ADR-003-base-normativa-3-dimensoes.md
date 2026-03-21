# ADR-003 — Base Normativa: 3 Dimensões Sempre Presentes

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

O sistema estava a ser construído com base em features desejadas — "quero um módulo de qualidade", "quero gerir stock". As normas eram vistas como requisitos externos a cumprir em separado, não como a razão de existir de cada módulo.

## Decisão

O CSN Opus é a **implementação digital das normas** que regulam o fabrico de carroçarias na UE. As normas estão organizadas em 3 dimensões que estão sempre presentes em todos os documentos de arquitectura:

**Dimensão 1 — O Produto** *(regula o que sai da fábrica)*
Reg. 2018/858 · GSR 2019/2144 · EN 12642 · UNECE R48/R73/R58 · Dir. 96/53/CE · EN 12640/12195-1

**Dimensão 2 — O Processo** *(regula como fabricas)*
ISO 9001 · EN 1090 · EN ISO 3834 · EN ISO 15614-1 · EN ISO 9606-1 · EN ISO 5817/17637
Futuro: ISO 14001 · ISO 45001

**Dimensão 3 — O Sistema** *(regula como geres)*
ISA-95 · ISO 22400 · ISO 55000

## Razão

Cada módulo com justificação normativa é inatacável em auditoria. Cada tabela com justificação normativa nunca é removida por acidente. A base normativa é também o argumento comercial — a CSN não vende carroçarias, vende conformidade documentada e rastreável.

## Consequências

- A secção "Prontidão para Auditoria" é NUNCA removida de nenhuma versão do documento de arquitectura
- Cada novo módulo proposto deve indicar a norma que o obriga a existir
- Cada nova tabela deve indicar a evidência de auditoria que vai guardar
- A sequência de implementação segue a sequência normativa: ISO 9001 → EN 1090 → EN 12642 → COC electrónico → ISO 14001/45001
