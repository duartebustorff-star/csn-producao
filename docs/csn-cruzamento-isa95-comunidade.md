# CSN Technic — Cruzamento ISA-95 × Skills Comunidade
**08/04/2026 · Fonte: alirezarezvani/claude-skills (10k★, 223 skills)**

## LEGENDA
- 🟢 COBERTO — skill comunidade resolve directamente
- 🟡 ADAPTAR — skill comunidade existe mas precisa contextualização CSN
- 🔴 CUSTOM — não existe, tem de ser criado do zero (específico CSN/normas)
- 🔵 ANTHROPIC — skill nativo da plataforma

---

## L4-COM — Comercial / Marketing / Vendas

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| proposta-comercial | — | — | 🔴 CUSTOM (já criado S43) |
| cold-outreach | demand-generation | marketing-skill/ | 🟡 ADAPTAR (genérico SaaS → CSN carroçarias) |
| social-media | content-creator, social-media-analyzer | marketing-skill/ | 🟡 ADAPTAR (tem frameworks bons, falta contexto PT) |
| follow-up | sales-enablement | marketing-skill/ | 🟡 ADAPTAR |
| catalogo-produto | product-marketing-strategy | marketing-skill/ | 🟡 ADAPTAR |
| case-study | content-creator | marketing-skill/ | 🟡 ADAPTAR |
| argumentario-vendas | sales-enablement, competitive-intel | marketing-skill/ | 🟡 ADAPTAR |
| copywriting-produto | content-creator | marketing-skill/ | 🟡 ADAPTAR |
| email-marketing | demand-generation | marketing-skill/ | 🟡 ADAPTAR |
| analise-concorrencia | competitive-intelligence | c-level-advisor/ | 🟢 COBERTO (framework completo) |
| pitch-deck | — | — | 🔴 CUSTOM (já criado S43) |
| press-release | pr-communications | marketing-skill/ | 🟡 ADAPTAR |
| qualificacao-lead | demand-generation | marketing-skill/ | 🟡 ADAPTAR |
| crm-relatorio-mensal | campaign-analytics | marketing-skill/ | 🟡 ADAPTAR |

**Resumo L4-COM: 2 custom (já criados) · 11 adaptar · 1 coberto**
**Instalar: `marketing-skills` (44 skills) + `competitive-intelligence` do c-level**

---

## L4-FIN — Financeiro

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| emitir_fatura | — | — | ✅ EXISTE (InvoiceXpress) |
| cash_flow_forecast | financial-analyst (DCF, scenario modeling) | finance/ | 🟡 ADAPTAR (PME industrial ≠ SaaS) |
| orcamento_anual | financial-analyst (budgeting) | finance/ | 🟡 ADAPTAR |
| rentabilidade_obra | — | — | 🔴 CUSTOM (específico obras carroçaria) |
| cobrancas | — | — | 🔴 CUSTOM (contexto PT, prazos pagamento) |
| reconciliacao_bancaria | — | — | 🔴 CUSTOM (BPI + Novo Banco, formato PT) |
| relatorio_fiscal | — | — | 🔴 CUSTOM (legislação fiscal PT) |
| pricing_margem | saas-metrics-coach | finance/ | 🟡 ADAPTAR (pricing industrial ≠ SaaS) |
| comparacao_cotacoes | — | — | 🔴 CUSTOM |
| ordem_compra | — | — | 🔴 CUSTOM |

**Resumo L4-FIN: 6 custom · 3 adaptar · 1 existe**
**Instalar: `finance-skills` (3 skills) — usar como base, mas maioria é custom**

---

## L4-ENG — Engenharia

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| analise-fabricante | — | — | ✅ EXISTE (skill v4 CSN) |
| gerar_coc | — | — | 🔴 CUSTOM (Reg. 2018/858, específico PT) |
| validar_coc | — | — | 🔴 CUSTOM |
| imt_coc_api | — | — | 🔴 CUSTOM (API IMT Portugal) |
| dist_carga | — | — | 🔴 CUSTOM (Dir. 96/53/CE, cálculo eixos) |
| spec_amarracao | — | — | 🔴 CUSTOM (EN 12640) |
| calc_12195 | — | — | 🔴 CUSTOM (EN 12195-1) |
| ilogic_configurador | — | — | 🔴 CUSTOM (Inventor paramétrico — Cowork já começou) |
| ilogic_fea | pyNastran (448★) | externo | 🟡 ADAPTAR (pyNastran + iLogic scripts) |
| especificacao_produto | — | — | 🔴 CUSTOM |
| change_request | — | engineering-team/ | 🟡 ADAPTAR |
| relatorio_tecnico | — | — | 🔴 CUSTOM (formato EN 1090) |

