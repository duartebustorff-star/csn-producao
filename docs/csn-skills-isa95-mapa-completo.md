# CSN Technic — Mapa de Skills por Secção ISA-95
**Documento fundador · 08/04/2026**
**Codificação interna: CSN-L[nível]-[secção]-[seq]-[ano]**

---

## L4-BPL — BUSINESS PLANNING & LOGISTICS (ERP/CRM)
*ISA-95 Part 4 / B2MML · ISO 9001 · ISO 14001 · ISO 31000*

---

### L4-COM — Comercial / Marketing / Vendas
**ISA-95:** Order Processing, Marketing & Sales
**Agente:** Ag. Comercial | **Persona:** Marta (C2)
**Normas:** Reg. 2018/858 (requisitos cliente), ISO 9001 cl.8.2 (requisitos produto)

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `proposta-comercial` | Universal | ✅ CRIADO S43 |
| 2 | `cold-outreach` | Universal | ✅ CRIADO S43 |
| 3 | `social-media` | Universal | ✅ CRIADO S43 |
| 4 | `follow-up` | Universal | ✅ CRIADO S43 |
| 5 | `catalogo-produto` | Universal | ✅ CRIADO S43 |
| 6 | `case-study` | Universal | ✅ CRIADO S43 |
| 7 | `argumentario-vendas` | Universal | ✅ CRIADO S43 |
| 8 | `copywriting-produto` | Universal | ✅ CRIADO S43 |
| 9 | `email-marketing` | Universal | ✅ CRIADO S43 |
| 10 | `analise-concorrencia` | Universal | ✅ CRIADO S43 |
| 11 | `pitch-deck` | Universal | ✅ CRIADO S43 |
| 12 | `press-release` | Universal | ✅ CRIADO S43 |
| 13 | `criar_lead` | Sistema | ✅ EXISTE |
| 14 | `pipeline_ticket` | Sistema | ✅ EXISTE |
| 15 | `validar_lead_para_obra` | Sistema | ✅ EXISTE (gate) |
| 16 | `qualificacao_lead` | Universal | ❌ POR CRIAR |
| 17 | `crm_relatorio_mensal` | Universal | ❌ POR CRIAR |

---

### L4-FIN — Financeiro / Contabilidade
**ISA-95:** Product Cost Accounting, Procurement
**Agente:** Ag. Financeiro | **Norma:** ISO 9001 cl.7.1 (recursos)

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `emitir_fatura` | Sistema | ✅ EXISTE (InvoiceXpress) |
| 2 | `listar_faturas` | Sistema | ✅ EXISTE |
| 3 | `efatura_sync` | Sistema | ✅ EXISTE |
| 4 | `modelo_custos` | Sistema | ✅ EXISTE |
| 5 | `cash_flow_forecast` | Universal | ❌ POR CRIAR |
| 6 | `orcamento_anual` | Universal | ❌ POR CRIAR |
| 7 | `rentabilidade_obra` | Universal | ❌ POR CRIAR |
| 8 | `cobrancas` | Universal | ❌ POR CRIAR |
| 9 | `reconciliacao_bancaria` | Universal | ❌ POR CRIAR |
| 10 | `relatorio_fiscal` | Universal | ❌ POR CRIAR |
| 11 | `pricing_margem` | Universal | ❌ POR CRIAR |
| 12 | `comparacao_cotacoes` | Universal | ❌ POR CRIAR |
| 13 | `ordem_compra` | Universal | ❌ POR CRIAR |

---

### L4-ENG — Engenharia / Projecto
**ISA-95:** Product Definition Management, R&D
**Agente:** Ag. Engenharia | **Norma:** EN 1090-2 (design), Reg. 2018/858 (homologação)

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `analise-fabricante` | Domínio | ✅ EXISTE (skill v4) |
| 2 | `perfil_fabricante` | Sistema | ✅ EXISTE |
| 3 | `dados_brutos_fabricante` | Sistema | ✅ EXISTE |
| 4 | `dav_extract` | Sistema | ✅ EXISTE |
| 5 | `fam_extract` | Sistema | ✅ EXISTE |
| 6 | `gerar_coc` | Norma | ❌ POR CRIAR |
| 7 | `validar_coc` | Norma | ❌ POR CRIAR |
| 8 | `imt_coc_api` | Norma | ❌ POR CRIAR (Jul 2026) |
| 9 | `dist_carga` | Norma | ❌ POR CRIAR (Dir. 96/53) |
| 10 | `spec_amarracao` | Norma | ❌ POR CRIAR (EN 12640) |
| 11 | `calc_12195` | Norma | ❌ POR CRIAR (EN 12195-1) |
| 12 | `especificacao_produto` | Universal | ❌ POR CRIAR |
| 13 | `change_request` | Universal | ❌ POR CRIAR |
| 14 | `relatorio_tecnico` | Universal | ❌ POR CRIAR |
| 15 | `lessons_learned` | Universal | ❌ POR CRIAR |

