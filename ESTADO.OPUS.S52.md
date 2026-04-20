# ESTADO.OPUS.S52

**Data fecho:** 2026-04-18
**Sessão anterior:** S51
**Próxima sessão:** S53 (continuação FUSO eCanter)
**HEAD git esperado após commit:** TBD (após `git add . && git commit && git push`)

---

## O QUE FOI FEITO EM S52

### Catálogo FUSO Canter LHD — Diesel 100% completo

**Objectivo da sessão:** iniciar construção do catálogo FUSO como dados de fornecedor, alimentando `catalogo_chassis` e `fichas_tecnicas_fuso` no Supabase. O catálogo FUSO é o segundo fornecedor a ser integrado (Renault Master XDD já existia com 20 configs).

**Entregável principal:** `CSN_FUSO_Catalog_S52_v2.xlsx` em `docs/fornecedores/fuso/`.

#### Conteúdo do Excel v2

- **Sheet `Diesel_60`:** 60 variantes diesel LHD Euro VI (Dezembro 2021), TODAS com 100% dos campos extraíveis dos PDFs preenchidos. ~90 colunas por variante.
  - 3S13 (6 variantes — Manual + DUONIC × 3 WB + EUW 130hp)
  - 3S15 (4 — Manual + DUONIC × 2 WB + EUX 150hp)
  - 3C13 (8 — Manual + DUONIC × 4 WB + EUW)
  - 3C15 (8 — Manual + DUONIC × 4 WB + EUX)
  - 3C15D (2 — crew cab Manual + DUONIC × WB 3400 + EUX)
  - 6S15 (3 — Manual × 3 WB + EUX)
  - 6C18 4×4 (2 — Manual AWD × 2 WB + EUY 175hp) — FGB
  - 6C18D 4×4 (2 — crew cab Manual AWD × 2 WB + EUY) — FGB
  - 7C15 (8 — Manual + DUONIC × 4 WB + EUX)
  - 7C15D (1 — crew cab Manual 3850 + EUX)
  - 7C18 (9 — Manual × 5 WB + DUONIC × 4 WB + EUY)
  - 7C18D (3 — crew cab Manual × 1 WB + DUONIC × 2 WB + EUY)
  - 9C18 (4 — DUONIC × 4 WB + EUY + rear_axle_ratio único 5.714)

- **Sheet `eCanter_10`:** 10 variantes eléctricas LHD (Outubro 2023). **Parcial** — cobre apenas 3 dos 7 PDFs eCanter disponíveis.
  - 7C18e M-Battery (4 WB)
  - 9C18e M-Battery (4 WB)
  - 9C18e L-Battery (2 WB)

- **Sheet `Decoder_Codigo`:** decoder do FUSO model code 12 chars (diesel) / 13 chars (eCanter). 34 linhas. 4 famílias (FEA/FEB/FEC/FGB) × 6 sub-plataformas (01/51/71/X1/VK/7K) × mapa completo de pos 6 (WB), 7 (L/R), 8 (transmissão/bateria), 9 (cabina), 10-12 (EUW/EUX/EUY diesel) / 10-13 (SEU1/SEU2/SEU3 eCanter).

- **Sheet `Schema_Mapping`:** mapeamento EN ↔ DE ↔ campo SQL proposto (100 linhas). Base para o Agente Documental.

- **Sheet `README`:** propósito, fonte, arquitectura, lacunas, próximos passos.

#### Descobertas-chave do decoder confirmadas

1. **Pos 1-3 (família):** FEA (Standard), FEB (Comfort light), FEC (Comfort heavy/wide), **FGB (AWD 4×4)** — novo vs resumo S52 inicial.
2. **Pos 4-5 (geração+variante):** 01 (3.5T), 51 (6T), 71 (7.49T e 4×4 7T), X1 (8.55T 9C18), VK (eCanter 4-6T), 7K (eCanter 7C18e), XK (eCanter 9C18e).
3. **Pos 8 diesel:** 3=DUONIC, 4=Manual 5M, 6=Manual+AWD (confirmado).
4. **Pos 8 eCanter:** C=S-Battery, D=M-Battery, E=L-Battery. Pos C confirmado com 4S15e/4C15e/6S15e (antes "inferido").
5. **Pos 10-12 diesel:** EUW=96kW/130hp (3S13, 3C13), EUX=110kW/150hp (3S15/3C15/6S15/7C15/7C15D), EUY=129kW/175hp (7C18/7C18D/9C18/6C18 4×4).
6. **Sufixos eCanter SEU1/SEU2/SEU3** homologação por plataforma.

#### Especificidades únicas capturadas

