# ADR-019 — Conformidade ISA-95 + ISO 9001 + EN 1090 + Marcação CE: Gaps e Plano de Fecho

**Data:** 26/03/2026
**Hora (Lisboa):** 11:00 WET (UTC+1 — WEST)
**Estado:** ✅ Aceite
**Sessão:** 15 (continuação)

---

## Contexto

Análise de conformidade do CSN Opus face às normas base do sistema:
- ISA-95 — arquitectura de sistemas de fabrico
- ISO 9001:2015 — sistema de gestão da qualidade
- EN 1090 + EN ISO 3834 — MES de soldadura + estruturas em aço
- Reg. 2018/858 + EN 1090-1 — Marcação CE (certificado de produto)

---

## Resultado da Análise

### ISA-95 — PARCIALMENTE ALINHADO ⚠️

| Nível | Define | CSN Opus |
|---|---|---|
| Nível 4 — ERP | Negócio, finanças, planeamento | ⚠️ Definido — Migration 014 por correr |
| Nível 3 — MES | Execução produção, qualidade, materiais | ✅ Definido — obras, fases, QMS, Stock |
| Nível 2 — SCADA | Controlo de processo | ❌ Não aplicável por agora |
| Nível 1/0 — Chão | Sensores, equipamentos | ❌ CMMS definido, não construído |

**Gap crítico:** Nenhuma tabela ou módulo tem campo `nivel_isa95`. Está definido conceptualmente mas não está implementado como metadado. O organigrama não está estruturado pela norma no código.

---

### ISO 9001:2015 — PARCIALMENTE ALINHADO ⚠️

| Cláusula | Requisito | Estado CSN Opus |
|---|---|---|
| 4 — Contexto | Partes interessadas, âmbito | ❌ Não documentado no sistema |
| 5 — Liderança | Política de qualidade, objectivos | ❌ Não existe |
| 6 — Planeamento | Riscos, objectivos de qualidade | ❌ Não existe |
| 7.5 — Documentos | Controlo de documentação | ✅ audit_log existe |
| 7.2 — Competências | Certificados colaboradores | ⚠️ tabela colaboradores existe, sem certificados |
| 8.1 — Operação | Controlo de produção | ✅ obras, fases, timetracking |
| 8.7 — NC outputs | Controlo de não conformidades | ❌ tabela nao_conformidades não existe |
| 9.2 — Auditoria interna | Auditorias periódicas documentadas | ⚠️ Agente Compliance definido, não construído |
| 9.3 — Revisão gestão | Actas de revisão pela gestão | ❌ Não existe |
| 10.2 — NC + acções | Registo NC + acção correctiva + verificação eficácia | ❌ Não existe |

---

### EN 1090 + EN ISO 3834 (MES Soldadura) — FRACO ❌

| Requisito | Norma | Estado |
|---|---|---|
| WPS qualificados por processo/material | EN ISO 15614-1 | ❌ Migration 015 |
| WPQR — relatório de qualificação | EN ISO 15614-1 | ❌ Migration 015 |
| Certificados soldadores válidos | EN ISO 9606-1 | ❌ Migration 015 |
| Coordenador de soldadura IWS/IWT | EN 1090 | ❌ A contratar |
| Rastreabilidade soldador/junta/WPS por obra | EN ISO 3834-3 | ❌ Migration 015 |
| Inspecção visual EN ISO 5817 nível C | EN ISO 17637 | ❌ Migration 015 |
| Controlo consumíveis soldadura | EN ISO 3834-3 | ❌ Migration 016 (stock) |
| Manual FPC — Factory Production Control | EN 1090-1 | ❌ Documento não existe |
| ITP — Plano de Inspecção e Ensaio | EN 1090-2 | ❌ Não existe |

---

### Marcação CE EN 1090 (Certificado de Produto) — MUITO FRACO ❌

