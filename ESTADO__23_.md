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

Faturação certificada AT: decisão Cegid Vendus (plano Pro). Migration 015 corrida no Supabase. ADR-025 criado e actualizado. Recibos 2025 extraídos. Módulo financeiro planeado. Extrato BPI analisado.

### Parte 1: Decisão Faturação — Cegid Vendus
- **ADR-025** criado e actualizado: `docs/ADR-025-integracao-masterway.md`
- Cegid Vendus escolhido: plano Pro (15,83 EUR/mês anual), certificado AT 2230
- SAF-T automático com comunicação directa AT, ATCUD, assinatura digital, guias de transporte AT
- API REST disponível imediatamente após subscrição (APPS > API)
- Masterway rejeitada: sem SAF-T automático via API, não cobre requisitos fiscais completos
- Cegid Invoicing Engine rejeitada: enterprise desnecessário para volume CSN
- CSN Opus envia ordem → Cegid Vendus gera doc certificado (ATCUD + QR + assinatura digital) → devolve ID + PDF URL
- Faturas no Supabase são metadados e referências externas (não documentos fiscais)
- **Commits:** `a07b761` (ADR original), `d32a6fa` (actualização Cegid Vendus)

### Parte 2: Migration 015 — Faturação Masterway (tabelas)
- **3 tabelas criadas no Supabase:** `clientes_faturacao`, `faturas`, `notas_credito`
- Ficheiro: `supabase/015_faturas_masterway.sql`
- Nível ISA-95: Nível 4 (ERP)
- **Commits:** `c7d446a` (refactor InvoiceXpress → Masterway), `b66c369` (migration original)

### Parte 3: Fix obra_id
- `obra_id TEXT` → `obra_id INTEGER` na tabela `faturas` (match tipo `dossie_obra.id`)
- **Commit:** `d80c2a4`

### Parte 4: Recibos 2025 extraídos
- João António: recibos Jan, Fev, Mar, Jul 2025 extraídos dos PDFs originais
- Todos os 3 colaboradores: recibos Jul 2025 extraídos
- Dados prontos para inserção na tabela `recibos_vencimento`

### Parte 5: Módulo Financeiro planeado
- **Migration 016 planeada:** `movimentos_bancarios`, `fornecedores`, campo `iban` em colaboradores e clientes
- Objectivo: gestão financeira integrada com rastreabilidade bancária

### Parte 6: Extrato BPI analisado
- Extrato bancário BPI analisado e integrado na gestão documental
- Identificado como tipo de documento a ingerir pelo Agente Documental
- Classificação automática de movimentos bancários → associação a obras/fornecedores

### Notas técnicas da sessão:
- Cegid Vendus API: `CEGID_VENDUS_API_KEY` env var necessária (backend only)
- Tabela `faturas`: campo `masterway_id` será renomeado para `vendus_id` na próxima migration
- Tabela `faturas`: metadados + referência externa, nunca documento fiscal
- `nivel_isa95` campo presente na migration (nível 4 ERP)
- Extratos bancários: novo tipo documental para Agente Documental

---

## INFRAESTRUTURA

| Componente | Estado |
|---|---|
| Supabase | ✅ 28 tabelas existentes |
| Vercel | ✅ auto-deploy via GitHub main |
| GitHub | ✅ duartebustorff-star/csn-producao |
| Claude API | ✅ claude-sonnet-4-5 |
| ANTHROPIC_API_KEY | ✅ Vercel env vars |
| Cegid Vendus | ⚠️ Plano Pro a subscrever (15,83 EUR/mês) — cert AT 2230 |

---

## TABELAS SUPABASE — 28 EXISTENTES

obras · fases_obra · timetracking · templates_fases · notas_obra · calendario · leads · davs · fams · inspecoes · cits · dossie_obra · obras_dossier_status · certificados_matricula · certificacoes_empresa · audit_log · colaboradores · ausencias · documentos_rh · mensagens · lugares_parque · research_tasks · colaboradores_rh · processamentos_mensais · recibos_vencimento · **clientes_faturacao** ✅ · **faturas** ✅ · **notas_credito** ✅

