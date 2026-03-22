# ADR-017 — Box Rules: Dimensões e Pesos Mínimos e Máximos de Carroçaria

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

Antes de dimensionar qualquer carroçaria, o CSN Brain calcula automaticamente o envelope permitido — os mínimos e máximos de dimensões e peso para aquele chassi específico com aqueles equipamentos. O cliente só pode escolher dentro deste envelope. Fora do envelope — bloqueio com citação legal.

---

## Box Rules — Definição Completa

### LARGURA

```
Largura_mín = MAX(largura_cabine, largura_extremidade_eixo_traseiro)

Largura_máx = 2.55m (DL 132/2017)
              2.60m se carroçaria frigorífica
```

**Razão do mínimo:**
- `largura_cabine` — a carroçaria não pode ser mais estreita que a cabine. Seria visualmente incorreto e pode criar problemas de homologação.
- `largura_extremidade_eixo_traseiro` — a carroçaria não pode ser mais estreita que o rodado traseiro. As rodas não podem ficar para fora da carroçaria — é ilegal e perigoso.
- Usa-se o MAX dos dois porque ambas as condições têm de ser cumpridas simultaneamente.

---

### LARGURA — Cálculo do Eixo Traseiro

As marcas fornecem este dado em dois formatos diferentes:

**Formato A — Largura entre extremidades (dado directo)**
```
largura_extremidade_eixo_traseiro = valor fornecido directamente
Ex: "Track width overall: 1.850mm"
```

**Formato B — Via + pneu (requer cálculo)**
```
Via = distância entre centros dos pneus traseiros
Largura_pneu = secção do pneu em mm (ex: "215" em 215/65R16C)

largura_extremidade_eixo_traseiro = Via + Largura_pneu
(soma metade do pneu de cada lado = soma 1 pneu completo)

Ex: Via = 1.635mm + Pneu 215mm = 1.850mm
```

**Campo na tabela:**
```
largura_extremidade_eixo_traseiro  → valor normalizado — sempre este
via_eixo_traseiro                  → se disponível — rastreabilidade
largura_pneu_traseiro              → se disponível — rastreabilidade
formato_fonte_largura_eixo         → "extremidades" / "via+pneu" / "calculado"
```

**Score de confiança (ADR-016):**
- Formato A fornecido directamente → ✅ Validado
- Formato B calculado com ambos os valores confirmados → ⚠️ Fonte única
- Formato B com pneu estimado → 🔄 Estimado

---

### COMPRIMENTO

```
Comprimento_mín = comprimento_zona_carga_chassi
(a carroçaria deve estar à face com o chassi — não pode ficar aquém)

Comprimento_máx = distancia_eixos + (distancia_eixos × 2/3)
(overhang máximo traseiro = 2/3 da distância entre eixos — DL 132/2017)
```

**Fórmula overhang:**
```
Overhang_máx = distancia_eixos × (2/3)
Comprimento_máx_carrocaria = distancia_eixos + Overhang_máx
                           = distancia_eixos × (1 + 2/3)
                           = distancia_eixos × 1.667
```

**Fonte legal:** DL 132/2017, artigo sobre distribuição — "as caixas só podem prolongar-se além do eixo da retaguarda até uma distância igual a dois terços da distância entre eixos"

---

### ALTURA

```
Altura_mín = definida pelo cliente / utilização
             (sem limite legal mínimo)

Altura_máx = 4.00m (legal) - altura_chassi - altura_subframe
             (para basculante: subframe obrigatório)
             (para estrado: sem subframe — mais altura disponível)
```

**Nota:** A altura_chassi inclui a altura dos longarinas + sobrestrutura se existir.

---

### PESO

```
Peso_mín = peso estrutural mínimo da carroçaria
           (depende do tipo: basculante tem subframe + cilindro hidráulico)
           (estrado simples é mais leve)
           (a definir por tipo de carroçaria — ADR-015)

Peso_máx = (PBV × 0.90) - Tara - ((Nº_lugares - 1) × 75) - Σ(peso_equipamentos)

Fonte legal: DL 132/2017 + Reg. UE 1230/2012 (ADR-011)
```

---

## Resumo das Box Rules

| Dimensão | Mínimo | Máximo | Fonte |
|---|---|---|---|
| Largura | MAX(largura_cabine, largura_extremidade_eixo_traseiro) | 2.55m | DL 132/2017 |
| Comprimento | comprimento_zona_carga_chassi | distancia_eixos × 1.667 | DL 132/2017 |
| Altura | cliente | 4.00m - altura_chassi - subframe | DL 132/2017 |
| Peso | peso estrutural mínimo | (PBV×0.90) - Tara - Tripulação - Equipamentos | DL 132/2017 + Reg. 1230/2012 |

---

## Campos Necessários na Tabela `marcas_veiculo`

```sql
-- Largura
largura_cabine                        numeric,  -- largura da cabine sem espelhos
largura_extremidade_eixo_traseiro     numeric,  -- calculado ou fornecido directamente
via_eixo_traseiro                     numeric,  -- se disponível
largura_pneu_traseiro                 numeric,  -- secção do pneu em mm
formato_fonte_largura_eixo            text,     -- extremidades / via+pneu / calculado

-- Comprimento
comprimento_zona_carga_chassi         numeric,  -- mínimo da carroçaria
distancia_eixos                       numeric,  -- base para cálculo overhang

-- Altura
altura_chassi                         numeric,  -- altura do chassi ao solo
altura_subframe_tipico                numeric,  -- altura típica do subframe

-- Pneus
designacao_pneu_traseiro              text,     -- ex: "215/65R16C"
```

---

## Como o CSN Brain Apresenta as Box Rules

Após selecção de chassi + equipamentos, o configurador mostra:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RENAULT MASTER XDD L3H2 — Cabine Simples
ENVELOPE DE CARROÇARIA PERMITIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Comprimento:  mín 2.800mm  |  máx 4.900mm
Largura:      mín 1.992mm  |  máx 2.550mm
Altura:       mín cliente  |  máx 1.850mm
Peso:         mín ~250kg   |  máx 1.050kg

Base legal: DL 132/2017 + Reg. UE 1230/2012
Dados chassi: Renault GT XDD ICE v2024 ✅ Validado
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Consequências

- Todos os campos listados acima são obrigatórios na tabela `marcas_veiculo`
- O Agente de Inteligência de Marcas (ADR-016) normaliza `largura_extremidade_eixo_traseiro` independentemente do formato fornecido pela marca
- O CSN Brain não aceita configurações fora do envelope — bloqueia com citação legal
- A documentação gerada por obra inclui sempre o envelope calculado e os valores escolhidos pelo cliente
- Score de confiança do campo afecta o aviso na interface: ✅ vs ⚠️ vs 🔄
