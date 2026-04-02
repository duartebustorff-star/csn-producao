# ESTADO.OPUS.S35.md
**Sessao:** S35 | **Data:** 02/04/2026 | **Commit HEAD:** 6b97a60

## ESTADO DO SISTEMA
- **Tabelas Supabase:** 37
- **Migrations:** 24
- **Tools/Routes API:** 32+
- **ADRs:** 31 (ADR-031 Interface Departamental criado nesta sessao)
- **Agentes nucleus:** 11
- **Fornecedores com NIF:** 381
- **Emails indexados:** 18.169 (importados para Supabase + 3.333 PDFs no Storage)
- **Documentos Storage:** 3.333 PDFs
- **Skill Registry:** criado (SKILL-GUIDE.md + REGISTRY.md + _global/SKILL.md)

## COMMITS S35 (ordem cronologica)
| Commit | Descricao |
|--------|-----------|
| 25d82aa | feat: script upload emails_indice para Supabase |
| d4690d5 | feat: script upload PDFs de emails_indice para Supabase Storage + tabela documentos |
| f5a5cfd | docs: diagrama KPIs ISA-95 completo S35 |
| 6b97a60 | docs: fecho S35 -- arquitectura + skills-tools registry + SKILL-GUIDE + global skill |

## FEATURES IMPLEMENTADAS S35

### Emails e Documentos
- Import emails_indice concluido: 18.169 registos no Supabase (script upload_emails_indice.py)
- Upload PDFs de emails_indice para Supabase Storage (script upload_documentos_email.py)
- 3.333 PDFs indexados no bucket documentos
- Tabela documentos ligada a emails_indice

### Skill Registry (ADR-031 -- Interface Departamental)
- SKILL-GUIDE.md criado: guia completo de criacao de skills e tools
- REGISTRY.md criado: log permanente de todos os skills e tools com data/hora
- skills/_global/SKILL.md criado: contexto base CSN, ISA-95, normas, stack, pessoas
- Estrutura de pastas definida: skills/ + tools/ com subdirectorios por departamento
- Standard adoptado: Anthropic Agent Skills Standard (Dez 2025)

### Arquitectura e Documentacao
- Diagrama KPIs ISA-95 completo (HTML): 38 KPIs ISO 22400 mapeados
- Diagrama arquitectura S35 actualizado (HTML): 3 camadas + Skill Registry + Tools
- csn-skills-tools-registry-S35.html: registo visual de skills e tools
- ADR-031: Interface Departamental -- regra de ouro formalizada

### Decisoes Estrategicas
- Canais de entrada decididos: WhatsApp Business API + Telegram Bot API
- RAG via pgvector planeado para S36 (migration 025 + tabela embeddings)
- MCP como standard de plumbing para tools

## MIGRACOES SUPABASE S35
- Nenhuma nova migration aplicada (dados importados via scripts Python)
- Scripts executados:
  - upload_emails_indice.py: 18.169 registos importados
  - upload_documentos_email.py: PDFs enviados para Storage + registos em documentos

## PENDENTES IMEDIATOS (S36)
1. RAG -- migration 025 pgvector + tabela embeddings
2. Skill producao/SKILL.md -- obras, fases, timer, KPIs
3. Skill rh/SKILL.md -- recibos, ferias, CITs
4. Skill fornecedores/chagas/SKILL.md -- aco e perfis
5. Tools docs: tools/_global/ (supabase.md, storage.md, auth.md)
6. /api/embeddings endpoint (L3-DOC, escrita)
7. /api/whatsapp/webhook (Fronteira)
8. /api/telegram/webhook (Fronteira)

## PENDENTES HERDADOS
- Ciclo obra: COC, DoP, CE marking, invoice, dossier (fim F9/Termo)
- CIT Jose Julio -- criar ausencia associada
- Apagar src/app/portal/ duplicado
- Recibos 2023-2024 (para fechar periodo completo)
- Bodor laser smart meter (ISO 50001 / ISO 22400 energy KPIs 35-38)
- COC Electronico IMT -- deadline Jul 2026
- Manuais Bodor (chapa e tubo) -- PDFs por obter

## NUMEROS DO SISTEMA
| Recurso | Quantidade |
|---------|-----------|
| Tabelas Supabase | 37 |
| Migrations | 24 |
| Routes API | 32+ |
| ADRs | 31 |
| Agentes nucleus | 11 |
| Fornecedores com NIF | 381 |
| Emails indexados | 18.169 |
| Documentos Storage | 3.333 |
| Skills criados | 3 (SKILL-GUIDE + REGISTRY + _global) |
| Commits S35 | 4 |

## REGRAS DE SESSAO
- PowerShell: sempre cd C:\Users\Utilizador\Projectos-AI\csn-producao primeiro
- Deploy: npx vercel --prod
- SQL: Supabase SQL Editor (Ctrl+A -> Delete antes de colar)
- Restauro ficheiros: git show [hash]:path | Out-File -FilePath [path] -Encoding utf8
- Nunca git push --force -- usar --force-with-lease se necessario
