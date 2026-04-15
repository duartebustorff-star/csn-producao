# CSN — Manual de Montagem Paramétrica
## Instruções para o modelador · Caixa Aberta
## Veículo: Renault Master XDD L3H1 3.5t

---

## TABELA MESTRE — PARÂMETRO SUPABASE → PEÇAS QUE UTILIZAM

Esta tabela é preenchida à medida que mapeamos cada peça. Mostra de onde vem cada valor e quem o consome.

| Código Supabase | Valor (Enc.1) | Base Universal | Longarina Ext Xpos | Longarina Ext Xneg | Longarina Int Xpos | Longarina Int Xneg | Travessa | Perfil Lateral | Tubo Topo | Chapa Piso | Taipal |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **V_Centro_Long** | 928 | posição Y assembly | centro slots | centro slots | centro slots | centro slots | posição Y | — | — | — | — |
| **V_Dist_Furos** | 131 | d39, d40 (÷2=65.5) | — | — | — | — | — | — | — | — | — |
| **V_Dim_Furo** | 12.2 | d41 | — | — | — | — | — | — | — | — | — |
| **D_Dente_Long** | 10 | d34 (slot larg.) | d12,d14,d16,d18,d88 | ? | ? | ? | — | — | — | — | — |
| **D_Folga_Rasgo** | 0.1 | d34 (+0.2) | slots 2.2 | ? | ? | ? | ? | — | — | — | — |
| **P_Esp_Chapa_Ext** | 2 | — | Thickness | Thickness | — | — | — | — | — | — | — |
| **P_Esp_Chapa_Int** | 2 | — | — | — | Thickness | Thickness | — | — | — | — | — |
| **P_Perfil_Base_Z** | 80 | d23 (÷2=40) | d77 (=40), d81 (=80) | ? | ? | ? | — | — | — | — | — |
| **P_Alt_Trav** | 60 | — | slots topo (28=prof.) | ? | ? | ? | altura perfil | — | — | — | — |
| **P_Esp_Trav** | 30 | — | slots topo (larg.) | ? | ? | ? | espessura X | — | — | — | — |
| **C_X_pos** | 1799 | — | d97 (≈1801?) | — | — | — | — | — | — | — | — |
| **C_X_neg** | 1401 | — | — | comprimento | — | comprimento | — | — | — | — | — |
| **C_Alt_Long** | 198 | — | altura | altura | altura | altura | — | — | — | — | — |
| **X_Fix1p** | +659.2 | posição X | slot base | — | slot base | — | — | — | — | — | — |
| **X_Fix2p** | +1074.2 | posição X | d109 (slot base) | — | slot base | — | — | — | — | — | — |
| **X_Fix3p** | +1694.2 | posição X | d110 (slot base) | — | slot base | — | — | — | — | — | — |
| **X_Fix4p** | +1764.2 | posição X | — | — | — | — | — | — | — | — | — |
| **X_Fix1n** | −152.8 | posição X | d112 (slot base) | slot base | d112 | slot base | — | — | — | — | — |
| **X_Fix2n** | −985.8 | posição X | d113 (slot base) | slot base | d113 | slot base | — | — | — | — | — |
| **E_Comp** | 3200 | — | — | — | — | — | — | — | — | comp. | — |
| **E_Larg** | 2100 | — | — | — | — | — | comprimento Y | — | — | largura | largura |
| **E_H_taipal** | 450 | — | — | — | — | — | — | — | — | — | altura |

**Legenda:**
- Célula preenchida = peça usa este parâmetro
- `dNN` = parâmetro confirmado no modelo actual
- `?` = por confirmar na próxima sessão
- `—` = peça não usa este parâmetro

**Regra:** cada valor nesta tabela é um número final calculado pelo Supabase. O iLogic só substitui.

---

## ANTES DE COMEÇAR

**Origem do assembly (0,0,0):**
- X = 0 → centro do eixo traseiro
- Y = 0 → plano de simetria do veículo
- Z = 0 → base de apoio no chassi (topo da longarina do veículo)
- X positivo → frente (cabina)
- X negativo → traseira
- Y positivo → lado direito
- Y negativo → lado esquerdo
- Z positivo → para cima

