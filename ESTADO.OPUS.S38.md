# ESTADO OPUS — S38 (FINAL DEFINITIVO)
## Data: 05/04/2026 | HEAD: ee8b5a8

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
- 17 endpoints: /api/veiculos/*, /api/clientes/*, /api/tickets/*, /api/router/classificar, /api/marta/*, /api/leads/*
- 4 migrations: 027-030
- Marta = face pública (C2 L4-COM), Router = nucleus (C3 L3-MOM)
- 6 departamentos activos: COM/PRD/DOC/PER/FIN/ATT

### Configurador JPM Réplica (commits 348d83b → ee8b5a8)
- 7 migrations: 031-037
- Frontend React standalone: configurador-csn.html
- Progressive disclosure 6 passos (igual JPM)
- 363 chassis (17 marcas, 53 modelos, 3 PBT)
- 26 carroçarias, 24 regras filtragem, 5 acessórios
- Verificado contra API live JPM (10 combinações)
- Bugs corrigidos: cofre duplicado, mensagem triplicada, pickups filtradas, DISTINCT wheelbases, RENAULT agrupados, ordem passos

### APIs Veículos
- matricula.co.pt: username CSN, funciona
- Vincario: VIN decoder confirmado 50+ campos
- Vehicle Databases: conta sandbox criada

### Assets
- Modelo 3D STL: public/modelo-carrocaria.stl (16MB, caixa aberta)
- Logos CSN: public/logo-csn-white.png + assinatura
- Manual de normas: Fivo Sans Modern, logo só preto/branco

### Personas C2 (5)
- Marta (COM), Fernando (PRD), Carolina (RH), Luísa (CEO), Leonor (aftersales)

---

## COMMITS S38 (9)
```
ee8b5a8 fix: cofre duplicado + mensagem triplicada + pickups filtradas
f3e474c assets: modelo 3D carrocaria STL
dcb8d3d feat: redesign premium dark theme
828d865 fix: cofre antes das medidas
ddbb6d2 fix: DISTINCT wheelbases + RENAULT agrupados
c9b7597 docs: ESTADO S38 final — 363 chassis
c32ae5c data: 359 chassis JPM — migration 037
348d83b feat: configurador JPM replica — migrations 031-036
70bcd83 feat: 17 endpoints CRM pipeline
```

---

## SUPABASE
| Tabela | Linhas | Migration |
|--------|--------|-----------|
| catalogo_chassis | 363 | 037 |
| catalogo_carrocarias | 26 | 031 |
| regras_filtragem | 24 | 033 |
| catalogo_acessorios | 5 | 034 |
| precos | 0 | 035 |

---

## PENDENTE S39

### Configurador JPM — Fechar cópia
- [ ] Verificação lado-a-lado 3 caminhos vs JPM live (Cowork)
- [ ] Corrigir diferenças
- [ ] Registar versão confirmada

### CSN Connect — Portal
- [ ] Copiar configurador JPM como base
- [ ] Dados reais CSN (pesos, preços)
- [ ] Redesign premium (Fivo Sans Modern, verde, 3D)
- [ ] Segmento pickups separado
- [ ] Validação por eixo

### APIs
- [ ] Conta Vincario
- [ ] Email infomatricula.pt
- [ ] CarsXE trial

### CRM / Leads
- [ ] Estado tabelas leads/tickets/conversas
- [ ] Teste fluxo lead completo

### Outros
- [ ] WhatsApp/Telegram API
- [ ] COC electrónico IMT (Jul 2026)