**Resumo L4-ENG: 9 custom · 2 adaptar · 1 existe**
**A secção mais específica CSN — quase tudo é custom**

---

## L4-CST — Custos / Controlo de Gestão

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| custo_por_obra | — | — | 🔴 CUSTOM |
| break_even_analysis | financial-analyst | finance/ | 🟡 ADAPTAR |
| kpi_financeiros | saas-metrics-coach | finance/ | 🟡 ADAPTAR |
| relatorio_gestao_mensal | cfo-advisor | c-level-advisor/ | 🟡 ADAPTAR |
| gestao_riscos | — | — | 🔴 CUSTOM (ISO 9001 cl.6 + ISO 31000) |

**Resumo L4-CST: 2 custom · 3 adaptar**

---

## L4-RSH — Research

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| web_search | autoresearch-agent | engineering/ | 🟢 COBERTO |
| benchmark_sector | competitive-intelligence | c-level-advisor/ | 🟢 COBERTO |

**Resumo L4-RSH: 0 custom · 0 adaptar · 2 cobertos + 4 existem**

---

## L3-PRD — Produção

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| plano_producao | — | — | 🔴 CUSTOM (fases_obra, ISA-95 L3) |
| checklist_fase | — | — | 🔴 CUSTOM (EN 1090 por fase) |
| rastrear_material | — | — | 🔴 CUSTOM (cert 3.1 → obra) |
| plano_soldadura | — | — | 🔴 CUSTOM (EN ISO 3834) |
| rastrear_soldadura | — | — | 🔴 CUSTOM (soldador/WPS/junta) |
| ordem_fabrico | — | — | 🔴 CUSTOM |
| instrucao_trabalho | — | — | 🔴 CUSTOM |
| relatorio_producao_diario | — | — | 🔴 CUSTOM |
| calculo_capacidade | — | — | 🔴 CUSTOM |
| planeamento_semanal | — | — | 🔴 CUSTOM |

**Resumo L3-PRD: 10 custom · 0 adaptar — 100% custom (domínio fabrico)**

---

## L3-QMS — Qualidade

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| registar_nc | iso-13485-qms, capa-management | ra-qm-team/ | 🟡 ADAPTAR (MedTech→metalomecânica) |
| gerar_itp | — | — | 🔴 CUSTOM (EN 1090) |
| gerar_fpc | — | — | 🔴 CUSTOM (EN 1090) |
| gerar_dop | — | — | 🔴 CUSTOM (EN 1090) |
| etiqueta_ce | — | — | 🔴 CUSTOM |
| controlo_consumiveis | — | — | 🔴 CUSTOM (EN ISO 3834) |
| insp_visual_sold | — | — | 🔴 CUSTOM (EN ISO 17637) |
| gerar_manual_sgq | iso-13485-qms | ra-qm-team/ | 🟡 ADAPTAR (estrutura QMS reutilizável) |
| auditoria_interna | iso-13485-qms | ra-qm-team/ | 🟡 ADAPTAR |
| revisao_gestao | — | — | 🔴 CUSTOM |
| satisfacao_cliente | customer-success | business-growth/ | 🟡 ADAPTAR |
| analise_causa_raiz | capa-management | ra-qm-team/ | 🟡 ADAPTAR |
| checklists UNECE/GSR/spray | — | — | 🔴 CUSTOM (6 checklists, 100% domínio) |
| EN 12642 (FEA, cert, etiqueta) | — | — | 🔴 CUSTOM (3 skills) |
| cert_amarracao | — | — | 🔴 CUSTOM (EN 12640) |

**Resumo L3-QMS: 16 custom · 5 adaptar**
**Instalar: `ra-qm-skills` (14 skills) — ISO 13485 QMS + CAPA + risk management como base**

---

## L3-MNT — Manutenção

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| plano_manutencao | — | — | 🔴 CUSTOM (ISO 55000) |
| registo_manutencao | — | — | 🔴 CUSTOM |
| alerta_manutencao | — | — | 🔴 CUSTOM |

**Resumo L3-MNT: 3 custom**

---

## L3-PER — Pessoal / KPIs

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| kpi_qualidade | — | — | 🔴 CUSTOM (ISO 22400) |
| kpi_oee | — | — | 🔴 CUSTOM (ISO 22400) |
| dashboard_22400 | — | — | 🔴 CUSTOM |

**Resumo L3-PER: 3 custom**

---

## L3-DOC — Documentação

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| classificar_documento | — | — | 🔴 CUSTOM |
| verificar_completude_obra | — | — | 🔴 CUSTOM |
| dossier_obra_completo | — | — | 🔴 CUSTOM |

**Resumo L3-DOC: 3 custom**

---

