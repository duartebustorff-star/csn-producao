# ADR-013 — Hierarquia de Conformidade + Todos os Limites que a CSN Tem de Cumprir

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

A CSN não tem de cumprir um limite — tem de cumprir múltiplos limites em simultâneo, de origens diferentes. O CSN Brain tem de verificar todos antes de aceitar uma configuração. Se qualquer limite for ultrapassado — a configuração é recusada.

---

## A Hierarquia de Conformidade — 3 Níveis

```
NÍVEL 1 — LEGISLAÇÃO EUROPEIA (obrigatória, directamente aplicável)
        ↓
NÍVEL 2 — LEGISLAÇÃO NACIONAL (Portugal + mercado de destino)
        ↓
NÍVEL 3 — REGRAS DO FABRICANTE DO CHASSI (mounting directives)
```

**Os 3 níveis acumulam-se — tem de cumprir todos.**
Se o fabricante for mais restritivo que a lei, prevalece o fabricante (não invalida a garantia).

---

## NÍVEL 1 — Diplomas Europeus

### Pesos e Dimensões

**Diretiva 96/53/CE do Conselho, de 25 de julho de 1996**
*Dimensões máximas no tráfego nacional e internacional e pesos máximos no tráfego internacional*
- URL consolidada: https://eur-lex.europa.eu/legal-content/PT/TXT/HTML/?uri=CELEX:01996L0053-20190814
- Define os limites absolutos europeus de pesos por eixo:
  - Eixo simples: máx. 10t
  - Eixo motor com suspensão pneumática: máx. 11.5t
  - Eixo duplo (bogie): 16t-19t conforme distância entre eixos
  - Eixo triplo: 24t

**Diretiva (UE) 2015/719**
*Altera a Dir. 96/53/CE — combustíveis alternativos +1t, emissões zero +1t*

**Regulamento (UE) n.º 1230/2012 de 12/12/2012**
*Homologação — massas e dimensões*
- URL: https://eur-lex.europa.eu/legal-content/PT/ALL/?uri=celex:32012R1230
- Define massa por passageiro = 75kg
- Define dimensões máximas para homologação CE

**Regulamento (UE) 2018/858 de 30/05/2018**
*Homologação e COC multi-etapa*
- Base legal do COC que a CSN emite

**Regulamento (UE) 2019/2144 — GSR**
*Segurança geral — AEB, câmaras, sensores*

---

## NÍVEL 2 — Legislação Nacional Portugal

**DL n.º 132/2017 de 11/10/2017 (actualizado DL 59/2023)**
*Regulamento que Fixa os Pesos e Dimensões Máximos em Circulação*
- URL: https://dre.tretas.org/dre/3115633/decreto-lei-132-2017-de-11-de-outubro

**Limites máximos em Portugal — tabela de referência:**

| Tipo de veículo | PBV máximo |
|---|---|
| Veículo 2 eixos | 18t |
| Veículo 3 eixos | 25t (26t com suspensão pneumática) |
| Veículo 4+ eixos | 32t |
| Conjunto 4 eixos | 36t |
| Conjunto 5+ eixos | 44t |

**Limites por eixo em Portugal:**

| Tipo de eixo | Máximo |
|---|---|
| Eixo simples | 10t |
| Eixo motor com suspensão pneumática | 11.5t |
| Eixo duplo (bogie) | 16-18t (conforme distância) |
| Eixo dianteiro diretor | 7.5t |

---

## NÍVEL 3 — Regras do Fabricante (Mounting Directives)

Cada marca define restrições próprias mais apertadas para não invalidar a garantia e garantir homologação. Ver pasta:
```
Marcas - Veiculos/[marca]/[documento_mounting_directives]
```

**Exemplos de restrições típicas:**
- Não perfurar o chassis em zonas definidas
- Não soldar directamente no chassis sem aprovação
- Altura máxima do CoG da carroçaria
- Overhang máximo traseiro
- Distância mínima entre chassis e carroçaria

---

## Todos os Limites que o CSN Brain Verifica

### Pesos

| Limite | Fonte | Verificação |
|---|---|---|
| PBV máximo legal | DL 132/2017 | PBV chassi ≤ limite por nº eixos |
| Carga máxima eixo dianteiro | DL 132/2017 + fabricante | Calcular distribuição |
| Carga máxima eixo traseiro | DL 132/2017 + fabricante | Calcular distribuição |
| Peso útil disponível carroçaria | Fórmula ADR-011 | (PBV×0.90) - Tara - ((Nº lug-1)×75) |
| Carga máxima no ponto de engate | Fabricante | Se tiver bola de reboque |