- **9C18 DUONIC:** rear_axle_ratio **5.714** (único no catálogo — todos os outros 4.444/4.875/4.111), max_speed **129 km/h** (não 130), GVW 8550, GCW 12050, front_overhang 1185.
- **6C18 / 6C18D 4×4:** ground_clearance_axle_front/rear 210/185, approach/departure angles 35°/25°, torque_split 60/40 F/R.
- **7C18 WB 4300/4750:** passa de frame 750mm → 850mm e width 2025 → 2135 ("wide comfort").

#### Trabalho desta sessão (S52)

Esta sessão S52 teve múltiplas conversas em Claude que processaram os 30 PDFs FUSO (15 diesel EN + 15 DE + 9 eCanter). A sessão produziu:

1. **Chat inicial S52:** leitura de PDFs rodada a rodada (5 rodadas), descoberta iterativa do decoder, primeira construção do xlsx v1 com 70 variantes (60 diesel + 10 eCanter).
2. **Chat final S52 (este):** detecção de 16 linhas diesel EUY com pesos/dimensões em branco no v1; extracção verbatim dos 5 PDFs (7C18 Manual, 7C18 DUONIC, 7C18D Manual, 7C18D DUONIC, 9C18 DUONIC) via rasterização 150 DPI; preenchimento das 16 linhas; gravação de v2 com diesel 100% completo.

#### Lições aprendidas em S52

- **REGRA BANDEIRA aplicada estritamente:** zero inferência. Os 5 campos AWD (ground_clearance_axle_front/rear, approach_angle, departure_angle, torque_split_4x4) ficam NULL nos 56 veículos 4×2 porque não existem nos PDFs deles. Correctamente vazios.
- **Lapso identificado em v1:** um Claude anterior leu os PDFs 7C18/7C18D/9C18 para contagem/decoder mas não transcreveu pesos/dimensões para as células. Corrigido em v2.
- **Necessidade reconhecida:** skill `analise-ficha-fuso` para Agente Documental extrair automaticamente futuras fichas (novas variantes por email, fichas legacy de veículos antigos não disponíveis no site FUSO).

---

## O QUE NÃO FOI FEITO EM S52 (passa para S53)

### 1. Completar eCanter — **prioridade alta**

Adicionar 13 variantes à sheet eCanter (10 → 23 total):
- **4S15e:** 4 variantes (3 S-Battery + 1 M-Battery) — PDF `1_TF_eCanter_4S15e_LHD_2022_EN_update.pdf`
- **4C15e:** 3 variantes (2 S-Battery + 1 M-Battery) — PDF `2_TF_eCanter_4C15e_LHD_2022_EN_update.pdf`
- **6S15e:** 4 variantes (3 S-Battery + 1 M-Battery) — PDF `3_TF_eCanter_6S15e_LHD_2022_EN_update.pdf`
- **7C18e L-Battery:** 2 variantes (WB 4450 + 4750) — PDF `4_TF_eCanter_7C18e_LHD_2022_L-Battery_EN_update.pdf`

Adicionalmente, **auditar** as 10 linhas eCanter já existentes em v2 (7C18e M, 9C18e M, 9C18e L) campo-a-campo contra os PDFs originais — por analogia com o lapso diesel v1, pode haver campos em falta.

### 2. Actualizar Decoder_Codigo e README

- Pos 8 `C` de "inferido" para "confirmado" (S-Battery validada nos PDFs 4S15e/4C15e/6S15e).
- Adicionar SEU1 (6S15e) e SEU3 (4S15e, 4C15e) como sufixos eCanter. SEU2 já lá está.
- README: contagem 60 + 23 = 83. Remover lacunas resolvidas.

### 3. Produzir migration SQL Supabase

Ficheiro `migrations/XXX_fuso_catalog.sql`:
- `CREATE TABLE fichas_tecnicas_fuso` (diesel, ~62 cols, PK `id`, UNIQUE `fuso_model_code`, 5 cols AWD nullable, CHECK constraints).
- `CREATE TABLE fichas_tecnicas_fuso_ecanter` (~61 cols, CHECK battery_variant S/M/L).
- `CREATE TABLE fuso_decoder_codigo` + 34 INSERTs idempotentes.
- `CREATE VIEW v_catalogo_fuso` UNION ALL com coluna `propulsao`.
- Indexes em modelo, wheelbase, drive_type, gvw, battery_variant.
- Trigger `_trg_set_updated_at`.
- Idempotente (IF NOT EXISTS, ON CONFLICT DO NOTHING).

### 4. Produzir skill `analise-ficha-fuso`

Em `/mnt/skills/user/analise-ficha-fuso/SKILL.md`. Detecção automática (keyword "FUSO model code"), schema de extracção (~45 cols diesel / ~50 cols eCanter), regra de parsing tabela-layout-fixo, output `ON CONFLICT DO UPDATE`, verificação de duplicados por `fuso_model_code`, suporte legacy (fichas antigas via `ficha_valida_em` + `extraido_de`).

