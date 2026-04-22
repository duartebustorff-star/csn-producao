# ESTADO.OPUS.S54

**Data fecho:** 2026-04-22
**Sessão anterior:** S53 (fechada 2026-04-20, commit `0672994`)
**Próxima sessão:** S55
**HEAD git esperado após commit:** `<a preencher após commit>`

---

## ESCOPO DE S54

Sessão de trabalho técnico profundo sobre modelação paramétrica Inventor +
definição arquitectural do módulo CSN NestHub (equivalente integrado a
Almacam Cut/Tube) + correcção de dados de máquina na memória.

Diferente das 3 sessões anteriores (catalogação de fornecedores FUSO em
S51/S52/S53), S54 foi **dominada por duas linhas de trabalho**:

1. **L4-ENG** — iLogic rules, convenção Inventor CSN, briefing freelancer
2. **L3-MOM** — visão do CSN NestHub como camada integradora

As pendências defensivas originalmente planeadas para S54 (REGRA BANDEIRA
codificada, tabela `agentes_perfil`, anti-loop) rolaram intactas para S55.
Decisão deliberada: aproveitar o momentum iLogic actual e registar tudo
antes de esfriar.

---

## TRABALHO REALIZADO EM S54

### 1. iLogic — supressão/activação de bases

**Ficheiro testado:** `Floor-assembly-version-4.2-V2.iam`
**Descoberta-chave:** `ComponentOccurrence.Suppressed` é **read-only** no
Inventor 2026 API. Solução validada:

```vb
Dim occ As ComponentOccurrence
' NÃO usar occ.Suppressed = True  → falha E_FAIL
' Usar Component.IsActive("nome:N") = True/False
Component.IsActive("Universal_chassis_mounting_bodywork_80x4:15") = False
```

**Resultado teste:** 42 instâncias de base universal no assembly.
- 10 suprimidas ✓
- 32 re-activadas ✓
- 0 falhas

### 2. iLogic — escrita em parâmetros da base universal

**Ficheiro:** `Universal_chassis_mounting_bodywork_80x4.ipt`

**Padrão validado:**
```vb
Dim pdoc As PartDocument = TryCast(occ.Definition.Document, PartDocument)
Dim pdef As PartComponentDefinition = pdoc.ComponentDefinition
pdef.Parameters.Item(dn).Expression = "val mm"
pdoc.Update()
```

**Parâmetros aplicados:** d34 (2.2), d39 (65.5), d40 (65.5), d41 (12.2).
4/4 OK.

### 3. Diagnóstico das longarinas Fiat

**Ficheiros:**
- `Fiat L3 CCD_01_0101_01 - Chapa_Longarina_t=3mm_Rev07-Front-2.ipt`
- `Fiat L3 CCD_01_0101_01 - Chapa_Longarina_t=3mm_Rev07-Rear-2.ipt`

**Resultado:** peças **NÃO paramétricas**.
- `Total ModelParameters: 1`
- `UserParameters.Count: 0`
- Qualquer escrita retorna `E_UNEXPECTED` (0x8000FFFF)
- Peças importadas de STEP sem histórico

**Consequência:** User Parameters nomeados referidos no briefing antigo
(`LL_Length_Xp`, `T_Xp_1`, etc.) **não existem** na peça. Tem de ser
remodelada de raiz. Trabalho fica para Murtaza (ver briefing).

### 4. Convenção Inventor CSN (finalizada)

**Peças (nomes em inglês):**

| Ficheiro | Conteúdo |
|---|---|
| `CSN_PAR_Bases.ipt` | 20 bases (12 em +X + 8 em −X) numa peça única |
| `CSN_PAR_Stringer_Front_Xp.ipt` | Longarina traseira +X (12 dentes) |
| `CSN_PAR_Stringer_Rear_Xn.ipt` | Longarina frontal −X (8 dentes) |
| `CSN_PAR_Crossbeams.ipt` | Travessas |

**Sistema de coordenadas:**
- `X = 0` no eixo traseiro do chassis
- `+X` direcção cabine
- `+Y` esquerda (ISO 8855)
- `Z = 0` plano XY = face inferior das peças

**Convenção eixos:** `Px/Nx/Py/Ny` (Positive/Negative X/Y).

