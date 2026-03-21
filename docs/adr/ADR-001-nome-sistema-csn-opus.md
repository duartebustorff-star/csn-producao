# ADR-001 — Nome do Sistema: CSN Opus

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

O repositório e o sistema chamavam-se "csn-producao". Internamente era referido como "ERP". Nenhum dos nomes reflectia o que o sistema realmente é — um sistema de gestão integrado que cobre produção, qualidade, documentação, conformidade normativa e agentes IA.

## Decisão

O sistema chama-se **CSN Opus**.
Tagline: *Every build. Documented. Certified. Traceable.*

O repositório mantém o nome `csn-producao` para não quebrar o deploy Vercel. O nome CSN Opus é o nome do produto/sistema — não do repositório.

## Razão

"Opus" significa obra em latim e em português. É o conceito central do sistema — cada carroçaria é uma obra. O nome funciona em todas as línguas (PT/EN/DE/FR). Tem peso suficiente para um produto que no futuro pode ser licenciado a outras empresas de carroçarias.

## Consequências

- Todos os documentos de sessão passam a usar o nome CSN Opus
- O `package.json` deve ser actualizado com `"name": "csn-opus"`
- O header do sistema deve mostrar CSN Opus
- A mudança de nome do repositório é adiada para um refactor maior