---

### L4-CST — Custos / Controlo de Gestão
**ISA-95:** Product Cost Accounting
**Norma:** ISO 9001 cl.7.1, ISO 31000 (risco)

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `custo_por_obra` | Universal | ❌ POR CRIAR |
| 2 | `break_even_analysis` | Universal | ❌ POR CRIAR |
| 3 | `kpi_financeiros` | Universal | ❌ POR CRIAR |
| 4 | `relatorio_gestao_mensal` | Universal | ❌ POR CRIAR |
| 5 | `gestao_riscos` | Norma | ❌ POR CRIAR (ISO 9001 cl.6) |

---

### L4-RSH — Research / Investigação
**ISA-95:** R&D
**Agente:** Ag. Research (ADR-022)

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `web_search` | Sistema | ✅ EXISTE |
| 2 | `fetch_url` | Sistema | ✅ EXISTE |
| 3 | `save_finding` | Sistema | ✅ EXISTE |
| 4 | `conclude_research` | Sistema | ✅ EXISTE |
| 5 | `benchmark_sector` | Universal | ❌ POR CRIAR |

---

## L3-MOM — MANUFACTURING OPERATIONS MANAGEMENT (MES)
*MESA-11 · ISO 22400 · ISO 45001 · ISO 55001*

---

### L3-PRD — Produção
**MESA:** #1 Resource Allocation, #2 Scheduling, #3 Dispatching, #8 Process Mgmt, #10 Product Tracking
**Agente:** Ag. Produção | **Persona:** Fernando (C2)
**Normas:** EN 1090-2, EN ISO 3834-3

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `estado_obra` | Sistema | ✅ EXISTE |
| 2 | `iniciar_timer` | Sistema | ✅ EXISTE |
| 3 | `parar_timer` | Sistema | ✅ EXISTE |
| 4 | `concluir_fase` | Sistema | ✅ EXISTE |
| 5 | `plano_producao` | Norma | ❌ POR CRIAR (ISO 9001 cl.8) |
| 6 | `checklist_fase` | Norma | ❌ POR CRIAR (EN 1090) |
| 7 | `rastrear_material` | Norma | ❌ POR CRIAR (EN 1090) |
| 8 | `plano_soldadura` | Norma | ❌ POR CRIAR (EN ISO 3834) |
| 9 | `rastrear_soldadura` | Norma | ❌ POR CRIAR (EN ISO 3834) |
| 10 | `ordem_fabrico` | Universal | ❌ POR CRIAR |
| 11 | `instrucao_trabalho` | Universal | ❌ POR CRIAR |
| 12 | `relatorio_producao_diario` | Universal | ❌ POR CRIAR |
| 13 | `calculo_capacidade` | Universal | ❌ POR CRIAR |
| 14 | `planeamento_semanal` | Universal | ❌ POR CRIAR |

---

### L3-QMS — Qualidade
**MESA:** #7 Quality Management
**Agente:** Ag. Qualidade (POR FAZER)
**Normas:** ISO 9001, EN 1090, EN ISO 3834, EN ISO 5817, EN ISO 17637

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `registar_nc` | Norma | ❌ POR CRIAR (ISO 9001+1090+3834) |
| 2 | `gerar_itp` | Norma | ❌ POR CRIAR (EN 1090) |
| 3 | `gerar_fpc` | Norma | ❌ POR CRIAR (EN 1090) |
| 4 | `gerar_dop` | Norma | ❌ POR CRIAR (EN 1090) |
| 5 | `etiqueta_ce` | Norma | ❌ POR CRIAR (EN 1090) |
| 6 | `controlo_consumiveis` | Norma | ❌ POR CRIAR (EN ISO 3834) |
| 7 | `nc_soldadura` | Norma | ❌ POR CRIAR (EN ISO 3834) |
| 8 | `insp_visual_sold` | Norma | ❌ POR CRIAR (EN ISO 17637) |
| 9 | `criterios_5817` | Norma | ❌ POR CRIAR (EN ISO 5817) |
| 10 | `foto_soldadura` | Norma | ❌ POR CRIAR |
| 11 | `checklist_gsr` | Norma | ❌ POR CRIAR (Reg. 2019/2144) |
| 12 | `registo_gsr` | Norma | ❌ POR CRIAR |
| 13 | `checklist_r48` | Norma | ❌ POR CRIAR (UNECE R48) |
| 14 | `checklist_r73` | Norma | ❌ POR CRIAR (UNECE R73) |
| 15 | `checklist_r58` | Norma | ❌ POR CRIAR (UNECE R58) |
| 16 | `checklist_spray` | Norma | ❌ POR CRIAR (Reg. 109/2011) |
| 17 | `fea_report` | Norma | ❌ POR CRIAR (EN 12642) |
| 18 | `cert_12642` | Norma | ❌ POR CRIAR (EN 12642) |
| 19 | `etiqueta_lxl` | Norma | ❌ POR CRIAR (EN 12642) |
| 20 | `cert_amarracao` | Norma | ❌ POR CRIAR (EN 12640) |
| 21 | `gerar_manual_sgq` | Norma | ❌ POR CRIAR (ISO 9001) |
| 22 | `auditoria_interna` | Norma | ❌ POR CRIAR (ISO 9001+14001+45001) |
| 23 | `revisao_gestao` | Norma | ❌ POR CRIAR (ISO 9001) |
| 24 | `satisfacao_cliente` | Universal | ❌ POR CRIAR |
| 25 | `analise_causa_raiz` | Universal | ❌ POR CRIAR |

