# CSN Technic — Estado do Projeto
**Última atualização:** 26/03/2026 — 21:00 WET (UTC+1 — WEST)
**Sistema interno:** CSN Opus — Every build. Documented. Certified. Traceable.
**Produto comercial:** CSN Brain — The engineering brain behind every body.
**Marca corporativa:** CSN Technic — Commercial Vehicle Engineering
**Repositório:** `duartebustorff-star/csn-producao`
**URL produção:** https://csn-producao.vercel.app
**Stack:** Next.js 16 + TypeScript + Supabase + Claude API (claude-sonnet-4-5) + Vercel
**Pasta local:** `C:\Users\Utilizador\Projectos-AI\csn-producao`

---

## COMO USAR

Quando abrires uma sessão nova no Claude Code:
```
cd C:\Users\Utilizador\Projectos-AI\csn-producao
claude
```
Carrega: `ESTADO__21_.md` + `docs/csn-architecture__19_.html` + ADRs relevantes

---

## SESSÃO 16 — RESUMO (26/03/2026)

Migration 021 Carolina — gestão salarial implementada e corrida no Supabase.

### Migration 021 — Carolina: Gestão Salarial
- **3 tabelas criadas:** `colaboradores_rh`, `processamentos_mensais`, `recibos_vencimento`
- **Seed 3 colaboradores RH:**
  - Bohdan HirskYY — reformado, SS 7.5%
  - José Júlio Gomes Duarte de Almeida — normal, SS 11%
  - João António Gomes — normal, SS 11%, KM viatura
- **Seed 6 processamentos mensais:** Out 2025–Mar 2026 (base 870€ em 2025, 920€ em 2026)
- **15 recibos históricos inseridos:** Out 2025–Fev 2026 × 3 colaboradores
  - José Júlio Fev 2026: baixa desde 16/02, só 10/20 dias (valores proporcionais)
  - Todos isentos IRS, sub. alimentação 4.55€/dia, duodécimos férias/natal incluídos
- **`colaborador_id` nullable** — tabela `colaboradores` vazia, FK será ligada depois
- **Nível ISA-95:** nivel4_erp em todas as tabelas
- **Audit log:** registado com `entidade_tipo = 'migration'`

### Commits:
- `2ad8f29` — feat: migration 021 — Carolina gestão salarial (tabelas + seed colaboradores + processamentos)
- `bbdb16a` — feat: migration 021 completa com 15 recibos históricos

### Notas técnicas da sessão:
- Supabase SQL Editor: JSON com em-dash (—) ou carriage return causa erro `22P02` — usar apenas ASCII em valores JSON
- `audit_log` usa colunas `entidade_tipo`, `entidade_id`, `acao`, `metadata` (não `tabela`/`registo_id`/`dados_novos`)

---

## INFRAESTRUTURA

| Componente | Estado |
|---|---|
| Supabase | ✅ 25 tabelas existentes |
| Vercel | ✅ auto-deploy via GitHub main |
| GitHub | ✅ duartebustorff-star/csn-producao |
| Claude API | ✅ claude-sonnet-4-5 |
| ANTHROPIC_API_KEY | ✅ Vercel env vars |

---

## TABELAS SUPABASE — 25 EXISTENTES

obras · fases_obra · timetracking · templates_fases · notas_obra · calendario · leads · davs · fams · inspecoes · cits · dossie_obra · obras_dossier_status · certificados_matricula · certificacoes_empresa · audit_log · colaboradores · ausencias · documentos_rh · mensagens · lugares_parque · research_tasks · **colaboradores_rh** ✅ · **processamentos_mensais** ✅ · **recibos_vencimento** ✅

## MIGRATIONS PENDENTES

| Migration | Tabelas principais | Estado |
|---|---|---|
| 015 | fornecedores, faturas, faturas_linhas, notas_credito, recibos | ❌ 🔴 URGENTE |
| 016 | nao_conformidades, wps, wpqr, certificados_soldadores, inspecoes_soldadura | ❌ |
| 017 | stocks, lotes_material, certificados_material, movimentos_stock | ❌ |
| 018 | equipamentos_csn, manutencao_plano, avarias, formacoes, epis | ❌ |
| 019 | marcas_veiculo, nomenclatura_marcas, qualidade_dados_marca, monitorizacao_marcas | ❌ |
| 020 | equipamentos_carrocaria, tipos_carrocaria | ❌ |
| **021** | **colaboradores_rh, processamentos_mensais, recibos_vencimento** | **✅ COMPLETA** |
| 022 | sops, work_instructions, cadernos_montagem, passos_caderno | ❌ |
| 023 | analises_fea | ❌ |

---

## ADRs — 24 COMMITADOS (docs/adr/)

