# CSN Technic — Skills & Tools por Norma
**Extraído do S43 · 08/04/2026**

---

## D1 — O PRODUTO (o que sai da fábrica)

### Reg. (UE) 2018/858 — Homologação multi-etapa
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 1 | `dav_extract` | ✅ EXISTE | Extracção DAV (Vision API + n8n) |
| 2 | `fam_extract` | ✅ EXISTE | Extracção FAM |
| 3 | `imt_coc_api` | ❌ TOOL | Integração portal IMT — COC electrónico |
| 4 | `gerar_coc` | ❌ SKILL | Geração automática COC multi-etapa por VIN |
| 5 | `validar_coc` | ❌ SKILL | Validação dados COC vs obra |

### Reg. (UE) 2019/2144 — GSR
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 6 | `checklist_gsr` | ❌ SKILL | Checklist GSR por montagem (AEB, câmaras, sensores) |
| 7 | `registo_gsr` | ❌ SKILL | Registo evidência câmaras/sensores preservados |

### EN 12642 L/XL — Resistência estrutural
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 8 | gate (peso/eixo) | ✅ EXISTE | Validação peso/eixo no gate |
| 9 | `fea_report` | ❌ TOOL | Ensaio ou cálculo FEA por modelo |
| 10 | `cert_12642` | ❌ SKILL | Certificado EN 12642 por modelo |
| 11 | `etiqueta_lxl` | ❌ SKILL | Etiqueta L/XL na carroçaria |

### UNECE R48/R73/R58 — Iluminação, protecções, para-choques
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 12 | `checklist_r48` | ❌ SKILL | Checklist iluminação por obra |
| 13 | `checklist_r73` | ❌ SKILL | Checklist protecções laterais |
| 14 | `checklist_r58` | ❌ SKILL | Verificação para-choques traseiro |

### Dir. 96/53/CE — Pesos e dimensões
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 15 | gate (limites) | ✅ EXISTE | Validação limites legais 2550/4000/12000mm |
| 16 | gate (payload) | ✅ EXISTE | Validação payload positivo |
| 17 | `dist_carga` | ❌ SKILL | Cálculo distribuição carga por eixo |

### EN 12640 + EN 12195-1 — Amarração carga
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 18 | `spec_amarracao` | ❌ SKILL | Especificação pontos amarração por modelo |
| 19 | `calc_12195` | ❌ SKILL | Cálculo forças fixação EN 12195-1 |
| 20 | `cert_amarracao` | ❌ SKILL | Certificado pontos amarração |

---

## D2 — O PROCESSO (como fabricas)

### ISO 9001:2015 — SGQ
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 21 | arquitectura S43 | ✅ EXISTE | Contexto da organização (cláusula 4) |
| 22 | personas | ✅ EXISTE | Liderança / responsabilidades (cláusula 5) |
| 23 | `gestao_riscos` | ❌ SKILL | Planeamento — riscos e oportunidades (cláusula 6) |
| 24 | ag_documental | ✅ EXISTE | Suporte — docs controlados (cláusula 7) |
| 25 | `plano_producao` | ❌ SKILL | Operação — planeamento produção (cláusula 8) |
| 26 | `auditoria_interna` | ❌ SKILL | Avaliação desempenho — auditoria interna (cláusula 9) |
| 27 | `registar_nc` | ❌ SKILL | Melhoria — NC + acções correctivas CAPA (cláusula 10) |
| 28 | `gerar_manual_sgq` | ❌ SKILL | Manual da Qualidade |
| 29 | `revisao_gestao` | ❌ SKILL | Revisão pela gestão (input + output) |

### EN 1090-1/-2 — Execução estruturas aço EXC2
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 30 | cert EN 1090 | ✅ EXISTE | Certificação obtida |
| 31 | wps | ✅ EXISTE | WPS documentadas (pWPS-CSN-S235-MAG-001) |
| 32 | `gerar_fpc` | ❌ SKILL | Manual FPC (Factory Production Control) |
| 33 | `gerar_dop` | ❌ SKILL | DoP (Declaration of Performance) por obra |
| 34 | `etiqueta_ce` | ❌ SKILL | Etiqueta CE por obra |
| 35 | `gerar_itp` | ❌ SKILL | ITP (Inspection Test Plan) por tipo obra |
| 36 | `rastrear_material` | ❌ SKILL | Rastreabilidade material (cert 3.1 → obra) |

### EN ISO 3834-3 — Qualidade soldadura
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 37 | dossie_obra | ✅ EXISTE | Base rastreabilidade |
| 38 | `controlo_consumiveis` | ❌ SKILL | Controlo consumíveis (lotes fio/gás → obra) |
| 39 | `plano_soldadura` | ❌ SKILL | Planeamento soldadura por obra (WPS↔junta) |
| 40 | `rastrear_soldadura` | ❌ SKILL | Rastreabilidade soldador/WPS/junta |
| 41 | `nc_soldadura` | ❌ SKILL | NC de soldadura — registo e tratamento |

