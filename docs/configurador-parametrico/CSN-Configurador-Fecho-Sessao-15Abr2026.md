# CSN — Configurador Paramétrico · Fecho de Sessão
## 11–15 Abril 2026 (4 dias)

---

## RESUMO EXECUTIVO

Projecto mais importante da CSN. Objectivo: matrícula entra → sistema calcula tudo → Inventor gera modelo → BOM → orçamento → produção. Zero desenho manual.

Nesta sessão: RAG Inventor operacional, primeiro veículo mapeado, primeiras peças analisadas, arquitectura paramétrica definida.

---

## O QUE FOI FEITO

### 1. RAG Inventor (CONCLUÍDO)
- Tabela `knowledge_inventor` — migration 038 no Supabase ERP
- **7419 docs** Inventor 2026 com embeddings Voyage AI (voyage-3, 1024 dims)
- Endpoint `/api/inventor/query` em produção (csn-producao.vercel.app)
- RPC `match_inventor_docs` operacional
- Chat standalone `agent-inventor.html` funcional
- Custo ingestão: ~$0.90
- Commits: `9e231f9`, `f64ee17`

### 2. Veículo de teste — Renault Master XDD L3H1 3.5t
- **WB = 4216 mm** (fonte: Plano 2DX0 FN9 2RR, CATIA V5, 15/11/2022, Cristina RASOAGA)
- BBG Cap. 5.04 (25pp) no RAG do Supabase Storage
- 12 fixações registadas na tabela `fixacoes_chassis` (nova):
  - Fix_1p a Fix_4p (X positivo) + Fix_1n, Fix_2n (X negativo)
  - Fix_4 = flexível (anilhas Belleville, BBG 5.04.3.2)
  - Fonte: Plano 2DX0 FN9 2RR, cotas convertidas de Axe Roue AV

### 3. Três encomendas de teste definidas
- Encomenda 1: 3200 × 2100 × 450 ✅ range 2979–3907
- Encomenda 2: 3050 × 2000 × 450 ✅
- Encomenda 3: 3600 × 2100 × 450 ✅
- Cálculo completo dos 21 parâmetros derivados feito para Encomenda 1

### 4. Mapeamento Inventor — Camada 1 (Bases) PARCIAL
- Peça: `Universal_chassis_mounting_bodywork_80x4.ipt`
- d23=40 (slot Z), d33=82.6 (largura), d34=10.2 (slot longarina)
- d39=d40=65.5 (Dist_Furos/2), d41=12.2 (furo)

### 5. Mapeamento Inventor — Camada 2 (Longarinas) PARCIAL
- Peça: `Fiat L3 CCD_01_0101_01 - Chapa_Longarina_t=3mm_Rev07-Front-2.ipt`
- Thickness = 2mm (nome ficheiro diz 3mm — ERRADO)
- d109=1074.2, d110=1694.2, d112=152.8, d113=985.8 (posições fixações ✅)
- d97=1801 (comprimento ≈ X_pos)
- d77=40 (slot base), 14× slots=2.2mm, 6× prof=28mm, 5× dentes=10mm
- d1=160 (não é altura — órfão ou antigo, a confirmar)

### 6. Arquitectura e princípios definidos
- **Parâmetro partilhado, nunca herdado** — peças referenciam a fonte, não outras peças
- **Supabase calcula, iLogic substitui** — iLogic nunca faz contas, recebe JSON com números finais
- **Peça na orientação final** — no assembly só translação, nunca rotação
- **Hierarquia de fontes** — Desenho técnico > BBG > JPM
- **Dois tipos de peças** — PAR (geometria muda) vs STD (geometria fixa)
- **Convenção de nomes** — prefixos V_, F_, D_, E_, P_, C_, X_ + ficheiros CSN_PAR_/CSN_STD_/CSN_ASM_

### 7. 80 variáveis iLogic mapeadas com códigos CSN
- G1 Veículo (V_): 19+3 vars
- G2 FAM (F_): 8 vars
- G3 Defaults CSN (D_): 10 vars (incluindo D_Dente_Long=10, novo)
- G4 Encomenda (E_): 10 vars
- G5 Perfis (P_): 13 vars (P_Esp_Chapa_Ext=2, P_Esp_Chapa_Int=2 confirmado)
- G6 Calculados (C_): 21 vars

