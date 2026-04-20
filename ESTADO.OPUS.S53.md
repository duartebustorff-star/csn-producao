# ESTADO.OPUS.S53

**Data fecho:** 2026-04-19
**Sessão anterior:** S52
**Próxima sessão:** S54
**HEAD git esperado após commit:** TBD (após `git add . && git commit && git push`)

---

## DECISÃO DE SCOPE — fecho FUSO

S53 fechou definitivamente o tema FUSO **com o material disponível**. Auditoria
das 10 linhas eCanter já existentes (M-Battery 7C18e/9C18e + L-Battery 9C18e)
fica em backlog formal — os 3 PDFs EN originais não foram disponibilizados.
Decisão: parar de processar manualmente e construir infra-estrutura para que
o Agente Documental processe **automaticamente** quando esses (ou outros) PDFs
chegarem por email.

Em vez de ficar bloqueado nas extracções manuais que faltam, S53 entrega:
- v3 do xlsx com **as 13 variantes para que tinha PDFs**
- Migration SQL (3 tabelas + view + 35 INSERTs decoder)
- Script de import idempotente
- Skill `analise-ficha-fuso` para o Agente Documental
- Categorias 15 e 16 documentadas para integração no router

Quando os 3 PDFs em falta aparecerem (via email ou upload), o pipeline já
existirá — não há trabalho manual adicional para os processar.

---

## O QUE FOI FEITO EM S53

### 1. Catálogo FUSO eCanter — 13 variantes adicionadas

Entregável: `docs/fornecedores/fuso/CSN_FUSO_Catalog_S52_v3.xlsx`

Sheet `eCanter_10` renomeada para `eCanter_23`. Adicionadas 13 linhas:

| Plataforma | Variantes | Bateria | Wheelbases | PDF fonte |
|---|---|---|---|---|
| 4S15e | 4 | 3×S + 1×M | 2500, 2800, 3400, 3400 | `1_TF_eCanter_4S15e_LHD_2022_EN_update.pdf` |
| 4C15e | 3 | 2×S + 1×M | 2800, 3400, 3400 | `2_TF_eCanter_4C15e_LHD_2022_EN_update.pdf` |
| 6S15e | 4 | 3×S + 1×M | 2500, 2800, 3400, 3400 | `3_TF_eCanter_6S15e_LHD_2022_EN_update.pdf` |
| 7C18e L-Battery | 2 | 2×L | 4450, 4750 | `4_TF_eCanter_7C18e_LHD_2022_L-Battery_DE_update.pdf` (DE only — EN missing) |

Total eCanter passa de 10 → 23.
Total catálogo FUSO passa de 70 → **83 variantes**.

### 2. Decoder consolidado

Sheet `Decoder_Codigo` actualizada de 33 → 35 linhas:

- **Pos 8 = C**: confirmado como `battery_S` (era "S?" inferido em S52). Confirmado em todos os 4S15e/4C15e/6S15e PDFs onde a coluna "Battery variant: S" coincide com `code_pos8 = C`.
- **Pos 10-13 = SEU1**: nova linha — homologação eCanter 6S15e (GVW 6000kg).
- **Pos 10-13 = SEU3**: nova linha — homologação eCanter 4S15e/4C15e (GVW 4150kg, opcional 4000kg para FR).
- **Pos 10-13 = SEU2**: descrição refinada — homologação 7C18e/9C18e (7490/8550kg).

Bug corrigido: linha decoder antiga dizia `pos8 = 'S' → battery_S`. O valor real é `'C'`. Substituído.

### 3. Migration SQL produzida

Ficheiro: `migrations/053_fuso_catalog.sql`

