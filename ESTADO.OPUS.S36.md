# ESTADO OPUS — S36 FECHO
**Data:** 02/04/2026
**Commit principal:** `2dde018`
**Commit fecho:** (este ficheiro)
**Sessão:** S36 — RAG / Embeddings Pipeline

---

## MÉTRICAS DO SISTEMA (pós-S36)

| Indicador | Valor |
|-----------|-------|
| Tabelas Supabase | 38 |
| Migrations aplicadas | 25 (até 025) |
| ADRs | 31 |
| Agentes autónomos | 11 |
| Skills activos | 5 |
| Emails indexados | 18.169 |
| PDFs no Storage | 3.333 |
| **Embeddings totais** | **2.927** |
| Embeddings criados em S36 | 2.310 |
| Embeddings pré-existentes | 617 |
| Erros ingest (PDF sem texto/estrutura inválida) | 546 |
| Duração ingest total | ~100 minutos |

---

## O QUE FOI FEITO EM S36

### RAG / Embeddings (prioridade principal)
- Migration 025 aplicada: `pgvector` v0.8.0, tabela `embeddings` (vector 1024 dims, índice HNSW cosine)
- Endpoint `/api/embeddings/gerar` — Voyage AI voyage-3, pdf-parse, chunking 24K chars
- Script `supabase/scripts/ingest_embeddings.py` criado e executado
- **2.310 embeddings novos criados** (546 erros normais: PDFs scaneados sem texto extraível)
- Script `upload_documentos_email.py` executado em S36 anterior: 3.333 PDFs no Storage

### Skills System
- `skills/_global/SKILL.md` — skill global do sistema
- `skills/producao/SKILL.md` — skill de produção
- `skills/rh/SKILL.md` — skill de RH
- `skills/fornecedores/chagas/SKILL.md` — skill Chagas
- `skills/fornecedores/dhollandia/SKILL.md` — skill D-Hollandia
- `SKILL-GUIDE.md` + `REGISTRY.md` criados
- ADR-031 (Interface Departamental, 3 layers) committed

### Documentos de fecho S36 (commit 2dde018)
- `ESTADO.OPUS.S36.md` (raiz + docs/) — **actualizado neste commit com números finais**
- `docs/csn-architecture-OPUS-S36.html`
- `docs/csn-kpis-isa95-S36.html`
- `docs/csn-skills-tools-registry-S36.html`
- `docs/CSN-Controlo-OPUS-S36.pdf` ⚠️ converter manualmente via browser (Ctrl+P → PDF)

---

## NOTA SOBRE O INGEST

O script `ingest_embeddings.py` terminou **após** o commit principal `2dde018`.
Os números finais (2.927 embeddings, 546 erros) são registados neste commit de fecho.
O log de erros está em: `supabase/scripts/ingest_errors.log`

Erros por categoria:
- `422 PDF sem texto extraível` — PDFs scaneados (imagens), sem OCR. Normal.
- `500 Invalid PDF structure` — PDFs corrompidos ou protegidos. Normal.
- `500 Erro insert: unsupported Unicode escape sequence` — caracteres especiais no conteúdo. Minoritário.

---

## PENDENTES PARA S37

**Prioridade 1 — Migration 017 (stock/materiais):**
- Tabelas: `materiais`, `stock_movimentos`, `lotes`
- Endpoint extracção linhas de fatura (Claude extrai JSON de PDFs fornecedores)
- Skill Pecol (consumíveis, parafusos, EPI, fio de soldar)

**Prioridade 2 — RAG activo:**
- `/api/embeddings/pesquisar` — pesquisa semântica nos embeddings
- RAG ligado aos skills (documentos recuperados como contexto)

**Prioridade 3 — Comunicação:**
- WhatsApp Business API (Twilio + Meta Business verification)
- Telegram Bot (BotFather)

**Pendentes históricos:**
- CIT José Júlio — ausência associada
- Apagar `src/app/portal/` — duplicado
- Ciclo obra — COC, DoP, CE, invoice, dossier (pós F9/Termo)
- COC Eletrónico IMT — deadline Julho 2026
- ISO 45001 risk assessments por workstation
- ISO 14001 waste registry
- Bodor laser: ISO 50001 energy baseline (L2)
- Skill Registry implementation (REGISTRY.md criado, implementação pendente)
- Skills pendentes: Bielco, Silfesan, Pecol, Publispeed

---

## CONTEXTO TÉCNICO

**Stack:** Next.js + TypeScript + Supabase + Claude API + Vercel
**Repo:** `duartebustorff-star/csn-producao`
**Deploy:** `csn-producao.vercel.app` (manual via `npx vercel --prod`)
**Python:** `C:\Users\Utilizador\AppData\Local\Python\pythoncore-3.14-64\python.exe`
**Supabase:** `https://oysfxhlzilazeznpaafc.supabase.co`

**Voyage AI:** voyage-3, 1024 dims, modelo de embeddings
**pgvector:** v0.8.0, índice HNSW, similaridade cosine

---

## PROTOCOLO INÍCIO S37

```powershell
cd C:\Users\Utilizador\Projectos-AI\csn-producao
Get-Content ESTADO.OPUS.S36.md
```

Upload docs S36 para o chat → arrancar Migration 017.
