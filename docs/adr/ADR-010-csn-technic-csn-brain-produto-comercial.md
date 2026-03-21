# ADR-010 — CSN Technic: Marca Corporativa + CSN Configurador como Produto Comercial

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

O CSN Opus foi concebido como sistema de gestão interno. Durante a sessão 15 ficou claro que a base de dados de chassi, o configurador, a calculadora de carga e o render 3D paramétrico têm valor comercial muito além do uso interno. O software de referência do mercado europeu — TrailerWin — só calcula, não desenha, não gera documentação e não está ligado a sistemas de gestão. Existe um gap de mercado claro.

---

## Decisão

### 1 — Marca Corporativa: CSN Technic

**Nome:** CSN Technic
**Posicionamento:** Commercial Vehicle Engineering
**Mercados:** Portugal · França · Alemanha · Espanha · União Europeia

A marca CSN Technic engloba:
- A empresa Carlos dos Santos Nascimento, Lda
- O sistema de gestão interno (CSN Opus)
- O produto comercial (CSN Brain)

O nome funciona em todas as línguas sem tradução. Soa a engenharia séria e especializada.

---

### 2 — Produto Comercial: CSN Configurador

**Nome:** CSN Configurador
**Tagline:** *The engineering brain behind every body.*
**Tipo:** SaaS B2B para carroçadores europeus

**O que faz — melhor que o TrailerWin:**

| Funcionalidade | TrailerWin | CSN Brain |
|---|---|---|
| Cálculo distribuição carga | ✅ | ✅ |
| Limites por eixo automáticos | ✅ | ✅ |
| Base de dados chassi multi-marca | ✅ | ✅ |
| Dicionário de nomenclatura por marca | ❌ | ✅ |
| Número de passageiros → peso útil | ❌ | ✅ |
| Dimensões máximas carroçaria automáticas | ❌ | ✅ |
| Desenho 3D paramétrico da carroçaria | ❌ | ✅ |
| Geração automática documentação técnica | ❌ | ✅ |
| Conformidade normativa integrada | ❌ | ✅ |
| COC multi-etapa | ❌ | ✅ |
| Ligado ao sistema de gestão | ❌ | ✅ |
| Monitorização evoluções das marcas | ❌ | ✅ |
| SaaS / cloud | ❌ | ✅ |

---

### 3 — Módulos do CSN Configurador

```
CSN Configurador
  ├── Configurador de Chassi
  │     → Motorização (Diesel / Eléctrico)
  │     → Marca → Modelo → Cabine → Versão → Rodado
  │     → Caixa + Tracção (opcional)
  │     → Número de passageiros
  │
  ├── Calculadora de Carga
  │     → Peso ocupantes (nº passageiros × 75kg padrão EU)
  │     → Peso carroçaria + carga útil disponível
  │     → Distribuição por eixo
  │     → Verificação PBT e limites por eixo
  │     → Altura máxima CoG
  │
  ├── Configurador de Carroçaria
  │     → Tipo (basculante, caixa aberta, frigorífico, furgão, etc.)
  │     → Dimensões máximas e mínimas calculadas automaticamente
  │     → Limitações do fabricante do chassi
  │     → Verificação conformidade EN 12642
  │
  ├── Render 3D Paramétrico
  │     → Desenho da carroçaria com dimensões correctas
  │     → Vista lateral, frontal, superior
  │     → Exportação para Inventor/SolidWorks
  │
  └── Gerador de Documentação
        → Ficha técnica da configuração
        → Cálculo de carga (evidência EN 12642)
        → Declaração de conformidade
        → Base para COC multi-etapa
```

---

### 4 — Dicionário de Nomenclatura CSN (tabela `nomenclatura_marcas`)

Cada marca usa terminologia diferente para os mesmos conceitos. O dicionário mapeia tudo para a nomenclatura CSN:

| Conceito CSN | Renault | Fuso | Mercedes |
|---|---|---|---|
| Cabine simples | Cabine simple | Regular Cab | Einzelkabine |
| Cabine dupla | Cabine double | Crew Cab | Doppelkabine |
| Rodado simples | Roues simples | Single rear | Einzelbereifung |
| Rodado duplo | Roues jumelées | Dual rear | Zwillingsbereifung |
| Distância eixos | Empattement | Wheelbase | Radstand |
| Comprimento total | Long. totale | Overall length | Gesamtlänge |
| PBT | PTAC | GVW | zGG |
| Tara | Poids à vide | Kerb weight | Leergewicht |
| Carga útil | Charge utile | Payload | Nutzlast |
| CoG altura máx | Hcg max | CoG height | Schwerpunkthöhe |
| Nº passageiros | Places assises | Seating capacity | Sitzplätze |

**Tabela `nomenclatura_marcas`:**
```
id, conceito_csn, marca, termo_marca, unidade, notas
```

---

### 5 — Número de Passageiros e Cálculo de Peso

Campo `num_passageiros_max` obrigatório na tabela `marcas_veiculo`.

Valores típicos por tipo de cabine:

| Tipo de cabine | Passageiros típicos |
|---|---|
| Simples (pick-up, chassi) | 2-3 |
| Crew Cab / Cabine dupla | 5-7 |
| Van de passageiros | 5-9 |
| Minibus | 9-17 |

**Fórmula de peso útil disponível para carroçaria:**
```
Peso_util_carrocaria = PBT - Tara_chassi - (Num_passageiros × 75kg)
```