| ADR | Título | Normas |
|---|---|---|
| 001 | Nome sistema: CSN Opus | — |
| 002 | AI Personas (6) vs Autonomous Agents (10) | — |
| 003 | Base normativa 3 dimensões | ISO 9001, EN 1090, ISA-95 |
| 004 | Knowledge Base externa por domínio | — |
| 005 | Arquitectura 5 camadas | ISA-95 |
| 006 | Agente Compliance: auditoria mensal | ISO 9001 |
| 007 | Rastreabilidade materiais por lote e FIFO | EN ISO 3834 |
| 008 | Base de dados veículos + Cowork | Reg. 2018/858 |
| 009 | Inteligência técnica por marca + workflow | EN 1090 |
| 010 | CSN Technic + CSN Brain produto comercial | — |
| 011 | Fórmula peso útil + base legal | DL 132/2017 + Reg. 1230/2012 |
| 012 | EN 12195 completa + EN 12640 + IRU | EN 12195, EN 12640, EN 12642 |
| 013 | Hierarquia conformidade + todos os limites | DL 132/2017, UNECE |
| 014 | Equipamentos: grua, plataforma, engate | EN 12999, EN 1756, UNECE R55 |
| 015 | Famílias carroçaria: basculante + estrado | EN 1090, EN 12642 |
| 016 | Agente Inteligência de Marcas | — |
| 017 | Box Rules: dimensões e pesos carroçaria | DL 132/2017 |
| 018 | Gestão OTs e scraping com Cowork | — |
| 019 | Conformidade ISA-95 + ISO9001 + EN1090 gaps | ISA-95, ISO 9001, EN 1090 |
| 020 | Carolina: Agente RH completo | CT art. 276º |
| 021 | Fernando: Liderança + RAG específico | — |
| 022 | Agente Research: autónomo + fluxo tarefas | — |
| 023 | Departamento Processos: SOPs + WIs multilingue | ISO 9001 cl. 8.1, EN 1090 |
| 024 | Agente FEA: iLogic + Nastran + EN 12642 | EN 12642, ISO 9001 |

---

## CSN BRAIN — 5 CAMADAS

```
1 — LEGISLAÇÃO    → DL 132/2017, Reg. 1230/2012, Dir. 96/53/CE
2 — CHASSI        → tabela marcas_veiculo (Agente Inteligência de Marcas)
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

## AI PERSONAS — 6

| Persona | Nome | Nível ISA-95 | Estado |
|---|---|---|---|
| Assistente CEO | Luísa | Transversal | ❌ Fase 1 |
| Chefe de Produção | Fernando | Nível 3 MES | ⚠️ Existe como Sr. Manuel |
| **Recursos Humanos** | **Carolina** | **Nível 4 ERP** | **🔄 DB pronta, persona por implementar** |
| Agente Comercial | Marta | Nível 4 ERP | ❌ Fase 2 |
| Aftersales | Leonor | Nível 4 ERP | ❌ Fase 2 |
| Fornecedores | Irina | Nível 4 ERP | ❌ Fase 2 |

---

## AUTONOMOUS AGENTS — 10

| Agente | Nível ISA-95 | ADR | Estado |
|---|---|---|---|
| Roteador | Transversal | — | ❌ |
| Documental | Nível 3 MES | — | ❌ 🔴 URGENTE |
| QMS | Nível 3 MES | — | ❌ |
| Stock | Nível 3 MES | ADR-007 | ❌ |
| Manutenção | Nível 3 MES | — | ❌ |
| KPIs | Transversal | — | ❌ |
| Compliance | Transversal | ADR-006 | ❌ |
| Inteligência de Marcas | Nível 4 ERP | ADR-016 | ❌ |
| **Research** | **Transversal** | **ADR-022** | **✅ Funcional** |
| FEA | Nível 3 MES Técnico | ADR-024 | ❌ Depende RAG iLogic |

---

## CÓDIGO EXISTENTE

| Ficheiro | Estado |
|---|---|
| `src/app/api/chat/route.ts` | ✅ Sr. Manuel — **17 tools** |
| `src/app/api/research/route.ts` | ✅ CRUD tarefas research |
| `src/app/api/research/[id]/route.ts` | ✅ GET + PATCH tarefa |
| `src/app/api/research/execute/route.ts` | ✅ Executa Agente Research |
| `src/lib/chat-tools.ts` | ✅ **17 tools** (15 originais + 2 research) |
| `src/lib/research-agent.ts` | ✅ Motor autónomo (Claude API + web search) |
| `src/lib/supabase.ts` | ✅ |
| `src/lib/audit.ts` | ✅ |
| `src/app/api/documentos/gerar-termo/route.ts` | ⚠️ Funcional mas formato errado |
| `src/app/api/documentos/gerar-checklist/route.ts` | ✅ Funcional e aprovado |
| `supabase/014_research_tasks.sql` | ✅ Corrida no Supabase |
| `supabase/021_carolina_salarios.sql` | ✅ Corrida no Supabase (3 tabelas + 15 recibos) |
| `.vercelignore` | ✅ Exclui _research/, docs/, supabase/ |

---

## CAROLINA — RECIBOS INSERIDOS

| Mês | Bohdan (líq.) | José Júlio (líq.) | João António (líq.) |
|---|---|---|---|
| Out 2025 | 1043.52 | 1008.00 | 1008.00 |
| Nov 2025 | 1029.87 | 994.35 | 994.35 |
| Dez 2025 | 1043.52 | 1008.00 | 1008.00 |
| Jan 2026 | 1092.94 | 1055.37 | 1055.37 |
| Fev 2026 | 1083.84 | 523.15 (baixa 10/20 dias) | 1046.27 |

**Próximos passos Carolina:**
- Processar recibo Março 2026 (processamento_id=6 já existe)
- Ligar `colaborador_id` FK quando tabela `colaboradores` for populada
- Implementar persona Carolina (chat + tools RH)
- Geração PDF recibos de vencimento

---

## AGENTE RESEARCH — ✅ COMPLETO

```
Passo 1 — Migration research_tasks        ✅ DONE
Passo 2 — Pasta _research/ estrutura      ✅ DONE
Passo 3 — API /api/research CRUD          ✅ DONE
Passo 4 — Motor research-agent.ts         ✅ DONE
Passo 5 — Chat tools integração           ✅ DONE (criar + listar)
Passo 6 — Teste end-to-end RT-2026-001    ✅ DONE
```

**RT-2026-001** — MAN TGS/TGM bodybuilder guidelines
- 34 fontes consultadas, 10 acedidas, 2 findings
- Portal MAN requer registo bodybuilder autorizado
- Alternativa: TruckScience (specs OEM estruturadas)

---

## ESTRUTURA DE PASTAS ESPECIAIS

```
_research/                    ✅ Criada e em uso
  RT-2026-001-man-tgs-tgm-bodybuilder-guidelines/
    RELATORIO_RT-2026-001.md
    processado/dados_extraidos.json
    processado/fontes.json

