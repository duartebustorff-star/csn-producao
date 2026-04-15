# CSN — Variáveis Paramétricas do Modelo
## Documento vivo — actualizado por sessão
## Início: 15 Abril 2026

---

## CADEIA DE DEPENDÊNCIAS — COMO OS PARÂMETROS SE LIGAM

### Regra: cada valor depende de outro anterior. Nada aparece do nada.
### Regra: o sinal (+ ou −) vem SEMPRE explícito com o valor. Nunca se assume positivo.

```
V_Centro_Long (928 mm — do chassi)
    │
    ├──÷ 2 = C_Centro_Ypos (+464)
    │         │
    │         ├── Base universal: posição Y no assembly
    │         ├── Longarina: centro das slots inferiores (bases)
    │         └── Longarina: centro das slots superiores (travessas)
    │
    ├── + V_Larg_Long/2 = face exterior longarina chassi (+511.4)
    │
    └── − V_Larg_Long/2 = face interior longarina chassi (+416.6)
              │
              ├──÷ 2 = distância centro → extremidade longarina
              │
              ├── + P_Esp_Chapa/2 + D_Folga_Rasgo = slot lado exterior
              └── − P_Esp_Chapa/2 − D_Folga_Rasgo = slot lado interior
```

---

## CAMADA 1 — BASES UNIVERSAIS

### 1.1 Posicionamento XYZ no assembly

Cada base é posicionada por 3 coordenadas. Todas vêm do Supabase como números finais.

| Eixo | Parâmetro | Fonte | Exemplo Fix_1p_dir |
|------|-----------|-------|--------------------|
| X | `X_Fix_Np` ou `X_Fix_Nn` | Plano chassis (fixacoes_chassis) | +659.2 |
| Y | `C_Centro_Ypos` ou `C_Centro_Yneg` | V_Centro_Long / 2 | +464 |
| Z | 0 | Fixo (apoio no chassi) | 0 |

### 1.2 Geometria interna da base

| dN | Valor | O que é | Depende de |
|----|-------|---------|-----------|
| d23 | 40 | Profundidade slot Z (intercepção) | P_Perfil_Base_Z / 2 |
| d33 | 82.6 | Largura base Y | Fixo (dimensão da base) |
| d34 | 10.2 | Slot longarina (largura X) | D_Dente_Long + D_Folga_Rasgo × 2 |
| d39 | 65.5 | Centro → furo esquerdo | V_Dist_Furos / 2 |
| d40 | 65.5 | Centro → furo direito | V_Dist_Furos / 2 |
| d41 | 12.2 | Diâmetro furo | V_Dim_Furo |

### 1.3 Slot da base onde entra o dente da longarina

A slot na base e o dente na longarina partilham o mesmo X e Y:
- **X** = mesma posição X da fixação (X_Fix_Np)
- **Y** = C_Centro_Ypos (centro da longarina)
- **Largura da slot** = D_Dente_Long (10) + D_Folga_Rasgo × 2 (0.2) = **10.2 mm**
- **Profundidade** = P_Perfil_Base_Z / 2 = 80/2 = **40 mm** (intercepção em cruz)

---

## CAMADA 2 — LONGARINAS

### 2.1 Posicionamento Y das longarinas

O posicionamento Y das 4 chapas depende de:

```
V_Centro_Long = 928 (distância entre centros das longarinas do chassi)
V_Larg_Long = 94.8 (largura de cada longarina do chassi)

Centro da longarina direita:
  C_Centro_Ypos = V_Centro_Long / 2 = +464

Extremidades da longarina do chassi (face a face):
  Face_Ext = C_Centro_Ypos + V_Larg_Long / 2 = 464 + 47.4 = +511.4
  Face_Int = C_Centro_Ypos − V_Larg_Long / 2 = 464 − 47.4 = +416.6
```

### 2.2 Posição Y de cada chapa (4 chapas por longarina)

A espessura cresce **de fora para dentro**. A face exterior é FIXA (definida pelo chassi).

```
P_Esp_Chapa_Ext = 2 mm
P_Esp_Chapa_Int = 2 mm
D_Folga_Rasgo = 0.1 mm

LONGARINA DIREITA (Y positivo):

  Chapa EXTERIOR:
    Face_Ext = +511.4 (FIXA — face exterior da longarina chassi)
    Face_Int = Face_Ext − P_Esp_Chapa_Ext = 511.4 − 2 = +509.4

  Chapa INTERIOR:
    Face_Ext = +416.6 (FIXA — face interior da longarina chassi)
    Face_Int = Face_Ext + P_Esp_Chapa_Int = 416.6 + 2 = +418.6
    (cresce para DENTRO — em direcção ao centro)

LONGARINA ESQUERDA (Y negativo):
    Simétrico — mesmos valores com sinal negativo
```

### 2.3 Slots na longarina — para as bases universais

As slots inferiores (base) da longarina ficam nas mesmas posições X das fixações:

| Slot | X (mm) | Fonte |
|------|--------|-------|
| Slot base 1 | +659.2 | X_Fix1p |
| Slot base 2 | +1074.2 | X_Fix2p |
| Slot base 3 | +1694.2 | X_Fix3p |

