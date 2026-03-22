# CSN Brain — Briefing Agente Research
## Ordens de Trabalho de Scraping e Pesquisa

**Data:** 21/03/2026
**Versão:** 1.0

---

## Função do Agente Research

O Agente Research faz scraping e pesquisa de informação técnica em portais de fabricantes, bases legais e portais de normas. Entrega os ficheiros ao Cowork para organização e registo.

**Não organiza ficheiros. Não faz commits. Só extrai.**

---

## Instruções Gerais

Para cada OT:
1. Navegar as fontes indicadas
2. Descarregar todos os documentos relevantes
3. Gerar relatório de extracção
4. Entregar ficheiros + relatório ao Cowork

**Formato do relatório:**
```
OT: [referência]
Executado por: Agente Research
Data: [data]
Fontes consultadas: [URLs]
Documentos encontrados: [N]
Documentos extraídos: [N]
Sem acesso: [N] — motivo
Lista: [nome, URL, tamanho, data]
Notas: [o que encontrou de relevante]
```

---

## OT-R-001 — Legislação PT + UE (Pesos e Dimensões)

```
Fontes:
  - https://dre.pt → pesquisar "132/2017" e "59/2023"
  - https://eur-lex.europa.eu → pesquisar:
    - "96/53/CE" (consolidada 2019)
    - "2015/719"
    - "1230/2012"
    - "2018/858"
    - "2019/2144"

Documentos alvo:
  - DL 132/2017 de 11/10/2017 (PDF completo)
  - DL 59/2023 de 21/07/2023 (PDF completo)
  - Directiva 96/53/CE versão consolidada 2019
  - Regulamento UE 1230/2012
  - Regulamento UE 2018/858
  - Regulamento UE 2019/2144 (GSR)

Entregar ao Cowork para: knowledge-base/tecnico/normas/pesos-dimensoes/
```

---

## OT-R-002 — Normas Fixação de Carga

```
Fontes:
  - https://www.iru.org → "safe load securing guidelines"
  - Comissão Europeia → "best practice guidelines cargo securing"
  - https://www.bsigroup.com ou similar → EN 12195-1, EN 12195-2, EN 12640, EN 12642

Documentos alvo:
  - IRU International Guidelines on Safe Load Securing (PDF)
  - EU Best Practice Guidelines on Cargo Securing (PDF)
  - EN 12195-1:2010 (cálculo forças fixação)
  - EN 12195-2:2004 (cintas lashing)
  - EN 12640 (pontos amarração)
  - EN 12642:2016 (resistência estrutural)
  - VDI 2700 (se disponível gratuitamente)

Entregar ao Cowork para: knowledge-base/tecnico/normas/fixacao-carga/
```

---

## OT-R-003 — Regulamentos UNECE

```
Fontes:
  - https://unece.org/transport/vehicle-regulations

Documentos alvo:
  - R48 — Iluminação
  - R58 — Para-choques traseiro
  - R73 — Pára-lamas / protecções laterais
  - R55 — Engates mecânicos

Entregar ao Cowork para: knowledge-base/tecnico/normas/unece/
```

---

## OT-R-004 — MAN Bodybuilder

```
Portais:
  - https://www.man.eu/de/trucks/bodybuilder-portal.html
  - https://www.man-mn.com (Portugal)

Modelos alvo: TGE (ligeiro) · TGL · TGM · TGS · TGX

Por cada modelo extrair:
  - Mounting Guidelines / Body Builder Instructions (PDF)
  - Dados técnicos: PBV, tara, distância eixos, overhang max, CoG max
  - Localização sensores GSR (AEB, câmaras)
  - Opções PTO disponíveis
  - Contactos técnicos Portugal

Entregar ao Cowork para: Marcas - Veiculos/MAN/
```

---

## OT-R-005 — DAF Bodybuilder

```
Portais:
  - https://www.daf.com/en/for-operators/bodybuilder-information
  - https://www.daf.pt

Modelos alvo: LF · XB · XD · XF

Por cada modelo extrair:
  - Body Builder Instructions (PDF)
  - Dados técnicos completos
  - Contactos técnicos Portugal

Entregar ao Cowork para: Marcas - Veiculos/DAF/
```

---

## OT-R-006 — Iveco Bodybuilder