### 5. Actualizar Agente Documental (14 → 16 categorias)

Adicionar classificadores `ficha_tecnica_fuso_diesel` e `ficha_tecnica_fuso_ecanter`. Detecção tetra-família FEA/FEB/FEC/FGB. Validação pos 6 decoder vs WB extraído. Testes E2E com 2 PDFs fixture.

### 6. Script de import xlsx → Supabase

`scripts/import_fuso_xlsx.ts` que lê `docs/fornecedores/fuso/CSN_FUSO_Catalog_S52_v3.xlsx` e faz `ON CONFLICT DO UPDATE` nas duas tabelas.

---

## ESTADO TÉCNICO DO SISTEMA

- **Supabase HEAD:** ~84 tabelas. Sem alterações de schema em S52.
- **Git HEAD após S52:** a confirmar após commit. Commits esperados nesta sessão:
  - `docs(fuso): v2 catálogo FUSO diesel 60 variantes completas`
  - `docs(sessao): fecho S52`
- **Vercel produção:** `csn-producao.vercel.app` — sem deploys em S52.
- **Agente Documental:** operacional desde S49. 14 categorias. Sem alterações em S52.
- **Router email:** v9 operacional. Sem alterações em S52.
- **R_AGENT:** operacional. Sem alterações em S52.

---

## PROBLEMAS CONHECIDOS HERDADOS DE S49-S51

(Sem alterações em S52 — listados para continuidade)

- DOC handler para acções automáticas de tickets — ainda ausente
- Três sistemas de processamento documental sobrepostos — ainda por consolidar
- Faturação: duplicar invoice 253708521 — ainda por apagar; Vendus subscription — ainda por cancelar
- Worker portal: navegação por reconstruir (sidebar estruturada, PropostaWizard integrar)
- OCR paralelo Tesseract + Claude Vision — ainda adiado
- Gate docs lead→produção — ainda por enforçar
- `fam` e `cartao_unico` tables — ainda por criar

---

## COMO ABRIR S53

1. `cd C:\Users\Utilizador\Projectos-AI\csn-producao`
2. `Get-Content ESTADO.OPUS.S52.md` (deste ficheiro)
3. Upload no chat Claude dos ficheiros de S52:
   - `CSN-Controlo-OPUS-S52.pdf`
   - `csn-architecture-OPUS-S52.html`
   - `docs/fornecedores/fuso/CSN_FUSO_Catalog_S52_v2.xlsx`
4. Upload dos 4 PDFs eCanter em falta:
   - `1_TF_eCanter_4S15e_LHD_2022_EN_update.pdf`
   - `2_TF_eCanter_4C15e_LHD_2022_EN_update.pdf`
   - `3_TF_eCanter_6S15e_LHD_2022_EN_update.pdf`
   - `4_TF_eCanter_7C18e_LHD_2022_L-Battery_EN_update.pdf`
5. Upload dos 3 PDFs eCanter já na v1 (para auditoria):
   - `4_TF_eCanter_7C18e_LHD_2022_M-Battery_EN_update.pdf`
   - `5_TF_eCanter_9C18e_LHD_2022_M-Battery_EN_update.pdf`
   - `5_TF_eCanter_9C18e_LHD_2022_L-Battery_EN_update.pdf`
6. Pedir ao Claude:
   - (a) Auditar 10 linhas eCanter existentes contra os 3 PDFs — reportar discrepâncias antes de alterar.
   - (b) Adicionar 13 linhas eCanter novas extraídas verbatim dos 4 PDFs novos.
   - (c) Actualizar Decoder_Codigo (pos 8 C confirmado, SEU1 + SEU3 adicionados).
   - (d) Actualizar README (83 variantes).
   - (e) Gravar `CSN_FUSO_Catalog_S52_v3.xlsx` (a v3 é ainda do âmbito S52 como dados de fornecedor, mas produzida em S53).
7. Após v3 aprovado, arranque dos artifacts DDL + skill + prompt Claude Code Agente Documental.

**REGRA BANDEIRA absoluta em todo o trabalho S53:** zero inferência. Campo sem fonte directa no PDF = NULL.

---

## CONTAGEM DE SESSÃO

- Ficheiros gerados em S52: 6 (os 5 docs de fecho + `CSN_FUSO_Catalog_S52_v2.xlsx`)
- PDFs processados: 23 (15 diesel EN + 8 eCanter EN) — os 15 DE são duplicados dos EN para verificação cruzada
- Variantes catalogadas: 70 (60 diesel + 10 eCanter parcial)
- Descobertas de decoder: 4 famílias × 6 sub-plataformas × 3 sufixos diesel × 3 sufixos eCanter + 6 wheelbases × 6 opções pos 8
