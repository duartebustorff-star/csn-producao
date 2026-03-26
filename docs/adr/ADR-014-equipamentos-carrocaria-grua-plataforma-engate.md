# ADR-014 — Equipamentos de Carroçaria + Plataformas de Carga + Engate de Reboque

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

Antes de falar de carroçarias, o CSN Brain precisa de gerir os equipamentos que se montam no veículo. Cada equipamento tem peso próprio, norma específica, impacto no cálculo de pesos e centro de gravidade, e restrições do fabricante do chassi. Sem este núcleo, qualquer carroçaria é uma estimativa. Com este núcleo, é engenharia.

---

## Distinção Fundamental

### Equipamentos
Alteram estruturalmente o veículo. Têm norma de produto própria. Impacto directo no cálculo de pesos, CoG e distribuição por eixo. Requerem documentação específica.

### Acessórios
Não alteram o cálculo estrutural. Sem norma de produto própria (excepto EN 12640 para pontos de amarração que são da carroçaria).

---

## EQUIPAMENTOS — Catálogo e Normas

### 1 — Grua de Coluna (Knuckle Boom Crane)
**Norma:** EN 12999:2020 — Gruas de carga para veículos rodoviários
**Fabricantes referência:** Hiab, Fassi, Palfinger, PM, Effer, Amco Veba
**O que impacta:**
- Peso próprio → reduz peso útil disponível
- Momento de tombamento → limita CoG drasticamente
- Posição no chassis → afecta distribuição por eixo
- Reforço do chassis → pode ser obrigatório pelo fabricante
- PTO (tomada de força) → pode ser necessária
- Estabilizadores → dimensões adicionais quando abertos
- Alcance máximo × carga máxima → curva de carga da grua

**Documentação obrigatória por instalação:**
- Certificado CE da grua (EN 12999)
- Cálculo de estabilidade com grua na posição mais desfavorável
- Verificação limites de eixo com grua em posição de transporte
- Instruções de utilização e carga máxima visíveis

**Campos na tabela:**
```
tipo_grua, marca, modelo, capacidade_max_kg, alcance_max_m
peso_proprio_kg, momento_tombamento, posicao_montagem
dimensoes_estabilizadores, requer_pto, certificado_en12999
```

---

### 2 — Plataforma de Carga Traseira (Tail Lift)
**Norma:** EN 1756-1:2001+A1:2008 — Plataformas elevatórias traseiras para veículos rodoviários
**Norma complementar:** EN 1756-2 — Plataformas laterais
**Fabricantes referência:** Zepro, Anteo, Dhollandia, Palfinger, Dautel
**O que impacta:**
- Peso próprio → tipicamente 200-600 kg
- Posição traseira → impacto significativo no eixo traseiro e CoG
- Comprimento extra quando aberta → verificar legislação dimensões
- Plataforma dobrada → comprimento total do veículo
- Capacidade nominal: 500kg / 750kg / 1000kg / 1500kg / 2000kg

**Documentação obrigatória:**
- Certificado CE da plataforma (EN 1756-1)
- Capacidade nominal visível na plataforma
- Verificação peso eixo traseiro com plataforma em posição de transporte
- Manual de operação

**Campos na tabela:**
```
tipo_plataforma, marca, modelo, capacidade_kg
peso_proprio_kg, comprimento_plataforma, largura_plataforma
posicao → traseira / lateral, certificado_en1756
```

---

### 3 — Engate de Reboque / Conjunto de Engate
**Normas:**
- **UNECE Regulamento n.º 55** — Engates mecânicos de conjuntos de veículos
- **ISO 11092:1994** — Engates para veículos a motor
- **EN ISO 2416** — Massas — definições e parâmetros

**Componentes do conjunto:**
- Estrutura de suporte ao chassis (reforço) — fixada ao chassis pelo carroçador
- Bola de reboque (50mm standard) ou placa de engate
- Tomada eléctrica 7 ou 13 pinos

**O que limita:**
- PBR — Peso Bruto Rebocável — inscrito no livrete pelo fabricante do chassi (absoluto)
- D-value — força horizontal máxima no engate
- S-value — carga vertical estática máxima no ponto de engate (tipicamente 50-100 kg)
- Comprimento total veículo + reboque — DL 132/2017

---

## Fórmulas de Cálculo — Engate de Reboque

### D-value (força de engate horizontal máxima)
```
D = (g × T × R) / (T + R)

Onde:
g = 9.81 m/s²
T = massa máxima tecnicamente admissível do veículo tractor (kg)
R = massa máxima tecnicamente admissível do reboque (kg)

Fonte: UNECE Regulamento n.º 55
```

### S-value (carga vertical estática no engate)
```
S = massa estática no ponto de engate (kg)
Máximo típico: 50 kg (veículos ligeiros) / 100 kg (veículos pesados)
Verificar sempre no livrete do chassi
```

### Verificação distribuição por eixo com reboque
```
Carga_eixo_traseiro_com_reboque = 
  Carga_eixo_traseiro_sem_reboque + S_value

Verificar: ≤ Carga_max_eixo_traseiro (DL 132/2017)
```

### Cálculo da massa do reboque admissível
```
Massa_reboque_max = PBR inscrito no livrete
Verificar: D-value calculado ≤ D-value do engate certificado
```

---