```
Portais:
  - https://www.iveco.com/italy/Pages/bodybuilders.aspx
  - https://www.iveco.pt

Modelos alvo: Daily (ligeiro) · Eurocargo · S-Way

Por cada modelo extrair:
  - Body Builder Instructions (PDF)
  - Dados técnicos completos
  - Contactos técnicos Portugal

Entregar ao Cowork para: Marcas - Veiculos/Iveco/
```

---

## OT-R-007 — Stellantis (completar)

```
Portais:
  - https://www.fcagroup.com/bodybuilders (ou equivalente actual)
  - Fiat Professional: https://www.fiatprofessional.com
  - PSA Bodybuilder: https://www.psa-bodybuilder.com

Modelos alvo:
  - Fiat Ducato (todas as versões)
  - Citroën Jumper
  - Peugeot Boxer
  - Opel/Vauxhall Movano

Por cada modelo extrair:
  - Bodybuilder guidelines (PDF)
  - Dados técnicos: PBV, tara, eixos, overhang, CoG
  - Contactos técnicos Portugal

Entregar ao Cowork para: Marcas - Veiculos/Stellantis/
```

---

## OT-R-008 — Gruas de Coluna

```
Portais:
  - https://www.hiab.com → catálogo + specs técnicas
  - https://www.fassi.com → catálogo + specs
  - https://www.palfinger.com → catálogo + specs
  - https://www.pmcranes.com → catálogo + specs
  - https://www.effer.it → catálogo + specs

Por cada modelo/série extrair:
  - Curva de carga (capacidade kg × alcance m) — tabela ou PDF
  - Peso próprio (kg)
  - Dimensões posição transporte (L×W×H)
  - Dimensões estabilizadores abertos
  - Requisitos PTO (pressão bar, caudal L/min)
  - Certificação EN 12999
  - Manual de instalação se disponível

Entregar ao Cowork para: Marcas - Veiculos/Equipamentos/Gruas/
```

---

## OT-R-009 — Plataformas de Carga Traseira

```
Portais:
  - https://www.zepro.com
  - https://www.anteo.it
  - https://www.dhollandia.com
  - https://www.palfinger.com/liftgates
  - https://www.dautel.de

Por cada modelo extrair:
  - Capacidade nominal (kg)
  - Peso próprio (kg)
  - Dimensões plataforma (L × W)
  - Comprimento em posição dobrada
  - Certificação EN 1756-1

Entregar ao Cowork para: Marcas - Veiculos/Equipamentos/Plataformas/
```

---

## OT-R-010 — Engates de Reboque

```
Portais:
  - https://www.westfalia-automotive.com
  - https://www.brinkautomotive.com
  - https://www.bosal.eu
  - https://www.thule.com/towbars

Por cada modelo extrair:
  - D-value certificado (kN)
  - S-value máximo (kg)
  - Peso do conjunto (kg)
  - Compatibilidade por marca/modelo chassi
  - Certificação UNECE R55

Entregar ao Cowork para: Marcas - Veiculos/Equipamentos/Engates/
```

---

## OT-R-011 — Normas Soldadura e Estrutura

```
Fontes:
  - ISO.org, BSI, CEN
  - Pesquisar versões gratuitas ou resumos oficiais

Documentos alvo:
  - EN 1090-1 + EN 1090-2 (Marcação CE estruturas aço)
  - EN ISO 3834-3 (qualidade soldadura)
  - EN ISO 15614-1 (qualificação WPS)
  - EN ISO 9606-1 (certificação soldadores)
  - EN ISO 5817 (qualidade imperfeições)
  - EN ISO 17637 (inspecção visual)

Entregar ao Cowork para: knowledge-base/tecnico/normas/soldadura/
```

---

## OT-R-012 — Normas Equipamentos

```
Fontes: ISO.org, BSI, CEN, UNECE

Documentos alvo:
  - EN 12999:2020 (gruas de carga para veículos)
  - EN 1756-1:2001+A1 (plataformas elevatórias traseiras)
  - EN 1756-2 (plataformas laterais)
  - ISO 11092 (engates para veículos)

Entregar ao Cowork para: knowledge-base/tecnico/normas/equipamentos/
```

---

## Nota Final

Esta é a primeira vez que usamos o Agente Research para este tipo de trabalho.
Vamos testar com a OT-R-001 (legislação) e OT-R-004 (MAN) primeiro.
Se funcionar bem → expandimos para todas as OTs.
Se houver problemas → ajustamos o processo e documentamos o que correu mal.
