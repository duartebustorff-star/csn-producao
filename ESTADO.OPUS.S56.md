# ESTADO.OPUS.S56

**Data fecho:** 2026-04-26
**Sessão anterior:** S55 (fechada 2026-04-22, commit `a13015e` — docs S55 não commitados, commitados em S56)
**Próxima sessão:** S57
**HEAD git após S56:** `<preencher após commit>`

---

## ESCOPO DE S56

Sessão mista: operacional urgente (termos de responsabilidade Juliana/Sixt) + técnico
(RAG Inventor operacional) + estratégico (GEO + modelo empresa-inteligência Block).

**Três linhas de trabalho:**

1. **Homologações urgentes** — 3 matrículas em atraso (BZ-93-LE, BJ-10-SI, BL-74-AM)
2. **RAG Inventor** — 41.681 embeddings gerados + endpoint unificado deployed
3. **Estratégia** — GEO CSN + comparação modelo Block/Sequoia

---

## TRABALHO REALIZADO EM S56

### 1. Termos de Responsabilidade — homologações urgentes

**Contexto:** Juliana Sousa (CAA Solution) com 3 matrículas em atraso. Email mais recente
hoje 11h25 com Sixt em CC (`Infleet_geral@sixt.pt`). 8+ pontos de exclamação.

**BZ-93-LE (RENAULT MASTER)**
- DAV + inspeção Controlauto já existiam na BD
- Termo gerado: `Termo_Responsabilidade_BZ-93-LE.pdf`
- Campos preenchidos: matrícula, VIN, homologação, PBT, tara (2.378 kg), dimensões 3.200×2.080mm
- Campos a preencher manualmente (a vermelho): 2 distâncias eixo retaguarda
- Removidos: data de matrícula + combustível (não vão no termo)

**BJ-10-SI (OPEL MOVANO) + BL-74-AM (CITROËN JUMPER)**
- DAVs estavam com `tipo_documento = 'ANEXO'` — por isso nunca foram processados
- Claude Code corrigiu e reprocessou via `/api/documental/processar` (endpoint usa `reprocess_paths`)
- DAV #46 criado: BJ-10-SI, VIN VXEYCBPH1R2Z05060, homologação 2021100066854695
- DAV #47 criado: BL-74-AM, VIN VF7YCBPH5R2Z07737, homologação 2021100058542728
- Dimensões carroçaria: NEs não têm medidas (só "taipais em madeira" + código L3)
- Termos BJ-10-SI + BL-74-AM: **não gerados** — dimensões por confirmar

**Ofício IMT (BJ-10-SI + BL-74-AM):**
- Não chegou por email — é carta física em Mafra
- Sem o ofício não é possível redigir a resposta

**Bug descoberto:** DAVs classificados como `ANEXO` pelo Router — issue de classificação.
Os documentos novos IDs 5372 e 5373 ficaram com `estado='importado'` nos originais 1467/1308
(comportamento do endpoint: cria novos em vez de actualizar).

### 2. RAG Inventor — operacional

**Estado anterior:** 41.681 chunks, 0 embeddings, coluna `vector(1536)`.

**Trabalho Claude Code:**
- Coluna alterada: `vector(1536)` → `vector(1024)` (HNSW index dropped + recreated)
- 41.681 embeddings gerados via Voyage AI voyage-3 (1024 dims) em ~19 min
- Script: `scripts/embed-inventor-rag.mjs` (resumable, batch 100, concurrency 20)
- Log: `logs/embed-inventor-rag.log`
- Índice HNSW `inventor_rag_embedding_idx` reconstruído (m=16, ef=64, cosine)

**Endpoint unificado `/api/rag/inventor/search`:**
- Commit `1944de9` deployed (+ empty commit `b8dfc53` para forçar rebuild)
- Helper `src/lib/inventor-rag.ts`: `voyageEmbedQuery()` + `hybridRetrieve()` + `formatChunksForPrompt()`
- Consulta `knowledge_inventor` (7.419 chunks) + `inventor_rag` (41.681 chunks) em paralelo
- App Murtaza (`agent-inventor.html`) já usa via `/api/inventor/query` — sem mudança frontend
- **Estado:** deploy em progresso no fecho da sessão — 404 activo, Vercel a buildar

**RAG summary:**

| Tabela | Chunks | Embeddings | Endpoint |
|--------|--------|-----------|---------|
| `knowledge_inventor` | 7.419 | ✅ voyage-3 | `/api/inventor/query` ✅ |
| `inventor_rag` | 41.681 | ✅ voyage-3 | `/api/rag/inventor/search` ⚠️ deploy |

### 3. Briefing Murtaza (DOCX)

Gerado `CSN_Inventor_iLogic_Briefing_Murtaza_Apr2026.docx` com:
- Goal + file convention + coordinate system
- Parameter architecture 3 níveis (SR_, C_, V_/D_/E_/F_)
- Validated iLogic patterns (suppress, write params, VB keyword)
- Issue 1 CRITICAL: d49 → SR_Stringer_Center_Y fix
- Issue 2: Fiat longerons não paramétricos — remodel from scratch
- Contact + priority order

### 4. Debates estratégicos registados em sessao_debates (S56)

