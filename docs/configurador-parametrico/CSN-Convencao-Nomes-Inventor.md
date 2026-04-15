# CSN — Convenção de Nomes · Parâmetros e Peças
## Inventor iLogic · v1.0 · 14 Abril 2026

---

## 1. REGRAS BASE

- Sem espaços — usar underscore `_`
- Sem caracteres especiais (ç, ã, é, etc.) — usar ASCII puro
- Case sensitive — manter consistência (CamelCase nos nomes, MAIÚSCULAS nos prefixos quando necessário)
- Nomes descritivos — quem abrir o `fx` percebe sem documentação
- User Parameters sempre — nunca renomear Model Parameters (d0, d1, etc.)

---

## 2. PREFIXOS DE PARÂMETROS — POR GRUPO

| Prefixo | Grupo | Fonte | Quem altera | Exemplos |
|---------|-------|-------|-------------|----------|
| `V_` | Veículo (fabricante) | BBG / Desenho técnico | Nunca (muda com o chassi) | `V_WB`, `V_H_cab`, `V_OF`, `V_Centro_Long` |
| `F_` | FAM (legal) | Documento IMT | Nunca (vem por obra) | `F_Comp_max`, `F_PBT`, `F_Tara` |
| `D_` | Defaults CSN | Engenharia CSN | Raramente | `D_GAP`, `D_H_piso`, `D_Folga_Rasgo` |
| `E_` | Encomenda (cliente) | Comercial / PropostaWizard | Por encomenda | `E_Comp`, `E_Larg`, `E_H_taipal` |
| `P_` | Perfis engenharia | Engenharia CSN | Por tipo carroçaria | `P_Alt_Travessa`, `P_Esp_Chapa_Ext` |
| `C_` | Calculados | Motor de cálculo | Nunca (automático) | `C_X_pos`, `C_Comp_min`, `C_N_trav` |
| `X_` | Fixações (posições) | Desenho técnico chassi | Nunca (muda com o chassi) | `X_Fix1p`, `X_Fix2n` |

**No `fx` do Inventor, os parâmetros ficam agrupados por prefixo (ordem alfabética):**
```
C_Altura_total
C_Comp_max
C_Comp_min
C_X_neg
C_X_pos
D_Folga_Rasgo
D_GAP
D_H_piso
E_Comp
E_H_taipal
E_Larg
P_Alt_Travessa
P_Esp_Chapa_Ext
V_Centro_Long
V_H_cab
V_WB
X_Fix1n
X_Fix1p
```

---

## 3. TIPOS DE PEÇAS

### 3.1 Peças Paramétricas (tipo `PAR`)

Peças cuja geometria **muda** com os parâmetros da encomenda/veículo. Têm User Parameters, driven por iLogic. Mudam de obra para obra.

| Peça | O que muda |
|------|-----------|
| Longarinas (chapas verticais) | Comprimento (X_pos/X_neg), altura, espessura, slots |
| Travessas (tubos transversais) | Comprimento (Y), posição X, perfil |
| Perfis laterais | Comprimento (X), posição Y |
| Tubos de topo | Posição X (extremidades) |
| Chapa de piso | Comprimento × Largura |
| Taipais (frontal, laterais, traseiro) | Altura, comprimento, largura |
| Sobre-taipal frontal | Altura (calculada) |

**Regra de nome ficheiro:**
```
CSN_PAR_[componente]_[detalhe].ipt
```

**Exemplos:**
```
CSN_PAR_Longarina_Ext_Xpos.ipt
CSN_PAR_Longarina_Ext_Xneg.ipt
CSN_PAR_Longarina_Int_Xpos.ipt
CSN_PAR_Longarina_Int_Xneg.ipt
CSN_PAR_Travessa_Piso.ipt
CSN_PAR_Perfil_Lateral_Dir.ipt
CSN_PAR_Perfil_Lateral_Esq.ipt
CSN_PAR_Tubo_Topo_Frente.ipt
CSN_PAR_Tubo_Topo_Tras.ipt
CSN_PAR_Chapa_Piso.ipt
CSN_PAR_Taipal_Frontal.ipt
CSN_PAR_Taipal_Lateral_Dir.ipt
CSN_PAR_Taipal_Lateral_Esq.ipt
CSN_PAR_Taipal_Traseiro.ipt
CSN_PAR_Sobretaipal_Frontal.ipt
```

### 3.2 Peças Standard (tipo `STD`)

Peças cuja geometria **nunca muda**. São sempre iguais — só muda a quantidade e a posição no assembly. São suprimidas/activadas conforme a configuração.

| Peça | Quantidade variável? | Posição variável? |
|------|---------------------|-------------------|
| Base universal chassi-carroçaria | Sim (6–8 por longarina) | Sim (X das fixações) |
| Dobradiça taipal | Sim (2–4 por taipal) | Sim (espaçamento) |
| Base de dobradiça | Sim (acompanha dobradiça) | Sim |
| Gancho lateral | Sim (2–6 por lado) | Sim (espaçamento) |
| Olhal de amarração | Sim | Sim |
| Parafuso M12×150 | Sim (2 por base) | Com a base |
| Luz traseira | Fixo (2) | Fixa |
| Luz lateral | Sim (2–4) | Sim |
| Reflector | Sim | Sim |

**Regra de nome ficheiro:**
```
CSN_STD_[componente]_[especificação].ipt
```

**Exemplos:**
```
CSN_STD_Base_Universal_80x4.ipt
CSN_STD_Dobradica_Taipal.ipt
CSN_STD_Base_Dobradica.ipt
CSN_STD_Gancho_Lateral.ipt
CSN_STD_Olhal_Amarracao.ipt
CSN_STD_Parafuso_M12x150_10-9.ipt
CSN_STD_Luz_Traseira.ipt
CSN_STD_Luz_Lateral.ipt
CSN_STD_Reflector.ipt
```