_cowork/                      ⚠️ Estrutura definida, não populada
  inbox/
  prompts/

knowledge-base/               ❌ Não criada
  tecnico/normas/
  csn/
```

---

## MARCAS — VEICULOS

| Marca | Estado |
|---|---|
| Fuso | ✅ Parcial |
| Renault | ✅ GT XDD ICE + E-TECH |
| Mercedes-Benz | ✅ Sprinter mounting directives |
| Stellantis | 🔄 Em curso |
| MAN | 🔄 RT-2026-001 concluída — portal requer registo |
| DAF / Iveco | ❌ OTs pendentes |

---

## PENDENTES — POR ORDEM

| # | Prioridade | Tarefa |
|---|---|---|
| P1 | 🔴 | Migration 015 — ERP light (faturas, fornecedores) |
| P2 | 🔴 | Carolina — persona + tools RH + PDF recibos |
| P3 | 🔴 | Agente Documental |
| P4 | 🔴 | Reescrever gerar-termo |
| P5 | 🟡 | Migration 019 — CSN Brain (marcas_veiculo) |
| P6 | 🟡 | Migration 020 — equipamentos_carrocaria + tipos_carrocaria |
| P7 | 🟡 | Seed Renault Master XDD ICE |
| P8 | 🟡 | Função calcular_box_rules() |
| P9 | 🟡 | Página Gestão de OTs no CSN Opus |
| P10 | 🟡 | COC Electrónico IMT — deadline Jul 2026 |
| P11 | ⚪ | Luísa — Assistente CEO |
| P12 | ⚪ | Fernando — migrar Sr. Manuel com persona liderança |
| P13 | ⚪ | Knowledge Base Nastran para Agente FEA |
| P14 | ⚪ | Registar CSN como bodybuilder nos portais MAN, DAF, Iveco |

---

## NOTAS TÉCNICAS CRÍTICAS

- **PowerShell:** SEMPRE `cd C:\Users\Utilizador\Projectos-AI\csn-producao`
- **SQL:** SEMPRE Supabase SQL Editor — Ctrl+A → Delete antes de colar
- **SQL JSON:** Não usar em-dash (—), carriage returns ou caracteres especiais em valores JSON — causa erro `22P02`
- **audit_log:** colunas = `entidade_tipo`, `entidade_id`, `acao`, `metadata` (NÃO `tabela`/`registo_id`/`dados_novos`)
- **PowerShell:** um comando de cada vez — nunca em bloco
- **pdf-lib:** usar `s()` para sanitizar strings (WinAnsi encoding)
- **Logo CSN:** transparente — branco=termo, preto=checklist
- **Vercel:** auto-deploy via GitHub main
- **FK:** `null` para acções do sistema (nunca "system")
- **Git:** nunca force push
- **ZIPs:** não commitar — extrair primeiro
- **nivel_isa95:** campo a adicionar em TODAS as migrations futuras
- **BRAVE_SEARCH_API_KEY:** opcional — Agente Research usa para web search (sem ela usa fetch_url)

---

## EMPRESA

- **Marca:** CSN Technic — Commercial Vehicle Engineering
- **Nome legal:** Carlos dos Santos Nascimento, Lda
- **NIF:** 500 861 790
- **Morada:** Rua da Industria nº8, Casal do Rôdo, 2640-216 Encarnação
- **CEO:** Duarte da Cunha Martins Bustorff-Silva
- **Certidão:** 3172-1374-8252
