# CSN Opus — Guia de Criação de Skills e Tools
**Documento:** CSN-L3-DOC-001-2026 | **Versão:** 1.0 | **Data:** 02/04/2026
**ISA-95:** Transversal | **Norma:** Anthropic Agent Skills Standard (open, Dez 2025)

---

## O que é um Skill

Um skill é uma pasta com um ficheiro `SKILL.md` que contém:
- Instruções de como o agente deve tratar um domínio específico
- Contexto sobre a entidade (fornecedor, departamento, processo)
- Exemplos de situações e como responder
- Referências a tools disponíveis

O agente carrega o skill dinamicamente quando o contexto exige.
Um skill NÃO produz informação de sistema — só racionaliza sobre ela.

## O que é uma Tool

Uma tool é um endpoint API (`/api/...`) que executa uma acção no núcleo ISA-95.
- Leitura: consulta dados do Supabase
- Escrita: apenas pelo Roteador Externo ou agentes nucleus autorizados
- Cada tool tem: nome, rota, método HTTP, input, output, nível ISA-95

---

## Estrutura de Pastas

```
csn-producao/
  skills/
    SKILL-GUIDE.md          ← este ficheiro
    REGISTRY.md             ← log de todos os skills e tools
    _global/
      SKILL.md              ← contexto CSN, ISA-95, normas (todos os agentes lêem)
    producao/
      SKILL.md
      work-instructions/    ← instruções por fase de obra
    rh/
      SKILL.md
    financeiro/
      SKILL.md
    comercial/
      SKILL.md
    engenharia/
      SKILL.md
    qualidade/
      SKILL.md
    manutencao/
      SKILL.md
    inventario/
      SKILL.md
    fornecedores/
      chagas/
        SKILL.md
        historico.md        ← histórico de encomendas e preços
      dhollandia/
        SKILL.md
      bielco/
        SKILL.md
      pecol/
        SKILL.md
  tools/
    REGISTRY.md             ← lista de todas as tools com estado
    _global/
      supabase.md           ← como aceder ao Supabase
      storage.md            ← como aceder ao Storage
      auth.md               ← autenticação e PINs
    producao/
      timer.md
      obras.md
      kpis.md
    rh/
      recibos.md
      declaracoes.md
    financeiro/
      efatura.md
      fornecedores.md
    documental/
      roteador.md
      documentos.md
```

---

## Como Criar um Skill — Passo a Passo

### 1. Identificar o domínio
- Qual departamento ISA-95? (L4-COM, L3-PRD, L3-PER, etc.)
- É um skill de departamento ou de entidade (fornecedor/cliente)?
- Que informação o agente precisa de saber para tratar este domínio?

### 2. Criar a pasta
```bash
# Skill de departamento
mkdir -p skills/producao

# Skill de fornecedor
mkdir -p skills/fornecedores/chagas
```

### 3. Criar o SKILL.md
Estrutura obrigatória:

```markdown
---
name: [nome do skill]
version: 1.0
date: DD/MM/AAAA
isa95_level: L3-PRD
department: Produção
norm: ISO 22400
status: active
---

## Contexto
[Quem é esta entidade / o que faz este departamento]

## Instruções
[Como o agente deve tratar situações neste domínio]

## Tools disponíveis (read-only)
- /api/obras — lista obras activas
- /api/kpis/worker — KPIs por trabalhador

## Exemplos
[Situações típicas e como responder]

## Escalação
[Quando pedir informação ao departamento interno]
```

### 4. Registar no REGISTRY.md
Adicionar linha ao `skills/REGISTRY.md`:
```
| DD/MM/AAAA HH:MM | skill | nome/SKILL.md | L3-PRD | active | descrição |
```

### 5. Commitar
```powershell
git add skills/
git commit -m "skill: adicionar skill [nome] — [dept] ISA-95 [nivel]"
git push
```

---

## Como Criar uma Tool — Passo a Passo

### 1. Identificar a necessidade
- Que dados precisa o agente?
- É leitura (Interface Departamental pode usar) ou escrita (só núcleo)?
- Que tabela Supabase está envolvida?

### 2. Criar o endpoint
```
src/app/api/[departamento]/[nome]/route.ts
```

### 3. Documentar em tools/[dept]/[nome].md
Estrutura obrigatória:
```markdown
---
name: [nome da tool]
route: /api/[dept]/[nome]
method: GET | POST
isa95_level: L3-PRD
department: Produção
access: read | write
status: active
date: DD/MM/AAAA
---

## Descrição
[O que faz esta tool]

## Input
[Parâmetros de entrada]

## Output
[Estrutura de resposta]

## Supabase
[Tabelas acedidas]

## Exemplo
[Exemplo de chamada e resposta]
```

### 4. Registar no REGISTRY.md
```
| DD/MM/AAAA HH:MM | tool | /api/[dept]/[nome] | L3-PRD | active | descrição |
```

### 5. Commitar
```powershell
git add src/app/api/ tools/
git commit -m "tool: adicionar /api/[dept]/[nome] — [dept] ISA-95 [nivel]"
git push
```

---

## Regras Invioláveis

1. **Todo o skill tem nível ISA-95 atribuído** — sem excepções
2. **Interfaces Departamentais só usam tools de leitura** — nunca escrita
3. **Cada skill tem REGISTRY.md actualizado** — com data e hora
4. **Skills de fornecedores ficam em skills/fornecedores/[nome]/**
5. **Tools globais ficam em tools/_global/** — autenticação, storage, supabase
6. **Um skill não produz informação de sistema** — só racionaliza
7. **RAG alimenta os skills** — embeddings dos PDFs enriquecem o contexto

---

## RAG — Como os Documentos Alimentam os Skills

Os 3.333 PDFs no Supabase Storage + 18.169 emails indexados são a base de dados
que alimenta os skills via RAG (Retrieval Augmented Generation).

Fluxo previsto (S36):
1. PDF entra via Roteador → Storage
2. Agente embeddings gera vector embedding do PDF
3. Embedding guardado em tabela `embeddings` no Supabase (pgvector)
4. Quando skill é carregado → pesquisa semântica pelos documentos relevantes
5. Contexto enriquecido com documentos reais do fornecedor/departamento

Tabela necessária: `embeddings` (migration 025 — S36)
Extensão necessária: `pgvector` no Supabase

---

*CSN Opus · Carlos dos Santos Nascimento, Lda · NIF 500 861 790 · Mafra, Portugal*
*Repositório: duartebustorff-star/csn-producao*
