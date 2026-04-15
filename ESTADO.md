# CSN Opus — Estado do Sistema
## Pré-S51 · 14 Abril 2026 · HEAD: 5b5a721

---

## ARQUITECTURA

- **Stack:** Next.js/TypeScript, Supabase (~90 tabelas), Claude API (Haiku routing, Sonnet 4.6 chat), Voyage AI (pgvector, 2927 embeddings), Vercel, Google Apps Script v8
- **Repo:** duartebustorff-star/csn-producao
- **Prod:** csn-producao.vercel.app
- **Supabase:** oysfxhlzilazeznpaafc

---

## PORTAL

**URL raiz** → Lista nomes → ModeSelector 4 botões:
1. **Produção** (laranja) — obras, fases, timer, chat Fernando
2. **Registo de Veículo** (verde) — carroçaria nova / reparação / entrada-saída viatura
3. **Encomendas** (azul) — placeholder
4. **Área Pessoal** (cinza) — recibos, baixas, dados

**Portal /portal** → Login PIN → Dashboard produção v3 (verde #34C759)

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

### catalogo_chassis:
- Renault: 20 configs (PRONTO)
- FUSO: 27 (PDF existe, não extraído)
- Isuzu/Ford/Mercedes/Stellantis/VW: PENDENTE

---

## FATURAÇÃO

- InvoiceXpress (AT cert 192, account carlosdossantosna)
- Rotas: /api/faturacao/emitir, /api/faturacao/listar
- Pendente: delete duplicado IX 253708521, cancelar Vendus

---

## PENDENTE S51

### Urgente
- Termo responsabilidade BZ-93-LE (2º pedido)
- Testar portal com trabalhadores
- Email Ferromar: tubo 100×60×2 + desconto
- Foto VIN ISUZU ao colaborador

### Portal
- Unificar / e /portal
- Logística funcional (fotos + parque)
- PropostaWizard end-to-end
- Rota /api/upload para fotos

### Engenharia
- Validar ADAP01 com BBG Renault
- Extrair BBG FUSO
- Commitar docs variáveis iLogic

### Sistema
- 4 docs fecho S49
- Obras JAP por facturar
- Power Automate off
- Fix double-encoding JSON
- COC Eletrónico IMT (Jul 2026)
- csnopusprod@gmail.com password change
