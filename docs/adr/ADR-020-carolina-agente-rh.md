# ADR-020 — Carolina: Agente de Recursos Humanos

**Data:** 26/03/2026
**Hora (Lisboa):** 11:30 WET (UTC+1 — WEST)
**Estado:** ✅ Aceite
**Sessão:** 15 (continuação)
**Fonte:** CAROLINA_RH_AGENT.md — documento escrito por Duarte Bustorff-Silva

---

## Contexto

O RH é pessoal e confidencial. Não faz sentido misturar com a produção. Os recibos, férias, faltas e dados pessoais são assuntos privados entre o trabalhador e a empresa. A gestão de ausências comunicadas pelo Fernando (produção) é passada para a Carolina tratar administrativamente.

---

## Decisão

**Carolina** — 6ª AI Persona do CSN Opus.

**Tipo:** Persona com interface própria
**Nível ISA-95:** Nível 4 — ERP (RH)
**Departamento:** Recursos Humanos

**AI Personas completas — 6:**
1. Luísa — Assistente CEO
2. Fernando — Chefe de Produção
3. Marta — Comercial
4. Leonor — Aftersales
5. Irina — Fornecedores
6. **Carolina — Recursos Humanos** ← nova

---

## Entrada do Colaborador no Sistema

```
Login colaborador
         ↓
    ┌─────────┐    ┌──────────────────┐
    │ Produção│    │ Recursos Humanos │
    │ Fernando│    │    Carolina      │
    └─────────┘    └──────────────────┘
```

Módulos completamente independentes. Dados isolados por RLS Supabase.

---

## O que o Worker vê na Carolina

- **Recibos de vencimento** — lista por mês/ano, download PDF
- **Pedidos de férias e faltas** — pedir, ver estado, saldo disponível
- **Dados pessoais** — consultar, solicitar correcção
- **Declaração anual de rendimentos** — download folha IRS

---

## O que o Admin (Duarte via Luísa) faz na Carolina

### Processamento salarial mensal
Cálculo automático por colaborador:
- Salário base (bruto)
- Duodécimo subsídio férias (÷ 12)
- Duodécimo subsídio Natal (÷ 12)
- Subsídio alimentação (valor diário × dias úteis trabalhados)
- Desconto SS (11% normal / 7.5% reformado)
- Retenção IRS (conforme tabela — isento no salário mínimo)
- Valor líquido total

### Geração de PDFs
- Template A4 paisagem, Original + Duplicado lado a lado
- 3 recibos por colaborador/mês: Vencimento + Sub. Férias + Sub. Natal
- Numeração sequencial automática
- Download individual ou em lote

---

## Requisitos Legais — Artigo 276.º n.º 3 Código do Trabalho

**Identificação entidade empregadora:**
- Nome: Carlos dos Santos Nascimento, Lda
- NIF: 500 861 790
- NISS da empresa
- Morada: Rua da Industria nº8, Casal do Rôdo, 2640-216 Encarnação

**Identificação trabalhador:**
- Nome completo, NIF, NISS, categoria profissional

**Seguro de acidentes de trabalho:**
- Nome da seguradora + número da apólice

**Valores obrigatórios:**
- Período de referência, retribuição base, subsídio alimentação
- Duodécimos, desconto SS (taxa + valor), retenção IRS (taxa + valor)
- Valor líquido, forma de pagamento, numeração sequencial

---

## Colaboradores Actuais e Dados Salariais

### João António — Normal
- Salário base 2026: 920,00€
- Taxa SS trabalhador: 11% | Taxa SS empresa (TSU): 23.75%
- Isento de IRS

### Bohdan — Reformado
- Salário base 2026: 920,00€
- Taxa SS trabalhador: 7.5% (pensionista de velhice)
- Taxa SS empresa (TSU): 23.75%
- Isento de IRS

### José Júlio — Normal
- Salário base 2026: 920,00€
- Taxa SS trabalhador: 11% | Taxa SS empresa (TSU): 23.75%
- Isento de IRS

### Valores calculados (mês completo 2026)

**Normal (João, José Júlio):**
```
Salário base:        920,00€
Duodécimo férias:     76,67€
Duodécimo Natal:      76,67€
Bruto total:       1.073,34€
Desconto SS (11%):  -118,07€
Líquido:            955,27€
Sub. alimentação:    97,90€ (22 dias) / 89,00€ (20 dias)
```

**Reformado (Bohdan):**
```
Bruto total:       1.073,34€
Desconto SS (7.5%): -80,50€
Líquido:            992,84€
Sub. alimentação: igual
```