**Debate 1: GEO — Generative Engine Optimization CSN**
- Diagnóstico: CSN não existe para LLMs (só Facebook 80 likes + directório)
- Plano 4 fases definido:
  - Fase 1: Google Business Profile + LinkedIn (0€, urgente)
  - Fase 2: site `carrocariascsn.pt` com Schema markup (LocalBusiness, FAQPage)
  - Fase 3: artigos técnicos + parceiros que citam CSN
  - Fase 4: queries específicas (taipais Renault Master, basculante 3.5T Mafra)
- Texto GEO-optimizado por preparar em S57

**Debate 2: CSN como empresa-inteligência — modelo Block/Sequoia**
- Comparação ponto-a-ponto com artigo Sequoia/Block (empresa organizada como inteligência)
- World model = Supabase source of truth ✓
- Customer signal = DAVs + inspeções + matricula.co.pt ✓
- Intelligence layer = Router + 11 agentes ✓ (mas ainda manual hoje)
- GAP CRÍTICO: lacunas de ingestão de dados são o bloqueador real
- Conclusão: prioridade não é mais agentes — é fechar lacunas de ingestão

---

## ESTADO TÉCNICO DO SISTEMA

- **Supabase:** ~90 tabelas
- **Git HEAD após S56:** `<preencher>`
- **Vercel produção:** `csn-producao.vercel.app` — deploy em progresso (RAG endpoint)
- **Commits S56:** `1944de9` (RAG endpoint), `b8dfc53` (empty force rebuild)
- **Agente Documental:** bug de classificação DAVs como ANEXO — por investigar
- **inventor_rag:** 41.681 embeddings ✅ Voyage AI voyage-3 1024d
- **knowledge_inventor:** 7.419 embeddings ✅ (já existia)

---

## PENDÊNCIAS S57

### P0 — Homologações urgentes
- Encontrar ofício físico IMT para BJ-10-SI + BL-74-AM (carta em Mafra)
- Confirmar dimensões carroçaria BJ-10-SI + BL-74-AM e gerar termos
- Verificar deploy RAG endpoint (`/api/rag/inventor/search`) — smoke test

### P1 — GEO
- Preparar texto GEO-optimizado CSN (descrição técnica para Google Business + LinkedIn)
- Criar Google Business Profile + LinkedIn empresa

### P2 — Sistema defensivo (herdado de S53)
- REGRA BANDEIRA codificada (`CLAUDE.md` + Router system prompt)
- Tabela `agentes_perfil` com enforcement Router
- Anti-loop mechanism

### P3 — Ingestão de dados (GAP CRÍTICO identificado S56)
- Investigar bug classificação DAVs como ANEXO pelo Router
- Marcar docs 1467/1308 como processados (duplicação com 5372/5373)
- Garantir que dimensões carroçaria chegam ao sistema via NE ou outro canal

### P4 — NestHub
- Tabela `nesting_queue` (schema documentado em S54)
- Agente de agregação dominical

### P5 — Murtaza
- Enviar `CSN_Inventor_iLogic_Briefing_Murtaza_Apr2026.docx`
- Aguardar fix d49 + remodel longarinas Fiat

### P6 — Herdadas
- Invoice IX 253708521 duplicado por apagar
- Vendus subscription por cancelar
- Worker portal navegação por reconstruir
- Tabelas `fam` e `cartao_unico` por criar
- Password `csnopusprod@gmail.com` por alterar

---

## PRONTIDÃO PARA AUDITORIA

| Certificação | Progresso | Delta S56 |
|---|---|---|
| ISO 9001 | 60% | = |
| ISO 14001 | 25% | = |
| ISO 45001 | 20% | = |
| Marcação CE (Reg. 2018/858) | 45% | = |
| EN 1090 | 40% | = |

*Valores herdados de S52. Reconciliação quando houver progresso real.*

---

## COMO ABRIR S57

1. `cd C:\Users\Utilizador\Projectos-AI\csn-producao`
2. `Get-Content ESTADO.OPUS.S56.md`
3. Upload dos 5 docs fecho S56.
4. Smoke test RAG: `Invoke-RestMethod -Uri "https://csn-producao.vercel.app/api/rag/inventor/search" -Method POST -ContentType "application/json" -Body '{"query":"suppress component iLogic","top_k":3}'`
5. Decidir vector S57: (A) Homologações + GEO | (B) Sistema defensivo | (C) NestHub

**REGRA BANDEIRA absoluta**: zero inferência, fonte directa ou campo vazio, sem excepções.

---

## CONTAGEM DE SESSÃO S56

- **Termos gerados:** 1 (BZ-93-LE — parcial, 2 campos manuais)
- **DAVs reprocessados:** 2 (BJ-10-SI #46, BL-74-AM #47)
- **Embeddings gerados:** 41.681 (inventor_rag, voyage-3 1024d)
- **Endpoints novos:** 1 (`/api/rag/inventor/search` — unified)
- **Debates registados:** 2 (GEO, empresa-inteligência)
- **DOCX gerado:** 1 (Briefing Murtaza)
- **Skills registry:** 239 (sem alteração)
- **Commits:** 2 (1944de9, b8dfc53)
