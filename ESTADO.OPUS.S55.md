# ESTADO.OPUS.S55

**Data fecho:** 2026-04-22
**Sessão anterior:** S54 (fechada 2026-04-22, commit `a13015e`)
**Próxima sessão:** S56
**HEAD git após S55:** `a13015e` (sem commits novos em S55 — trabalho no Supabase e deploy Vercel)

---

## ESCOPO DE S55

Sessão operacional de desbloqueio: resolver problema imediato do João no portal de
colaboradores + concluir o import do catálogo FUSO que estava pendente desde S53.

**Duas linhas de trabalho:**

1. **Worker portal** — diagnóstico e fix do Fernando (lead bloqueada por email)
2. **FUSO catalog** — migration + import completo das 83 variantes

As pendências defensivas (REGRA BANDEIRA, `agentes_perfil`, anti-loop) rolam novamente
para S56 — decisão deliberada de priorizar o operacional.

---

## TRABALHO REALIZADO EM S55

### 1. Diagnóstico portal João — Fernando não criava leads

**Sintoma:** João (PIN 1003) não conseguia registar o Nissan Cabstar 76-38-71B.
Sessão de 13/04 ficou a meio — cliente "Fernando" deu telefone mas não deu email.

**Diagnóstico via Supabase:**
- Todas as mensagens do Fernando tinham `metadata: {"tool_calls": false}` — **comportamento normal**
- A lead nunca foi criada porque o system prompt exigia email antes de chamar `criar_lead`
- Tabela `leads` → zero registos para matrícula 76-38-71B

**Root cause:** system prompt `route.ts` linha 45-46:
```
5. Em AMBOS → pede email
6. Quando tiveres tudo → cria lead
```
O Fernando interpretava "tudo" como incluindo email — bloqueava a criação.

### 2. Fix route.ts — email opcional

**Ficheiro:** `src/app/api/chat/route.ts`

**Alteração no system prompt:**
```
ANTES:
5. Em AMBOS → pede nome → pede telefone → pede email
6. Quando tiveres tudo → mostra RESUMO → usa criar_lead

DEPOIS:
5. Em AMBOS → pede nome → pede telefone (email é OPCIONAL)
6. Com nome + telefone + marca/modelo + tipo trabalho → cria lead IMEDIATAMENTE
7. SÓ DEPOIS de criar lead → pergunta: "Para onde enviamos a cotação — email ou WhatsApp?"
```

**Commit:** `2a8a731` — "fix: fernando cria lead sem email obrigatorio"

### 3. Fix tsconfig.json — scripts/ excluído do build

**Problema:** `scripts/import_fuso_xlsx.ts` dependia de `xlsx` e `dotenv` não instalados
no projecto Next.js → build Vercel falhava com TypeScript errors.

**Fix:** adicionado `"scripts"` ao array `"exclude"` do `tsconfig.json`.

**Commit:** `121d08c` — "fix: excluir scripts/ do tsconfig"

### 4. Deploy Vercel

`npx vercel --prod` → `csn-producao.vercel.app` actualizado com os dois fixes.

### 5. Migration 053_fuso_catalog.sql aplicada

Aplicada no Supabase SQL Editor. Criadas:
- `fichas_tecnicas_fuso` (diesel, 62+ cols)
- `fichas_tecnicas_fuso_ecanter` (eléctrico, 70+ cols)
- `fuso_decoder_codigo` (34 rows — 1 duplicado ignorado)
- `v_catalogo_fuso` (VIEW UNION ALL)
- Triggers `set_updated_at` em ambas as tabelas

**Colunas adicionadas post-migration** (estavam no xlsx mas não no DDL original):
- `fichas_tecnicas_fuso`: `alternator_a`, `alternator_v`, `starter_kw`, `brake_auxiliary`,
  `transmission`, `code_pos10_12`, `minimum_vehicle_weight`, `towed_braked`, `towed_unbraked`,
  `engine_type`, `no_cylinders`, `capacity_cc`, `peak_output_kw`, `peak_output_hp`,
  `peak_output_rpm`, `rated_torque_nm`, `rated_torque_rpm`, `dpf_life_km`,
  `exhaust_aftertreatment`, `transmission_model`, `gear_ratios`, `load_capacity_front_kg`,
  `load_capacity_rear_kg`, `electrical_batteries`

**Constraints corrigidas:**
- `fuso_model_code_format`: alargado de `^FE[A-Z]...` para `^F[A-Z]{2}...` (4×4 têm `FG`)
- `propulsao_ecanter`: alargado para `IN ('eCanter', 'eletrico')` (xlsx usa 'eletrico')

### 6. Import FUSO — 83 variantes

Script `scripts/import_fuso_xlsx.ts` executado com sucesso:

```
fichas_tecnicas_fuso:        60 rows ✓ (expected 60)
fichas_tecnicas_fuso_ecanter: 23 rows ✓ (expected 23)
v_catalogo_fuso:              83 rows ✓ (expected 83)
✓ Import bem-sucedido.
```

