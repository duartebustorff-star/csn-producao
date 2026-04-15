# CSN — Configurador Paramétrico · Registo Completo
## Sessão 13–14 Abril 2026

---

## 1. RAG INVENTOR — CONCLUÍDO

| Item | Estado |
|------|--------|
| Tabela `knowledge_inventor` (migration 038) | ✅ |
| 7419 docs Inventor ingeridos | ✅ 7419/7419 |
| Embeddings Voyage AI (voyage-3, 1024 dims) | ✅ 7419/7419 |
| RPC `match_inventor_docs` | ✅ |
| Endpoint `/api/inventor/query` | ✅ Produção |
| Chat `agent-inventor.html` | ✅ |
| Custo ingestão Voyage | ~$0.90 |

---

## 2. VEÍCULO DE TESTE — Renault Master XDD L3H1 3.5t

### 2.1 Fonte dos dados

| Documento | Referência | Data | Responsável | Formato |
|-----------|-----------|------|-------------|---------|
| Plan de Definition CATIA V5 | **2DX0 FN9 2RR** | 15/11/2022 | Cristina RASOAGA | A0, 1:1 |
| Designação | UDD L3H1 ICE/EV CHASSIS CABINE | | | |
| Ficheiro | `fr-664329f539f34-UDE__chassis_cabine__L3_H1_COTATION.pdf` | | | |
| BBG Cap. 5.04 | Chassis-cabina ligação da carroçaria | 05/12/2024 | Renault SAS | 25 pp |
| BBG Storage | `email/MARIA-JOAO-CRUZ/L2026-001_ANEXO_2026-01-05_5.04._B_Chassis-cabina_liga__o_da_carro_aria.pdf` | | | 4.2MB |

### 2.2 Parâmetros do veículo (Grupo 1 — Fabricante)

| Parâmetro | Valor | Fonte |
|-----------|-------|-------|
| WB (entre-eixos) | **4216 mm** | Plano 2DX0 FN9 2RR (EMPATTEMENT) |
| A (eixo frontal → frente cabine) | 970 mm | JPM |
| C (eixo frontal → traseira cabine) | 2367 mm | JPM |
| B (overhang traseiro) | 1180 mm | JPM |
| H_cab (altura cabine) | 1560 mm | JPM |
| Centro_Long_chassi | 928 mm | Plano 2DX0 FN9 2RR (853.2 + 94.8 confirmado) |
| Largura_Long_chassi | 94.8 mm | Plano 2DX0 FN9 2RR |
| Dist_Furos_Fixacao | 131 mm | BBG 5.04.2 + Plano |
| Dimensao_Furo | 12.2 mm | Medição modelo Inventor (a confirmar BBG) |
| OF (overhang frontal) | 962 mm | Calculado: 6355 − 4213 − 1180 (BBG cap. 1.01) |
| D1_max (consola traseira max) | 50% × WB = 2108 mm | BBG |
| Comp_total_veiculo | 6355 mm | BBG cap. 1.01 (L3 TRS) |
| Parafuso fixação | M12×150, classe 10.9 | BBG 5.04.3.2 |
| Anilhas Belleville (fix. flexível) | 6× Ø12.3×34 esp. 1.5mm | BBG 5.04.3.2 |

### 2.3 Fixações do chassi — Posições (Camada 1)

**Origem:** X=0 no eixo traseiro, Y=0 no plano de simetria, Z=0 na base de apoio.
**Fonte:** Plano 2DX0 FN9 2RR, cotas convertidas de Axe Roue AV para X=0 no eixo traseiro (WB=4216).
**Tabela Supabase:** `fixacoes_chassis` — 12 registos.

| Fixação | X (mm) | Y (mm) | Z (mm) | Tipo | Cota original (desde Axe AV) |
|---------|--------|--------|--------|------|------------------------------|
| Fix_4_pos_dir | +1764.2 | +464 | 0 | **flexível** | — (Fix_3 + 70) |
| Fix_4_pos_esq | +1764.2 | −464 | 0 | **flexível** | — |
| Fix_3_pos_dir | +1694.2 | +464 | 0 | rígida | 2521.8 |
| Fix_3_pos_esq | +1694.2 | −464 | 0 | rígida | — |
| Fix_2_pos_dir | +1074.2 | +464 | 0 | rígida | 3141.8 |
| Fix_2_pos_esq | +1074.2 | −464 | 0 | rígida | — |
| Fix_1_pos_dir | +659.2 | +464 | 0 | rígida | 3556.8 |
| Fix_1_pos_esq | +659.2 | −464 | 0 | rígida | — |
| Fix_1_neg_dir | −152.8 | +464 | 0 | rígida | 4368.8 |
| Fix_1_neg_esq | −152.8 | −464 | 0 | rígida | — |
| Fix_2_neg_dir | −985.8 | +464 | 0 | rígida | 5201.8 |
| Fix_2_neg_esq | −985.8 | −464 | 0 | rígida | — |

**Nota:** Fix_4 (atrás da cabina) é montagem flexível com anilhas Belleville — BBG 5.04.3.1.2 e 5.04.3.2.

### 2.4 Cotas do desenho não mapeadas a fixações

