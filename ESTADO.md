# CSN Opus — Estado do Sistema
## S51 · 17 Abril 2026 · HEAD: 9b81fed

---

## ARQUITECTURA

- **Stack:** Next.js/TypeScript, Supabase (~90 tabelas), Claude API (Haiku routing, Sonnet 4.6 chat), Voyage AI (pgvector, 2927 embeddings), Vercel, Google Apps Script v8
- **Repo:** duartebustorff-star/csn-producao
- **Prod:** csn-producao.vercel.app
- **Supabase:** oysfxhlzilazeznpaafc

---

## PORTAL

**URL raiz** → Lista nomes → ModeSelector 4 botões:
1. **Produção** (accent) — obras, fases, timer, chat Fernando
2. **Registo de Veículo** (verde) — carroçaria nova / reparação / entrada-saída viatura
3. **Encomendas** (azul) — placeholder
4. **Área Pessoal** (cinza) — recibos, baixas, dados

**Marta:** `/api/marta/mensagem` — conversational engine operacional (be42e52)
**VIN decode:** `/api/veiculo/identificar` — VIN → specs via Vincario (6783b52, fixes 9b81fed)
**inventor/query:** CORS support activo (244fdea)

**PINs:** Bohdan 1001, José Julio 1002, João António 1003, Duarte 1234

---

## OBRAS ACTIVAS

### Produção: 0 obras carroçaria
### Standard (7 obras, 21 fases):
- STD-PRD (8 fases: bases, travessas, longarinas, laterais, frontais, taipais, cofres, suportes)
- STD-MNT-BODOR (4 fases), STD-MNT-POLIR (3 fases)
- STD-LMP-LASER (1), STD-LMP-MONTAGEM (1), STD-LMP-PINTURA (1)
- STD-ORG-RESIDUOS (3 fases)

### Entregues: L2026-001-01 a 06 (JAP/Renault Master)

---

## PARQUE

- 50 lugares, 1 ocupado
- **Lugar 1:** ISUZU N35.150 NLR, VIN JAANLR88HR7100651, expedidor IMOTORS LDA (sem matrícula — veículo novo)

---

## PIPELINE EMAIL

- **Operacional:** Office 365 → Gmail → Apps Script v8 → Router v9 → Supabase → Agente Documental
- **Router:** Sonnet 4.6, classifica e cria tickets ISA-95
- **Agente Documental:** Haiku, classifica PDFs em 14 categorias, extrai dados, dedup por ATCUD
- **Tickets:** ~182/semana processados

---

## FORNECEDORES COM TABELAS PRÓPRIAS

| Fornecedor | ID | Tabelas | Registos |
|-----------|-----|---------|----------|
| Chagas | 1 | facturas_chagas + linhas | existentes |
| Pecol | 2 | facturas_pecol + linhas | existentes |
| ENI Plenitude | 22 | facturas_eni + linhas | 29 facturas, 5 PDFs processados |
| Ferromar (Ferpinta) | 38 | catalogo_materiais (9) + cotacoes (1) + facturas (1) + linhas | completo com €/kg |

---

## ENGENHARIA / iLOGIC

### Variáveis: 80 registos em `variaveis_ilogic` (caixa_aberta)
- G1_FABRICANTE (19), G2_FAM (8), G3_DEFAULTS (9), G4_ENCOMENDA (10), G5_ENGENHARIA (13), G6_CALCULADO (21)
- H_taipal = 450mm (madeira), H_piso = 200mm (bases+longarina+travessas)
- X_pos = WB - ADAP01 - GAP (corrigido)

### Convenção Nomes Inventor (commitado):
- Prefixos: V_ (veículo), F_ (FAM), D_ (defaults), E_ (encomenda), P_ (perfis), C_ (calculados), X_ (fixações)
- Peças: CSN_PAR_*.ipt (paramétricas) + CSN_STD_*.ipt (standard)
- Assemblies: CSN_ASM_[tipo]_[secção].iam

### Docs configurador-paramétrico commitados (b01e92d):
- CSN-Manual-Montagem-Parametrica.md
- CSN-Variaveis-Parametricas-Modelo.md
- CSN-Configurador-Parametrico-Registo-Completo.md
- CSN-Convencao-Nomes-Inventor.md
- CSN-Configurador-Fecho-Sessao-15Abr2026.md
- CSN_CaixaAberta_v7.vb
- agent-inventor.html

### catalogo_chassis:
- Renault: 20 configs (PRONTO)
- FUSO: 27 (PDF existe, não extraído)
- Isuzu/Ford/Mercedes/Stellantis/VW: PENDENTE

---

## DOCUMENTOS S51

- **CSN-Guia-Colaborador.pdf** — guia de utilização portal (3 páginas A4, logo CSN, PINs, 6 secções)
- **Portal-CSN-Guia-Trabalhadores.pptx** — apresentação 6 slides para trabalhadores (verde #27AE60)

---

## COMMITS S51

| Hash | Descrição |
|------|-----------|
| b01e92d | docs: configurador parametrico - registo sessao 11-15 Abr 2026 |
| be42e52 | feat: Marta conversational engine /api/marta/mensagem |
| 244fdea | feat(inventor/query): add CORS support |
| ca8cbaa | merge: CORS inventor/query |
| 6783b52 | feat: route veiculo/identificar VIN decode via Vincario |
| 724c370 | fix: remover campos JSONB schema cache route veiculo/identificar |
| 9aeea0d | fix: alinhar nomes colunas com schema catalogo_chassis |
| 9b81fed | fix: encoding e dimensoes route veiculo/identificar v2 |

---

## FATURAÇÃO

- InvoiceXpress (AT cert 192, account carlosdossantosna)
- Rotas: /api/faturacao/emitir, /api/faturacao/listar
- Pendente: delete duplicado IX 253708521, cancelar Vendus

---

## PENDENTE S52

### Urgente
- Termo responsabilidade BZ-93-LE (2º pedido — juliana.sousa@caasolution.pt)
- Testar portal com trabalhadores (guia e apresentação prontos)
- Email Ferromar: tubo 100×60×2 + desconto (Gonçalo goncalo.goncalves@ferro.pt)
- Ford BBAS Q-381 — boletim bomba combustível (ticket aberto)

### Portal
- Logística funcional (fotos + parque)
- PropostaWizard end-to-end
- Rota /api/upload para fotos

### Engenharia
- Validar ADAP01 com BBG Renault
- Extrair BBG FUSO (CANTER-TUDO.json → tabela veiculos_tecnicos)
- Isuzu/Ford/Mercedes/Stellantis/VW pendente no catalogo_chassis

### Sistema
- 4 docs fecho S49 (ainda pendentes)
- Obras JAP por facturar (6 × €2.100+IVA)
- Power Automate off
- Fix double-encoding JSON
- COC Eletrónico IMT (Jul 2026)
- csnopusprod@gmail.com password change