| Requisito | Estado |
|---|---|
| DoP — Declaração de Desempenho por obra | ❌ Não existe — geração automática por construir |
| Etiqueta CE física na carroçaria | ❌ Não emitida |
| Organismo notificado (Bureau Veritas, TÜV, APCER) | ❌ Não contratado |
| Auditoria FPC pelo organismo notificado | ❌ Depende do Manual FPC |
| Certificação EN 1090 + EN ISO 3834 | ❌ Não obtida |

---

## Os 3 Gaps Críticos

### Gap 1 — Campo `nivel_isa95` em módulos e tabelas

**O que falta:**
Cada módulo, agente e tabela deve ter metadado que indica o nível ISA-95 a que pertence.

**Implementação:**
```sql
-- Campo a adicionar em todas as tabelas de sistema
nivel_isa95  text  -- 'nivel_3_mes' | 'nivel_4_erp' | 'transversal'
departamento text  -- 'producao' | 'qualidade' | 'comercial' | 'financeiro' | 'tecnico'
```

**Mapeamento por módulo:**
| Módulo | Nível ISA-95 | Departamento |
|---|---|---|
| Obras, fases, timetracking | Nível 3 — MES | Produção |
| QMS, NC, WPS, inspecções | Nível 3 — MES | Qualidade |
| Stock, materiais, FIFO | Nível 3 — MES | Produção |
| CMMS, equipamentos | Nível 3 — MES | Manutenção |
| Leads, clientes | Nível 4 — ERP | Comercial |
| Faturas, fornecedores | Nível 4 — ERP | Financeiro |
| Colaboradores, certificados | Nível 4 — ERP | RH |
| KPIs, analytics | Transversal | Gestão |
| DAV, FAM, COC | Transversal | Qualidade |

---

### Gap 2 — Migration 015: Tabelas MES de Soldadura (EN 1090 + EN ISO 3834)

**O que falta criar:**
```sql
wps                    -- procedimentos de soldadura qualificados
wpqr                   -- relatórios de qualificação WPS
certificados_soldadores -- EN ISO 9606-1 por colaborador + validade
inspecoes_soldadura    -- registo de inspecção visual por junta/obra
rastreabilidade_soldadura -- soldador + WPS + junta + obra (por cordão)
nao_conformidades      -- ISO 9001 cláusula 10.2 + EN ISO 3834
acoes_corretivas       -- ligadas às NC com verificação de eficácia
```

---

### Gap 3 — Módulo ISO 9001 Completo

**O que falta:**
```
politica_qualidade     → documento + versão + data aprovação
objectivos_qualidade   → por área, mensuráveis, com prazo
revisoes_gestao        → actas de revisão periódica pela gestão
auditorias_internas    → plano + relatório + NC encontradas
```

Estes não são tabelas técnicas — são documentos de gestão. Devem existir no DMS (tabela `dossie_obra` equivalente mas para o SGQ).

---

## Plano de Fecho por Prioridade

| # | Acção | Norma | Migration |
|---|---|---|---|
| 1 | Correr Migration 015 — WPS, WPQR, certificados soldadores, inspecções, NC | EN 1090 + EN ISO 3834 + ISO 9001 | 015 |
| 2 | Adicionar campo `nivel_isa95` e `departamento` a todas as tabelas | ISA-95 | ALTER TABLE |
| 3 | Criar módulo SGQ — política, objectivos, revisão gestão | ISO 9001 cláusulas 5+6+9 | 020 |
| 4 | Criar gerador de DoP automático por obra | EN 1090-1 | código |
| 5 | Contratar coordenador IWS/IWT | EN 1090 | — |
| 6 | Contratar organismo notificado para auditoria FPC | EN 1090 | — |

---

## Consequências

- O campo `nivel_isa95` deve ser adicionado a TODAS as migrations futuras
- A arquitectura 19 deve mostrar o organigrama com os níveis ISA-95 visíveis
- O Agente Compliance (ADR-006) verifica mensalmente o estado de cada cláusula ISO 9001
- O Manual FPC deve ser criado como documento no DMS antes da auditoria EN 1090
- A Prontidão para Auditoria na arquitectura reflecte estes gaps em tempo real
