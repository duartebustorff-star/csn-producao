# ESTADO OPUS — Sessão 49 (FECHADA)
**Data:** 10/04/2026  
**HEAD:** 5070d96  
**Deploy:** csn-producao.vercel.app  
**Tabelas:** ~84 | **Migrations:** ~82 | **RPCs KPI:** 10

---

## REALIZADO S49

### CSN Connect — Visão de Produto (PDF v3)
- Documento CSN-L4-COM-001-2026-CSN-Connect-Visao-v3.pdf (4 páginas)
- Princípio central: fazer o comercial vender mais, com menos esforço, mais acertivo
- Cenários reais documentados (viabilidade técnica, stock concessionário, preço/prazo, legalização)
- Concorrência TrailerWin mapeada — CSN Connect melhor em front-end e UX
- Regra: "não exporta ficheiros Excel com o nosso ouro" — só dá respostas
- Arquitectura 5 camadas: Base Dados Veículos → Normas/Leis → AI Autónomo → KPIs → Front-end
- Roadmap: chassi-cabina → todos PBV → van → trailers/frigoríficos

### Apps Script v8 (Anexos → Supabase Storage)
- Upgrade do v5: upload automático de PDFs para Supabase Storage (bucket `documentos`)
- Lista IGNORAR limpa (vazia) — entra tudo, filtrar depois com histórico real
- SUPABASE_SERVICE_KEY nas Script Properties do Apps Script
- Testado com email real: `Carta_CSN.pdf` (234KB) → Storage OK

### Router v9 (data_email + trigger Ag. Documental)
- Campo `data_email` — guarda data original do email do servidor, não data de entrada no Supabase
- `anexos_estado: 'pendente'` — marcado automaticamente quando ticket tem PDFs no Storage
- Trigger fire-and-forget: Router chama `/api/documental/processar` quando há PDFs
- Dedup actualiza anexos em tickets existentes (em vez de ignorar)

### Agente Documental — OPERACIONAL
- Endpoint: `/api/documental/processar` (GET status + POST processar batch)
- Download PDF do Supabase Storage → Claude Haiku classifica pelo conteúdo real
- 14 categorias: factura_fornecedor, certificado_material_31, cit, orcamento, dav, fam, guia_transporte, etc.
- Acções automáticas pós-classificação: match e-Fatura por ATCUD, inserir certificados_material, ligar CITs a colaboradores
- Batch de 3 tickets por execução (limite 60s Vercel)

### Teste Chagas — 105 PDFs Classificados
- Upload de 105 PDFs das 13 pastas Chagas no disco para Storage (`fornecedores/10-chagas/`)
- Ag. Documental processou todos: 18 facturas, 7 orçamentos, 1 certificado material, 77 emails/outro, 1 erro, 1 sem classificação
- Prova que classificação por conteúdo real ≠ classificação por nome de ficheiro (Cowork tinha 26 FAT, Claude encontrou 18 reais)

### Pipeline Email Completo
- Forward O365 geral@ → Gmail carrocariascsn@ — confirmado operacional com emails reais
- Apps Script v8 → extrai anexos → upload Storage → POST Router
- Router v9 → classifica Haiku → cria ticket → grava data_email → trigger Ag. Documental
- Ag. Documental → download PDF → Claude lê → classifica → extrai dados → liga entidades
- Triggers: COM orçamento → lead automática, spam → arquivado

### Migrations e Fixes
- `data_email` TIMESTAMPTZ adicionada a tickets
- `anexos_estado` TEXT com check constraint adicionado a tickets
- Storage RLS policy para bucket `documentos`
- Constraint `remetente_tipo` alargada (adicionado 'conhecido', 'sistema')
- Constraint `canal` alargada (adicionado 'historico', 'import')
- Fix double-encoding JSON nos anexos (jsonb string → array)

### Commits S49
| Hash | Descrição |
|------|-----------|
| 4113073 | fix: router actualiza anexos em tickets deduplicados |
| 0cdb6d4 | feat: agente documental processa anexos tickets (ADR-034 fase 2) |
| 5070d96 | feat: router v9 data_email original + trigger agente documental automatico |

---

## PENDENTE S50

### Imediato
- [ ] 6 docs fecho S49 (ESTADO+PDF+3 HTML) — gerar e commitar
- [ ] CSN-L4-COM-001-2026-CSN-Connect-Visao-v3.pdf → docs/
- [ ] Obras JAP: custos + facturar 6 × €2.100+IVA no InvoiceXpress
- [ ] Desligar Power Automate no O365

### Prioridade Média
- [ ] Upload restantes fornecedores (6.622 docs total, Chagas feito)
- [ ] Fix double-encoding JSON no script de upload Python
- [ ] FUSO crawler com credenciais (Claude Code + Playwright)
- [ ] Reprocessar emails antigos Chagas/Portinter/Cadflow (remover label CSN_PROCESSADO → v8 reprocessa com upload)

### Próximas Funcionalidades
- [ ] Dashboard React com kpi_dashboard() tempo real
- [ ] COC Electrónico IMT (deadline julho 2026)
- [ ] Ciclo fim-de-obra automático (F9→COC+DoP+CE+factura+dossier)
- [ ] R_AGENT com Puppeteer/Playwright no servidor Duarte
- [ ] CSN Connect — base técnica de veículos
- [ ] Worker UI: MNT-001 a MNT-004 como botões grandes

---

## STACK
Next.js 14 | TypeScript | Supabase (~84 tabelas) | Claude Haiku (Router+Documental) | Vercel | Google Apps Script v8 | Office 365