---

### L3-MNT — Manutenção
**MESA:** #9 Maintenance Management
**Agente:** Ag. Manutenção (POR FAZER)
**Norma:** ISO 55000

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | MNT-001→004 | Sistema | ✅ EXISTE (obras internas) |
| 2 | `plano_manutencao` | Norma | ❌ POR CRIAR (ISO 55000) |
| 3 | `registo_manutencao` | Norma | ❌ POR CRIAR |
| 4 | `alerta_manutencao` | Norma | ❌ POR CRIAR |

---

### L3-PER — Pessoal / Timetracking
**MESA:** #6 Labor Management
**Agente:** Ag. Produção (timer) | **Norma:** ISO 22400

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `iniciar_timer` | Sistema | ✅ EXISTE |
| 2 | `parar_timer` | Sistema | ✅ EXISTE |
| 3 | 6 KPIs ISO 22400 | Sistema | ✅ EXISTE |
| 4 | `kpi_qualidade` | Norma | ❌ POR CRIAR (ISO 22400) |
| 5 | `kpi_oee` | Norma | ❌ POR CRIAR (ISO 22400) |
| 6 | `dashboard_22400` | Norma | ❌ POR CRIAR |

---

### L3-DOC — Documentação
**MESA:** #4 Document Control
**Agente:** Ag. Documental

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `gerar_termo_responsabilidade` | Sistema | ✅ EXISTE |
| 2 | `gerar_checklist_entrega` | Sistema | ✅ EXISTE |
| 3 | `classificar_documento` | Sistema | ❌ POR CRIAR |
| 4 | `verificar_completude_obra` | Sistema | ❌ POR CRIAR |
| 5 | `dossier_obra_completo` | Norma | ❌ POR CRIAR |

---

### L3-INV — Inventário / Fornecedores
**MESA:** #10 Product Tracking (material)
**Agente:** Ag. Fornecedores + Ag. Inventário (POR FAZER)

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `classificar_email` | Sistema | ✅ EXISTE |
| 2 | `identificar_remetente` | Sistema | ✅ EXISTE |
| 3 | `fornecedores_ambiental` | Norma | ❌ POR CRIAR (ISO 14001) |
| 4 | `avaliacao_fornecedor` | Universal | ❌ POR CRIAR |
| 5 | `negociacao_preco` | Universal | ❌ POR CRIAR |
| 6 | `gestao_stock` | Universal | ❌ POR CRIAR |

---

## TRANSVERSAIS (servem múltiplos níveis)

---

