# CSN Opus — Indice Geral de Skills por Agente
### Codigo: CSN-L4-ENG-DOC-SKL-IDX-2026
### Ultima actualizacao: Sessao 30 (30/03/2026)

---

## Agente Documental (CSN-L3-DOC-AGT)

Localizacao: `docs/skills/agente-documental/`

| Serie | Camada | Ficheiro | Codigo | Tipo | Estado |
|-------|--------|----------|--------|------|--------|
| 000 | 1 — Classifier | SKILL_GERAL.md | CSN-L3-DOC-SKL-000-2026 | Geral | ✅ |
| 100 | 1.5 — Tipo doc | SKILL_REQUISICAO.md | CSN-L3-DOC-SKL-100-2026 | Tipo | ✅ |
| 001 | 2 — Fornecedor | SKILL_CHAGAS.md | CSN-L3-DOC-SKL-001-2026 | Fornecedor | ✅ |
| 002 | 2 — Fornecedor | SKILL_COPRIAL.md | CSN-L3-DOC-SKL-002-2026 | Fornecedor | ✅ |
| 003 | 2 — Fornecedor | SKILL_PECOL.md | CSN-L3-DOC-SKL-003-2026 | Fornecedor | ✅ |
| 004 | 2 — Fornecedor | SKILL_POLIFER.md | CSN-L3-DOC-SKL-004-2026 | Fornecedor | ✅ |
| 005 | 2 — Fornecedor | SKILL_MADEICENTRO.md | CSN-L3-DOC-SKL-005-2026 | Fornecedor | ✅ |

**Numeracao:** 000=classifier · 1xx=tipos documento · 0xx=fornecedores · 2xx=clientes

**Pendentes:** Bielco (006), Silfesan (007), Publispeed (008), Dhollandia, Dom Carro, SKILL_EFATURA (101), SKILL_DHL (009), SKILL_GRUPOJAP (200)

---

## Agente RH (CSN-L3-RH-AGT)

Localizacao: `docs/skills/agente-rh/`

| Codigo | Ficheiro | Descricao | Persona | Estado |
|--------|----------|-----------|---------|--------|
| CSN-L3-RH-SKL-001-2026 | SKILL_RECIBOS.md | Servir recibos por PIN | Carolina | ✅ |
| CSN-L3-RH-SKL-002-2026 | SKILL_FERIAS.md | Saldo, pedidos, aprovacoes | Carolina | ✅ |
| CSN-L3-RH-SKL-003-2026 | SKILL_DADOS_PESSOAIS.md | Perfil mascarado | Carolina | ✅ |

---

## Agente Producao (CSN-L3-PRD-AGT)

Localizacao: `docs/skills/agente-producao/`

| Codigo | Ficheiro | Descricao | Persona | Estado |
|--------|----------|-----------|---------|--------|
| CSN-L3-PRD-SKL-001-2026 | SKILL_PONTO.md | Entrada/saida por obra e fase | Fernando | ✅ |
| CSN-L3-PRD-SKL-002-2026 | SKILL_OBRA_ACTIVA.md | Estado obras, progresso | Fernando | ✅ |

---

## Agente Qualidade (CSN-L3-QMS-AGT)

Localizacao: `docs/skills/agente-qualidade/`

| Codigo | Ficheiro | Descricao | Persona | Estado |
|--------|----------|-----------|---------|--------|
| CSN-L3-QMS-SKL-001-2026 | SKILL_QUALIFICACOES.md | EN 9606, equipamento, alertas | Fernando | ✅ |

---

## Resumo

| Agente | Skills | Commitados |
|--------|--------|-----------|
| Documental | 7 | ✅ 7/7 |
| RH | 3 | ✅ 3/3 |
| Producao | 2 | ✅ 2/2 |
| Qualidade | 1 | ✅ 1/1 |
| **Total** | **13** | **13/13** |

---

## Notas

- Skills do Agente Documental commitados sessao 28-29
- Skills dos Agentes RH, Producao e Qualidade commitados sessao 31
- Cada skill define: trigger, fluxo, tabelas, API existente, regras, e nivel ISA-95
- Skills sao documentacao — o codigo que implementa e nas routes (`src/app/api/`)