---

## O QUE FALTA

### Próxima sessão — continuar mapeamento modelo
- [ ] Resolver d1=160 na longarina (o que controla?)
- [ ] Mapear Camada 2 completa (longarinas) — dN → códigos CSN
- [ ] Camada 3: Degrau traseiro
- [ ] Camada 4: Travessas
- [ ] Camada 5: Tubos de topo
- [ ] Camada 6: Perfis laterais
- [ ] Camada 7: Chapa de piso
- [ ] Camada 8: Ganchos + luzes
- [ ] Camadas 9-11: Taipais (frontal, laterais, traseiro)

### Supabase — tabelas por criar
- [ ] `config_ilogic_defaults` (D_ vars — GAP, H_piso, etc.)
- [ ] `config_ilogic_perfis` (P_ vars — perfis e chapas)
- [ ] `fam` (F_ vars — dados legais por obra)
- [ ] Motor de cálculo `/api/engenharia/calcular` (21 fórmulas)

### Dados fabricantes — bloqueador para escalar
- [ ] Extrair BBG FUSO (244pp importado, não extraído)
- [ ] Processar BBG Stellantis, Isuzu, Ford, Mercedes, VW
- [ ] Só Renault tem 14 vars BBG completas (40/363 chassis)

### PropostaWizard — campos em falta
- [ ] H_taipal, tipo_cabine, cofre_atras_cabine, bola_reboque

---

## TABELAS SUPABASE CRIADAS/MODIFICADAS

| Tabela | Tipo | Registos |
|--------|------|----------|
| `knowledge_inventor` | Nova (migration 038) | 7419 docs + embeddings |
| `fixacoes_chassis` | Nova | 12 (6 posições × 2 longarinas, Renault Master) |

---

## FICHEIROS CRIADOS

| Ficheiro | Descrição |
|----------|-----------|
| `scripts/ingest-inventor-docs.mjs` | Script ingestão Inventor → Supabase + Voyage |
| `src/app/api/inventor/query/route.ts` | Endpoint RAG Agent Inventor |
| `supabase/038_knowledge_inventor.sql` | Migration tabela + RPC |
| `agent-inventor.html` | Chat standalone |
| `CSN-Configurador-Parametrico-Registo-Completo.md` | Documento único v2.0 |
| `CSN-Convencao-Nomes-Inventor.md` | Convenção nomes v1.2 |

---

## ESTRATÉGIA MAPEAMENTO — 11 CAMADAS

| # | Camada | Estado |
|---|--------|--------|
| 1 | Bases de apoio (Z=0) | 🔄 Parcial — dN mapeados, fixações registadas |
| 2 | Longarinas (Z=0→198) | 🔄 Parcial — XML lido, fixações confirmadas |
| 3 | Degrau traseiro | ⏳ |
| 4 | Travessas | ⏳ |
| 5 | Tubos de topo | ⏳ |
| 6 | Perfis laterais | ⏳ |
| 7 | Chapa de piso | ⏳ |
| 8 | Ganchos + luzes | ⏳ |
| 9 | Taipal frontal | ⏳ |
| 10 | Taipais laterais | ⏳ |
| 11 | Taipal traseiro | ⏳ |

---

## VISÃO — TRÊS FASES

```
Fase 1 (AGORA):  Humano mapeia modelo → Supabase calcula → iLogic substitui
Fase 2 (BREVE):  Agente lê regras CSN → gera iLogic automaticamente
Fase 3 (FUTURO): Agente liga à API Inventor → cria geometria directamente
```

Fase 1 constrói o conhecimento que as Fases 2 e 3 consomem.

---

## CONTEXTO PARA O PRÓXIMO CHAT

Para continuar, o próximo chat precisa destes ficheiros:
1. `CSN-Configurador-Parametrico-Registo-Completo.md` — documento único com tudo
2. `CSN-Convencao-Nomes-Inventor.md` — convenção de nomes
3. `VARIAVEIS-ILOGIC-78-ESTADO.md` — estado das 80 variáveis
4. XMLs de parâmetros das peças do Inventor (exportar à medida que mapeia)

O chat anterior ao Inventor (plano 2DX0 FN9 2RR) tem os PDFs do chassis Renault Master.

---

CSN · Configurador Paramétrico · Fecho Sessão · 15 Abril 2026
