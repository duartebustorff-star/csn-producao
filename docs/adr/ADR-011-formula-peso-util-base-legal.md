# ADR-011 — Fórmula de Peso Útil para Carroçaria + Base Legal Completa

**Data:** 21/03/2026
**Estado:** ✅ Aceite — fórmula confirmada
**Sessão:** 15

---

## Contexto

O CSN Brain precisa de calcular automaticamente o peso útil disponível para a carroçaria antes de qualquer dimensionamento. Este cálculo é a base de toda a engenharia — sem ele não se pode garantir conformidade legal. A maioria dos carroçadores faz este cálculo manualmente ou não o faz de todo.

---

## Princípio Fundamental

**Primeiro bloqueiam-se os limites legais. Só depois se dimensiona a carroçaria.**

Não se inventa. Não se estima. O CSN Brain calcula com base na Lei e nos dados do fabricante do chassi. Se a configuração proposta excede o envelope legal — o sistema bloqueia. Não adverte. Bloqueia.

---

## Base Legal — Diplomas a Guardar no RAG

### NÍVEL 1 — Portugal (transposição nacional)

**DL n.º 132/2017, de 11 de outubro**
Aprova o Regulamento que Fixa os Pesos e as Dimensões Máximos Autorizados para os Veículos em Circulação
- Transpõe: Diretiva (UE) 2015/719
- Publicado: DR n.º 196/2017, Série I
- URL: https://dre.pt/web/guest/pesquisa/-/search/108284890/details/normal
- URL alternativo: https://dre.tretas.org/dre/3115633/decreto-lei-132-2017-de-11-de-outubro
- **CRÍTICO — Alínea e):** Define Tara como peso do veículo em ordem de marcha com motorista 75kg + 90% combustível + 100% outros fluídos

**DL n.º 59/2023, de 21 de julho**
Altera o Regulamento que Fixa os Pesos e as Dimensões Máximos Autorizados para os Veículos em Circulação
- URL: https://dre.tretas.org/dre/5419164/decreto-lei-59-2023-de-21-de-julho

**DL n.º 99/2005, de 21 de junho** (versão anterior — referência histórica)
Regulamento anterior de Pesos e Dimensões — revogado pelo DL 132/2017

### NÍVEL 2 — União Europeia (regulamentos directamente aplicáveis)

**Regulamento (UE) n.º 1230/2012 da Comissão, de 12 de dezembro de 2012**
Requisitos de homologação para massas e dimensões dos veículos a motor e seus reboques
- Dá execução ao Regulamento (CE) n.º 661/2009
- Altera a Diretiva 2007/46/CE
- URL: https://eur-lex.europa.eu/legal-content/PT/ALL/?uri=celex:32012R1230
- URL PDF: http://publications.europa.eu/resource/oj/JOL_2012_353_R_0031_01.POR.pdfa1a.l_35320121221pt00310079.pdf
- **CRÍTICO — Ponto 2.6.2.2:** "A massa representativa de cada passageiro deve ser de **75 kg**"
- **CRÍTICO — Ponto 2.2.3:** "A massa de cada membro da tripulação deve ser de **75 kg**"

**Diretiva (UE) 2015/719 do Parlamento Europeu e do Conselho, de 29 de abril de 2015**
Altera a Diretiva 96/53/CE relativa às dimensões e pesos máximos dos veículos pesados
- URL: https://eur-lex.europa.eu/PT/legal-content/summary/authorised-maximum-dimensions-and-weights-for-trucks-buses-and-coaches.html

**Diretiva 96/53/CE do Conselho, de 25 de julho de 1996**
Dimensões máximas no tráfego nacional e internacional e pesos máximos no tráfego internacional
- Origem da harmonização europeia dos pesos e dimensões

**Regulamento (UE) 2018/858 do Parlamento Europeu e do Conselho, de 30 de maio de 2018**
Homologação e fiscalização do mercado dos veículos a motor — COC multi-etapa
- Revoga a Diretiva 2007/46/CE
- **Base legal do COC que a CSN emite para cada carroçaria**

**Regulamento (UE) 2019/2144 do Parlamento Europeu e do Conselho, de 27 de novembro de 2019**
GSR — Segurança Geral dos Veículos — AEB, câmaras, sensores
- Revoga o Regulamento (CE) n.º 661/2009 (que incluía o Reg. 1230/2012)
- **ATENÇÃO:** Verifica se o Reg. 1230/2012 foi substituído nesta matéria

### NÍVEL 3 — A confirmar / pesquisar

| Diploma | O que define | Estado |
|---|---|---|
| Fonte do limite 10% PBV | Reserva de 10% do PBV | ⚠️ A confirmar — pode estar no DL 132/2017 ou na ficha de homologação |
| Reg. (CE) n.º 661/2009 | Requisitos de segurança geral — base do Reg. 1230/2012 | Revogado pelo Reg. 2019/2144 |
| Reg. 1230/2012 — versão actual | Verificar se foi substituído após Reg. 2019/2144 | ⚠️ A confirmar |
| VDI 2700 (DE) | Estado da arte fixação de carga na Alemanha | Norma técnica alemã |
| RD 563/2017 (ES) | Estiba de carga em Espanha — referencia EN 12195-1 | Decreto espanhol |

