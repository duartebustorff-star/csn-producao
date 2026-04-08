---
name: research-index
code: CSN-L4-CST-RES-000-2026
level: L4-CST
agent: Ag. Research
canal: 2 (Brain)
description: Indice dos 12 research skills do Ag. Research para web scraping, analise concorrencial e enriquecimento de dados
version: 1.0.0
created: 2026-04-08
---

# Research Skills — Ag. Research (L4-CST)

Coleccao de 12 skills para pesquisa web, scraping estruturado, inteligencia concorrencial e enriquecimento de leads B2B. Todos os outputs sao gravados na tabela Supabase `research_findings`.

## Contexto CSN

- **Empresa:** Carlos dos Santos Nascimento, Mafra, NIF 500 861 790
- **Produto:** Carrocarias basculantes, estrados, taipais — chassis-cabina 3.5T a 8.5T
- **Alvos:** Terraplanagens (CAE 43120), Demolicoes (43110), Inertes (49410), Residuos (38110/38210)
- **Zona:** Grande Lisboa, Oeste, Alentejo
- **Concorrentes:** Galucho, Berto Pinto, Inapal, Marques & Marques, TrailerWin

## Skills

| # | Ficheiro | Codigo | Descricao |
|---|----------|--------|-----------|
| 01 | extract-page.md | RES-001 | Extraccao estruturada de paginas web |
| 02 | deep-research.md | RES-002 | Pesquisa profunda multi-fonte |
| 03 | competitive-intel.md | RES-003 | Analise concorrentes |
| 04 | lead-enrich.md | RES-004 | Enriquecimento leads B2B |
| 05 | extract-tables.md | RES-005 | Extraccao tabelas e dados tabulares |
| 06 | monitor-changes.md | RES-006 | Deteccao mudancas em sites |
| 07 | synthesize.md | RES-007 | Sintese multi-fonte |
| 08 | social-mining.md | RES-008 | Mining redes sociais e noticias |
| 09 | discover-api.md | RES-009 | Descoberta APIs publicos |
| 10 | organize-data.md | RES-010 | Organizacao e deduplicacao de dados |
| 11 | validate-data.md | RES-011 | Validacao e fact-check |
| 12 | orchestrate.md | RES-012 | Meta-prompt orquestrador |

## Regra Bandeira

**NUNCA inventar dados. Sem fonte verificavel = NULL.**

## Output

Todos os skills gravam em `research_findings` com tipo: `prospeccao | concorrencia | seo | social | fabricante | mercado | norma`.
