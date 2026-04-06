# ESTADO CSN OPUS — S41
## 06 Abril 2026 | HEAD: e17ca30

### SISTEMA
- **59 tabelas** | **52 migrations** | **53+ routes** | **34 ADRs** | **11 agentes** | **5 personas**
- **Backend:** Sonnet 4 + Haiku | **Deploy:** csn-producao.vercel.app
- **Repo:** duartebustorff-star/csn-producao

### S41 — REALIZADO
- [x] Docs fecho S40 gerados e committed (fec7abe): PDF controlo + 3 HTMLs + ESTADO
- [x] Diagnóstico processar_fornecedores.py v1 (94% falha — ficheiros FAT/ANEXO/CERT31 não existem no disco)
- [x] processar_fornecedores_v2.py criado — processa tipo_doc=EMAIL (ficheiros que existem)
- [x] Migration 052: ALTER TABLE correspondencia_email ADD 5 colunas (tipo_doc_classificado, resumo_claude, dados_extraidos, atcud, efatura_id)
- [x] Script v2 executado: **1322/1323 docs classificados** (129 facturas, 3 certificados_material, 1190 outros, 1 erro parsing)
- [x] Committed e17ca30
- [x] ANTHROPIC_API_KEY rotated (key S40 exposta em chat)

### PENDENTE S42
- [ ] Webhook email (recepção automática → Router)
- [ ] Gate validação lead→produção
- [ ] Docs fecho S41 (este ficheiro + PDF + 3 HTMLs)
- [ ] Portal "duas portas" (Produção + Pessoal)
- [ ] ISO 22400 worker dashboards (6 KPIs calculáveis)
- [ ] Supplier skills: SKILL_CHAGAS, SKILL_PECOL + ferro
- [ ] Obra end-of-cycle automation
- [ ] COC electrónico IMT (deadline Jul 2026)
- [ ] Agente Financeiro + reconciliação bancária (841 movimentos BPI)

### MIGRATIONS S41
| # | Nome | Descrição |
|---|------|-----------|
| 052 | correspondencia_email_classificacao | ADD tipo_doc_classificado, resumo_claude, dados_extraidos, atcud, efatura_id |

### GIT LOG RECENTE
| Commit | Descrição |
|--------|-----------|
| e17ca30 | feat: processar_fornecedores_v2 - 1322/1323 docs classificados |
| fec7abe | docs: fecho S40 - controlo PDF + arquitectura + kpis + skills HTMLs |
| c0c528e | S40 fechada (anterior) |
