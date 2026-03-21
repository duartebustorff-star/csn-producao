# ADR-015 — Famílias de Carroçaria CSN + Normas + Mercados

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

A CSN fabrica dois tipos de carroçaria. O CSN Brain precisa de saber exactamente o que cada tipo implica — dimensões, normas, cálculos, variantes — para configurar correctamente e gerar documentação de conformidade.

---

## Famílias de Carroçaria

### Família 1 — Basculante (Tipper)

**Variantes:**
- Traseiro — bascula para trás
- Lateral — bascula para um lado
- Trilateral — bascula para trás e para ambos os lados

**Componentes obrigatórios:**
- Caixa basculante (chapa S235JR / S355)
- Subframe — estrutura intermédia entre chassis e caixa
- Cilindro hidráulico — simples ou telescópico
- Sistema hidráulico — bomba, reservatório, válvulas
- Dobradiças traseiras e/ou laterais
- Trincos de fecho

**Normas aplicáveis:**
- EN 1090-1/-2 — execução estrutural em aço EXC2
- EN ISO 3834-3 — qualidade de soldadura
- EN 12642 L/XL — resistência estrutural da carroçaria
- EN 12640 — pontos de amarração
- DL 132/2017 — pesos e dimensões
- Reg. 2018/858 — COC multi-etapa

**Mercados:**
- Ligeiros (N1/N2): Fuso, Renault, Mercedes — até 7.5t
- Pesados (N3): MAN, DAF, Iveco, Volvo, Scania — acima 7.5t

**Cálculo específico:**
- Peso do subframe → reduz peso útil
- Centro de gravidade sobe quando bascula → verificar estabilidade
- Ângulo de basculamento máximo → depende do CoG com carga
- Pressão hidráulica necessária → função do peso da caixa + carga

---

### Família 2 — Caixa Aberta / Estrado (Flatbed / Platform)

**Variantes:**
- Estrado simples — sem taipais
- Caixa aberta com taipais fixos
- Caixa aberta com taipais amovíveis ← mercado pesados / camiões
- Caixa aberta com taipais rebatíveis
- Com cobertura — lona manual / lona automática / cobertura rígida

**Componentes:**
- Estrado / plataforma (chapa + perfis)
- Taipais (se aplicável) — laterais e traseiro
- Sistema de fecho de taipais
- Cobertura (se aplicável)
- Estribo lateral (opcional)
- Pára-lamas integrados

**Taipais amovíveis — mercado pesados:**
- Utilizados extensivamente em camiões N3
- Permitem carga lateral com empilhador
- Certificação de resistência dos pinos de fixação
- Norma EN 12642 XL obrigatória para mercado DE/FR

**Normas aplicáveis:**
- EN 1090-1/-2 — execução estrutural em aço EXC2
- EN ISO 3834-3 — qualidade de soldadura
- EN 12642 L/XL — resistência estrutural
- EN 12640 — pontos de amarração obrigatórios
- EN 12195-1 — cálculo forças fixação carga
- DL 132/2017 — pesos e dimensões
- Reg. 2018/858 — COC multi-etapa

**Mercados:**
- Ligeiros (N1/N2): carrinhas, furgões transformados
- Pesados (N3): camiões — estrado com taipais amovíveis

---

## Ligeiros vs Pesados — A Mesma Lógica

| | Ligeiros N1/N2 | Pesados N3 |
|---|---|---|
| PBV | até 7.5t | acima 7.5t |
| Marcas chassi | Renault, Fuso, Mercedes | MAN, DAF, Iveco, Volvo, Scania |
| Eixos | 2 | 2, 3 ou 4 (tandem traseiro) |
| Normas | Iguais | Iguais |
| Cálculo | Igual | Igual — valores diferentes |
| COC | Multi-etapa igual | Multi-etapa igual |
| EN 1090 | EXC2 | EXC2 |

O CSN Brain trata tudo com a mesma lógica. O configurador pergunta o número de eixos — o resto é automático.

---

## Dimensões Máximas por Tipo

### Basculante — fórmulas de dimensionamento:
```
Comprimento_caixa ≤ Comprimento_chassis - Subframe_dianteiro
Largura_caixa ≤ Largura_max_legal (2.55m) - tolerâncias
Altura_caixa → função do PBV disponível e CoG máximo
Volume_caixa = Comprimento × Largura × Altura_interna
```

### Estrado / Caixa Aberta:
```
Comprimento_estrado ≤ Overhang_max_traseiro + Distancia_eixos × (2/3)
Largura_estrado ≤ 2.55m (max legal)
Altura_taipal → tipicamente 300-500mm
```

---

## Tabela Supabase — `tipos_carrocaria`

```sql
CREATE TABLE tipos_carrocaria (
  id uuid PRIMARY KEY,
  familia text NOT NULL,        -- basculante / caixa_aberta
  variante text,                -- traseiro / lateral / trilateral / taipais_amovíveis
  mercado text,                 -- ligeiros / pesados / ambos
  normas text[],                -- lista de normas aplicáveis
  componentes_obrigatorios text[],
  calculo_especifico jsonb,     -- fórmulas e parâmetros específicos
  documentacao_obrigatoria text[],
  ativo boolean DEFAULT true,
  notas text
);
```

---

## Consequências

- Migration 019 cria `equipamentos_carrocaria` + `tipos_carrocaria`
- O configurador CSN Brain apresenta as famílias após configuração do chassi + equipamentos
- O peso disponível para carroçaria já está calculado nesse ponto
- As dimensões máximas são calculadas automaticamente com base no chassi seleccionado
- Os pesados (N3) entram com as mesmas tabelas — só diferem nos valores
