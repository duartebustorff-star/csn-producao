# ESTADO.OPUS.S34.md
**Sessão:** S34 | **Data:** 01/04/2026 | **Commit HEAD:** 8f0d1c0 (+ c3cd111 + c128729)

## ESTADO DO SISTEMA
- **Tabelas Supabase:** 37 (+ emails_indice migration 024 aplicada, tabela criada)
- **Migrations:** 24 (022 documentos, 023 fornecedores NIF, 024 emails_indice)
- **Tools/Routes API:** 32+
- **ADRs:** 30 (ADR-028, ADR-029, ADR-030 criados nesta sessão)
- **Agentes nucleus:** 11
- **Fornecedores com NIF:** 381 (populados via script pg_trgm da efatura)
- **Emails indexados (pendente import):** 18.169 (CSV gerado, import no Supabase pendente)

## COMMITS S34 (ordem cronológica)
| Commit | Descrição |
|--------|-----------|
| 0c30d5a | fix: BottomNav UTF-8 encoding restaurado |
| 8e8722b | fix: supabase lazy init para build limpo |
| bafa2e9 | feat: WorkerDashboard alinhado com endpoint kpis/worker |
| 0f4d89f | feat: conta corrente por IBAN |
| 429dc96 | feat: recibos por ano + PDF resumo anual RH |
| 8c14532 | feat: declaração anual de rendimentos PDF por trabalhador |
| 8e1bcbf | feat: CITs no Modo Pessoal + DocumentosView por categoria |
| 7d65775 | fix: recibos estado provisório/final + declaração PDF a preto |
| 8c6f0f8 | fix: WorkerRHView recibos sem valores — só mês+ano+download |
| 66a21de | fix: declaração rendimentos art. 119 CIRS formato legal |
| 0b75444 | fix: LoginScreen colaboradores da DB — remove hardcoded |
| bda58f4 | feat: obras MNT botões grandes + sequência bloqueada + extracto pagamentos PDF |
| f07c2d1 | feat: layout responsivo 2 colunas tablet + câmara mobile + foto fase |
| edba34c | docs: ADR-030 Work Instructions por Fase e Núcleos Especializados |
| a2616e0 | docs: ADR-028 Portal Trabalhador + ADR-029 ISO 22400 KPIs |
| fc389b6 | docs: manual Fronius Transteel 4000 Pulse |
| e2a1d67 | feat: Agente Roteador L3-DOC — classificação automática com Claude |
| 7bc6000 | feat: RoteadorView no dashboard admin |
| 8f0d1c0 | feat: conta corrente fornecedores — endpoint faturado vs pago por NIF |
| c3cd111 | migration: 024 emails_indice |
| c128729 | feat: script import emails_indice do INDICE_v4.xlsx |

## MIGRAÇÕES SUPABASE APLICADAS S34
- 022: tabela documentos (Agente Roteador)
- 023: fornecedores.nif + documentos (estado, data_entrada, fornecedor_id, tipo)
- 024: emails_indice (tabela criada, import pendente)
- Script: populate_fornecedores_nif_from_efatura.sql — 381 NIFs populados

## FEATURES IMPLEMENTADAS S34

### RH / Área Pessoal
- Recibos sem valores monetários visíveis — só mês+ano+download+badge
- Badge Provisório/Final por recibo (limite = último dia mês seguinte)
- Declaração art. 119º CIRS — PDF a preto, formato legal
- Extracto anual de pagamentos PDF (base, extras, abonos, descontos, data transferência, saldo)
- CITs no Modo Pessoal (data início/fim, dias, PDF)
- LoginScreen carrega colaboradores da DB (não hardcoded)

### Portal Trabalhador
- Layout responsivo: tablet/desktop = 2 colunas (obras + Fernando); mobile = tabs Obras|Fernando|Câmara
- Câmara nativa mobile com preview da última foto associada à fase activa
- Endpoint /api/timer/foto-fase — upload foto → Supabase Storage → notas_obra

### Obras MNT
- 4 botões grandes (MNT-001 a MNT-004)
- Execução sequencial bloqueada (🔒 nas fases não disponíveis)
- Reset automático do ciclo quando todas as fases concluídas

### Documentos de Produção
- DocumentosView por categoria: Manuais, Procedimentos, Checklists, Instruções
- Secção Manuais de Máquinas: Fronius Transteel 4000 Pulse disponível
- public/manuais/fronius-transteel-4000-pulse.pdf (6.4MB)

### Agente Roteador (L3-DOC)
- Endpoint POST /api/roteador: recebe ficheiro → Claude API → classifica → regista em documentos
- Cruzamento NIF com tabela fornecedores (381 com NIF)
- RoteadorView no dashboard admin (ícone 🧭)
- Endpoint GET /api/fornecedores/conta-corrente: faturado vs pago por NIF

### Base de Conhecimento
- 381 fornecedores com NIF populados via pg_trgm similarity da efatura
- emails_indice: tabela criada, CSV de 18.169 linhas gerado, import pendente

## PENDENTES IMEDIATOS (S35)
1. Importar emails_indice CSV para Supabase (script upload_emails_indice.py por criar)
2. Fechar import: SELECT COUNT(*) FROM emails_indice deve = 18169
3. Cruzar emails_indice.fornecedor com fornecedores por nome/domínio
4. Manuais Bodor (chapa e tubo) — PDFs por obter
5. Classificação fina fornecedores (nivel_isa95 — nem todos são L0-MAT)
6. Agente Roteador Fase 2: integração email geral@

## PENDENTES HERDADOS
- Ciclo obra: COC, DoP, CE marking, invoice, dossier (fim F9/Termo)
- Skills fornecedores: Bielco, Silfesan, Dhollandia
- CIT José Júlio → criar ausência associada
- Apagar src/app/portal/ duplicado
- Recibos 2023-2024 (para fechar período completo)
- Bodor laser smart meter (ISO 50001 / ISO 22400 energy KPIs 35-38)

## NÚMEROS DO SISTEMA
| Recurso | Quantidade |
|---------|-----------|
| Tabelas Supabase | 37 |
| Migrations | 24 |
| Routes API | 32+ |
| ADRs | 30 |
| Agentes nucleus | 11 |
| Fornecedores com NIF | 381 |
| Emails indexados (CSV) | 18.169 |
| Commits S34 | 21 |

## REGRAS DE SESSÃO
- PowerShell: sempre cd C:\Users\Utilizador\Projectos-AI\csn-producao primeiro
- Deploy: npx vercel --prod
- SQL: Supabase SQL Editor (Ctrl+A → Delete antes de colar)
- Restauro ficheiros: git show [hash]:path | Out-File -FilePath [path] -Encoding utf8
- Nunca git push --force — usar --force-with-lease se necessário
