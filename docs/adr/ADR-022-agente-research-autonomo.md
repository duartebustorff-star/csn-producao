# ADR-022 — Agente Research: Autónomo, Externo ao Sistema, Melhor de Todos

**Data:** 26/03/2026
**Hora (Lisboa):** 12:00 WET (UTC+1 — WEST)
**Estado:** ✅ Aceite
**Sessão:** 15 (continuação)

---

## Contexto

O sistema CSN Opus precisa de informação técnica constantemente actualizada — normas, dados de chassi, equipamentos, legislação, concorrência, mercado. Esta informação vive na internet e em bases de dados externas. Precisa de um agente dedicado exclusivamente a pesquisar, extrair e estruturar esta informação de forma autónoma e sistemática.

---

## Decisão

**Agente Research** — Autonomous Agent externo ao sistema CSN Opus.

**Tipo:** Autonomous Agent — sem persona — trabalha completamente de forma autónoma
**Localização:** Fora do sistema CSN Opus — não tem acesso directo à Supabase
**Nível ISA-95:** Transversal — alimenta todos os níveis
**Objectivo:** Ser o melhor agente de pesquisa e scraping possível — em evolução contínua

---

## Princípio Fundamental

```
O Agente Research extrai. O sistema decide o que entra.
```

Nunca escreve directamente na base de dados. Produz informação estruturada e o sistema analisa, valida e decide o que incorporar.

---

## Fluxo Completo de uma Tarefa

```
1. ORDEM DE TAREFA
   Duarte (via Luísa ou directamente) ou
   Sistema CSN Opus (automático)
   → Define: tema, objectivo, fontes, formato de output
   → Atribui código de tarefa: RT-AAAA-NNN-tema
        ↓
2. EXECUÇÃO (Agente Research autónomo)
   → Scraping de portais técnicos
   → Pesquisa em bases de dados
   → Download de documentos
   → Extracção de dados estruturados
   → Guarda TUDO na pasta da tarefa
        ↓
3. PASTA DA TAREFA
   _research/
     RT-2026-001-man-bodybuilder/
       RELATORIO_RT-2026-001.md    ← o que fez, o que encontrou
       raw/                        ← HTML e ficheiros brutos
       processado/                 ← dados estruturados, JSON, Excel
       downloads/                  ← PDFs e documentos descarregados
        ↓
4. NOTIFICAÇÃO
   Agente avisa o sistema: "Tarefa RT-2026-001 concluída"
        ↓
5. ANÁLISE PELO SISTEMA
   Sistema analisa a pasta da tarefa
   Extrai o que é relevante
   Regista na Supabase e/ou Knowledge Base
   Duarte valida o que entra no RAG
        ↓
6. ARQUIVO
   Pasta da tarefa fica permanentemente no repo
   Registo na tabela `research_tasks`
```

---

## Estrutura de Pastas

```
_research/
  RT-2026-001-man-bodybuilder/
    RELATORIO_RT-2026-001.md
    raw/
    processado/
    downloads/
  RT-2026-002-legislacao-pesos/
  RT-2026-003-gruas-hiab-fassi/
  ...
```

---

## Formato do Relatório de Tarefa

```markdown
# RELATÓRIO DE TAREFA
Código: RT-AAAA-NNN
Tema: [tema]
Data início: [data hora Lisboa]
Data conclusão: [data hora Lisboa]

## Fontes consultadas
- [URL 1] — estado (ok/bloqueado/erro)
- [URL 2]

## Documentos encontrados: N
## Documentos descarregados: N
## Documentos sem acesso: N — motivo

## Dados estruturados extraídos
[resumo do que foi extraído]

## Qualidade da informação
[avaliação da fiabilidade das fontes]

## O que ficou por fazer
[o que não conseguiu aceder ou completar]

## Recomendações
[o que o sistema deve incorporar e com que prioridade]
```

---

## Tipos de Tarefas

| Tipo | Código | Exemplos |
|---|---|---|
| Marca de chassi | RT-marca | MAN, DAF, Iveco, Stellantis |
| Legislação | RT-legal | DL 132/2017, Reg. UE 1230/2012 |
| Normas técnicas | RT-norma | EN 1090, EN 12195, UNECE |
| Equipamentos | RT-equip | Gruas Hiab, plataformas Zepro |
| Mercado | RT-mercado | Concorrência, preços, tendências |
| Tecnologia | RT-tech | Novas ferramentas, IA, automação |
| Qualquer outro | RT-geral | A definir caso a caso |

---

## Tabela Supabase — `research_tasks`

```sql
CREATE TABLE research_tasks (
  id uuid PRIMARY KEY,
  codigo text UNIQUE NOT NULL,       -- RT-2026-001
  tema text NOT NULL,
  tipo text NOT NULL,
  descricao text,
  solicitado_por text,               -- Duarte / sistema / Luísa
  pasta_local text,                  -- _research/RT-2026-001-tema/
  estado text DEFAULT 'pendente',    -- pendente / em_curso / concluido / incorporado
  data_inicio timestamptz,
  data_conclusao timestamptz,
  documentos_encontrados integer,
  documentos_descarregados integer,
  relatorio_path text,
  incorporado_rag boolean DEFAULT false,
  incorporado_supabase boolean DEFAULT false,
  notas text,
  created_at timestamptz DEFAULT now()
);
```

---

## Evolução Contínua

O Agente Research deve estar sempre a melhorar:
- Novas técnicas de scraping quando sites bloqueiam
- Novos formatos de output quando o sistema precisa
- Novas fontes descobertas automaticamente
- Melhor estruturação dos dados extraídos
- Validação cruzada entre múltiplas fontes

**O objectivo é ser o melhor agente de pesquisa técnica para a indústria de carroçarias comerciais.**

---

## Consequências

- Pasta `_research/` criada na raiz do repo
- Migration 018 adiciona tabela `research_tasks`
- O sistema notifica Duarte (via Luísa) quando uma tarefa é concluída
- Nenhum dado entra no RAG ou Supabase sem passar pela análise do sistema
- O Agente Research é completamente independente — não tem acesso às credenciais do sistema