**Regra de orientação:** cada peça é desenhada na orientação final. No assembly só se move em X, Y, Z — nunca se roda.

---

## CAMADA 1 — BASES UNIVERSAIS

### Peça: CSN_PAR_Base_Universal.ipt

**O que é:** perfil que assenta nas longarinas do chassi do veículo. Faz a ligação chassi → carroçaria. Tem 2 furos de fixação e 1 slot onde entra o dente da longarina da carroçaria.

**Orientação:** comprimento em Y (transversal), altura em Z (vertical).

---

### PASSO 1 — Criar a peça

Abrir novo .ipt. Guardar como `CSN_PAR_Base_Universal.ipt`.

---

### PASSO 2 — Criar User Parameters

No `fx` (Parâmetros), criar estes parâmetros numéricos:

| Nome | Valor | Unidade | O que é |
|------|-------|---------|---------|
| Perfil_Z | 80 | mm | Altura total do perfil |
| Perfil_Y | 82.6 | mm | Largura da base |
| Perfil_Esp | 4 | mm | Espessura do perfil |
| Slot_Prof_Z | 40 | mm | Profundidade slot intercepção (= Perfil_Z / 2) |
| Slot_Larg | 10.2 | mm | Largura slot longarina (= Dente 10 + Folga 0.1×2) |
| Furo_Offset | 65.5 | mm | Centro → furo (= Dist_Furos 131 / 2) |
| Furo_Dim | 12.2 | mm | Diâmetro do furo |

---

### PASSO 3 — Esboço principal (Esboço1 — Plano XZ)

**Origem da peça (0,0,0):** centro da base, a meia largura em Y, na base inferior Z=0.

```
    Y=0 (centro)
      │
      ▼
    └──┘  └──────────────────────┘  └──┘  ← Z = Perfil_Z (80)
    │  │                          │  │
    │  │     SLOT (aberta)        │  │    ← slot desde Z=80 desce até Z=40
    │  │                          │  │
    │  └──┐                  ┌────┘  │    ← Z = Slot_Prof_Z (40)
    │     │                  │       │
    │     │  PERFIL SÓLIDO   │       │
    │     │                  │       │
    └─────┘──────────────────└───────┘    ← Z = 0 (apoio no chassi)

    ←──────── Perfil_Y (82.6) ──────────→
```

A longarina desce por cima e o dente encaixa na slot. Intercepção em cruz: base cortada por cima (40mm), longarina cortada por baixo (40mm).

**Mapeamento dN → User Parameters:**

| dN no modelo | Valor actual | User Parameter | O que controla |
|---|---|---|---|
| d23 | 40 mm | `Slot_Prof_Z` | Profundidade da slot (Perfil_Z / 2) |
| d33 | 82.6 mm | `Perfil_Y` | Largura total da base |
| d34 | 10.2 mm | `Slot_Larg` | Largura slot longarina (Dente + Folga×2) |
| d39 | 65.5 mm | `Furo_Offset` | Centro ao furo esquerdo (Dist_Furos / 2) |
| d40 | 65.5 mm | `Furo_Offset` | Centro ao furo direito (Dist_Furos / 2) |
| d41 | 12.2 mm | `Furo_Dim` | Diâmetro do furo de fixação |

**No `fx`, ligar cada dN ao User Parameter:**
- Equação de d23 → `Slot_Prof_Z`
- Equação de d33 → `Perfil_Y`
- Equação de d34 → `Slot_Larg`
- Equação de d39 → `Furo_Offset`
- Equação de d40 → `Furo_Offset`
- Equação de d41 → `Furo_Dim`

Assim, quando o Supabase enviar novos valores, basta alterar os User Parameters — os dN actualizam automaticamente.

---

### PASSO 4 — Extrusão do perfil

Extrudir o Esboço1 em X com a espessura do perfil:
- Distância = `Perfil_Esp` (4 mm)
- Direcção: simétrica (2 mm para cada lado de X=0)

---

### PASSO 5 — Furos de fixação (Esboço2 — face superior)

Na face de topo da base (Z = Perfil_Z), criar esboço:

```
    ○                              ○
    Furo 1                    Furo 2

    ←── Furo_Offset ──→ Y=0 ←── Furo_Offset ──→
         (65.5)                    (65.5)
```