## L3-INV — Inventário / Fornecedores

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| fornecedores_ambiental | — | — | 🔴 CUSTOM (ISO 14001) |
| avaliacao_fornecedor | — | — | 🔴 CUSTOM |
| negociacao_preco | sales-engineer | business-growth/ | 🟡 ADAPTAR |
| gestao_stock | — | — | 🔴 CUSTOM |

**Resumo L3-INV: 3 custom · 1 adaptar**

---

## RH — Recursos Humanos

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| plano_formacoes | — | — | 🔴 CUSTOM (ISO 45001) |
| registo_epis | — | — | 🔴 CUSTOM (ISO 45001) |
| matriz_riscos_sst | risk-management | ra-qm-team/ | 🟡 ADAPTAR |
| registo_acidentes | — | — | 🔴 CUSTOM (ISO 45001) |
| cert_soldadores | — | — | 🔴 CUSTOM (EN ISO 9606) |
| onboarding | — | — | 🔴 CUSTOM |
| avaliacao_desempenho | — | — | 🔴 CUSTOM |
| descricao_funcoes | — | — | 🔴 CUSTOM |
| contrato_trabalho | — | — | 🔴 CUSTOM (legislação PT) |
| comunicacao_interna | — | — | 🔴 CUSTOM |

**Resumo RH: 9 custom · 1 adaptar**

---

## AMB — Ambiente (ISO 14001)

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| Todos os 5 skills | — | — | 🔴 CUSTOM (100% — ISO 14001 não existe na comunidade) |

**Resumo AMB: 5 custom**

---

## JUR — Jurídico

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| contrato_cliente | contract-proposal-writer | business-growth/ | 🟡 ADAPTAR |
| contrato_fornecedor | contract-proposal-writer | business-growth/ | 🟡 ADAPTAR |
| termos_condicoes | — | — | 🔴 CUSTOM (legislação PT) |
| rgpd_privacidade | gdpr-dsgvo | ra-qm-team/ | 🟢 COBERTO |
| reclamacao_formal | — | — | 🔴 CUSTOM |
| analise_regulamentar | regulatory-affairs-head | ra-qm-team/ | 🟡 ADAPTAR |
| seguro_sinistro | — | — | 🔴 CUSTOM |

**Resumo JUR: 4 custom · 2 adaptar · 1 coberto**

---

## EST — Estratégia

| Skill CSN | Comunidade | Pacote | Veredicto |
|-----------|-----------|--------|-----------|
| business_plan | ceo-advisor, strategy | c-level-advisor/ | 🟢 COBERTO |
| analise_swot | competitive-intelligence | c-level-advisor/ | 🟢 COBERTO |
| okrs_objectivos | ceo-advisor | c-level-advisor/ | 🟢 COBERTO |
| candidatura_incentivos | — | — | 🔴 CUSTOM (SICE, PRR, Portugal 2030) |
| acta_reuniao | chief-of-staff | c-level-advisor/ | 🟢 COBERTO |

**Resumo EST: 1 custom · 4 cobertos**
**Instalar: `c-level-skills` (34 skills) — cobre quase tudo de estratégia**

---

## RESUMO GLOBAL

| Veredicto | Quantidade | % |
|-----------|-----------|---|
| 🟢 COBERTO (usar directo) | 10 | 10% |
| 🟡 ADAPTAR (contextualizar CSN) | 27 | 26% |
| 🔴 CUSTOM (criar do zero) | 66 | 64% |
| **TOTAL skills por criar** | **103** | |

### PACOTES COMUNIDADE A INSTALAR (por prioridade)

| # | Pacote | Skills | Cobre secção |
|---|--------|--------|-------------|
| 1 | `marketing-skills` | 44 | L4-COM (11 adaptar) |
| 2 | `c-level-skills` | 34 | EST (4 cobertos) + L4-CST (3 adaptar) |
| 3 | `ra-qm-skills` | 14 | L3-QMS (5 adaptar) + JUR (2 adaptar) |
| 4 | `finance-skills` | 3 | L4-FIN (3 adaptar) |
| 5 | `business-growth-skills` | 5 | JUR + L3-INV (3 adaptar) |
| 6 | `product-skills` | 15 | L4-COM complementar |
| 7 | `pm-skills` | 7 | L3-PRD complementar |
| **TOTAL** | | **122** | **37 skills directamente úteis** |

### O QUE FICA 100% CUSTOM CSN (66 skills)

Os 66 skills custom dividem-se em:
- **Normativos EU** (42): EN 1090, EN ISO 3834, EN 12642, UNECE, GSR, Dir. 96/53, ISO 14001, ISO 45001
- **Domínio carroçarias** (12): plano produção, rastreabilidade, iLogic, FEA, configurador
- **Legislação PT** (7): IMT, fiscal, contratos, SICE, e-fatura
- **RH/Operações PT** (5): recibos, formações, EPIs, acidentes
