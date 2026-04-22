# CSN — Convenção de Nomes Inventor (v2)

**Versão:** 2
**Data:** 2026-04-22 (S54)
**Aplicável a:** todas as novas modelações Inventor CSN e remodelações de peças existentes

---

## 1. Sistema de coordenadas

| Eixo | Origem | Sentido positivo |
|---|---|---|
| X | Eixo traseiro do chassis | Direcção cabine |
| Y | Eixo longitudinal do chassis (centro) | Esquerda (ISO 8855) |
| Z | Face inferior das peças da carroçaria | Cima |

### Convenção abreviada para posições

- `Px` = lado +X (traseira)
- `Nx` = lado −X (frente)
- `Py` = lado +Y (esquerda)
- `Ny` = lado −Y (direita)

---

## 2. Nomenclatura de ficheiros (peças)

**Regra:** nomes de ficheiros **em inglês**, com prefixo `CSN_PAR_` para peças paramétricas, `CSN_` para peças fixas.

| Ficheiro | Conteúdo |
|---|---|
| `CSN_PAR_Bases.ipt` | 20 bases de fixação (12 em +X + 8 em −X) — peça paramétrica única |
| `CSN_PAR_Stringer_Front_Xp.ipt` | Longarina traseira lado +X (12 dentes) |
| `CSN_PAR_Stringer_Rear_Xn.ipt` | Longarina frontal lado −X (8 dentes) |
| `CSN_PAR_Crossbeams.ipt` | Travessas transversais |
| `CSN_Universal_Base_80x4.ipt` | Base universal de fixação (peça a reutilizar) |

---

## 3. User Parameters (peças paramétricas)

### Prefixos

- `SR_` = Stringer (longarinas)
- `BS_` = Base (bases de fixação)
- `CB_` = Crossbeam (travessas)

### Stringer — parâmetros globais

| Parâmetro | Unidade | Descrição |
|---|---|---|
| `SR_Length_Xp` | mm | Comprimento total da longarina no eixo X |
| `SR_Height` | mm | Altura da secção |
| `SR_Thickness` | mm | Espessura da chapa base |
| `SR_Tooth_Width` | mm | Largura do dente (partilhada por todos) |
| `SR_Tooth_Height` | mm | Altura do dente (partilhada por todos) |
| `SR_Tooth_Hole_Dist` | mm | Distância centro-centro dos furos no dente |
| `SR_Tooth_Hole_Diam` | mm | Diâmetro dos furos do dente |

### Stringer — posições de dentes

**Lado +X (12 dentes):**
- `SR_Tooth_1`, `SR_Tooth_2`, … `SR_Tooth_12` (mm, posição no eixo X)

**Lado −X (8 dentes):**
- `T_Xn_1`, `T_Xn_2`, … `T_Xn_8` (mm, posição no eixo X)

---

## 4. Valores de referência — Renault Master L3 (para teste)

| Parâmetro | Valor [mm] |
|---|---|
| `SR_Tooth_Width` | 80 |
| `SR_Tooth_Height` | 40 |
| `SR_Tooth_Hole_Dist` | 131 |
| `SR_Tooth_Hole_Diam` | 12.2 |
| `Tooth_Px_1` | 659.2 |
| `Tooth_Px_2` | 1074.2 |
| `Tooth_Px_3` | 1694.2 |
| `Tooth_Px_4` | 1764.2 |
| `Tooth_Nx_1` | 152.8 |
| `Tooth_Nx_2` | 985.8 |

Os restantes valores (`Tooth_Px_5..12` e `Tooth_Nx_3..8`) são específicos do Renault Master L3. Para outros chassis, a chamada de valores vem do `catalogo_chassis` via iLogic externa à peça.

---

## 5. Features — convenção de nomes

No browser do Inventor, renomear features para nomes descritivos:

| Nome de feature | Descrição |
|---|---|
| `Feat_SR_Tooth_N` | Dente N da longarina (1-12 no +X, 1-8 no −X) |
| `Feat_Rasgo_Xp_N` | Rasgo N entre dentes (lado +X) |
| `Feat_Hole_Tooth_N` | Furação do dente N |
| `Sketch_Master_Teeth_Px` | Sketch mestre com todos os centros dos dentes +X |
| `Sketch_Master_Teeth_Nx` | Sketch mestre lado −X |

---

## 6. Contagem oficial (longarina CSN)

- **Lado +X:** 12 dentes (6 em +Y + 6 em −Y)
- **Lado −X:** 8 dentes (4 em +Y + 4 em −Y)
- **Total bases:** 20 (peça `CSN_PAR_Bases.ipt`)

---

## 7. iProperties obrigatórias

Todas as peças CSN têm de ter preenchidas:

| Propriedade | Exemplo |
|---|---|
| `Material` | S235JR / S275JR / S355JR (aço estrutural) |
| `Part Number` | CSN-PAR-STR-FR-XP (código interno CSN) |
| `Description` | "Longarina frontal +X Renault Master L3" |
| `Author` | Nome do modelador |
| `Project` | "CSN Opus / {obra_id}" |

**Razão:** a rule `CSN_Export_Nesting_v2` lê o `Material` do iProperty. Sem este valor → fallback regex → fallback `MISSING`.

---

## 8. Estrutura de assembly

### Principles

1. **Uma peça por função.** Bases numa peça, longarinas noutra, travessas noutra.
2. **Instâncias, não duplicados.** 20 bases = 1 ficheiro `CSN_PAR_Bases.ipt` com 20 instâncias no assembly.
3. **Espelho sempre que possível.** Lado +Y é o "master"; lado −Y é espelho. Reduz parametrização por 2.
4. **Sub-assemblies por sistema.**
   - `CSN_ASM_Floor_{chassis}.iam`
   - `CSN_ASM_Walls_{chassis}.iam`
   - `CSN_ASM_Roof_{chassis}.iam`

---

## 9. Método recomendado para modelação de longarinas

**Opção 2 (escolhida em S54)** — sketch único com centros paramétricos:

1. Criar sketch na face superior da longarina.
2. Colocar 12 pontos/centros nesse sketch.
3. Ligar cada centro a `SR_Tooth_1`..`SR_Tooth_12` (posição X).
4. Largura/altura/furos do dente ficam em dimensões partilhadas (`SR_Tooth_Width`, etc.).
5. Feature `Extrude` única para criar os 12 dentes.
6. Rasgos criados com sketch separado referenciando os mesmos pontos.

**Vantagem:** alterar `SR_Tooth_3` move só esse dente. Alterar `SR_Tooth_Width` altera os 12 ao mesmo tempo.

---

## 10. Histórico de versões

| Versão | Data | Sessão | Alterações |
|---|---|---|---|
| v1 | 2026-04-18 | S52 | Primeira versão — convenção inicial para caixa aberta |
| **v2** | 2026-04-22 | S54 | Adicionadas longarinas paramétricas + sistema coordenadas Px/Nx/Py/Ny + User Parameters SR_ + contagem 12+8 dentes |
