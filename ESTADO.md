# ESTADO DO SISTEMA — CSN Opus

**Última sessão:** 25 (27/03/2026)
**Último commit:** `de050e1` (fecho sessão 25 — ESTADO.md + arquitectura v24 + controlo v10)
**Branch:** main
**Deploy:** csn-producao.vercel.app (manual — `npx vercel --prod`)
**Repo:** duartebustorff-star/csn-producao
**Pasta local:** `C:\Users\Utilizador\Projectos-AI\csn-producao`

---

## O QUE FOI FEITO NA SESSÃO 25

1. Rename masterway→invoicexpress — tabelas Supabase + código (commit `ad21212`)
2. Migration 015 executada — 3 tabelas faturação (clientes_faturacao, faturas, notas_credito)
3. Logo-horizontal.png adicionado ao repo (commit `8436c58`)
4. gerar-termo testado OK com download_url
5. CIT 62766 corrigido (data_inicio)
6. Recibos Set2025 + Mar2026 inseridos — Jan25-Mar26 completo sem lacunas (45 recibos)
7. ADR-025 criado e pushed (commit `e1f5b50`)
8. Docs de fecho (commit `de050e1`)

---

## ESTADO ACTUAL

### Base de Dados — 28+ tabelas Supabase

**Produção:** obras, fases_obra, dossie_obra, davs, fams, cits, inspecoes, certificados_matricula, leads, marcas_veiculo, modelos_veiculo
**RH:** colaboradores_rh, processamentos_mensais, recibos_vencimento (45 registos), pedidos_ferias_faltas, declaracoes_anuais
**Faturação:** clientes_faturacao, faturas (invoicexpress_*), notas_credito (invoicexpress_*)
**Sistema:** colaboradores, chat_messages, documentos, notas_obra, research_tasks, research_results, lugares_parque, ausencias, + auxiliares

### Migrations: 001-015 + 021
### ADRs: 25 (docs/adr/)
### Personas (Camada 2): 6 — Luísa, Fernando, Marta, Leonor, Irina, Carolina
### Agentes Autónomos (Camada 3): 10
### Chat Tools: 17

### Faturação — InvoiceXpress (cert AT 192, conta carlosdossantosna)
- Env vars: INVOICEXPRESS_API_KEY, INVOICEXPRESS_ACCOUNT_NAME
- Routes: /api/faturacao/emitir, /api/faturacao/listar
- Pendente: remover CEGID_VENDUS_API_KEY, cancelar Vendus

### RH — 45 recibos Jan25-Mar26 (3 colaboradores, sem lacunas)
- Salário 2025: 870€ | 2026: 920€
- Bohdan (id=1, SS 7.5%), José Júlio (id=2), João António (id=3)

### Docs actuais: ESTADO.md + docs/csn-architecture__24_.html + docs/CSN-Controlo-Sistema-v10.pdf

---

## PENDENTES

P1: Testar InvoiceXpress real + remover Vendus env var
P2: Migration 016 (movimentos_bancarios, fornecedores, IBAN)
P3: Carolina chat tools para workers
P4: Pipeline documental end-to-end
P5: COC Eletrónico IMT (deadline jul/2026), NORMAS.md, GSR checklist

---

## REGRAS

- PowerShell: sempre cd C:\Users\Utilizador\Projectos-AI\csn-producao primeiro
- Um comando por linha
- SQL: Supabase SQL Editor, Ctrl+A → Delete antes de colar
- Deploy: npx vercel --prod
- Nunca sobrescrever docs — sempre versão nova
- Controlo sempre PDF
- Secção "Prontidão para Auditoria" na arquitectura HTML é inviolável
- Nunca force push

---

## EMPRESA

- Carlos dos Santos Nascimento, Lda | NIF 500 861 790
- Rua da Industria nº8, Casal do Rôdo, 2640-216 Encarnação
- CEO: Duarte da Cunha Martins Bustorff-Silva
- Certidão Permanente: 3172-1374-8252
- Equipamento: Bodor laser, Weinig Unimat 22E (KUKA NÃO adquirido)