**FUSO catalog está completo e na BD.** Pendente apenas auditoria das 10 linhas
eCanter herdadas de S52 quando os 3 PDFs EN chegarem.

### 7. Instrução Murtaza — d49 → C_Centro_Long_Ypos

Identificado que o `d49` na base universal estava ligado a `SR_Tooth_1_Width` (largura
do dente) em vez de `C_Centro_Long_Ypos` (= `D_Centro_Long_chassi / 2`).

Instrução enviada ao Murtaza: ligar `d49` a `C_Centro_Long_Ypos`.

### 8. Side business tribasculantes — registado no sistema

Conceito registado em `research_findings` (tipo: `mercado`, relevância 9/10):
- Produto: tribasculante CSN + chassis europeu (FUSO prioritário, Mercedes secundário)
- Canal: concessionário amigo (1 mês) + online + espaço físico (a definir)
- Financeiro: 12 veículos/ano × (€5k venda + €2.5k fábrica) = €90k/ano estimado
- Lógica: compradores de carros médio-altos são donos de empresas com frotas

---

## ESTADO TÉCNICO DO SISTEMA

- **Supabase:** ~90 tabelas (87 S54 + 3 FUSO: fichas_tecnicas_fuso, fichas_tecnicas_fuso_ecanter, fuso_decoder_codigo)
- **Git HEAD:** `a13015e` (chore: check_fuso_cols.mjs temporario)
- **Vercel produção:** `csn-producao.vercel.app` — 1 deploy em S55 (fix route.ts + tsconfig)
- **FUSO catalog:** 83 variantes na BD ✓
- **Worker portal:** Fernando cria lead sem bloquear por email ✓
- **Agente Documental:** 16 categorias (skill analise-ficha-fuso integrada)

---

## PENDÊNCIAS S56

### P0 — Operacional imediato
- Verificar se João (PIN 1003) conseguiu registar o Nissan Cabstar 76-38-71B
- Alterar password Gmail `csnopusprod@gmail.com` (comprometida via WhatsApp)

### P1 — Sistema defensivo (herdado de S54, crítico)
- **REGRA BANDEIRA codificada** em `CLAUDE.md` raiz + system prompt Router + schema `{fonte, sem_fonte, confianca}`
- **Tabela `agentes_perfil`** com enforcement no Router
- **Anti-loop mechanism** (max_iterations, detecção repetições)

### P2 — NestHub
- **Tabela `nesting_queue`** (schema documentado em S54)
- Agente de agregação dominical

### P3 — Murtaza (freelancer 3D)
- Enviar briefing em inglês (`docs/inventor/BRIEFING-Murtaza-Longarinas-S54.md`)
- 5 tarefas pendentes (3 peças SheetMetal + 2 longarinas paramétricas + bases)

### P4 — FUSO
- Auditoria 10 linhas eCanter S52 quando 3 PDFs EN chegarem (processo automático)

### P5 — Herdadas
- Invoice IX 253708521 duplicado por apagar
- Vendus subscription por cancelar
- Worker portal navegação por reconstruir
- Gate docs lead→produção por enforçar
- Tabelas `fam` e `cartao_unico` por criar

---

## PRONTIDÃO PARA AUDITORIA

| Certificação | Progresso | Delta S55 |
|---|---|---|
| ISO 9001 | 60% | = |
| ISO 14001 | 25% | = |
| ISO 45001 | 20% | = |
| Marcação CE (Reg. 2018/858) | 45% | = |
| EN 1090 | 40% | = |

*Valores herdados de S52. Reconciliação quando houver progresso real.*

---

## COMO ABRIR S56

1. `cd C:\Users\Utilizador\Projectos-AI\csn-producao`
2. `Get-Content ESTADO.OPUS.S55.md`
3. Upload no chat dos 5 docs de fecho S55.
4. Decidir vector S56:
   - **(A)** Sistema defensivo — REGRA BANDEIRA + `agentes_perfil` + anti-loop
   - **(B)** NestHub — `nesting_queue` + agregação dominical
   - **(C)** Worker portal rebuild
   - **(D)** Briefing Murtaza EN + templates fornecedor

**REGRA BANDEIRA absoluta**: zero inferência, fonte directa ou campo vazio, sem excepções.

---

## CONTAGEM DE SESSÃO S55

- **Ficheiros gerados em S55:** 6 (5 docs fecho + route.ts fix)
- **Variantes FUSO importadas:** 83 (60 diesel + 23 eCanter) — **FUSO fechado**
- **Tabelas criadas:** 3 (fichas_tecnicas_fuso, fichas_tecnicas_fuso_ecanter, fuso_decoder_codigo)
- **Colunas adicionadas ao schema:** 24 (fichas_tecnicas_fuso)
- **Constraints corrigidas:** 2
- **Deploys Vercel:** 1
- **Commits:** 3 (2a8a731, 121d08c, a13015e)
- **Skills registry:** 239 (sem alteração)
- **Side business registado:** tribasculantes (research_findings)