## Impacto de Cada Equipamento no Cálculo Global

```
Configuração base
  PBV - Tara - Tripulação = Peso_util_total
                              ↓
  - Peso_grua            = Peso_util_apos_grua
  - Peso_plataforma      = Peso_util_apos_plataforma
  - Peso_engate          = Peso_util_final_carrocaria
                              ↓
  Peso disponível para carroçaria + carga
```

**CoG com equipamentos:**
```
CoG_total = Σ(Peso_i × CoG_i) / Peso_total

Verificar: CoG_total ≤ CoG_max_fabricante
```

---

## Restrições do Fabricante do Chassi por Equipamento

Cada mounting directive define:
- Zonas permitidas para montagem da grua
- Reforços obrigatórios do chassis para engate
- PTO disponível — localização e potência máxima
- Carga máxima admissível no ponto de engate
- Impacto nos sistemas GSR (AEB, câmaras) com equipamentos montados

**Campos adicionais na tabela `marcas_veiculo`:**
```
pto_disponivel → sim/não
pto_localizacao
pto_potencia_max_kw
zonas_montagem_grua (JSON)
reforcos_obrigatorios_engate (JSON)
carga_max_ponto_engate_kg
d_value_max
s_value_max
```

---

## Normas dos Equipamentos para RAG

```
knowledge-base/tecnico/normas/equipamentos/
  EN_12999_2020_Gruas_Carga_Veiculos.pdf
  EN_1756-1_2001_Plataformas_Elevatórias_Traseiras.pdf
  EN_1756-2_Plataformas_Laterais.pdf
  UNECE_R55_Engates_Mecanicos.pdf
  ISO_11092_Engates_Veiculos.pdf
```

---

## OT para o Cowork — Scraping por Marca de Equipamento

### Gruas de Coluna:
```
OT-2026-013-scraping-gruas-coluna
Marcas: Hiab, Fassi, Palfinger, PM, Effer, Amco Veba
O que extrair por modelo:
  - Curva de carga (capacidade × alcance)
  - Peso próprio
  - Dimensões estabilizadores
  - Dimensões em posição de transporte
  - Requisitos de PTO
  - Certificação EN 12999
Pasta destino: Marcas - Veiculos/Equipamentos/Gruas/
```

### Plataformas de Carga Traseira:
```
OT-2026-014-scraping-plataformas-carga
Marcas: Zepro, Anteo, Dhollandia, Palfinger, Dautel
O que extrair por modelo:
  - Capacidade nominal (kg)
  - Peso próprio
  - Dimensões plataforma
  - Comprimento em posição dobrada
  - Certificação EN 1756-1
Pasta destino: Marcas - Veiculos/Equipamentos/Plataformas/
```

### Engates de Reboque:
```
OT-2026-015-scraping-engates-reboque
Marcas: Westfalia, Brink, Bosal, Thule, Oris
O que extrair por modelo:
  - D-value certificado
  - S-value máximo
  - Peso do conjunto
  - Compatibilidade por marca/modelo de chassi
  - Certificação UNECE R55
Pasta destino: Marcas - Veiculos/Equipamentos/Engates/
```

---

## Tabela Supabase — `equipamentos_carrocaria`

```sql
CREATE TABLE equipamentos_carrocaria (
  id uuid PRIMARY KEY,
  nome text NOT NULL,
  categoria text NOT NULL, -- grua_coluna / plataforma_carga / engate_reboque
  marca text,
  modelo text,
  norma_principal text,       -- EN 12999 / EN 1756-1 / UNECE R55
  capacidade_kg numeric,
  peso_proprio_kg numeric,
  dimensoes_transporte jsonb, -- comprimento, largura, altura em transporte
  dimensoes_operacao jsonb,   -- com estabilizadores abertos, plataforma aberta
  impacto_cog numeric,        -- deslocamento CoG estimado
  impacto_eixo_traseiro numeric,
  requer_pto boolean DEFAULT false,
  certificado_norma text,
  restricoes_chassi jsonb,    -- por marca de chassi
  documentos_obrigatorios text[],
  estado text DEFAULT 'disponivel',
  notas text,
  created_at timestamptz DEFAULT now()
);
```

---

## O Núcleo do CSN Brain

```
CAMADA 1 — LEGISLAÇÃO
  Pesos, dimensões, eixos, CoG, ângulos → ADR-013

CAMADA 2 — CHASSI
  Dados técnicos por marca/modelo → tabela marcas_veiculo

CAMADA 3 — EQUIPAMENTOS
  Grua, plataforma, engate → tabela equipamentos_carrocaria
  Fórmulas: D-value, S-value, peso útil residual

CAMADA 4 — CARROÇARIA
  (ainda por definir — mas já com envelope claro)

CAMADA 5 — ACESSÓRIOS
  Sem impacto no cálculo estrutural
```

**Ainda não falámos de carroçarias — e já temos o sistema mais completo do mercado.**

---

## Consequências

- Migration 019: criar tabela `equipamentos_carrocaria`
- 3 OTs para o Cowork: gruas, plataformas, engates
- Campos adicionais na tabela `marcas_veiculo` para PTO e engate
- O CSN Brain calcula o peso útil residual para carroçaria após subtrair todos os equipamentos
- A documentação gerada cita as normas de cada equipamento instalado