Dimensões da slot:
- **Largura Y** = P_Esp_Chapa + D_Folga_Rasgo × 2 = 2 + 0.2 = **2.2 mm** (confirmado: 14× dN = 2.2)
- **Posição Y** = C_Centro ± (2.2 / 2) = C_Centro ± 1.1
- **Profundidade Z** = P_Perfil_Base_Z / 2 = 80/2 = **40 mm** (confirmado: d77 = 40)
- **Desde Z = 0, sobe para cima** (intercepção em cruz)

Posição Y dos limites de cada slot (sinais sempre explícitos):

```
LONGARINA DIREITA (centro = +464):
  Slot_Y+ = +464 + 1.1 = +465.1
  Slot_Y- = +464 − 1.1 = +462.9

LONGARINA ESQUERDA (centro = −464):
  Slot_Y+ = −464 + 1.1 = −462.9
  Slot_Y- = −464 − 1.1 = −465.1
```

**Regra: o sinal vem sempre com o valor. Nunca se assume positivo.**

### 2.4 Slots na longarina — para as travessas (topo)

As slots superiores da longarina ficam nas posições X calculadas das travessas:

Dimensões da slot:
- **Largura Y** = P_Esp_Trav + D_Folga_Rasgo × 2 = ? + 0.2 (a confirmar)
- **Profundidade Z** = P_Alt_Trav / 2 − margem = **28 mm** (confirmado: 6× dN = 28)
- **Desde Z = topo (198), desce para baixo**

### 2.5 Dente da longarina (entra na slot da base)

| Parâmetro | Valor | Tipo |
|-----------|-------|------|
| D_Dente_Long | 10 mm | Default CSN (fixo) |
| Posição X do dente | = mesma posição X da fixação | Partilhado |
| Posição Y do dente | = centro da longarina (C_Centro_Ypos) | Partilhado |
| Confirmado no modelo | d12, d14, d16, d18, d88 = 10 mm | ✅ |

### 2.6 Parâmetros confirmados no XML da longarina Front (Xpos)

| dN | Valor | Mapeamento CSN | Confirmado |
|----|-------|---------------|-----------|
| Thickness | 2.0 | P_Esp_Chapa_Ext | ✅ |
| d97 | 1801 | ≈ C_X_pos (1799+2?) | ⚠️ confirmar |
| d109 | 1074.2 | X_Fix2p | ✅ |
| d110 | 1694.2 | X_Fix3p | ✅ |
| d112 | 152.8 | X_Fix1n (abs) | ✅ |
| d113 | 985.8 | X_Fix2n (abs) | ✅ |
| d77 | 40 | Slot base profundidade | ✅ |
| d23, d30, d95, d98, d106, d107 | 28 | Slot travessa profundidade | ✅ |
| d25, d27, d29, d34, d36, d38, d43, d45, d47, d50, d75, d79, d94, d99 | 2.2 | Slot largura (chapa+folga) | ✅ |
| d12, d14, d16, d18, d88 | 10 | D_Dente_Long | ✅ |
| d19, d21 | 15 | ? (a confirmar) |
| d51 | 3 | ? (a confirmar) |
| d74 | 36 | ? (a confirmar) |
| d81 | 80 | Perfil base Z? | ⚠️ |
| d82 | 37 | ? (a confirmar) |
| d87 | 68.392 | ? (a confirmar) |
| d89 | 112.5 | Posição X travessa 1 topo | ⚠️ |
| d90 | 225 | Posição X travessa 2 topo | ⚠️ |
| d91 | 471 | Posição X travessa 3 topo | ⚠️ |
| d92 | 717 | Posição X travessa 4 topo | ⚠️ |
| d93 | 963 | Posição X travessa 5 topo | ⚠️ |
| d96 | 1209 | Posição X? | ⚠️ |
| d100 | 1455 | Posição X? | ⚠️ |
| d101-d105 | 112.5, 225, 508.5, 792, 1075.5 | Posições X base slots? | ⚠️ |
| d108 | 559.2 | = X_Fix1p − 100? | ⚠️ |
| d1 | 160 | Órfão ou antigo | ❓ |
| d5 | 80 | Perfil base Z | ⚠️ |

---

## PRÓXIMA SESSÃO — CONTINUAR AQUI

### Camada 2 (longarinas) — por completar:
- [ ] Confirmar d1=160 (que controla?)
- [ ] Confirmar d97=1801 (é comprimento total ou comprimento + espessura?)
- [ ] Mapear posições X das travessas (d89-d93, d101-d105)
- [ ] Abrir longarina Rear (Xneg) e comparar

### Camada 3 (degrau traseiro):
- [ ] Identificar peça no browser
- [ ] Exportar XML parâmetros
- [ ] Mapear dN

### Para cada peça nova — procedimento:
1. Duplo-clique no browser para abrir
2. Exportar parâmetros XML
3. Clicar nas cotas sketch a sketch
4. Registar neste documento
5. Ligar ao código CSN

---

## REGISTO DE SESSÕES

| Sessão | Data | O que foi feito |
|--------|------|-----------------|
| S1 | 11-12 Abr 2026 | RAG Inventor (7419 docs), endpoint /api/inventor/query |
| S1 | 12-13 Abr 2026 | Veículo teste Renault Master, fixações, 80 variáveis, princípios |
| S1 | 13-15 Abr 2026 | Mapeamento Camadas 1-2, convenção nomes, códigos CSN |
| S2 | próxima | Continuar Camadas 3-11, tabelas Supabase, motor cálculo |

---

CSN · Variáveis Paramétricas do Modelo · v1.1 · 15 Abril 2026