**Verificação por eixo:**
```
Carga_eixo_traseiro = Tara_eixo_traseiro + (Peso_carrocaria × factor_distribuicao)
Verificar: Carga_eixo_traseiro ≤ Carga_max_eixo_traseiro
```

**Fórmula CoG:**
```
CoG_total = (CoG_chassi × Tara + CoG_carrocaria × Peso_carrocaria) / PBT_real
Verificar: CoG_total ≤ CoG_max_fabricante
```

---

### 6 — Relação CSN Opus ↔ CSN Configurador

```
CSN Technic
  ├── CSN Opus (interno)
  │     → Gestão de obras, qualidade, documentação
  │     → Usa CSN Configurador internamente para cada obra
  │
  └── CSN Configurador (comercial)
        → Começa como módulo do CSN Opus
        → Cresce para produto SaaS independente
        → Base de dados de chassi partilhada
```

---

### 7 — Modelo de Negócio CSN Configurador

**Fase 1 — Validação interna:**
CSN usa o Brain em todas as obras. Valida precisão, corrige erros, melhora base de dados.

**Fase 2 — Beta com parceiros:**
3-5 carroçadores portugueses usam em beta. Feedback. Iteração.

**Fase 3 — Lançamento SaaS:**
- Subscrição mensal por carroçador
- White label para marcas de chassi
- API para integrações (concessionários, peritos, seguradoras)

**Pricing benchmark TrailerWin:**
TrailerWin custa ~€2.000-5.000/ano por licença. CSN Configurador tem mais funcionalidades — pode posicionar-se acima.

---

### 8 — Migrations necessárias

**Migration 018:**
```sql
-- Tabela principal de chassi por configuração
CREATE TABLE marcas_veiculo (
  id uuid PRIMARY KEY,
  marca text NOT NULL,
  gama text,
  modelo text NOT NULL,
  versao text,
  cabine text,
  rodado text,
  motorizacao text, -- diesel / electrico / hibrido
  caixa text,
  tracao text,
  num_passageiros_max integer,
  pbt_max numeric,
  tara_chassi numeric,
  carga_max_eixo_dianteiro numeric,
  carga_max_eixo_traseiro numeric,
  altura_max_cog numeric,
  overhang_max_traseiro numeric,
  distancia_eixos numeric,
  comprimento_chassis numeric,
  largura_chassis numeric,
  altura_chassis numeric,
  restricoes_soldadura text,
  restricoes_perfuracao text,
  sensores_gsr_localizacao text,
  fonte_dados text,
  documento_ref text,
  versao_documento text,
  validado_por text,
  data_validacao date,
  testes_cruzamento text,
  notas text,
  estado text DEFAULT 'rascunho', -- rascunho / validado / desactualizado
  created_at timestamptz DEFAULT now()
);

-- Dicionário de nomenclatura por marca
CREATE TABLE nomenclatura_marcas (
  id uuid PRIMARY KEY,
  conceito_csn text NOT NULL,
  marca text NOT NULL,
  termo_marca text NOT NULL,
  unidade text,
  notas text,
  created_at timestamptz DEFAULT now()
);

-- Ordens de trabalho do Cowork
CREATE TABLE ordens_trabalho_cowork (
  id uuid PRIMARY KEY,
  referencia text UNIQUE NOT NULL, -- OT-AAAA-NNN-marca
  tipo text, -- extraccao_inicial / monitorizacao / validacao
  marca text,
  descricao text,
  pasta_destino text,
  data_criacao timestamptz DEFAULT now(),
  data_execucao timestamptz,
  relatorio_extraccao jsonb,
  documentos_encontrados integer,
  documentos_descarregados integer,
  documentos_sem_acesso integer,
  proxima_verificacao date,
  estado text DEFAULT 'pendente' -- pendente / executado / em_monitorizacao / erro
);

-- Documentos externos das marcas
CREATE TABLE documentos_externos (
  id uuid PRIMARY KEY,
  marca text,
  tipo_documento text,
  nome_ficheiro text,
  versao_documento text,
  data_documento date,
  url_fonte text,
  metodo_obtencao text, -- portal / scraping / email / download_manual
  ot_id uuid REFERENCES ordens_trabalho_cowork(id),
  pasta_local text,
  data_entrada timestamptz DEFAULT now(),
  registado_por text,
  estado text DEFAULT 'activo', -- activo / obsoleto / substituido
  documento_substituto_id uuid,
  notas text
);
```

---

## Razão

O gap entre o TrailerWin e o que o mercado precisa é real e documentado. Nenhum software existente combina configuração de chassi + cálculo de carga + desenho 3D + geração de documentação normativa numa única plataforma cloud. A CSN tem vantagem competitiva única: vai usar o produto internamente antes de o vender, garantindo que funciona em condições reais de produção.

## Consequências

- O nome CSN Technic passa a ser usado em toda a comunicação externa
- O CSN Configurador é um produto separado do CSN Opus — arquitectura modular desde o início
- A tabela `marcas_veiculo` é a base de tudo — tem de ser construída com rigor
- O dicionário `nomenclatura_marcas` é obrigatório antes do configurador funcionar com múltiplas marcas
- Migration 018 cria as 4 tabelas base do CSN Brain
- Renault Master XDD ICE é o primeiro modelo a entrar completo na `marcas_veiculo`