---

## Definições Legais Confirmadas

### Tara — DL 132/2017, alínea e):
> *"peso do veículo em ordem de marcha, sem passageiros nem carga, com o líquido de arrefecimento, lubrificantes, 90% do total de combustível, 100% dos outros fluidos, exceto águas residuais, ferramentas e roda de reserva, quando esta seja obrigatória e, com exceção dos ciclomotores, motociclos, triciclos e quadriciclos, o condutor (75 kg)"*

**Conclusão:** Tara **já inclui o motorista a 75kg**. Não é necessário adicionar separadamente.

### Massa por passageiro — Reg. (UE) 1230/2012, ponto 2.6.2.2:
> *"A massa representativa de cada passageiro deve ser de 75 kg"*

**Conclusão:** **75kg por passageiro** — incluindo tripulação adicional. Não é 62kg nem 65kg.

### Peso bruto — DL 132/2017, alínea f):
> *"conjunto da tara e da carga que o veículo pode transportar"*

### Lotação — DL 132/2017, alínea i):
> *"número de passageiros que o veículo pode transportar, incluindo o condutor"*

---

## Fórmula de Peso Útil para Carroçaria — DEFINITIVA

```
PASSO 1 — Peso máximo legal
Peso_max = PBV × 0.90
(reserva 10% — fonte a confirmar)

PASSO 2 — Retirar a tara
(tara já inclui: motorista 75kg + 90% combustível + 100% fluídos)
Disponivel = Peso_max - Tara

PASSO 3 — Retirar tripulação adicional (excluindo motorista)
Tripulacao = (Nº_lugares - 1) × 75kg
(Reg. UE 1230/2012, ponto 2.6.2.2)

PASSO 4 — Peso livre para carroçaria + acessórios + equipamentos
Peso_carrocaria = Disponivel - Tripulacao
```

**Fórmula completa:**
```
Peso_carrocaria = (PBV × 0.90) - Tara - ((Nº_lugares - 1) × 75)
```

---

## Exemplo — Renault Master XDD L3H2 Diesel

```
PBV = 3.500 kg
Tara = 1.950 kg (inclui motorista 75kg + fluídos — valor indicativo)
Nº lugares = 3 (cabine simples)

Peso_max = 3.500 × 0.90 = 3.150 kg
Disponivel = 3.150 - 1.950 = 1.200 kg
Tripulação adicional = (3-1) × 75 = 150 kg
Peso_carrocaria = 1.200 - 150 = 1.050 kg

→ Máximo para carroçaria + acessórios + equipamentos: 1.050 kg
```

---

## Onde Ficam os Diplomas no RAG

```
knowledge-base/
  /tecnico/normas/
    /pesos-dimensoes/
      DL_132_2017_Pesos_Dimensoes.pdf
      DL_59_2023_Alteracao_Pesos_Dimensoes.pdf
      Reg_UE_1230_2012_Massas_Dimensoes.pdf
      Directiva_UE_2015_719_Pesos_Dimensoes.pdf
      Directiva_96_53_CE_Pesos_Dimensoes.pdf
    /homologacao/
      Reg_UE_2018_858_Homologacao_COC.pdf
      Reg_UE_2019_2144_GSR_Seguranca_Geral.pdf
  /produto/
    /d1-produto/       ← Dimensão 1 do sistema CSN
      (estes diplomas vivem aqui também)
```

---

## Acção para o Cowork

Criar OT para descarregar os PDFs oficiais de todos os diplomas listados acima:

```
OT-2026-010-legislacao-pesos-dimensoes
Tipo: extraccao_inicial
Fontes:
  - https://dre.pt (DL 132/2017, DL 59/2023)
  - https://eur-lex.europa.eu (Reg. 1230/2012, Dir. 2015/719, Reg. 2018/858, Reg. 2019/2144)
Pasta destino: knowledge-base/tecnico/normas/pesos-dimensoes/
```

---

## Impacto no CSN Brain

O configurador bloqueia quando a carroçaria proposta excede `Peso_carrocaria`. Mensagem:

> *"Esta configuração excede o peso útil disponível de [X] kg para este chassi com [N] lugares. Com base no DL 132/2017 e Reg. (UE) 1230/2012, o máximo disponível para carroçaria é [X] kg. Sugestão: reduzir [componente] ou seleccionar chassi com PBV superior."*

Não é uma advertência. É um bloqueio com citação legal.

---

## Consequências

- PDFs dos diplomas entram na Knowledge Base via Cowork — OT-2026-010
- Campo `num_lugares` obrigatório na tabela `marcas_veiculo`
- Função `calcular_peso_carrocaria()` no CSN Brain usa esta fórmula
- O resultado do cálculo é guardado por obra na Supabase com referência legal
- Na documentação gerada por obra — a fórmula e os diplomas são citados automaticamente