## MIGRATIONS

| Migration | Tabelas principais | Estado |
|---|---|---|
| **015** | **clientes_faturacao, faturas, notas_credito** | **✅ COMPLETA — Cegid Vendus (ADR-025)** |
| **016** | **movimentos_bancarios, fornecedores, iban cols** | **⚠️ PLANEADA** |
| 017 | nao_conformidades, wps, wpqr, certificados_soldadores, inspecoes_soldadura | ❌ |
| 018 | stocks, lotes_material, certificados_material, movimentos_stock | ❌ |
| 019 | equipamentos_csn, manutencao_plano, avarias, formacoes, epis | ❌ |
| 020 | marcas_veiculo, nomenclatura_marcas, qualidade_dados_marca, monitorizacao_marcas | ❌ |
| **021** | **colaboradores_rh, processamentos_mensais, recibos_vencimento** | **✅ COMPLETA** |
| 022 | equipamentos_carrocaria, tipos_carrocaria | ❌ |
| 023 | sops, work_instructions, cadernos_montagem, passos_caderno | ❌ |
| 024 | analises_fea | ❌ |

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
| **025** | **Integração Cegid Vendus — faturação certificada AT** | **CIVA, ISA-95 nível 4** |

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
| `supabase/015_faturas_masterway.sql` | ✅ Corrida no Supabase (3 tabelas — Cegid Vendus) |
| `supabase/021_carolina_salarios.sql` | ✅ Corrida no Supabase (3 tabelas + 15 recibos) |
| `docs/ADR-025-integracao-masterway.md` | ✅ Decisão faturação Cegid Vendus |
| `.vercelignore` | ✅ Exclui _research/, docs/, supabase/, Marcas - Veiculos/, knowledge-base/ |

---

## FATURAÇÃO CEGID VENDUS — ✅ MIGRATION 015 COMPLETA

### Decisão (ADR-025)
- CSN Opus **não é** software de faturação certificado AT
- Cegid Vendus: plano Pro, 15,83 EUR/mês (anual), certificado AT 2230
- SAF-T automático com comunicação directa AT, ATCUD, assinatura digital, guias de transporte AT
- API key disponível imediatamente após subscrição (APPS > API)
- Fluxo: CSN Opus envia ordem → Cegid Vendus gera doc certificado (ATCUD + QR + assinatura digital) → devolve ID + PDF URL
- SAF-T comunicado automaticamente à AT — sem intervenção manual

### Alternativas rejeitadas
- **Masterway:** conta activa (3,75 EUR/mês) mas sem SAF-T automático via API; não cobre requisitos fiscais completos
- **Cegid Invoicing Engine:** enterprise; desnecessário para volume CSN
- **InvoiceXpress:** custos superiores; migração abandonada

### Tabelas DB (migration 015)
- `clientes_faturacao` — nome, NIF, email, morada, masterway_client_id (renomear → vendus_client_id)
- `faturas` — numero_fatura, serie, masterway_id (renomear → vendus_id), obra_id (INTEGER FK), estado, tipo, valores, pdf_url
- `notas_credito` — fatura_original_id FK, masterway_id (renomear → vendus_id), motivo, total

### Env var necessária
- `CEGID_VENDUS_API_KEY` — backend only, nunca exposta ao frontend

### Próximos passos faturação:
- Subscrever plano Pro Cegid Vendus
- Renomear campos `masterway_*` → `vendus_*` nas tabelas (migration 016 ou ALTER)
- Implementar API route `/api/faturacao/emitir` (POST → Cegid Vendus API)
- Implementar API route `/api/faturacao/listar` (GET faturas por obra)
- UI de faturação no CSN Opus (admin-only)

---

## MÓDULO FINANCEIRO — ⚠️ PLANEADO (MIGRATION 016)

### Tabelas planeadas
- `movimentos_bancarios` — data, descricao, valor, saldo, banco, conta, obra_id, fornecedor_id, categoria
- `fornecedores` — nome, NIF, morada, IBAN, contacto, notas, activo
- Campo `iban` a adicionar em `colaboradores_rh` e `clientes_faturacao`

