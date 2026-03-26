# CSN Technic — Estado do Projeto
**Última atualização:** 21/03/2026
**Sistema interno:** CSN Opus — Every build. Documented. Certified. Traceable.
**Produto comercial:** CSN Brain — The engineering brain behind every body.
**Marca corporativa:** CSN Technic — Commercial Vehicle Engineering
**Repositório:** `duartebustorff-star/csn-producao`
**URL produção:** https://csn-producao.vercel.app
**Stack:** Next.js 16 + Supabase + Claude API (claude-sonnet-4-5) + Vercel
**Pasta local:** `C:\Users\Utilizador\Projectos-AI\csn-producao`

---

## COMO USAR

Quando abrires um chat novo:
1. Envia este ficheiro + `docs/csn-architecture__18_.html`
2. Envia os ADRs relevantes de `docs/adr/`
3. Diz: *"Lê o ESTADO__18_.md, a arquitectura v18 e os ADRs. Continua o trabalho."*

---

## SESSÃO 15 — RESUMO FINAL DEFINITIVO (21/03/2026)

Sessão de arquitectura pura. A mais importante do projecto.

### Tudo o que foi definido:
- **CSN Technic** — marca corporativa
- **CSN Opus** — sistema de gestão interno
- **CSN Brain** — produto comercial SaaS (melhor que TrailerWin)
- **5 camadas arquitecturais** do CSN Opus
- **5 AI Personas** — Luísa, Fernando, Marta, Leonor, Irina
- **8 Autonomous Agents** — incluindo Compliance + Agente Inteligência de Marcas
- **Knowledge Base** — RAG por domínio
- **Base normativa 3 dimensões** — sempre presente
- **18 ADRs** commitados
- **Hierarquia de conformidade** — 3 níveis
- **Fórmula peso útil** — `(PBV × 0.90) - Tara - ((Nº_lugares-1) × 75) - Σequipamentos`
- **CSN Brain 5 camadas** — Legislação → Chassi → Equipamentos → Carroçaria → Acessórios
- **Box Rules** — dimensões mín/máx por chassi
- **Famílias carroçaria** — Basculante + Caixa Aberta/Estrado (ligeiros e pesados)
- **Equipamentos** — Grua (EN 12999), Plataforma (EN 1756), Engate (UNECE R55)
- **D-value e S-value** fórmulas
- **Agente Inteligência de Marcas** — guardião da tabela marcas_veiculo
- **Gestão de OTs** — estrutura _cowork/inbox/ + tabela ordens_trabalho
- **18 OTs** definidas para o Cowork

---

## INFRAESTRUTURA

| Componente | Estado |
|---|---|
| Supabase | ✅ 21 tabelas existentes |
| Vercel | ✅ `npx vercel --prod` |
| GitHub | ✅ duartebustorff-star/csn-producao |
| Claude API | ✅ claude-sonnet-4-5 |

---

## TABELAS SUPABASE — 21 EXISTENTES

obras · fases_obra · timetracking · templates_fases · notas_obra · calendario · leads · davs · fams · inspecoes · cits · dossie_obra · obras_dossier_status · certificados_matricula · certificacoes_empresa · audit_log · colaboradores · ausencias · documentos_rh · mensagens · lugares_parque

## MIGRATIONS PENDENTES

| Migration | Tabelas principais | Estado |
|---|---|---|
| 014 | fornecedores, faturas, faturas_linhas, notas_credito, recibos | ❌ 🔴 URGENTE |
| 015 | nao_conformidades, wps, wpqr, certificados_soldadores | ❌ |
| 016 | stocks, lotes_material, certificados_material, movimentos_stock | ❌ |
| 017 | equipamentos_csn, manutencao_plano, avarias, formacoes, epis | ❌ |
| 018 | marcas_veiculo, nomenclatura_marcas, ordens_trabalho, qualidade_dados_marca, monitorizacao_marcas, documentos_externos | ❌ |
| 019 | equipamentos_carrocaria, tipos_carrocaria | ❌ |

---

## ADRs — 18 COMMITADOS

| ADR | Título |
|---|---|
| 001 | Nome sistema: CSN Opus |
| 002 | AI Personas vs Autonomous Agents |
| 003 | Base normativa 3 dimensões |
| 004 | Knowledge Base externa por domínio |
| 005 | Arquitectura 5 camadas |
| 006 | Agente Compliance: auditoria mensal |
| 007 | Rastreabilidade materiais por lote e FIFO |
| 008 | Base de dados veículos + Cowork |
| 009 | Inteligência técnica por marca + workflow documentos |
| 010 | CSN Technic + CSN Brain produto comercial |
| 011 | Fórmula peso útil + base legal |
| 012 | EN 12195 completa + EN 12640 + IRU guidelines |
| 013 | Hierarquia conformidade + todos os limites |
| 014 | Equipamentos: grua, plataforma, engate |
| 015 | Famílias carroçaria: basculante + estrado |
| 016 | Agente Inteligência de Marcas |
| 017 | Box Rules: dimensões e pesos carroçaria |
| 018 | Gestão OTs e scraping com Cowork |

