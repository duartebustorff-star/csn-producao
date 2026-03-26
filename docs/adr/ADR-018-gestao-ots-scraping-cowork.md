# ADR-018 — Gestão de OTs e Scraping com Cowork

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

O Cowork executa pesquisas e scraping para qualquer departamento. Sem estrutura de controlo, os ficheiros ficam espalhados, não se sabe o que foi feito, o que está processado e o que está no RAG. Isto tem de estar organizado desde o início.

---

## Princípio

**Tu escreves o pedido ao Cowork. O Cowork executa. O sistema regista.**

Sem intermediários por agora. Fase 2 terá um agente de chat para automatizar a geração de prompts.

---

## Estrutura de Pastas no Repo

```
_cowork/
  inbox/
    OT-2026-001-fuso/
      RELATORIO_OT-2026-001.md     ← gerado pelo Cowork
      [ficheiros brutos]
    OT-2026-002-stellantis/
    OT-2026-010-legislacao/
    ...
  prompts/
    marcas/
      prompt_scraping_marca_chassi.md
      prompt_extrair_dados_pdf_mounting.md
    normas/
      prompt_download_legislacao.md
      prompt_download_norma_en.md
    geral/
      prompt_organizar_pasta.md
      prompt_registar_ot_sistema.md

knowledge-base/
  /tecnico/
  /csn/
  (só entra ficheiro processado e validado)
```

**Regra:** Nada vai directamente para `knowledge-base/`. Passa sempre por `_cowork/inbox/` primeiro.

---

## Fluxo de uma OT

```
1. Tu crias OT no sistema (página no CSN Opus)
   → Preenches: descrição, tipo, pasta destino

2. Tu dás instrução ao Cowork
   → Usas prompt da biblioteca ou escreves livremente
   → Incluis sempre: número OT + pasta destino

3. Cowork executa
   → Descarrega ficheiros para _cowork/inbox/OT-XXXX/
   → Cria RELATORIO_OT-XXXX.md
   → Faz commit no GitHub

4. Cowork regista no sistema
   → Abre csn-producao.vercel.app
   → Navega para Gestão de OTs
   → Marca OT como concluída

5. Tu revês os ficheiros
   → Validas o que está correcto
   → Aprovados → movem para knowledge-base/
   → Rejeitados → ficam em inbox com nota

6. Agente de Inteligência de Marcas (ADR-016)
   → Processa ficheiros aprovados de marcas
   → Actualiza tabela marcas_veiculo
   → Regista score de confiança por campo
```

---

## Prompt Standard para o Cowork

Cada OT começa sempre com este cabeçalho:

```
ORDEM DE TRABALHO: [OT-XXXX]
TIPO: [marca_chassi / norma / equipamento / outro]
DATA: [data]
PASTA DESTINO: _cowork/inbox/[OT-XXXX]-[tema]/

OBJECTIVO:
[descrição do que queres]

O QUE EXTRAIR:
[lista do que queres]

RELATÓRIO:
Criar RELATORIO_[OT-XXXX].md com:
- URLs consultadas
- Documentos encontrados e descarregados
- O que não conseguiu aceder e porquê

REGISTO:
Após concluir, abrir https://csn-producao.vercel.app
→ Gestão de OTs → marcar OT como concluída
```

---

## Tabela Supabase — `ordens_trabalho` (simplificada)

```sql
CREATE TABLE ordens_trabalho (
  id uuid PRIMARY KEY,
  referencia text UNIQUE NOT NULL,  -- OT-2026-001
  tipo text NOT NULL,               -- marca_chassi / norma / equipamento / outro
  descricao text NOT NULL,
  departamento text,                -- producao / qualidade / comercial / tecnico
  pasta_inbox text NOT NULL,        -- _cowork/inbox/OT-XXXX/
  estado text DEFAULT 'pendente',   -- pendente / em_curso / concluido / validado / rejeitado
  criado_por text DEFAULT 'Duarte',
  data_criacao timestamptz DEFAULT now(),
  data_conclusao timestamptz,
  relatorio_path text,              -- path para o RELATORIO_OT-XXXX.md
  ficheiros_descarregados integer,
  ficheiros_validados integer,
  notas text
);
```

---

## Página de Gestão de OTs no CSN Opus

Interface simples:
- Lista de OTs com estado (pendente / em curso / concluído / validado)
- Botão "Nova OT" — preenche referência, tipo, descrição, pasta
- Botão "Ver relatório" — abre o RELATORIO_OT-XXXX.md do repo
- Botão "Validar" — muda estado para validado e activa processamento

---

## Tipos de OT

| Tipo | Departamento | Destino RAG |
|---|---|---|
| marca_chassi | Técnico | knowledge-base/tecnico/bodybuilder/ |
| norma_legal | Técnico | knowledge-base/tecnico/normas/ |
| equipamento | Técnico | knowledge-base/tecnico/equipamentos/ |
| qualidade | Qualidade | knowledge-base/csn/qualidade/ |
| comercial | Comercial | knowledge-base/csn/comercial/ |
| outro | — | a definir caso a caso |

---

## Fase 2 — Chat com Agente (futuro)

Quando o volume de OTs justificar:
- Chat em linguagem natural
- Agente interpreta o pedido
- Gera a OT e a prompt automaticamente
- Passa ao Cowork sem intervenção manual

Por agora — simples e manual. Funciona.

---

## Consequências

- Criar pasta `_cowork/` na raiz do repo
- Criar subpastas `inbox/` e `prompts/`
- Migration 018 adiciona tabela `ordens_trabalho`
- Página "Gestão de OTs" no CSN Opus
- O Cowork usa sempre o cabeçalho standard nas OTs
- Nenhum ficheiro entra no RAG sem passar por inbox primeiro
