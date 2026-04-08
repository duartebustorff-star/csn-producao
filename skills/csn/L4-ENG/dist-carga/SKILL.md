---
name: dist-carga
description: >
  Calcula distribuição de carga por eixo. Activa para distribuição eixos, peso por eixo, centro gravidade, carga eixo.
---

# dist-carga — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Projecto nova carroçaria
- Validação gate lead→produção
- Cálculo para COC

## Norma: Dir. 96/53/CE, DL 99/2005
## Fórmula
- Centro de gravidade carroçaria: CG_x (distância ao eixo frontal)
- Carga eixo frontal = (PBT × L_traseiro - M_carga × CG_x) / entre_eixos
- Carga eixo traseiro = PBT - carga eixo frontal
- Verificar: cada eixo ≤ carga máxima permitida

## Inputs
- entre_eixos, overhang_traseiro (da lead)
- tara_chassis_frente, tara_chassis_tras (do fabricante)
- peso_carrocaria, CG_carrocaria (do modelo 3D)