---

## CSN BRAIN — 5 CAMADAS

```
1 — LEGISLAÇÃO    → DL 132/2017, Reg. 1230/2012, Dir. 96/53/CE
2 — CHASSI        → tabela marcas_veiculo (gerida pelo Agente de Marcas)
3 — EQUIPAMENTOS  → grua, plataforma, engate
4 — CARROÇARIA    → basculante, caixa aberta/estrado
5 — ACESSÓRIOS    → sem impacto estrutural
```

**Box Rules:**
```
Largura:     MIN = MAX(largura_cabine, largura_extremidade_eixo_traseiro)
             MAX = 2.55m
Comprimento: MIN = comprimento_zona_carga_chassi
             MAX = distancia_eixos × 1.667
Altura:      MAX = 4.00m - altura_chassi - altura_subframe
Peso:        MAX = (PBV×0.90) - Tara - ((Nº_lugares-1)×75) - Σequipamentos
```

---

## AUTONOMOUS AGENTS — 8

| Agente | Função | Estado |
|---|---|---|
| Roteador | Recebe e distribui entradas | ❌ |
| Documental | DAV/FAM/INSP/CIT → Termo | ❌ 🔴 URGENTE |
| QMS | NC, inspecções, EN 1090 | ❌ |
| Stock | FIFO, alertas, rastreabilidade | ❌ |
| Manutenção | 12 equipamentos, plano preventivo | ❌ |
| KPIs | OEE, throughput, ISO 22400 | ❌ |
| Compliance | Auditoria mensal automática | ❌ |
| **Inteligência de Marcas** | Guardião tabela marcas_veiculo | ❌ |

---

## AI PERSONAS — 5

| Persona | Nome | Estado |
|---|---|---|
| Assistente CEO | Luísa | ❌ Fase 1 |
| Chefe de Produção | Fernando | ⚠️ Existe como Sr. Manuel |
| Agente Comercial | Marta | ❌ Fase 2 |
| Aftersales | Leonor | ❌ Fase 2 |
| Fornecedores | Irina | ❌ Fase 2 |

---

## MARCAS - VEICULOS

| Marca | Estado |
|---|---|
| Fuso | ✅ Parcial |
| Renault | ✅ GT XDD ICE + E-TECH |
| Mercedes-Benz | ✅ Sprinter mounting directives |
| Stellantis | 🔄 Em curso Cowork |
| MAN | ❌ OT pendente |
| DAF | ❌ OT pendente |
| Iveco | ❌ OT pendente |

---

## ESTRUTURA _cowork/ (a criar no repo)

```
_cowork/
  inbox/          ← Cowork descarrega aqui
  prompts/        ← prompts standard por tipo de OT
knowledge-base/   ← só entra ficheiro validado
```

---

## PENDENTES — POR ORDEM

| # | Prioridade | Tarefa |
|---|---|---|
| P1 | 🔴 | Agente Documental |
| P2 | 🔴 | Reescrever gerar-termo |
| P3 | 🔴 | Migration 014 |
| P4 | 🟡 | Criar pasta _cowork/ no repo |
| P5 | 🟡 | Migration 018 — CSN Brain + OTs |
| P6 | 🟡 | Migration 019 — equipamentos + carroçarias |
| P7 | 🟡 | Seed Renault Master XDD ICE |
| P8 | 🟡 | Box Rules engine — função calcular_box_rules() |
| P9 | 🟡 | Página Gestão de OTs no CSN Opus |
| P10 | 🟡 | Cowork executa OTs de marcas e legislação |
| P11 | 🟡 | Migration 015-017 QMS/Stock/CMMS |
| P12 | 🟡 | COC Electrónico IMT Jul/2026 |
| P13 | ⚪ | Luísa — Assistente CEO |
| P14 | ⚪ | Fernando — migrar Sr. Manuel |

---

## NOTAS TÉCNICAS

- **PowerShell:** SEMPRE `cd C:\Users\Utilizador\Projectos-AI\csn-producao`
- **SQL:** SEMPRE Supabase SQL Editor — Ctrl+A → Delete
- **Vercel:** `npx vercel --prod`
- **FK:** `null` para acções do sistema
- **Git:** nunca force push
- **ZIPs:** não commitar — extrair primeiro
- **Software 3D:** SolidWorks vs Inventor — A CONFIRMAR

---

## EMPRESA

- **Marca:** CSN Technic — Commercial Vehicle Engineering
- **Nome legal:** Carlos dos Santos Nascimento, Lda
- **NIF:** 500 861 790
- **Morada:** Rua da Industria nº8, Casal do Rôdo, 2640-216 Encarnação
- **CEO:** Duarte da Cunha Martins Bustorff-Silva
- **Certidão:** 3172-1374-8252
