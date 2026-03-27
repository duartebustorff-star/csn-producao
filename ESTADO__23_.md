# CSN Technic — Estado do Projeto
**Última atualização:** 27/03/2026 — sessão 23
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
Carrega: `ESTADO__23_.md` + `docs/csn-architecture__23_.html` + ADRs relevantes

---

## SESSÃO 23 — RESUMO (27/03/2026)

Decisão software faturação: Masterway em vez de InvoiceXpress. Migration 015 criada e corrida no Supabase. ADR-025 criado.

### Parte 1: Decisão Faturação Masterway
- **ADR-025** criado: `docs/ADR-025-integracao-masterway.md`
- Masterway escolhido: conta activa (3,75 EUR/mês), certificado AT, API REST
- CSN Opus envia ordem → Masterway gera documento certificado com ATCUD + QR Code → devolve ID + PDF URL
- Faturas no Supabase são metadados e referências externas (não documentos fiscais)
- **Commit:** `a07b761`

### Parte 2: Migration 015 — Faturação Masterway
- **3 tabelas criadas no Supabase:** `clientes_faturacao`, `faturas`, `notas_credito`
- Ficheiro: `supabase/015_faturas_masterway.sql`
- Nível ISA-95: Nível 4 (ERP)
- **Commits:** `c7d446a` (refactor InvoiceXpress → Masterway), `b66c369` (migration original)

### Parte 3: Fix obra_id
- `obra_id TEXT` → `obra_id INTEGER` na tabela `faturas` (match tipo `dossie_obra.id`)
- **Commit:** `d80c2a4`

### Notas técnicas da sessão:
- Masterway API: `MASTERWAY_API_KEY` env var necessária (backend only)
- Tabela `faturas`: metadados + referência Masterway, nunca documento fiscal
- `nivel_isa95` campo presente na migration (nível 4 ERP)

---

## INFRAESTRUTURA

| Componente | Estado |
|---|---|
| Supabase | ✅ 28 tabelas existentes |
| Vercel | ✅ auto-deploy via GitHub main |
| GitHub | ✅ duartebustorff-star/csn-producao |
| Claude API | ✅ claude-sonnet-4-5 |
| ANTHROPIC_API_KEY | ✅ Vercel env vars |
| Masterway | ✅ Conta activa (3,75 EUR/mês) — API REST |

---

## TABELAS SUPABASE — 28 EXISTENTES

obras · fases_obra · timetracking · templates_fases · notas_obra · calendario · leads · davs · fams · inspecoes · cits · dossie_obra · obras_dossier_status · certificados_matricula · certificacoes_empresa · audit_log · colaboradores · ausencias · documentos_rh · mensagens · lugares_parque · research_tasks · colaboradores_rh · processamentos_mensais · recibos_vencimento · **clientes_faturacao** ✅ · **faturas** ✅ · **notas_credito** ✅

## MIGRATIONS

| Migration | Tabelas principais | Estado |
|---|---|---|
| **015** | **clientes_faturacao, faturas, notas_credito** | **✅ COMPLETA — Masterway** |
| 016 | nao_conformidades, wps, wpqr, certificados_soldadores, inspecoes_soldadura | ❌ |
| 017 | stocks, lotes_material, certificados_material, movimentos_stock | ❌ |
| 018 | equipamentos_csn, manutencao_plano, avarias, formacoes, epis | ❌ |
| 019 | marcas_veiculo, nomenclatura_marcas, qualidade_dados_marca, monitorizacao_marcas | ❌ |
| 020 | equipamentos_carrocaria, tipos_carrocaria | ❌ |
| **021** | **colaboradores_rh, processamentos_mensais, recibos_vencimento** | **✅ COMPLETA** |
| 022 | sops, work_instructions, cadernos_montagem, passos_caderno | ❌ |
| 023 | analises_fea | ❌ |

---

## ADRs — 25 COMMITADOS (docs/)

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
| **025** | **Integração Masterway — faturação certificada AT** | **CIVA, ISA-95 nível 4** |

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
| **Recursos Humanos** | **Carolina** | **Nível 4 ERP** | **✅ DB + API + Interface em produção** |
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
| `src/app/api/carolina/recibo/route.ts` | ✅ PDF recibo A4 paisagem |
| `src/app/api/carolina/declaracao-anual/route.ts` | ✅ PDF declaração art. 119 CIRS |
| `src/app/api/carolina/colaboradores/route.ts` | ✅ Lista colaboradores_rh |
| `src/app/api/research/route.ts` | ✅ CRUD tarefas research |
| `src/app/api/research/[id]/route.ts` | ✅ GET + PATCH tarefa |
| `src/app/api/research/execute/route.ts` | ✅ Executa Agente Research |
| `src/lib/chat-tools.ts` | ✅ **17 tools** (15 originais + 2 research) |
| `src/lib/research-agent.ts` | ✅ Motor autónomo (Claude API + web search) |
| `src/lib/supabase.ts` | ✅ |
| `src/lib/audit.ts` | ✅ |
| `src/components/RHView.tsx` | ✅ Sub-tabs Equipa + Salários (Carolina) |
| `src/app/api/documentos/gerar-termo/route.ts` | ⚠️ Funcional mas formato errado |
| `src/app/api/documentos/gerar-checklist/route.ts` | ✅ Funcional e aprovado |
| `supabase/014_research_tasks.sql` | ✅ Corrida no Supabase |
| `supabase/015_faturas_masterway.sql` | ✅ Corrida no Supabase (3 tabelas Masterway) |
| `supabase/021_carolina_salarios.sql` | ✅ Corrida no Supabase (3 tabelas + 15 recibos) |
| `docs/ADR-025-integracao-masterway.md` | ✅ Decisão faturação Masterway |
| `.vercelignore` | ✅ Exclui _research/, docs/, supabase/, Marcas - Veiculos/, knowledge-base/ |

