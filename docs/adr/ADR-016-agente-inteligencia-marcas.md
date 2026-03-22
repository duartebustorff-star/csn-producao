# ADR-016 — Agente de Inteligência de Marcas (Vehicle Intelligence Agent)

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

A CSN tem como ponto de diferenciação ter informação técnica fidigna sobre todas as marcas com que trabalha. Sem um agente dedicado a gerir esta informação, os dados entram mas ninguém garante que estão correctos, completos ou actualizados. Um dado errado na tabela `marcas_veiculo` contamina todos os cálculos do CSN Brain e pode resultar em carroçarias não conformes.

---

## Decisão

Criar um **Autonomous Agent** dedicado à gestão completa do conhecimento técnico por marca de veículo.

**Nome:** Agente de Inteligência de Marcas
**Tipo:** Autonomous Agent — trabalha em background, sem persona
**Âmbito:** Todas as marcas com que a CSN trabalha — ligeiros e pesados

---

## Responsabilidades

### 1 — Gestão do Catálogo de Marcas

O agente é o dono da tabela `marcas_veiculo` e das tabelas associadas. Nenhum dado entra sem passar por ele.

```
Marcas activas que gere:
  LIGEIROS: Renault · Fuso · Mercedes-Benz · Stellantis (Fiat/Citroën/Peugeot)
  PESADOS:  MAN · DAF · Iveco · Volvo · Scania · Mercedes-Benz Trucks
  FUTURAS:  Ford Transit · Volkswagen Crafter · Nissan NV400
```

### 2 — Validação de Dados

Cada campo na tabela `marcas_veiculo` tem um **score de confiança**:

| Score | Significado |
|---|---|
| ✅ Validado | Confirmado em ≥2 fontes independentes |
| ⚠️ Fonte única | Confirmado numa fonte — aguarda validação cruzada |
| 🔄 Estimado | Calculado ou interpolado — não confirmado |
| ❌ Em falta | Dado não encontrado — campo bloqueante |
| 🔴 Desactualizado | Fonte actualizada — dado precisa de revisão |

**Campos bloqueantes** — se ❌ o CSN Brain não aceita configurações com este modelo:
- `pbt_max`
- `tara_chassi`
- `carga_max_eixo_dianteiro`
- `carga_max_eixo_traseiro`
- `num_lugares`

### 3 — Monitorização Contínua

Corre automaticamente no dia 1 e dia 15 de cada mês:

```
Para cada marca activa:
  1. Verificar portal oficial → existe nova versão de documento?
  2. Comparar com última versão arquivada
  3. Se novo documento → descarregar + alertar Luísa + marcar campos afectados como 🔴
  4. Verificar se existe novo modelo não catalogado
  5. Gerar relatório de monitorização
```

### 4 — Qualidade do Dado

```
Por cada modelo na tabela:
  → Calcular % de campos preenchidos
  → Calcular % de campos validados
  → Score geral de completude (0-100%)
  → Score geral de confiança (0-100%)

Score < 70% completude → modelo marcado como incompleto
Score < 50% confiança → modelo bloqueado no configurador
```

### 5 — Gestão das OTs do Cowork

O agente cria e acompanha as OTs do Cowork:

```
Quando detecta dado em falta:
  → Cria OT automaticamente para o Cowork ir buscar
  → Acompanha estado da OT
  → Quando Cowork entrega → valida e actualiza tabela

Quando detecta documento desactualizado:
  → Cria OT para o Cowork descarregar nova versão
  → Actualiza campos afectados
```

### 6 — Alertas

Alerta a **Luísa** (Assistente CEO) quando:
- Nova versão de mounting directives disponível
- Campo crítico desactualizado em modelo activo
- Novo modelo de chassi detectado no mercado
- Score de confiança desce abaixo do limiar
- Certificação de parceiro bodybuilder disponível para nova marca

---

## Tools do Agente

```typescript
verificar_portal_marca(marca: string) → relatório de monitorização
comparar_versoes_documento(doc_id: string) → diff entre versões
actualizar_campo_marca(modelo_id, campo, valor, fonte, score) → update tabela
bloquear_modelo(modelo_id, motivo) → bloqueia no configurador
criar_ot_cowork(marca, tipo, campos_em_falta) → cria OT automática
calcular_score_completude(modelo_id) → score 0-100
gerar_relatorio_qualidade_dados() → relatório mensal
alertar_luisa(tipo_alerta, detalhe) → notificação
```

---

## Tabelas Supabase Adicionais

### `qualidade_dados_marca`
```sql
CREATE TABLE qualidade_dados_marca (
  id uuid PRIMARY KEY,
  marca_veiculo_id uuid REFERENCES marcas_veiculo(id),
  campo text NOT NULL,
  score text NOT NULL,  -- validado / fonte_unica / estimado / em_falta / desactualizado
  fonte text,
  documento_ref text,
  versao_documento text,
  data_validacao date,
  validado_por text,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### `monitorizacao_marcas`
```sql
CREATE TABLE monitorizacao_marcas (
  id uuid PRIMARY KEY,
  marca text NOT NULL,
  data_verificacao timestamptz DEFAULT now(),
  portal_verificado text,
  documentos_novos integer DEFAULT 0,
  documentos_actualizados integer DEFAULT 0,
  alertas_gerados integer DEFAULT 0,
  relatorio jsonb,
  ots_criadas text[],
  proximo_verificacao date
);
```

---

## Posição na Arquitectura

```
AUTONOMOUS AGENTS
  Roteador
  Documental
  QMS
  Stock
  Manutenção
  KPIs
  Compliance
  → Agente Inteligência de Marcas  ← NOVO
```

Alimenta directamente o CSN Brain — é o guardião da base de dados que o configurador usa.

---

## Relação com outros sistemas

```
Cowork → entrega documentos e dados
        ↓
Agente Inteligência de Marcas → valida e regista
        ↓
tabela marcas_veiculo (dados de qualidade garantida)
        ↓
CSN Brain Configurador → usa dados validados
        ↓
Luísa → recebe alertas de qualidade
```

---

## Consequências

- Migration 018 adiciona tabelas `qualidade_dados_marca` e `monitorizacao_marcas`
- O configurador CSN Brain só aceita modelos com score ≥ 70% completude e campos bloqueantes validados
- Cada cálculo gerado pelo CSN Brain cita o score de confiança dos dados usados
- O Agente Compliance verifica mensalmente se o Agente de Marcas está a correr correctamente
- A Luísa tem acesso ao dashboard de qualidade de dados por marca