---

## Recibos Pendentes

### 2025 (Outubro, Novembro, Dezembro)
- Salário base 2025: 870,00€
- 3 meses × 3 colaboradores × 3 recibos = **27 recibos**

### 2026
- Janeiro e Fevereiro — feitos mas sem numeração correcta → refazer
- José Júlio — baixa médica Fevereiro desde 16/02 — 10 dias úteis trabalhados
- Salário base 2026: 920,00€

---

## Gestão de Ausências — Fluxo

```
Worker comunica ao Fernando (chat ou voz)
        ↓
Fernando regista e mostra card de confirmação
        ↓
Worker confirma ou corrige
        ↓
Registo criado com estado "COMUNICADA"
        ↓
Carolina recebe e gere administrativamente
        ↓
Quando documento chega → Agente Documental classifica
        ↓
Registo passa a "JUSTIFICADA"
```

**Estados de ausência:**
```
COMUNICADA      → worker avisou, sem documento
CONFIRMADA      → worker confirmou o card
PENDENTE_DOC    → aguarda documento justificativo
JUSTIFICADA     → documento entregue e registado
INJUSTIFICADA   → prazo passou sem documento
FECHADA         → completo
```

**Tipos de ausência:**
- Doença (sem documento / baixa médica / consulta manhã|tarde|horas)
- Falta justificada (com documento posterior)
- Falta injustificada
- Chegada tarde / saída cedo (com hora exacta)
- Férias (período com datas)
- Folga compensatória
- Formação externa

---

## Tabelas Supabase Necessárias — Migration 020 RH

```sql
colaboradores_rh         -- dados salariais e pessoais (separada de colaboradores produção)
processamentos_mensais   -- cada mês processado
recibos_vencimento       -- cada recibo individual com PDF URL
pedidos_ferias_faltas    -- pedidos dos workers
declaracoes_anuais       -- folha IRS final de ano
ausencias                -- já existe mas precisa de campos adicionais
```

**Campos chave `colaboradores_rh`:**
```
colaborador_id (FK), salario_base, regime (normal/reformado)
taxa_ss_trabalhador, taxa_ss_empresa, nif, niss
categoria_profissional, seguradora_at, apolice_at
data_admissao, iban, forma_pagamento
```

**Campos chave `recibos_vencimento`:**
```
numero_recibo, tipo (vencimento/subsidio_ferias/subsidio_natal)
ano, mes, dias_uteis, dias_trabalhados
salario_base, subsidio_alimentacao_total
bruto, desconto_ss, taxa_ss, retencao_irs, liquido
pdf_url
```

---

## Regras de Acesso (RLS Supabase)

- Cada worker só vê os seus próprios dados
- Admin (Duarte) vê tudo de todos
- Dados salariais nunca visíveis entre colaboradores
- Recibos são documentos privados

---

## Dashboards

### Dashboard Fernando (Produção)
- Obras concluídas vs objectivo
- Tempo médio por obra
- Capacidade real vs potencial
- Obras em atraso

### Dashboard Carolina (RH)
- Dias trabalhados vs dias úteis por colaborador
- Custo por colaborador vs output de produção
- Potencial de produção até final do ano vs real acumulado
- Custos salariais totais (mensal e anual)

---

## Contexto Estratégico — Automação Industrial

A estratégia CSN é substituir dependência de mão-de-obra especializada por maquinaria. O operador não precisa de ser especialista — precisa de seguir instruções do sistema.

**Weinig Unimat 22E (investimento em estudo):**
Com 7 cabeças, produz taipais perfil 25×160mm com encaixe macho/fêmea em uma passagem. Workflow integrado com Fernando:
1. Obra define o perfil
2. Operador fotografa cada uma das 7 cabeças
3. Sistema valida que as cabeças estão correctas
4. OK → operador alimenta as tábuas

Resultado: de carpinteiro especializado para tarefeiro básico com controlo digital.

---

## Consequências

- Carolina é a 6ª AI Persona — adicionada à arquitectura v19
- Migration 020 cria tabelas RH
- `colaboradores_rh` é separada de `colaboradores` (produção) — dados diferentes
- RLS obrigatório — cada worker isolado dos dados dos outros
- 27 recibos pendentes 2025 + Jan/Fev 2026 a gerar como primeira tarefa
- A gestão de ausências flui: Fernando (comunicação) → Carolina (administração) → Agente Documental (documentos)
- Nível ISA-95: Nível 4 — ERP — Departamento RH