**User Parameters longarina (prefixo `SR_` = Stringer):**
- `SR_Length_Xp`, `SR_Height`, `SR_Thickness`
- `SR_Tooth_1..12` (+X, 12 dentes)
- `SR_Tooth_Width`, `SR_Tooth_Height`, `SR_Tooth_Hole_Dist`, `SR_Tooth_Hole_Diam`
- Lado −X: 8 dentes `T_Xn_1..8`

**Features nomeadas:** `Feat_SR_Tooth_N`, `Feat_Rasgo_Xp_N`.

**Contagem confirmada:** 12 dentes no lado +X, 8 no lado −X. Total 20 bases.

**Valores Renault Master L3 teste:**
- `Tooth_Px_1..4` = 659.2, 1074.2, 1694.2, 1764.2
- `Tooth_Nx_1..2` = 152.8, 985.8

### 5. Rule iLogic `CSN_Inventario_Recursivo`

**Propósito:** varre todo o assembly recursivamente, classifica cada peça
em CHAPA / TUBO / IGNORAR / OUTRO. Output CSV no Desktop.

**Lógica de classificação:**
1. Nome contém `Chapa` / `Fecho` / `Base` → CHAPA
2. Nome contém `Tubo` / `Longarina` / `Stringer` / `Travessa` / `Crossbeam` → TUBO
3. `DocumentSubType = kSheetMetalDocumentSubType` → CHAPA
4. Parent é Content Center → IGNORAR
5. Material é `Wood*` ou `Generic` → IGNORAR
6. Resto → OUTRO

**Resultado teste** (`Main Assembly-version-4_2.iam`):
- 56 peças únicas
- 194 instâncias
- Classificação: 26 CHAPA, 60 TUBO, 76 IGNORAR (Content Center + madeira), 4 OUTROS

### 6. Rule iLogic `CSN_Export_Nesting_v2`

**Propósito:** exporta peças por tipo para pasta de obra, pronta para o
módulo NestHub agregar.

**Estrutura de pastas:**
```
C:\Users\Utilizador\Projectos-AI\Nesting\
└── {asm_name}\
    ├── Chapas\     ← DXF flat patterns
    └── Tubos\      ← STEP AP214
```

**Nomenclatura:**
```
{nome_original}_{t=Xmm|NxNxN}_{material}_{NNN}.{dxf|step}

Ex: Fecho_07-02_Base_t=3mm_S235JR_001.dxf
Ex: Stringer_Front_80x40x3_S235JR_012.step
```

**Fonte de material:** `partDoc.ComponentDefinition.Material.Name`.
Fallback 1: regex no nome da peça. Fallback 2: string `MISSING`.

**Resultado teste:**
- 8 DXF + 60 STEP criados
- 18 peças skipped (sem flat pattern disponível)
- 26 campos `MISSING` (peças sem iProperty de material)

**Peças que falharam flat pattern (backlog Murtaza):**
- `Universal_chassis_mounting_bodywork_80x4.ipt` (×12 instâncias)
- `Fecho_07 - 02_Base.ipt` (×2)
- `Fecho_01_01 Pega Fecho.ipt` (×4)

### 7. Visão CSN NestHub (nova secção L3-MOM)

**Arquitectura 4 etapas:**

```
ETAPA 1 — EXPORT (dia da modelação)
  Inventor → rule iLogic → C:\CSN\Obras\{obra_id}\
                            ├── Chapas\ (DXF)
                            └── Tubos\ (STEP)

ETAPA 2 — AGREGAÇÃO (domingo 20h, cron)
  Script varre todas as obras activas e agrupa por perfil:
  C:\CSN\NestingPool\Tubos\80x40x3_S235\
    ├── obra_L2026-010_Stringer_001.step
    ├── obra_L2026-011_Travessa_001.step
    ...
  (Registo em Supabase: nesting_queue com obra_id por ficheiro)

ETAPA 3 — CORTE (segunda ou terça)
  Operador Bodor A3T6:
  - Tipo da semana escolhido no portal (chapa OU tubo, não ambos)
  - Software nesting lê pool → gera programa óptimo
  - Ao importar: ficheiros movem-se para NestingPool\_processed\{data}\

ETAPA 4 — RASTREABILIDADE (pós-corte)
  Cada peça cortada volta à pasta da sua obra:
  C:\CSN\Obras\{obra_id}\Corte_Realizado\
  Registo Supabase: status=cortado, data_corte, operador
  Etiqueta por palete com QR code (obra_id)
```

