# ESTADO.OPUS.S40

## Sessão 40 — 05/04/2026
**Commit:** 079c9a1
**Anterior:** S39 commit 94e4435

---

## MÉTRICAS DO SISTEMA

| Métrica | Valor |
|---------|-------|
| Tabelas | 59 |
| Migrations | 51 (038 + 039 nesta sessão) |
| ADRs | 34 |
| Agentes autónomos | 11 |
| Skills | 13 |
| Personas C2 | 5 (Marta, Fernando, Carolina, Luísa, Leonor) |
| correspondencia_email | 18.169 registos |
| efatura | 4.409 registos |
| clientes | 8 |
| fornecedores ligados | 49 (2.452 emails) |
| clientes ligados | 8 (1.320 emails) |

---

## O QUE FOI FEITO NA S40

### Migration 038 — identificar_remetente + clientes_tipo_check
- Função `identificar_remetente(email)` recriada com `id TEXT` (fix UUID→TEXT)
- 7 caminhos: fornecedor directo → fornecedor histórico → cliente directo → cliente histórico → interno CSN → histórico sem ligação → desconhecido
- Constraint `clientes_tipo_check` expandida: + `oem`, `importador`

### Migration 039 — certificados_material
- Tabela `certificados_material` criada (EN 10204 3.1)
- Campos: qualidade aço, composição química (C/Mn/Si/P/S/CEQ), propriedades mecânicas (Re/Rm/A%), lote, vazamento
- Rastreabilidade: fornecedor_id, lote_material_id, obra_id, correspondencia_email_id
- 4 índices: fornecedor, lote, qualidade, obra

### 8 Clientes inseridos
- Grupo JAP (467 emails, concessionário)
- Villas-Boas (221 emails, concessionário)
- Domcarro (204 emails, concessionário)
- Stellantis (99 emails, OEM)
- C. Santos VP (87 emails, concessionário)
- Aires Almeida (87 emails, concessionário)
- Ochmann Maschinen (79 emails, concessionário)
- Astara (76 emails, importador)

### 1.320 emails ligados via cliente_id
- UPDATE correspondencia_email SET cliente_id por domínio email

### fornecedor_id adicionado a tickets
- ALTER TABLE tickets ADD COLUMN fornecedor_id BIGINT REFERENCES fornecedores(id)

### Router /api/router/classificar — OPERACIONAL
- Path: `src/app/api/router/classificar/route.ts`
- Modelo: Claude Haiku 4.5 (classificação rápida)
- maxDuration: 30s
- Pipeline: identificar_remetente → dedup 3 níveis → classificar Claude → criar ticket → acções automáticas
- Departamentos: COM, PRD, DOC, PER, FIN
- Testado em produção: Grupo JAP → COM/orçamento, confiança 95%

### Cobertura email: 82,5%
- Fornecedores: 2.452 (13,5%)
- Clientes: 1.320 (7,3%)
- Interno CSN: ~7.821 (43%)
- Spam: 3.820 (21%)
- Sem ligação: ~3.187 (17,5%)

### Script processar_fornecedores.py
- Processamento automático de 1.129 documentos (FAT/FT/CERT31/GR/ANEXO)
- Extracção ATCUD, match e-Fatura, linhas detalhadas (produção), certificados 3.1
- Segue pipeline SKILL_GERAL → SKILL_FORNECEDOR
- Pendente: adicionar ANTHROPIC_API_KEY ao .env.local e correr

---

## COMMITS S40

| Hash | Descrição |
|------|-----------|
| 8587fb1 | feat: router classificar com identificar_remetente, dedup 3 níveis, tickets ISA-95 |
| 2d833dc | fix: mover router para src/app, apagar app/ duplicado |
| 5eab6e1 | fix: router classificar com código correcto (substituir pdf-lib) |
| 079c9a1 | fix: router classificar usa Haiku + maxDuration 30 |

---

## PENDENTE S41

### Prioritário
1. Adicionar ANTHROPIC_API_KEY ao .env.local
2. Correr processar_fornecedores.py (1.129 documentos)
3. Validar resultados: ATCUDs, matches e-Fatura, linhas, certificados 3.1
4. Webhook email (geral@carrocariascsn.pt → Router automático)

### Backlog
5. Portal "duas portas" (Produção + Pessoal)
6. ISO 22400 dashboards (6 KPIs calculáveis)
7. CSN Connect portal
8. COC electrónico IMT (deadline Julho 2026)
9. Agente Financeiro + reconciliação bancária BPI
10. Canais WhatsApp/Telegram operacionais
11. RAG (pgvector, migration 025 pendente)

---

## DEPLOY

- **URL:** https://csn-producao.vercel.app
- **Último deploy:** 079c9a1, 05/04/2026
- **Router testado:** POST /api/router/classificar ✓
