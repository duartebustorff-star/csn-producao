---
name: fea-report
description: >
  Gera relatório FEA para certificação EN 12642. Activa para FEA, análise elementos finitos, cálculo estrutural, resistência carroçaria.
---

# fea-report — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Certificação EN 12642 por modelo
- Validação estrutural nova carroçaria

## Norma: EN 12642:2016
## Cargas de ensaio
- Parede frontal: 0.4 × payload (código L) ou 0.5 × payload (código XL)
- Paredes laterais: 0.3 × payload (L) ou 0.4 × payload (XL)
- Parede traseira: 0.25 × payload (L) ou 0.3 × payload (XL)
## Relatório
1. Modelo FEA: geometria, malha, materiais
2. Condições fronteira
3. Cargas aplicadas
4. Resultados: tensões von Mises, deformações
5. Factor segurança: σ_admissível / σ_max
6. Conclusão: CONFORME / NÃO CONFORME
