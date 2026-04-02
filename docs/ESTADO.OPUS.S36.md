# ESTADO.OPUS.S36.md
**Sessao:** S36 | **Data:** 02/04/2026 | **Commit HEAD:** 1e9e723

## ESTADO DO SISTEMA
- **Tabelas Supabase:** 38 (+1: embeddings)
- **Migrations:** 26 (025 + 025b)
- **Tools/Routes API:** 33+ (+1: /api/embeddings/gerar)
- **ADRs:** 31
- **Agentes nucleus:** 11
- **Fornecedores com NIF:** 381
- **Emails indexados:** 18.169
- **Documentos Storage:** 3.333 PDFs
- **Skills activos:** 5 (_global, producao, rh, chagas, dhollandia)
- **RAG:** pgvector + Voyage AI voyage-3 (1024 dims) -- live, ingestao em curso

## COMMITS S36 (ordem cronologica)
| Commit | Descricao |
|--------|-----------|
| 014727e | skill: producao + rh -- KPIs ISO 22400 e ISO 45001 mapeados |
| c1e6c60 | skill: fornecedores/chagas -- L3-DOC |
| ebb3ab7 | skill: fornecedores/dhollandia -- L3-DOC |
| 71a6c0c | migration: 025 embeddings RAG + pgvector |
| ff82d1c | feat: /api/embeddings/gerar -- Voyage AI RAG L3-DOC |
| 786d7a1 | fix: pdf-parse v1.1.1 + build pass |
| 2272683 | fix: pdf-parse import directo lib/ -- evita test file ENOENT no Vercel |
| e8cecf2 | feat: script ingest embeddings batch -- RAG 3333 PDFs |
| 5aa3041 | fix: ingest_embeddings paginacao + rate limit |
| 1e9e723 | fix: ingest_embeddings batch 50 + paginacao completa |

## FEATURES IMPLEMENTADAS S36

### Skills Departamentais (KPI-driven)
- skills/producao/SKILL.md: 20 KPIs ISO 22400 mapeados (5 activos, 4 parciais, 11 futuros/sensor)
- skills/rh/SKILL.md: 12 KPIs RH + Seguranca (RH-1..4, S-1..8), regras privacidade
- skills/fornecedores/chagas/SKILL.md: aco/perfis, conta corrente, emails, KPIs I-2..I-5
- skills/fornecedores/dhollandia/SKILL.md: tail lifts, 12 faturas 48.773 EUR, EN 1756
- Todos os skills orientados pelos KPIs da norma ISO 22400 / ISO 45001
- Metas de referencia e regras de escalacao em cada skill

### RAG -- Retrieval Augmented Generation
- Migration 025: pgvector activado, tabela embeddings criada
- Migration 025b: vector corrigido de 1536 para 1024 dims (Voyage AI voyage-3)
- /api/embeddings/gerar: endpoint POST -- download PDF + extraccao texto + Voyage AI + insert
- Pipeline: documento_id -> Storage download -> pdf-parse -> chunking -> Voyage AI -> embeddings
- Indice HNSW cosine para pesquisa semantica
- Script ingest_embeddings.py: batch processing dos 3.333 PDFs (idempotente)
- Primeiro embedding testado com sucesso em producao (doc_id=1, 742 tokens)

### Infraestrutura
- pdf-parse v1.1.1 instalado (fix import directo lib/ para Vercel serverless)
- VOYAGE_API_KEY configurada no Vercel + .env.local
- Deploy Vercel com /api/embeddings/gerar live

## MIGRACOES SUPABASE S36
| Migration | Descricao |
|-----------|-----------|
| 025_embeddings_rag | pgvector + tabela embeddings (vector 1536, HNSW) |
| 025b_fix_vector_dims | vector 1536 -> 1024 (Voyage AI voyage-3) + default modelo |

## PENDENTES IMEDIATOS (S37)
1. /api/embeddings/pesquisar -- endpoint busca semantica (query -> embedding -> cosine similarity)
2. RAG ligado aos skills -- quando skill carregado, pesquisa embeddings relevantes
3. /api/whatsapp/webhook (Fronteira)
4. /api/telegram/webhook (Fronteira)
5. Completar ingestao dos 3.333 PDFs (script em execucao)
6. Tools docs: tools/_global/ (supabase.md, storage.md, auth.md)

## PENDENTES HERDADOS
- Ciclo obra: COC, DoP, CE marking, invoice, dossier (fim F9/Termo)
- CIT Jose Julio -- criar ausencia associada
- Apagar src/app/portal/ duplicado
- Recibos 2023-2024 (para fechar periodo completo)
- Bodor laser smart meter (ISO 50001 / ISO 22400 energy KPIs 35-38)
- COC Electronico IMT -- deadline Jul 2026
- Manuais Bodor (chapa e tubo) -- PDFs por obter

## NUMEROS DO SISTEMA
| Recurso | S35 | S36 | Delta |
|---------|-----|-----|-------|
| Tabelas Supabase | 37 | 38 | +1 |
| Migrations | 24 | 26 | +2 |
| Routes API | 32+ | 33+ | +1 |
| ADRs | 31 | 31 | 0 |
| Skills activos | 1 | 5 | +4 |
| Fornecedores com NIF | 381 | 381 | 0 |
| Emails indexados | 18.169 | 18.169 | 0 |
| Documentos Storage | 3.333 | 3.333 | 0 |
| Embeddings | 0 | 1+ | +1 (ingestao em curso) |
| Commits S36 | - | 10 | - |

## REGRAS DE SESSAO
- PowerShell: sempre cd C:\Users\Utilizador\Projectos-AI\csn-producao primeiro
- Python: C:\Users\Utilizador\AppData\Local\Python\pythoncore-3.14-64\python.exe
- Deploy: npx vercel --prod
- SQL: Supabase SQL Editor (Ctrl+A -> Delete antes de colar)
- Restauro ficheiros: git show [hash]:path | Out-File -FilePath [path] -Encoding utf8
- Nunca git push --force -- usar --force-with-lease se necessario