### Dimensões

| Limite | Fonte | Valor |
|---|---|---|
| Comprimento máximo | DL 132/2017 | 12.00m (veículos simples) |
| Largura máxima | DL 132/2017 | 2.55m (2.60m frigorífico) |
| Altura máxima | DL 132/2017 | 4.00m |
| Overhang traseiro máximo | Fabricante + DL 132/2017 | ≤ 2/3 da distância entre eixos |
| Dimensões pára-lamas | UNECE R73 + fabricante | Cobrir rodas em toda a extensão |

### Centro de Gravidade

| Limite | Fonte |
|---|---|
| Altura máxima CoG carroçaria | Fabricante (mounting directives) |
| CoG total ≥ 5% da distância entre eixos à frente do eixo traseiro | DL 132/2017 art. sobre distribuição |
| CoG não pode estar atrás do eixo traseiro | DL 132/2017 |

### Ângulos e Geometria

| Limite | Fonte |
|---|---|
| Ângulo de saída traseiro (departure angle) | Fabricante — limita carroçaria baixa |
| Ângulo de entrada dianteiro | Fabricante |
| Distância mínima carroçaria ao solo | Fabricante + legislação |
| Raio de viragem | Legislação + fabricante |

### Bola de Reboque / Engate

| Limite | Fonte |
|---|---|
| Peso rebocável (PBR) | Fabricante — inscrito no livrete |
| Carga vertical máxima no ponto de engate | Fabricante |
| Impacto no CoG com reboque carregado | Calcular caso a caso |
| Distância engate ao eixo traseiro | Fabricante |

### Pára-Lamas

| Limite | Fonte |
|---|---|
| Regulamento (UE) n.º R73 UNECE | Protecção lateral das rodas |
| Deve cobrir: 30° à frente, 50° atrás do centro da roda | UNECE R73 |
| Material e resistência | UNECE R73 |

---

## Diplomas a Descarregar para RAG

```
knowledge-base/tecnico/normas/pesos-dimensoes/
  Directiva_96_53_CE_consolidada_2019.pdf       ← limites eixos europeus
  DL_132_2017_Pesos_Dimensoes_Portugal.pdf
  DL_59_2023_Alteracao.pdf
  Reg_UE_1230_2012_Massas_Dimensoes.pdf
  Reg_UE_2018_858_Homologacao_COC.pdf
  Reg_UE_2019_2144_GSR.pdf

knowledge-base/tecnico/normas/dimensoes-carrocaria/
  UNECE_R73_Para_Lamas.pdf                      ← pára-lamas
  UNECE_R58_Para_Choques_Traseiro.pdf           ← para-choques traseiro
  UNECE_R48_Iluminacao.pdf                      ← iluminação
  EN_12642_2016_Resistencia_Estrutural.pdf
```

---

## OT para o Cowork

```
OT-2026-012-legislacao-pesos-dimensoes-completa
Tipo: extraccao_inicial
Fontes:
  - https://eur-lex.europa.eu (Directiva 96/53/CE consolidada, Reg. 2018/858, Reg. 2019/2144)
  - https://dre.pt (DL 132/2017, DL 59/2023)
  - https://unece.org (R73, R58, R48)
Pasta destino: knowledge-base/tecnico/normas/
```

---

## Como o CSN Brain Usa Isto

Para cada configuração proposta, o Brain verifica sequencialmente:

```
1. PBV do chassi ≤ limite legal por nº eixos? → DL 132/2017
2. Peso útil disponível calculado → ADR-011 fórmula
3. Dimensões dentro dos limites legais? → DL 132/2017
4. Overhang dentro do limite? → 2/3 distância entre eixos
5. CoG dentro dos limites do fabricante? → Mounting Directives
6. Ângulo de saída respeitado? → Mounting Directives
7. Pára-lamas cobre as rodas correctamente? → UNECE R73
8. Se tem reboque: PBR e carga no engate dentro do limite? → Ficha fabricante
9. Peso por eixo calculado ≤ máximo? → DL 132/2017 + fabricante

SE TODOS OK → configuração aceite → gera documentação
SE QUALQUER FALHA → bloqueia → explica qual o limite e qual o diploma
```

---

## Consequências

- Todos os diplomas listados entram no RAG via Cowork OT-2026-012
- A tabela `marcas_veiculo` precisa dos campos: `angulo_saida`, `distancia_engate_eixo_traseiro`, `carga_max_engate`, `largura_paras_lamas`
- O CSN Brain cita automaticamente o diploma violado quando bloqueia uma configuração
- A documentação de conformidade gerada por obra lista todos os limites verificados e os valores calculados
