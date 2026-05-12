# ESTADO OPUS — S58

**Data:** 11 Maio 2026
**Repo:** duartebustorff-star/csn-producao
**Branch:** main (PRs #1 + #2 merged + deployed)
**Status:** sessão fechada com 8 bugs do gerador de termos corrigidos, 4 termos L2026-001 reconciliados em produção, eixo de certificações formalizado num 7º doc canónico.

---

## Resumo sessão

Sessão dedicada a fechar a dívida técnica do endpoint `/api/documentos/gerar-termo` (acumulada desde S39 — clone twilio órfão produzia PDFs lixo há 19 sessões) e a formalizar o eixo de certificações via novo documento canónico `CSN-CERT-ROADMAP-S58.html`. Reconciliação completa dos 6 termos L2026-001 (JAP Mouriz): 4 conformes BD com termo regenerado, 2 com issue regulamentar (refletores 4.8.2.10) pendente. Decisão estratégica: separar `CSN-L3-MOM` em dois agentes nucleus (ENM mecânica + WLD soldadura) e formalizar formação Duarte (IWS + consultor mentor + Eng. Validador Mecânico).

## Feito

### Bugs do gerador de termos (A–H) — 2 PRs merged + deployed

- **PR #1 `fix/termo-endpoint-undefined-and-dossie-sync`** (merge `f579fed` → `546d17c`): bugs A/B/C/D/E/G + remoção do endpoint órfão twilio + criação inicial do carimbo `public/assets/carimbo_csn.svg` (commit `0cb1d1a`)
  - **A**: `obra_id` undefined no body devolvia 500 em vez de 400
  - **B**: `dossie_obra.ficheiro_url` ficava NULL após upload (signed URL não persistido)
  - **C**: `modelo` legal lia `dav.modelo` (nome comercial) em vez de VIN posições 4-6
  - **D**: slug `caixa_aberta_madeira` ia raw para o termo em vez do nome legal IMT
  - **E**: tara total vinha de `dav.tara` (chassis) em vez de `inspecoes.peso_estatico_total` (carroçado)
  - **G**: lookup DAV falhava quando `matricula` chegava NULL — corrigido com fallback VIN
- **PR #2 `fix/inspecao-skip-null`** (merge `485f486` → `6eb76dd`): bug **H** — skip `peso_estatico_total IS NULL` na query, evitando stubs criados por duplicate ingestion

### Reconciliação 6 termos L2026-001 (JAP Mouriz)

| Obra | Matrícula | Status |
|---|---|---|
| L2026-001-01 | CB-83-LB | Conforme — termo regenerado |
| L2026-001-02 | CB-89-LB | Conforme — termo regenerado |
| L2026-001-03 | CB-78-LB | Issue regulamentar (refletores 4.8.2.10) — inspecção importada id=42 |
| L2026-001-04 | CB-34-LG | Issue regulamentar (refletores 4.8.2.10) — inspecção importada id=41 |
| L2026-001-05 | CB-23-LC | Conforme — termo regenerado |
| L2026-001-06 | CB-28-LD | Conforme — termo regenerado |

### Limpeza BD e Storage

- 4 registos NULL/duplicados removidos de `inspecoes`
- 7 PDFs lixo apagados de `Storage/documentos/termos/` (resíduos do clone twilio S39)
- Endpoint twilio órfão removido (root cause `undefined` em `obra_id`)

### Documento canónico novo — 7º

- `docs/CSN-CERT-ROADMAP-S58.html` (`CSN-L4-CST-CERT-001-2026`): 97 KPIs mapeados / 34 definidos ISO 22400-2 / 12 activos hoje; cobertura ISO 9001 62% · EN 1090 25% · EN 3834 0% · ISO 22400 35%

### Decisões estratégicas

| Tema | Decisão |
|---|---|
| Agente nucleus produção | Separar `CSN-L3-MOM` em **`CSN-L3-MOM-ENM`** (Eng. Mecânica) + **`CSN-L3-MOM-WLD`** (Soldadura). Desenho em S59. |
| Formação Duarte | Tira **IWS** (International Welding Specialist) + contrata **consultor mentor de soldadura** + **Eng. Validador Mecânico** part-time |
| 7º doc canónico | `CSN-CERT-ROADMAP-SXX.html` faz parte do fecho de sessão a partir de S58 |
| Tabela `kpis_csn` | Migration 056 a criar em S59 — fórmula + fonte + status para os 97 mapeados |

## Pendente top 10

1. **Layout BZ-93-LE em `route.ts`** — fix visual (cinza headers, carimbo PNG via SVG embedded) diferido. Ponto de partida em branch local `archive/termo-layout-bz93le-canonico` (commit `ac9a22d`). Funcional já entregue pelos PRs #1+#2; Duarte usa os 6 PDFs canónicos do chat para entrega à Juliana hoje
2. **Aplicar migration 054** `skills_csn` em produção (pendente desde S57)
3. **Migration 055** — `agentes_perfil` (regras operacionais JSONB, princípios Boris)
4. **Migration 056** — `kpis_csn` (registar 97 KPIs com fórmula + fonte + status)
5. **Desenhar 2 agentes nucleus L3-MOM** (ENM + WLD) — skills + atribuição de fases
6. **Resolver issue refletores** L2026-001-03 e L2026-001-04 (regulamentar 4.8.2.10)
7. **Skill `vin-decoder-csn`** (VIN → marca + modelo_comercial + modelo_codigo + ano)
8. **Separar `davs.modelo`** em `modelo_comercial` + `modelo_codigo`
9. **Tabela `empresa_dados`** (morada/NIF/certidão SSoT)
10. **Gestão Documental Facturação 2025** ← tema único S59 (ver nota abaixo)

## Como retomar S59

### Comandos PowerShell de arranque

```powershell
cd C:\Users\Utilizador\Projectos-AI\csn-producao
git checkout main
git pull
npm install
code .
```

### Verificar estado actual

```powershell
git log --oneline -10
git status
# Confirmar PRs #1 + #2 merged e Vercel deploy passou
# Confirmar que branch archive/termo-layout-bz93le-canonico existe (route.ts diferido)
git branch -a
```

### Upload dos 7 documentos canónicos S58 no início da próxima sessão

1. `docs/ESTADO.OPUS.S58.md`
2. `docs/CSN-Controlo-OPUS-S58.pdf`
3. `docs/csn-architecture-OPUS-S58.html`
4. `docs/csn-kpis-isa95-S58.html`
5. `docs/csn-skills-tools-registry-S58.html`
6. `docs/CSN-CERT-ROADMAP-S58.html`
7. `CSN-PRODUCAO-BRIEFING.md` (briefing técnico permanente)

## Lições aprendidas

1. **Clones órfãos de endpoints são bombas-relógio**: o endpoint twilio (S39) sobreviveu desligado e produziu PDFs lixo durante 19 sessões. Auditar trimestralmente endpoints sem referência ou com `obra_id` undefined.
2. **Peso do termo vem da inspecção (carroçado), não do DAV (chassis)**: confusão entre `dav.tara` (peso chassis sem carroçaria) e `inspecoes.peso_estatico_total` (peso carroçado) gerava termos com valores incorrectos.
3. **WinAnsi-1252 da Helvetica suporta todos os acentos PT**: não foi necessário embed de TTF Unicode no PDF. O bug "Industria sem acento" era apenas strings sem acento no source code, não limitação da fonte.
4. **Stubs criados por duplicate ingestion fingem ser dados válidos**: filtros `IS NOT NULL` em queries de séries temporais (inspecoes, davs, recibos) são defensivos obrigatórios.
5. **Distinguir formalmente "KPIs activos" (12) vs "KPIs mapeados" (97) vs "KPIs definidos em norma ISO 22400-2" (34)**: ambiguidade entre estes três números mascarava a verdadeira maturidade ISO 22400.

---

## ⚠️ NOTA DE ABERTURA S59 — TEMA ÚNICO

### Gestão Documental Facturação 2025

**Por que agora:** contabilidade precisa de conciliar facturas 2025 com e-Fatura **URGENTEMENTE**. Os 4.409 registos da e-Fatura 2025 já estão importados em BD mas faltam ligações às facturas físicas/digitais e à estrutura de fornecedores como entidades autónomas.

**Trio próximas sessões:**

1. **S59 — Facturação 2025**: conciliar 4.409 registos e-Fatura ↔ facturas em sistema; abrir tabela `fornecedores` como entidade SSoT (cada fornecedor = ecosistema próprio: morada, NIF, contactos, condições, histórico, KPIs)
2. **S60 — Núcleos de fornecedor**: estrutura BD onde cada fornecedor tem o seu próprio subgrafo (contratos, encomendas, recibos, qualidade, prazos, tratamento contencioso)
3. **S61 — KPIs L4-FIN**: registar formalmente em `kpis_csn` os indicadores financeiros activos (DSO, DPO, prazo médio pagamento, churn fornecedores, top-N concentração)

**Entregável S59:** todas as facturas 2025 conciliadas e em formato entregável à contabilidade.

---

**Status final:** sessão produtiva, 8 bugs fechados em 2 PRs merged + deployed, eixo de certificações formalizado, decisões estratégicas tomadas (agentes nucleus + formação Duarte). Layout cosmético do termo diferido. S59 abre em modo urgência contabilística.