### EN ISO 15614-1 — Qualificação WPS (WPQR)
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 42 | wps | ✅ EXISTE | pWPS documentada |
| 43 | `agendar_wpqr` | ❌ TOOL | Agendar WPQR em laboratório acreditado |
| 44 | `registar_wpqr` | ❌ SKILL | Registo WPQR digital ligado à WPS |

### EN ISO 9606-1 — Certificação soldadores
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 45 | `agendar_cert_sold` | ❌ TOOL | Agendar certificação João + Bohdan |
| 46 | `cert_soldadores` | ❌ SKILL | Registo digital certificados + validades |

### EN ISO 5817 + 17637 — Imperfeições + inspecção visual
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 47 | `insp_visual_sold` | ❌ SKILL | Checklist inspecção visual por junta (nível C) |
| 48 | `criterios_5817` | ❌ SKILL | Critérios aceitação/rejeição por classe |
| 49 | `foto_soldadura` | ❌ SKILL | Registo fotográfico com classificação |

### ISO 14001 — Gestão ambiental ⚡ ACTIVA
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 50 | `id_aspectos_ambientais` | ❌ SKILL | Identificação aspectos/impactos (resíduos, gases, energia) |
| 51 | `registo_residuos` | ❌ SKILL | Registo resíduos + guias transporte (e-GAR) |
| 52 | `monitorizacao_energia` | ❌ SKILL | Monitorização consumos (Bodor 60kW, compressor, etc.) |
| 53 | `fornecedores_ambiental` | ❌ SKILL | Critérios ambientais avaliação fornecedores |
| 54 | `objectivos_ambientais` | ❌ SKILL | Objectivos e metas ambientais anuais |
| 55 | `programa_ambiental` | ❌ SKILL | Programa gestão ambiental (acções, prazos, responsáveis) |

### ISO 45001 — Segurança e saúde ⚡ ACTIVA
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 56 | `matriz_riscos_sst` | ❌ SKILL | Matriz riscos por posto (soldadura, laser, quinadora) |
| 57 | `registo_epis` | ❌ SKILL | Registo EPIs por colaborador + validades |
| 58 | `plano_formacoes` | ❌ SKILL | Plano formações SST com evidência |
| 59 | `registo_acidentes` | ❌ SKILL | Registo acidentes/incidentes/quase-acidentes |
| 60 | `inspeccao_seguranca` | ❌ SKILL | Inspecções periódicas segurança |
| 61 | `consulta_trabalhadores` | ❌ SKILL | Evidência consulta/participação trabalhadores |

---

## D3 — O SISTEMA (como geres)

### ISA-95 / IEC 62264
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 62 | L4 (FIN,COM,ENG) | ✅ EXISTE | Operacional |
| 63 | L3 (PRD,PER,DOC,INV) | ✅ EXISTE | Operacional |
| 64 | `ag_qualidade` | ❌ SKILL | L3-QMS completo |
| 65 | `ag_manutencao` | ❌ SKILL | L3-MNT completo |

### ISO 22400 — KPIs fabrico
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 66 | 6 KPIs base | ✅ EXISTE | Worker/Allocation Efficiency, Throughput, etc. |
| 67 | `kpi_qualidade` | ❌ SKILL | Quality Ratio, Scrap Ratio (depende NC) |
| 68 | `kpi_oee` | ❌ SKILL | OEE, Availability, Performance (depende manutenção) |
| 69 | `dashboard_22400` | ❌ SKILL | Dashboard visual ISO 22400 |

### ISO 55000 — Gestão activos
| # | Skill/Tool | Estado | Descrição |
|---|-----------|--------|-----------|
| 70 | MNT-001→004 | ✅ EXISTE | Obras internas manutenção |
| 71 | `plano_manutencao` | ❌ SKILL | Plano manutenção preventiva por equipamento |
| 72 | `registo_manutencao` | ❌ SKILL | Registo intervenções + custos |
| 73 | `alerta_manutencao` | ❌ TOOL | Alertas manutenção (horas/data) |

---

## RESUMO

| | Total | ✅ Existe | ❌ Falta |
|--|-------|----------|---------|
| D1 Produto | 20 | 5 | 15 |
| D2 Processo | 33 | 8 | 25 |
| D3 Sistema | 12 | 5 | 7 |
| **TOTAL** | **65** | **18** | **47** |

### PARTILHADOS (skills que servem múltiplas normas)
- `registar_nc` → ISO 9001 (cl.10) + EN 1090 + EN ISO 3834 + ISO 14001 + ISO 45001
- `auditoria_interna` → ISO 9001 + ISO 14001 + ISO 45001
- `revisao_gestao` → ISO 9001 + ISO 14001 + ISO 45001
- `gerar_manual_sgq` → pode ser Manual Integrado (QMS + Ambiental + SST)
- `controlo_docs` → partilhado por todas (Ag. Documental já existe)

**Skills únicos reais (descontando partilhados): ~40**