---

## 4. NOMENCLATURA DE ASSEMBLIES

```
CSN_ASM_[tipo_carrocaria]_[secção].iam
```

**Exemplos:**
```
CSN_ASM_CaixaAberta_Main.iam           ← assembly principal
CSN_ASM_CaixaAberta_Piso.iam           ← sub-assembly piso
CSN_ASM_CaixaAberta_Longarina_Dir.iam  ← sub-assembly longarina direita
CSN_ASM_CaixaAberta_Taipais.iam        ← sub-assembly taipais
CSN_ASM_CaixaAberta_Acessorios.iam     ← sub-assembly ganchos/luzes
```

---

## 5. PARÂMETROS EM PEÇAS STD vs PAR

### Peça PAR — tem User Parameters
```
No fx:
  V_WB = 4216           (lido do Supabase)
  E_Comp = 3200         (lido do Supabase)
  C_X_pos = 1799        (calculado)
  P_Esp_Chapa_Ext = 3   (lido do Supabase)
  ...
  d0 = V_WB - ...       (Model Parameter driven pelo User Parameter)
  d1 = C_X_pos          (Model Parameter driven)
```

### Peça STD — sem User Parameters (ou mínimos)
```
No fx:
  d23 = 40              (fixo — metade de 80mm)
  d33 = 82.6            (fixo — largura base)
  d39 = 65.5            (ÚNICO parâmetro variável: Dist_Furos/2)
  d40 = 65.5            (idem)
  d41 = 12.2            (variável: diâmetro furo)
```

As peças STD têm poucos ou nenhuns User Parameters. A variação é controlada no **assembly** (posição, quantidade, suppress/unsuppress) — não dentro da peça.

---

## 6. RESUMO VISUAL

```
CSN_ASM_CaixaAberta_Main.iam
│
├── CSN_ASM_CaixaAberta_Piso.iam
│   ├── CSN_PAR_Longarina_Ext_Xpos.ipt      ← PAR (muda geometria)
│   ├── CSN_PAR_Longarina_Ext_Xneg.ipt      ← PAR
│   ├── CSN_PAR_Longarina_Int_Xpos.ipt       ← PAR
│   ├── CSN_PAR_Longarina_Int_Xneg.ipt       ← PAR
│   ├── CSN_PAR_Travessa_Piso.ipt ×8         ← PAR (instanciada N vezes)
│   ├── CSN_PAR_Perfil_Lateral_Dir.ipt       ← PAR
│   ├── CSN_PAR_Perfil_Lateral_Esq.ipt       ← PAR
│   ├── CSN_PAR_Tubo_Topo_Frente.ipt         ← PAR
│   ├── CSN_PAR_Tubo_Topo_Tras.ipt           ← PAR
│   ├── CSN_PAR_Chapa_Piso.ipt               ← PAR
│   └── CSN_STD_Base_Universal_80x4.ipt ×12  ← STD (posição variável)
│
├── CSN_ASM_CaixaAberta_Taipais.iam
│   ├── CSN_PAR_Taipal_Frontal.ipt           ← PAR
│   ├── CSN_PAR_Taipal_Lateral_Dir.ipt       ← PAR
│   ├── CSN_PAR_Taipal_Lateral_Esq.ipt       ← PAR
│   ├── CSN_PAR_Taipal_Traseiro.ipt          ← PAR
│   ├── CSN_PAR_Sobretaipal_Frontal.ipt      ← PAR
│   ├── CSN_STD_Dobradica_Taipal.ipt ×N      ← STD
│   └── CSN_STD_Base_Dobradica.ipt ×N        ← STD
│
└── CSN_ASM_CaixaAberta_Acessorios.iam
    ├── CSN_STD_Gancho_Lateral.ipt ×N         ← STD
    ├── CSN_STD_Luz_Traseira.ipt ×2           ← STD
    ├── CSN_STD_Luz_Lateral.ipt ×N            ← STD
    └── CSN_STD_Reflector.ipt ×N              ← STD
```

---

## 7. ORIENTAÇÃO DAS PEÇAS — PRINCÍPIO DE MODELAÇÃO

### Cada peça é desenhada na orientação final. No assembly, só se move — nunca se roda.

O origin da peça (0,0,0) é colocado na posição correcta (X, Y, Z) no assembly. Sem constraints de rotação. Só translação.

| Peça | Comprimento em | Largura/Espessura em | Altura em |
|------|---------------|---------------------|-----------|
| Base universal | **Y** (transversal) | X (longitudinal) | Z (vertical) |
| Longarina | **X** (longitudinal) | Y (espessura) | Z (altura) |
| Travessa | **Y** (transversal) | X (espessura) | Z (altura) |
| Perfil lateral | **X** (longitudinal) | Y (largura) | Z (altura) |
| Tubo de topo | **Y** (transversal) | X (largura) | Z (altura) |
| Chapa piso | **X** (longitudinal) | Y (transversal) | Z (espessura) |
| Taipal frontal | **Y** (transversal) | X (espessura) | Z (altura) |
| Taipal lateral | **X** (longitudinal) | Y (espessura) | Z (altura) |
| Taipal traseiro | **Y** (transversal) | X (espessura) | Z (altura) |

**Fonte:** Guia de Modelação Paramétrica CSN §1 — Regra de orientação por peça.

**Consequência:** No assembly, posicionar = definir apenas (X, Y, Z) do origin. A peça já está na orientação certa.

---

CSN · Convenção de Nomes · v1.1 · 14 Abril 2026
