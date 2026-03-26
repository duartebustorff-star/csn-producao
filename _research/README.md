# _research/

Pasta de output do **Agente Research** (ADR-022).

Cada tarefa cria uma sub-pasta com a estrutura:

```
RT-2026-001-tema/
  RELATORIO_RT-2026-001.md   ← relatório da tarefa
  raw/                       ← HTML e ficheiros brutos
  processado/                ← dados estruturados (JSON, CSV)
  downloads/                 ← PDFs e documentos descarregados
```

## Regras

- O Agente Research **deposita** aqui. O sistema **decide** o que entra no RAG/Supabase.
- Nenhum ficheiro desta pasta é importado automaticamente.
- As pastas de tarefa ficam permanentemente no repo como arquivo.
- Ficheiros grandes (>10MB) devem ir para Supabase Storage, não para o repo.