---

## FATURAÇÃO MASTERWAY — ✅ MIGRATION 015 COMPLETA

### Decisão (ADR-025)
- CSN Opus **não é** software de faturação certificado AT
- Masterway: conta activa, 3,75 EUR/mês, certificado AT, API REST
- Fluxo: CSN Opus envia ordem → Masterway gera doc certificado (ATCUD + QR) → devolve ID + PDF URL

### Tabelas DB
- `clientes_faturacao` — nome, NIF, email, morada, masterway_client_id
- `faturas` — numero_fatura, serie, masterway_id, obra_id (INTEGER FK), estado, tipo, valores, pdf_url
- `notas_credito` — fatura_original_id FK, masterway_id, motivo, total

### Env var necessária
- `MASTERWAY_API_KEY` — backend only, nunca exposta ao frontend

### Próximos passos faturação:
- Implementar API route `/api/faturacao/emitir` (POST → Masterway API)
- Implementar API route `/api/faturacao/listar` (GET faturas por obra)
- UI de faturação no CSN Opus (admin-only)

---

## CAROLINA — SISTEMA COMPLETO

### Tabelas DB
- `colaboradores_rh` — 3 colaboradores (Bohdan, José Júlio, João António)
- `processamentos_mensais` — 6 meses (Out 2025–Mar 2026)
- `recibos_vencimento` — 15 recibos (Out 2025–Fev 2026)

### Recibos Inseridos

| Mês | Bohdan (líq.) | José Júlio (líq.) | João António (líq.) |
|---|---|---|---|
| Out 2025 | 1043.52 | 1008.00 | 1008.00 |
| Nov 2025 | 1029.87 | 994.35 | 994.35 |
| Dez 2025 | 1043.52 | 1008.00 | 1008.00 |
| Jan 2026 | 1092.94 | 1055.37 | 1055.37 |
| Fev 2026 | 1083.84 | 523.15 (baixa 10/20 dias) | 1046.27 |

### API Endpoints
- `GET /api/carolina/recibo?colaborador_rh_id=X&ano=Y&mes=Z` → PDF recibo
- `GET /api/carolina/declaracao-anual?colaborador_rh_id=X&ano=Y` → PDF declaração
- `GET /api/carolina/colaboradores` → JSON lista colaboradores

### Interface
- Tab RH → sub-tab "Salários" (admin-only)
- Cards expansíveis por colaborador com botões PDF

### Próximos passos Carolina:
- Processar recibo Março 2026 (processamento_id=6 já existe)
- Ligar `colaborador_id` FK quando tabela `colaboradores` for populada
- Implementar persona Carolina no chat (system prompt + tools dedicados)

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
| P1 | 🔴 | Carolina — persona chat + tools RH dedicados |
| P2 | 🔴 | Agente Documental |
| P3 | 🔴 | Reescrever gerar-termo |
| P4 | 🔴 | API routes faturação Masterway (/api/faturacao/*) |
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
- **pdf-lib + Next.js 16:** usar `Buffer.from(bytes)` no NextResponse (Uint8Array incompatível)
- **Logo CSN:** transparente — branco=termo, preto=checklist
- **Vercel:** auto-deploy via GitHub main
- **Vercel .vercelignore:** incluir `Marcas - Veiculos/` (340MB) para evitar erro 250MB serverless
- **FK:** `null` para acções do sistema (nunca "system")
- **Git:** nunca force push
- **ZIPs:** não commitar — extrair primeiro
- **nivel_isa95:** campo a adicionar em TODAS as migrations futuras
- **BRAVE_SEARCH_API_KEY:** opcional — Agente Research usa para web search (sem ela usa fetch_url)
- **MASTERWAY_API_KEY:** backend only — nunca exposta ao frontend

---

## EMPRESA

- **Marca:** CSN Technic — Commercial Vehicle Engineering
- **Nome legal:** Carlos dos Santos Nascimento, Lda
- **NIF:** 500 861 790
- **Morada:** Rua da Industria nº8, Casal do Rôdo, 2640-216 Encarnação
- **CEO:** Duarte da Cunha Martins Bustorff-Silva
- **Certidão:** 3172-1374-8252