**Cotas:**
- Furo 1: Y = −Furo_Offset (−65.5 desde Y=0)
- Furo 2: Y = +Furo_Offset (+65.5 desde Y=0)
- Diâmetro = `Furo_Dim` (12.2)

Fazer furo passante (Through All).

---

### PASSO 6 — Posicionamento no assembly

Cada base é colocada no assembly com 3 constraints de posição:

| Base | X (mm) | Y (mm) | Z | Tipo fixação |
|------|--------|--------|---|-------------|
| Fix_1p_dir | +659.2 | +464 | 0 | rígida |
| Fix_1p_esq | +659.2 | −464 | 0 | rígida |
| Fix_2p_dir | +1074.2 | +464 | 0 | rígida |
| Fix_2p_esq | +1074.2 | −464 | 0 | rígida |
| Fix_3p_dir | +1694.2 | +464 | 0 | rígida |
| Fix_3p_esq | +1694.2 | −464 | 0 | rígida |
| Fix_4p_dir | +1764.2 | +464 | 0 | **flexível** |
| Fix_4p_esq | +1764.2 | −464 | 0 | **flexível** |
| Fix_1n_dir | −152.8 | +464 | 0 | rígida |
| Fix_1n_esq | −152.8 | −464 | 0 | rígida |
| Fix_2n_dir | −985.8 | +464 | 0 | rígida |
| Fix_2n_esq | −985.8 | −464 | 0 | rígida |

**Total: 12 bases** (6 posições × 2 longarinas).

**Como posicionar:**
1. Inserir `CSN_PAR_Base_Universal.ipt` no assembly
2. Constraint Mate: Plano XY da base → Plano XY do assembly (Z=0)
3. Constraint Mate: Plano XZ da base → Work Plane a Y=+464 (ou −464)
4. Constraint Mate: Plano YZ da base → Work Plane a X=+659.2 (ou outra posição)

Repetir para as 12 posições.

---

### PASSO 7 — Verificação

Após posicionar as 12 bases, verificar:
- [ ] Todas as bases estão a Z=0
- [ ] As bases direitas estão a Y=+464, as esquerdas a Y=−464
- [ ] Os furos estão a 65.5 mm do centro (131 mm entre si)
- [ ] A slot da longarina está centrada em Y=0 da base
- [ ] Fix_4p é a mais próxima da cabina (X=+1764.2)
- [ ] Fix_2n é a mais afastada na traseira (X=−985.8)

---

### RESUMO VISUAL — Base vista de topo (XY)

```
        CABINA ←                                    → TRASEIRA
                                    X=0
                                     │
  Fix_4p  Fix_3p        Fix_2p       │  Fix_1p          Fix_1n        Fix_2n
  +1764   +1694         +1074        │  +659            −153          −986
    ■       ■             ■          │    ■               ■             ■    Y=+464
────────────────────────────────────────────────────────────────────────────
                                     │                                       Y=0
────────────────────────────────────────────────────────────────────────────
    ■       ■             ■          │    ■               ■             ■    Y=−464
  +1764   +1694         +1074        │  +659            −153          −986
```

---

### DADOS — Fonte dos valores

| Parâmetro | Valor | Fonte |
|-----------|-------|-------|
| Posições X | ver tabela acima | Plano 2DX0 FN9 2RR (Renault CATIA V5) |
| Y = ±464 | V_Centro_Long / 2 = 928 / 2 | Plano 2DX0 FN9 2RR |
| Dist_Furos = 131 | BBG 5.04.2 | BBG Renault Master |
| Furo = 12.2 | Medição no modelo | A confirmar com BBG |
| Dente longarina = 10 | Default CSN | D_Dente_Long |
| Folga = 0.1 por lado | Default CSN | D_Folga_Rasgo |
| Fix_4 = flexível | BBG 5.04.3.2 | Anilhas Belleville M12×150 |

---

## PRÓXIMA CAMADA — LONGARINAS (em preparação)

A camada 2 (longarinas) será adicionada após completar e validar a Camada 1.

---

CSN · Manual de Montagem Paramétrica · Caixa Aberta · v1.1 · 15 Abril 2026
