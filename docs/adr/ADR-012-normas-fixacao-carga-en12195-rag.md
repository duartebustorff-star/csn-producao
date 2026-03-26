# ADR-012 — Normas de Fixação de Carga: EN 12195 Completa + Documentos para RAG

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

A fixação de carga é uma obrigação legal e uma responsabilidade directa da CSN como fabricante de carroçarias. A EN 12642 certifica a resistência estrutural da carroçaria. A EN 12195 define como a carga deve ser fixada dentro dessa carroçaria. A EN 12640 define os pontos de amarração que a carroçaria deve ter. As três normas são interdependentes.

O CSN Brain precisa de incorporar estas normas no configurador — não só para calcular os pontos de amarração necessários, mas para gerar a documentação de conformidade que prova que a carroçaria foi dimensionada correctamente.

---

## A Família EN 12195 — 4 Partes

### EN 12195-1:2010
**Cálculo das forças de fixação de carga**
- O que é: Define os coeficientes de aceleração por tipo de transporte (estrada, comboio, mar) e o método de cálculo do número e resistência dos sistemas de fixação necessários
- Para a CSN: Base de cálculo para dimensionar os pontos de amarração da carroçaria
- Directamente ligada à EN 12642 e EN 12640
- **Coeficientes de aceleração estrada:** frente 0.8g, trás 0.5g, lateral 0.5g, vertical 1.0g
- Inclui coeficientes de fricção por tipo de superfície

### EN 12195-2:2004
**Cintas de lashing em fibras sintéticas**
- O que é: Requisitos técnicos para cintas de fixação em poliéster — LC, STF, SHF, etiquetagem, testes
- Para a CSN: Especificação do equipamento de fixação a recomendar por carroçaria
- LC (Lashing Capacity) em daN — 1 daN ≈ 1 kg
- STF (Standard Tension Force) — força residual após aperto
- SHF (Standard Hand Force) = 50 daN universal
- Factor de segurança mínimo: 2:1 (resistência à rotura = 2× LC)

### EN 12195-3
**Correntes de fixação**
- O que é: Requisitos para correntes de aço usadas em fixação de carga pesada
- Para a CSN: Relevante para basculantes e carroçarias de equipamentos pesados

### EN 12195-4
**Cabos de aço para fixação**
- O que é: Requisitos para cabos de aço usados em fixação de carga
- Para a CSN: Casos especiais de carga muito pesada ou irregular

---

## Normas Complementares à EN 12195

### EN 12640:2001 + EN 12640:2019
**Pontos de amarração nos veículos**
- O que é: Define os requisitos mínimos de resistência dos pontos de amarração (argolas, calhas, etc.) instalados na carroçaria
- Para a CSN: **Obrigatório** — a carroçaria tem de ter pontos de amarração com resistência certificada
- Resistência mínima por ponto: depende do tipo de veículo e carga
- Marcação obrigatória em cada ponto: LC em daN

### EN 12642:2016 (L e XL)
**Resistência estrutural da carroçaria**
- Código L: carroçaria resiste a forças menores — carga distribuída uniformemente
- Código XL: carroçaria resiste a forças maiores — carga pode concentrar-se
- **Para mercado DE/FR: XL é exigência de facto**

---

## Documentos de Boas Práticas para RAG

### Guia IRU — International Road Union
**"International Guidelines on Safe Load Securing for Road Transport"**
- Editado pela IRU (International Road Union)
- Inclui "Quick Lashing Guide" — tabelas de cálculo rápido sem necessidade de fórmulas
- URL: https://www.iru.org/sites/default/files/2016-01/en-safe-load-securing-8th.pdf
- **Descarregar para RAG** — é o documento de boas práticas de referência europeu

### Comissão Europeia — European Best Practice Guidelines
**"European Best Practice Guidelines on Cargo Securing for Road Transport"**
- Publicado pela Comissão Europeia DG MOVE
- Cobre todos os métodos: blocking, lashing directo, loop lashing, spring lashing
- Referência em todos os países UE
- **Descarregar para RAG**

### VDI 2700 (Alemanha)
**Melhores práticas de fixação de carga — estado da arte reconhecido pelos tribunais alemães**
- Aplicável no mercado DE para responsabilidade civil (§22 StVO)
- **Descarregar para RAG**

---

## Estrutura no RAG

```
knowledge-base/tecnico/normas/fixacao-carga/
  EN_12195-1_2010_Calculo_Forcas_Fixacao.pdf
  EN_12195-2_2004_Cintas_Lashing.pdf
  EN_12195-3_Correntes_Fixacao.pdf
  EN_12195-4_Cabos_Fixacao.pdf
  EN_12640_2019_Pontos_Amarracao.pdf
  EN_12642_2016_Resistencia_Estrutural.pdf
  IRU_Guidelines_Safe_Load_Securing.pdf
  EU_Best_Practice_Guidelines_Cargo_Securing.pdf
  VDI_2700_Fixacao_Carga_Alemanha.pdf
```

---

## OT para o Cowork

```
OT-2026-011-normas-fixacao-carga
Tipo: extraccao_inicial
Fontes:
  - https://www.iru.org (IRU Guidelines)
  - Comissão Europeia DG MOVE (EU Best Practice Guidelines)
  - BSI / CEN (EN 12195 partes 1-4, EN 12640, EN 12642)
Pasta destino: knowledge-base/tecnico/normas/fixacao-carga/
```

---

## Impacto no CSN Brain

O configurador de carroçaria usa estas normas para:

1. **Calcular pontos de amarração necessários** por tipo e peso de carga — EN 12195-1
2. **Dimensionar os pontos de amarração** na carroçaria — EN 12640
3. **Definir se a carroçaria precisa de certificação L ou XL** — EN 12642
4. **Recomendar equipamento de fixação** ao cliente — EN 12195-2

A documentação gerada por obra cita automaticamente as normas aplicadas.

---

## Responsabilidade Civil

Em caso de acidente com carga solta:
- **Portugal:** responsabilidade do transportador e do fabricante da carroçaria se os pontos de amarração forem insuficientes
- **Alemanha:** §22 StVO + §412 HGB — responsabilidade directa do fabricante; VDI 2700 é "estado da arte reconhecido" pelos tribunais
- **França:** Code du Travail — avaliação de riscos inclui fixação de carga
- **Espanha:** RD 563/2017 — referencia directamente EN 12195-1

A CSN que certifica EN 12642 XL e dimensiona pontos de amarração EN 12640 está protegida. A que não certifica, não está.

---

## Consequências

- PDFs de todas as normas listadas entram no RAG via Cowork OT-2026-011
- O campo `certificacao_en12642` na tabela `marcas_veiculo` indica se a carroçaria está certificada L, XL ou não certificada
- O CSN Brain não gera documentação de conformidade para carroçarias sem EN 12642 certificada quando o destino é DE ou FR