### Extrato BPI
- Extrato bancário BPI analisado como tipo documental
- A ingerir pelo Agente Documental: classificação automática de movimentos → associação a obras/fornecedores
- Reconciliação bancária automática: movimentos ↔ faturas emitidas ↔ recibos

---

## CAROLINA — SISTEMA COMPLETO

### Tabelas DB
- `colaboradores_rh` — 3 colaboradores (Bohdan, José Júlio, João António)
- `processamentos_mensais` — 6 meses (Out 2025–Mar 2026)
- `recibos_vencimento` — 15+ recibos (Out 2025–Fev 2026 + Jul 2025 extraídos)

### Recibos Inseridos

| Mês | Bohdan (líq.) | José Júlio (líq.) | João António (líq.) |
|---|---|---|---|
| Jul 2025 | ✅ extraído | ✅ extraído | ✅ extraído |
| Out 2025 | 1043.52 | 1008.00 | 1008.00 |
| Nov 2025 | 1029.87 | 994.35 | 994.35 |
| Dez 2025 | 1043.52 | 1008.00 | 1008.00 |
| Jan 2026 | 1092.94 | 1055.37 | 1055.37 |
| Fev 2026 | 1083.84 | 523.15 (baixa 10/20 dias) | 1046.27 |

### Recibos 2025 extraídos (sessão 23)
- João António: Jan, Fev, Mar, Jul 2025
- Todos (3 colaboradores): Jul 2025
- Dados prontos para inserção na tabela `recibos_vencimento`

### API Endpoints
- `GET /api/carolina/recibo?colaborador_rh_id=X&ano=Y&mes=Z` → PDF recibo
- `GET /api/carolina/declaracao-anual?colaborador_rh_id=X&ano=Y` → PDF declaração
- `GET /api/carolina/colaboradores` → JSON lista colaboradores

### Interface
- Tab RH → sub-tab "Salários" (admin-only)
- Cards expansíveis por colaborador com botões PDF

### Próximos passos Carolina:
- Inserir recibos 2025 extraídos no Supabase
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
| P1 | 🔴 | Subscrever Cegid Vendus Pro + API routes faturação |
| P2 | 🔴 | Migration 016 — módulo financeiro (movimentos_bancarios, fornecedores, iban) |
| P3 | 🔴 | Carolina — persona chat + tools RH dedicados |
| P4 | 🔴 | Agente Documental (inclui ingestão extratos bancários) |
| P5 | 🔴 | Reescrever gerar-termo |
| P6 | 🔴 | Inserir recibos 2025 extraídos no Supabase |
| P7 | 🟡 | Renomear campos masterway_* → vendus_* nas tabelas |
| P8 | 🟡 | Migration 020 — CSN Brain (marcas_veiculo) |
| P9 | 🟡 | Função calcular_box_rules() |
| P10 | 🟡 | Página Gestão de OTs no CSN Opus |
| P11 | 🟡 | COC Electrónico IMT — deadline Jul 2026 |
| P12 | ⚪ | Luísa — Assistente CEO |
| P13 | ⚪ | Fernando — migrar Sr. Manuel com persona liderança |
| P14 | ⚪ | Knowledge Base Nastran para Agente FEA |
| P15 | ⚪ | Registar CSN como bodybuilder nos portais MAN, DAF, Iveco |

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
- **CEGID_VENDUS_API_KEY:** backend only — nunca exposta ao frontend
- **Extratos bancários:** tipo documental para Agente Documental — reconciliação automática

---

## EMPRESA

- **Marca:** CSN Technic — Commercial Vehicle Engineering
- **Nome legal:** Carlos dos Santos Nascimento, Lda
- **NIF:** 500 861 790
- **Morada:** Rua da Industria nº8, Casal do Rôdo, 2640-216 Encarnação
- **CEO:** Duarte da Cunha Martins Bustorff-Silva
- **Certidão:** 3172-1374-8252