**Tabela `nesting_queue` (a criar em S55):**
```sql
CREATE TABLE nesting_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id text REFERENCES obras(id),
  ficheiro_path text NOT NULL,
  ficheiro_nome text NOT NULL,
  tipo text CHECK (tipo IN ('CHAPA', 'TUBO')),
  perfil_ou_espessura text,
  material text,
  peca_origem text,
  quantidade integer DEFAULT 1,
  status text CHECK (status IN (
    'exported','ready_to_cut','in_nesting','cut','in_production','consumed'
  )),
  data_export timestamptz DEFAULT now(),
  data_agregacao timestamptz,
  data_corte timestamptz,
  data_consumo timestamptz,
  programa_corte text,
  nesting_batch text
);
```

**Decisão estratégica sobre motores de nesting:**

| Domínio | Escolha | Custo | Quando |
|---|---|---|---|
| Tubos 3D | Almacam Tube (Alma) | €25-45k + 15%/ano | Investimento Q4 2026 / Q1 2027 após baseline |
| Chapas 2D | Gratuitos (Deepnest.io, SVGnest) + software Weihong | €0 | Já, com máquina actual |

**Razão:** Alma tem 45 anos de algoritmos de nesting óptimo. Palfinger
relata 50% time savings. Para tubo 3D (offcuts cilíndricos, multi-axis,
cortes inclinados) não há alternativa gratuita credível. Para chapa 2D
existem alternativas aceitáveis — decidir após ter baseline de sucata.

**CSN NestHub não substitui estes motores — é a camada integradora** que
liga obras, operadores, clientes, financeiro, EN 1090 à máquina de corte.
Almacam + concorrentes são ilhas — nenhum deles fala com o ERP da fábrica.

### 8. Correcção máquina na memória

**Estava errado:** "Bodor P3015"

**Correcto:**
- Modelo: **Bodor A3T6**
- Potência: 6 kW fibra
- Área de corte chapa: 3000 × 1500 mm
- Corte tubular: incluído (T no modelo)
- Controlador: Weihong (FSCUT / CypCut)

Actualização feita via `memory_user_edits` no fim da sessão.

---

## KPIS NOVOS (L3-MOM — NestHub)

5 KPIs fundadores, baseline a medir em S55-S56:

- **NEST-1** — % sucata por corte (por obra / por lote)
- **NEST-2** — tempo médio de programação nesting (min/programa)
- **NEST-3** — piercings por programa (objectivo: reduzir)
- **NEST-4** — obras agregadas por sessão de corte (≥ 3 é bom)
- **NEST-5** — aproveitamento de offcuts (% de material de pontas usado)

---

## SKILLS NOVAS

| Skill | ISA-95 | Estado |
|---|---|---|
| `export-nesting-inventor` | L4-ENG | Criada S54 (rule VB documentada) |
| `modelacao-parametrica-longarina` | L4-ENG | Criada S54 (briefing Murtaza) |

**Total skills após S54:** 237 → **239**.

---

## ARTEFACTOS TÉCNICOS PRODUZIDOS EM S54

| # | Ficheiro | Destino |
|---|---|---|
| 1 | `ESTADO.OPUS.S54.md` | raiz + `docs/` |
| 2 | `CSN-Controlo-OPUS-S54.pdf` | `docs/` |
| 3 | `csn-architecture-OPUS-S54.html` | `docs/` |
| 4 | `csn-kpis-isa95-S54.html` | `docs/` |
| 5 | `csn-skills-tools-registry-S54.html` | `docs/` |
| 6 | `CSN-Convencao-Nomes-Inventor-v2.md` | `docs/inventor/` |
| 7 | `BRIEFING-Murtaza-Longarinas-S54.md` | `docs/inventor/` |
| 8 | `CSN_Export_Nesting_v2.vb` | `docs/inventor/` |
| 9 | `CSN_Inventario_Recursivo.vb` | `docs/inventor/` |

---

## PENDÊNCIAS MURTAZA (freelancer 3D, S55)