### RH — Recursos Humanos
**Agente:** Ag. RH | **Persona:** Carolina (C2)
**Normas:** ISO 45001, ISO 9001 cl.7.2 (competência)

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `gerar_recibo` | Sistema | ✅ EXISTE |
| 2 | `calcular_ferias` | Sistema | ✅ EXISTE |
| 3 | `plano_formacoes` | Norma | ❌ POR CRIAR (ISO 45001) |
| 4 | `registo_epis` | Norma | ❌ POR CRIAR (ISO 45001) |
| 5 | `matriz_riscos_sst` | Norma | ❌ POR CRIAR (ISO 45001) |
| 6 | `registo_acidentes` | Norma | ❌ POR CRIAR (ISO 45001) |
| 7 | `inspeccao_seguranca` | Norma | ❌ POR CRIAR (ISO 45001) |
| 8 | `consulta_trabalhadores` | Norma | ❌ POR CRIAR (ISO 45001) |
| 9 | `cert_soldadores` | Norma | ❌ POR CRIAR (EN ISO 9606) |
| 10 | `registar_wpqr` | Norma | ❌ POR CRIAR (EN ISO 15614) |
| 11 | `onboarding` | Universal | ❌ POR CRIAR |
| 12 | `avaliacao_desempenho` | Universal | ❌ POR CRIAR |
| 13 | `descricao_funcoes` | Universal | ❌ POR CRIAR |
| 14 | `contrato_trabalho` | Universal | ❌ POR CRIAR |
| 15 | `comunicacao_interna` | Universal | ❌ POR CRIAR |

---

### AMB — Ambiente (ISO 14001)
**Norma:** ISO 14001

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `id_aspectos_ambientais` | Norma | ❌ POR CRIAR |
| 2 | `registo_residuos` | Norma | ❌ POR CRIAR |
| 3 | `monitorizacao_energia` | Norma | ❌ POR CRIAR |
| 4 | `objectivos_ambientais` | Norma | ❌ POR CRIAR |
| 5 | `programa_ambiental` | Norma | ❌ POR CRIAR |

---

### JUR — Jurídico / Compliance
**Norma:** RGPD, Código Trabalho, legislação comercial

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `contrato_cliente` | Universal | ❌ POR CRIAR |
| 2 | `contrato_fornecedor` | Universal | ❌ POR CRIAR |
| 3 | `termos_condicoes` | Universal | ❌ POR CRIAR |
| 4 | `rgpd_privacidade` | Universal | ❌ POR CRIAR |
| 5 | `reclamacao_formal` | Universal | ❌ POR CRIAR |
| 6 | `analise_regulamentar` | Universal | ❌ POR CRIAR |
| 7 | `seguro_sinistro` | Universal | ❌ POR CRIAR |

---

### EST — Estratégia / Gestão
**Norma:** ISO 9001 cl.4-6 (contexto, liderança, planeamento)

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `business_plan` | Universal | ❌ POR CRIAR |
| 2 | `analise_swot` | Universal | ❌ POR CRIAR |
| 3 | `okrs_objectivos` | Universal | ❌ POR CRIAR |
| 4 | `candidatura_incentivos` | Universal | ❌ POR CRIAR |
| 5 | `acta_reuniao` | Universal | ❌ POR CRIAR |
| 6 | `adr_decisao` | Universal | ✅ EXISTE (27 ADRs) |

---

### GEN — Geração de documentos (Anthropic skills)
**Transversal a todas as secções**

| # | Skill | Tipo | Estado |
|---|-------|------|--------|
| 1 | `docx` | Anthropic | ✅ DISPONÍVEL |
| 2 | `xlsx` | Anthropic | ✅ DISPONÍVEL |
| 3 | `pptx` | Anthropic | ✅ DISPONÍVEL |
| 4 | `pdf` | Anthropic | ✅ DISPONÍVEL |
| 5 | `frontend-design` | Anthropic | ✅ DISPONÍVEL |

---

## RESUMO GERAL

| Secção ISA-95 | Total | ✅ Existe | ❌ Falta |
|---------------|-------|----------|---------|
| L4-COM | 17 | 15 | 2 |
| L4-FIN | 13 | 4 | 9 |
| L4-ENG | 15 | 5 | 10 |
| L4-CST | 5 | 0 | 5 |
| L4-RSH | 5 | 4 | 1 |
| L3-PRD | 14 | 4 | 10 |
| L3-QMS | 25 | 2 | 23 |
| L3-MNT | 4 | 1 | 3 |
| L3-PER | 6 | 3 | 3 |
| L3-DOC | 5 | 2 | 3 |
| L3-INV | 6 | 2 | 4 |
| RH | 15 | 2 | 13 |
| AMB | 5 | 0 | 5 |
| JUR | 7 | 0 | 7 |
| EST | 6 | 1 | 5 |
| GEN | 5 | 5 | 0 |
| **TOTAL** | **153** | **50** | **103** |

### Por tipo
| Tipo | Total | Existe | Falta |
|------|-------|--------|-------|
| Sistema (já no Supabase) | 33 | 30 | 3 |
| Norma (exigido por norma) | 55 | 3 | 52 |
| Universal (boas práticas) | 60 | 12 | 48 |
| Anthropic (skills plataforma) | 5 | 5 | 0 |
| **TOTAL** | **153** | **50** | **103** |
