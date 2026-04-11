# ESTADO OPUS — Sessão 50 (FECHADA)
**Data:** 10/04/2026  
**HEAD:** fdb7548  
**Deploy:** csn-producao.vercel.app  
**Tabelas:** ~84 | **Migrations:** ~82 | **RPCs KPI:** 10

---

## REALIZADO S50

### Docs Fecho S49 (4 ficheiros)
- CSN-Controlo-OPUS-S49.pdf — estado geral, realizado, commits, KPIs, pipeline, pendente
- csn-architecture-OPUS-S49.html — Ag. Documental OPERACIONAL, pipeline email completo, ISO 9001 38%, ISO 14001/45001 22%
- csn-kpis-isa95-S49.html — 97 KPIs, 18 CALC, 62 PEND, 11 DATA, 6 HW. 9 KPIs DATA→PEND (tabelas S48)
- csn-skills-tools-registry-S49.html — 236 skills, 10 RPCs, 7 routes, 6 integrações, 11 agentes operacionais

### FUSO Scraper v3 — Completo
- 13 modelos Canter (TF1, eCanter, TD) de 2007 a MY26 GSR
- 1.587 PDFs únicos descarregados (Body Builder Guidelines)
- Output: `fuso-output-v3/CANTER-TUDO.json`
- Login manual no portal, scraper automatiza navegação + download
- Inclui tabelas técnicas (65 tab/modelo) e PDFs de sub-páginas (122 PDFs/modelo)

### Ag. Documental — Nova Categoria `nota_encomenda`
- Categoria adicionada ao prompt de classificação (distingue de orçamento: compra firme vs proposta)
- Campos de extracção: numero_encomenda, data, cliente_nome, nif_cliente, linhas, valor_total, data_entrega, vins, observacoes
- Acção pós-classificação: procura cliente por NIF → liga ao ticket
- Testado com NE897289 VESAUTO: classificou correctamente, extraiu 3×Taipais Madeira @€2.100, 2 VINs, data entrega, local entrega, requisitante
- NE897290 deu erro_classificacao (variância Haiku) — reprocessar resolve
- 15 categorias no Ag. Documental (14 originais + nota_encomenda)

### Pipeline Email — Teste Real NE VESAUTO
- Email com 2 NE + 6 DAVs VESAUTO (Renault Master CCD L3, frota Sixt)
- Ticket criado automaticamente: TKT-1775844705356-9XT1
- 8 PDFs processados: 1 nota_encomenda, 1 erro, 1 DAV (1ª corrida), 5 outro/erro
- Pipeline end-to-end confirmado: O365→Gmail→Apps Script→Router→Ticket→Ag.Documental

### Diagnóstico: 3 Sistemas Documentais Sobrepostos
- `/api/documentos/upload` (S32, 31KB): Sonnet, prompts específicos DAV/FAM/CIT/INSPECAO, insere em tabelas dedicadas, actualiza dossier, gera termo
- `/api/documentos/classificar` (S32): rule-based por nome ficheiro, sem AI
- `/api/documental/processar` (S49): Haiku, classificação genérica, acções limitadas
- **Decisão S51:** unificar — Ag. Documental como ponto de entrada, delega extracção para funções do upload

### Commits S50
| Hash | Descrição |
|------|-----------|
| de2e09f | feat: ag documental nota_encomenda categoria + extraccao NIF/VINs (revertido) |
| 45b3f5e | fix: restaurar route.ts original |
| fdb7548 | feat: ag documental nota_encomenda categoria (via node edit) |

---

## PENDENTE S51

### Imediato
- [ ] Unificar 3 sistemas documentais: Ag. Documental chama funções do upload (DAV→davs, FAM→fams, CIT→cits, INSPECAO→inspecoes)
- [ ] Reprocessar NE897290 (erro_classificacao)
- [ ] Obras JAP: custos + facturar 6 × €2.100+IVA no InvoiceXpress
- [ ] Desligar Power Automate no O365

### Prioridade Média
- [ ] Skill `nota_encomenda` (user skill para Claude Projects)
- [ ] Upload restantes fornecedores (6.622 docs total, Chagas feito)
- [ ] Fix double-encoding JSON no script upload Python
- [ ] FUSO dados: processar CANTER-TUDO.json → tabela veiculos_tecnicos no Supabase

### Próximas Funcionalidades
- [ ] Dashboard React com kpi_dashboard() tempo real
- [ ] COC Electrónico IMT (deadline julho 2026)
- [ ] Ciclo fim-de-obra automático (F9→COC+DoP+CE+factura+dossier)
- [ ] CSN Connect — base técnica de veículos (inclui dados FUSO)
- [ ] Worker UI: MNT-001 a MNT-004 como botões grandes

---

## STACK
Next.js 14 | TypeScript | Supabase (~84 tabelas) | Claude Haiku (Router+Documental) | Claude Sonnet (Upload/Extracção) | Vercel | Google Apps Script v8 | Office 365