1. **Remodelar 3 peças CHAPA como SheetMetal proper** (`Universal_chassis_mounting_bodywork_80x4`, `Fecho_07 - 02_Base`, `Fecho_01_01 Pega Fecho`)
2. **Atribuir material** (`S235JR`/`S275JR`/`S355JR`) aos 26 `.ipt` com iProperty vazio
3. **Modelar `CSN_PAR_Stringer_Front_Xp.ipt`** paramétrica (12 dentes com Opção 2 sketch único, User Parameters `SR_Tooth_N` + dimensões partilhadas)
4. **Modelar `CSN_PAR_Stringer_Rear_Xn.ipt`** paramétrica (8 dentes)
5. **Modelar `CSN_PAR_Bases.ipt`** com 20 bases (12+X + 8−X) parametrizáveis

Briefing formal completo em `docs/inventor/BRIEFING-Murtaza-Longarinas-S54.md`.

---

## PENDÊNCIAS S54 ORIGINAIS (rolam para S55)

- **REGRA BANDEIRA codificada** em `CLAUDE.md` raiz + system prompt do Router + schema de resposta com `fonte`/`sem_fonte`/`confianca`
- **Tabela `agentes_perfil`** com enforcement no Router (cada agente confinado às suas tabelas/tools/skills)
- **Anti-loop mechanism** (max_iterations, detecção de chamadas repetidas)
- **Auditoria 10 rows eCanter herdadas** (depende dos 3 PDFs EN em falta; processo automático via Agente Documental quando chegarem)
- **Reconciliação percentagens "Prontidão para Auditoria"** (ISO 9001 60%, CE 45%, EN 1090 40%, 14001 25%, 45001 20% — valores S52, manter até haver progresso real)

---

## ESTADO TÉCNICO DO SISTEMA

- **Supabase:** ~87 tabelas (após migration S53 `053_fuso_catalog.sql` aplicada — confirmar).
- **Git HEAD após S54:** `<preencher>`. 3 commits locais por push:
  - `5ee2d9b` sessao: fecho S52 retroactivo
  - `7f05f3d` chore: limpeza arvore pre-S54
  - `<hash>` sessao: fecho S54 — iLogic + NestHub + convencao Inventor
- **Vercel produção:** `csn-producao.vercel.app` — sem deploys em S54.
- **Agente Documental:** 16 categorias (após integração skill `analise-ficha-fuso`).
- **Máquina corte:** Bodor A3T6 6kW híbrida chapa+tubo, 3000×1500mm, controlador Weihong.

---

## PROBLEMAS CONHECIDOS HERDADOS (sem alteração em S54)

- DOC handler para acções automáticas de tickets — ausente desde S49
- Três sistemas de processamento documental sobrepostos — por consolidar
- Faturação: invoice 253708521 duplicado por apagar; Vendus subscription por cancelar
- Worker portal: navegação por reconstruir (sidebar Proposta/Obras/Ponto/Chat/Documentos)
- OCR paralelo Tesseract+Claude Vision — adiado
- Gate docs lead→produção — por enforçar
- Tabelas `fam` e `cartao_unico` — por criar
- Agent session log `wake/emit/sleep` — por ligar a todas as routes

---

## COMO ABRIR S55

1. `cd C:\Users\Utilizador\Projectos-AI\csn-producao`
2. `Get-Content ESTADO.OPUS.S54.md`
3. Upload no chat dos 5 docs de fecho S54 (este + Controlo PDF + architecture HTML + KPIs HTML + skills registry HTML).
4. Confirmar com Duarte qual o vector de S55:
   - **A)** Sistema defensivo (REGRA BANDEIRA + `agentes_perfil` + anti-loop) — pendência original
   - **B)** Implementar `nesting_queue` + agente de agregação dominical — visão NestHub
   - **C)** Outro (worker portal, templates de fornecedor, memorando por marca chassi)

**REGRA BANDEIRA absoluta**: zero inferência, fonte directa ou campo vazio, sem excepções.

---

## CONTAGEM DE SESSÃO S54

- **Ficheiros gerados em S54:** 9
- **Rules iLogic validadas:** 2 (`CSN_Inventario_Recursivo`, `CSN_Export_Nesting_v2`)
- **Peças analisadas:** 56 únicas (194 instâncias)
- **Exports teste:** 8 DXF + 60 STEP
- **Skills registry:** 237 → 239 (+`export-nesting-inventor`, +`modelacao-parametrica-longarina`)
- **Tabelas Supabase:** sem alteração (nesting_queue planeada para S55)
- **Commits git esperados:** 1 (fecho S54) + 2 anteriores já locais (5ee2d9b S52 retroactivo, 7f05f3d limpeza)
- **Correções de memória:** 1 (Bodor P3015 → A3T6)
