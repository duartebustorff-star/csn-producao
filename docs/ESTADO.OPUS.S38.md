# ESTADO OPUS — S38 (FINAL)
## Data: 04/04/2026 | HEAD: c32ae5c

---

## MÉTRICAS
- Tabelas Supabase: ~47 (41 base + 6 configurador)
- Migrations: 037
- Routes API: 49+
- ADRs: 33
- Agentes autónomos: 11
- Skills: 13
- Embeddings: 2.927

---

## FEITO NA S38

### CRM Pipeline (commit 70bcd83)
- 17 endpoints implementados: /api/veiculos/*, /api/clientes/*, /api/tickets/*, /api/router/classificar, /api/marta/*, /api/leads/*
- 4 migrations: 027_clientes, 028_tickets, 029_conversas_marta, 030_leads_pipeline_crm
- Marta = face pública única (C2 L4-COM)
- Router (C3 L3-MOM) classifica e cria tickets ISA-95
- 6 departamentos activos: COM/PRD/DOC/PER/FIN/ATT
- TypeScript compilação limpa
- Deploy Vercel: csn-producao.vercel.app

### Configurador JPM Réplica (commit 348d83b)
- 6 migrations: 031-036 (catalogo_carrocarias, catalogo_chassis, regras_filtragem, catalogo_acessorios, precos, leads fields)
- Frontend React standalone: configurador-csn.html (46KB)
- Progressive disclosure 6 passos como JPM
- Estado base64 JSON no URL (partilhável)
- Regras filtragem: tribenne só alumínio, rear tipper 5T6 só aço
- Badge registabilidade (verde/laranja/vermelho)
- Geração PDF com jsPDF

### Catálogo Chassis Completo (commit c32ae5c)
- Migration 037: 359 combinações extraídas da API JPM
- Fonte: config-api.jpm-group.com/api/public/vehicles
- 17 marcas, 53 modelos, 3 categorias PBT
- 2-3.5T: 216 | 3.6-5.5T: 103 | 5.6-7.5T: 40
- Inclui variantes L3/L4 com PAF diferente e rodado simples/duplo

### APIs de Veículos Testadas
- matricula.co.pt: username CSN, funciona (marca, modelo, PBT, tara, SEM VIN)
- Vincario: VIN decoder confirmado 50+ campos (entre-eixos, PBT, dimensões, eixos)
- NHTSA: não funciona para VINs europeus
- Vehicle Databases: conta sandbox criada

### Personas C2 Confirmadas (5)
- Marta (COM), Fernando (PRD), Carolina (RH), Luísa (CEO), Leonor (aftersales)

---

## COMMITS S38
```
c32ae5c data: catalogo chassis 359 combinacoes JPM — migration 037
348d83b feat: configurador JPM replica — migrations 031-036, frontend React
70bcd83 feat(S38): endpoints CRM pipeline — 17 endpoints, 4 migrations
2005858 docs: fecho S38 — 6 docs
```

---

## SUPABASE
| Tabela | Linhas | Migration |
|--------|--------|-----------|
| catalogo_chassis | 359 | 037 |
| catalogo_carrocarias | 26 | 031 |
| regras_filtragem | 24 | 033 |
| catalogo_acessorios | 5 | 034 |
| precos | 0 | 035 |

---

## PENDENTE S39
- [ ] Corrigir ordem passos configurador (cofre antes das medidas)
- [ ] Dados reais CSN (pesos, preços)
- [ ] Validação por eixo (peso unitário + distribuição + ângulo ataque)
- [ ] Recomendação inversa veículos
- [ ] Conta Vincario (API key)
- [ ] Email infomatricula.pt
- [ ] Cowork: verificar 10 combinações JPM vs site live
- [ ] Manuais carroçador (limites por eixo)
- [ ] WhatsApp/Telegram API
- [ ] COC electrónico IMT (Jul 2026)