| Cota desde Axe AV | X desde eixo traseiro | Hipótese |
|----|----|----|
| 1543.8 | +2672.2 | Referência cabina? |
| 1649.8 | +2566.2 | Referência cabina? |
| 1716.8 | +2499.2 | Referência cabina? |
| 2117.78 | +2098.2 | LIMITE CLOISON DOUBLE CABINE |
| 2565.4 | +1650.6 | Referência cabina? |
| 2657.8 | +1558.2 | Referência cabina? |
| 190.7 | — | Overhang chassis traseiro desde eixo AR |

---

## 3. MAPEAMENTO MODELO INVENTOR — Base Universal

**Peça:** `Universal_chassis_mounting_bodywork_80x4.ipt`
**Assembly:** `Main Assembly-version-4_1.iam`

| dN (Inventor) | Valor | Variável CSN | O que controla |
|---|---|---|---|
| d23 | 40 mm | — | Altura base (metade de 80mm) |
| d33 | 82.6 mm | — | Largura da base (Y) |
| d34 | 10.2 mm | Esp_Chapa + Folga×2 | Slot onde entra a longarina |
| d39 | 65.5 mm | Dist_Furos_Fixacao / 2 | Centro ao furo (esquerdo) |
| d40 | 65.5 mm | Dist_Furos_Fixacao / 2 | Centro ao furo (direito) |
| d41 | 12.2 mm | Dimensao_Furo | Diâmetro do furo de fixação |

---

## 4. TRÊS ENCOMENDAS DE TESTE

**Tipo:** Caixa Aberta Taipais de Madeira
**Veículo:** Renault Master XDD L3H1 3.5t

### 4.1 Range automático (calculado)

```
X_pos = WB − C − GAP = 4216 − 2367 − 50 = 1799 mm
Comp_min = X_pos + B = 1799 + 1180 = 2979 mm
Comp_max = X_pos + D1_max = 1799 + 2108 = 3907 mm
```

### 4.2 Encomendas

| # | Comp × Larg × Taipal | Estado | X_neg | N_travessas |
|---|---|---|---|---|
| 1 | 3200 × 2100 × 450 | ✅ Dentro do range | 1401 | 8 |
| 2 | 3050 × 2000 × 450 | ✅ Dentro do range | 1251 | 7 |
| 3 | 3600 × 2100 × 450 | ✅ Dentro do range | 1801 | 8 |

---

## 5. 80 VARIÁVEIS iLOGIC — ESTADO

| Grupo | Vars | Estado |
|-------|------|--------|
| 1. Fabricante (BBG) | 19 | ⚠️ Só Renault completo (40/363 chassis) |
| 2. FAM | 8 | ❌ Tabela não criada |
| 3. Defaults CSN | 9 | ❌ Não em DB |
| 4. Encomenda | 10 | ⏳ PropostaWizard parcial |
| 5. Engenharia CSN | 13 | ❌ Não em DB |
| 6. Calculados | 21 | ❌ Fórmulas definidas, não implementadas |

---

## 6. ESTRATÉGIA DE MAPEAMENTO MODELO

### Sequência Z negativo → Z positivo (11 camadas)

| # | Camada | Z | Estado |
|---|--------|---|--------|
| 1 | Bases de apoio | Z=0 | 🔄 Em progresso — fixações registadas |
| 2 | Longarinas (chapas verticais) | Z=0 → Altura_Long | ⏳ |
| 3 | Degrau traseiro | Z≈0 | ⏳ |
| 4 | Travessas | Z_base → Z_topo | ⏳ |
| 5 | Tubos de topo (extremidades) | Z≈topo longarina | ⏳ |
| 6 | Perfis laterais | Z_base_lateral → Z_topo_piso | ⏳ |
| 7 | Chapa de piso | Z=H_piso (topo) | ⏳ |
| 8 | Ganchos laterais + luzes | Z=lateral | ⏳ |
| 9 | Taipal frontal (sobretaipal) | Z=H_piso → H_cab+H_extra | ⏳ |
| 10 | Taipais laterais | Z=H_piso → H_piso+H_taipal | ⏳ |
| 11 | Taipal traseiro | Z=H_piso → H_piso+H_taipal | ⏳ |

---

## 7. COMMITS

| Hash | Descrição |
|------|-----------|
| `9e231f9` | feat: RAG knowledge_inventor — migration 038 + script ingestão Voyage |
| `f64ee17` | feat: /api/inventor/query — RAG query endpoint Agent Inventor |

---

## 8. HIERARQUIA DE FONTES

1. **Desenho técnico / Plano de Definition** (CATIA V5 do fabricante) — cotas exactas
2. **BBG (Body Builder Guidelines)** — regras de montagem, limites, tipos de fixação
3. **JPM (ficha comercial)** — dados gerais, arredondamentos

**Regra:** Desenho técnico > BBG > JPM. Em caso de conflito, prevalece a fonte superior.

**Nota WB:** O plano diz 4216, o JPM diz 4215, o BBG diz 4213. Usar **4216** (fonte: desenho técnico).

---

CSN · Configurador Paramétrico · v0.2 · 14 Abril 2026