Idempotente (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE`). Cria:
- Tabela `fichas_tecnicas_fuso` (~62 cols, PK `id`, UNIQUE `fuso_model_code`, indexes em modelo/wheelbase/gvw/transmission, 5 cols AWD nullable, CHECK constraints)
- Tabela `fichas_tecnicas_fuso_ecanter` (~70 cols, CHECK battery_variant ∈ S/M/L, indexes em modelo/wheelbase/battery/gvw)
- Tabela `fuso_decoder_codigo` + 35 INSERTs decoder (UPSERT idempotente por `(posicao, valor)`)
- View `v_catalogo_fuso` UNION ALL com coluna `propulsao` ('diesel' | 'eCanter')
- Triggers `set_updated_at` em ambas as tabelas

### 4. Script de import produzido

Ficheiro: `scripts/import_fuso_xlsx.ts`

Lê o xlsx v3 e faz upsert por `fuso_model_code`. Usa `SUPABASE_SERVICE_ROLE_KEY`.
Verifica contagens finais (60 + 23 = 83) e sai com código 2 se não bater. Não
apaga linhas órfãs (apaga manualmente se necessário).

### 5. Skill `analise-ficha-fuso` produzida

Ficheiro: `/mnt/skills/user/analise-ficha-fuso/SKILL.md`

Para integração no Agente Documental como categorias 15 (`ficha_tecnica_fuso_diesel`)
e 16 (`ficha_tecnica_fuso_ecanter`). Documenta:
- Triggers de activação (texto literal + filename + Mitsubishi FUSO header)
- Distinção diesel vs eCanter via secções ELECTRIC DRIVE / ENGINE 4P10
- Schema completo de extracção (~62 cols diesel, ~70 cols eCanter)
- Layout multi-coluna (uma linha BD por coluna do PDF)
- Verificação de duplicados (suporte a fichas legacy via `ficha_valida_em`)
- Validação pós-extracção (regex code, decoder consistency, plausibility check)
- REGRA BANDEIRA reforçada — abrir ticket em vez de adivinhar

---

## O QUE NÃO FOI FEITO EM S53 (passa para backlog formal)

### Auditoria de 10 linhas eCanter herdadas de S52

PDFs EN em falta:
- `4_TF_eCanter_7C18e_LHD_2022_M-Battery_EN_update.pdf` (4 linhas para auditar)
- `5_TF_eCanter_9C18e_LHD_2022_M-Battery_EN_update.pdf` (4 linhas para auditar)
- `5_TF_eCanter_9C18e_LHD_2022_L-Battery_EN_update.pdf` (2 linhas para auditar)

Quando aparecerem (via email Apps Script → Storage → Router → Agente Documental
com skill `analise-ficha-fuso` activada), os valores extraídos automaticamente
serão comparados com os valores na BD. Se houver discrepância → ticket
automático `ficha_fuso_audit_discrepancia`.

### Verificação cruzada 7C18e L-Battery EN vs DE

As 2 linhas adicionadas em S53 vieram do PDF DE (EN não disponível). Números
são language-independent mas convém verificar quando o EN aparecer. Mesma
dinâmica: skill detecta novo PDF, faz INSERT com `ficha_valida_em` mais recente
ou compara com a linha existente.

---

## ESTADO TÉCNICO DO SISTEMA

- **Supabase HEAD:** ~84 tabelas (sem alteração até migration ser aplicada).
  **Após migration:** ~87 tabelas (+ `fichas_tecnicas_fuso`, `fichas_tecnicas_fuso_ecanter`, `fuso_decoder_codigo`).
- **Git HEAD após S53:** a confirmar após commit. Commits esperados:
  - `feat(fuso): catálogo S53 v3 + DDL + import script + skill analise-ficha-fuso`
  - `docs(sessao): fecho S53`
- **Vercel produção:** `csn-producao.vercel.app` — sem deploys em S53.
- **Agente Documental:** operacional. Após adição da skill `analise-ficha-fuso`
  e dos handlers no router, passará para **16 categorias**.

---

## PROBLEMAS CONHECIDOS HERDADOS (sem alteração em S53)

- DOC handler para acções automáticas de tickets — ainda ausente
- Três sistemas de processamento documental sobrepostos — ainda por consolidar
- Faturação: invoice 253708521 duplicado por apagar; Vendus subscription por cancelar
- Worker portal: navegação por reconstruir (sidebar estruturada Proposta/Obras/Ponto/Chat/Documentos)
- OCR paralelo Tesseract+Claude Vision — ainda adiado
- Gate docs lead→produção — ainda por enforçar
- Tabelas `fam` e `cartao_unico` — ainda por criar
- Agent session log `wake/emit/sleep` — ainda por ligar a todas as routes

---

## RECOMENDAÇÃO ESTRATÉGICA PARA S54

A discussão da sessão anterior sugeriu que o sistema precisa de **3-4 peças
estruturais** que ainda não existem:

1. **REGRA BANDEIRA codificada** (CLAUDE.md master + system prompt no router + schema de resposta com campos `fonte`/`sem_fonte`/`confianca`)
2. **Tabela `agentes_perfil`** com enforcement no router (cada agente confinado às suas tabelas/tools/skills)
3. **Anti-loop mechanism** (max_iterations, detecção de chamadas repetidas, fallback obrigatório)
4. **Templates replicáveis de núcleo de fornecedor** (meta-schema aplicável a Pecol, Dhollandia, Bielco, Acaíl)
5. **Memorando por marca de chassi** (fórmulas de extracção codificadas)

S54 deveria atacar a **#1 e #2** primeiro (sistema defensivo), porque sem isso
todo o trabalho de catálogos (FUSO, futuras marcas) fica vulnerável a agentes
que ignoram o perfil. Templates de fornecedor (#4) e memorando (#5) ficam para
S55-S56 — vão consumir o trabalho FUSO como caso-de-prova.

---

## COMO ABRIR S54

1. `cd C:\Users\Utilizador\Projectos-AI\csn-producao`
2. `Get-Content ESTADO.OPUS.S53.md`
3. Upload no chat dos 5 docs de fecho S53 (este + Controlo PDF + architecture HTML + KPIs HTML + skills registry HTML).
4. **Antes de continuar com features**: aplicar a migration `053_fuso_catalog.sql` no Supabase SQL Editor e correr `pnpm tsx scripts/import_fuso_xlsx.ts` para popular as 83 linhas. Verificar contagens.
5. Decidir se S54 ataca o sistema defensivo (REGRA BANDEIRA codificada + agentes_perfil) ou se segue por outro vector (worker portal, etc.).

**REGRA BANDEIRA absoluta**: zero inferência, fonte directa ou campo vazio, sem excepções.

---

## CONTAGEM DE SESSÃO S53

- **Ficheiros gerados em S53:** 9
  - `CSN_FUSO_Catalog_S52_v3.xlsx` (xlsx final)
  - `migrations/053_fuso_catalog.sql` (DDL)
  - `scripts/import_fuso_xlsx.ts` (TypeScript)
  - `/mnt/skills/user/analise-ficha-fuso/SKILL.md` (skill nova)
  - `ESTADO.OPUS.S53.md` (raiz + docs/)
  - `CSN-Controlo-OPUS-S53.pdf` (controlo)
  - `csn-architecture-OPUS-S53.html`
  - `csn-kpis-isa95-S53.html`
  - `csn-skills-tools-registry-S53.html`
- **PDFs processados em S53:** 7 (4 EN + 3 DE — 4S15e, 4C15e, 6S15e par; 7C18e L apenas DE)
- **Variantes adicionadas:** 13 (10 → 23 eCanter; 70 → 83 total)
- **Decoder mappings:** 33 → 35 (+SEU1, +SEU3; pos 8=C corrigido S→C)
- **Tabelas Supabase planeadas para criação:** 3 (após migration)
- **Skills registry:** 236 → 237 (+`analise-ficha-fuso`)
- **Agente Documental:** 14 → 16 categorias (após integração)
