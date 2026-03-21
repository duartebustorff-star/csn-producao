# CSN Brain — Briefing Cowork
## Todas as Ordens de Trabalho (OTs)

**Data:** 21/03/2026
**Versão:** 1.0
**Para:** Cowork Claude

---

## Instruções Gerais para o Cowork

Para cada OT seguir sempre esta estrutura:
1. Criar pasta de destino se não existir
2. Descarregar todos os documentos encontrados
3. Gerar relatório de extracção (ver formato ADR-009)
4. Registar na tabela `ordens_trabalho_cowork` do Supabase
5. Guardar relatório na pasta da OT como `RELATORIO_OT-XXXX.md`

**Formato do relatório:**
```
OT: [referência]
Marca/Tema: [nome]
Data execução: [data]
Fontes consultadas: [URLs]
Documentos encontrados: [N]
Documentos descarregados: [N]
Documentos sem acesso: [N] — motivo
Lista completa: [nome, versão, data, URL, estado]
Próxima verificação: [data — dia 1 ou 15 do mês seguinte]
```

---

## GRUPO 1 — LEGISLAÇÃO

### OT-2026-010 — Legislação Pesos e Dimensões
```
Pasta: knowledge-base/tecnico/normas/pesos-dimensoes/
Fontes:
  - https://dre.pt → DL 132/2017 + DL 59/2023
  - https://eur-lex.europa.eu → Dir. 96/53/CE consolidada + Dir. 2015/719
  - https://eur-lex.europa.eu → Reg. UE 1230/2012
  - https://eur-lex.europa.eu → Reg. UE 2018/858
  - https://eur-lex.europa.eu → Reg. UE 2019/2144 (GSR)
Documentos alvo:
  - DL_132_2017_Pesos_Dimensoes.pdf
  - DL_59_2023_Alteracao.pdf
  - Directiva_96_53_CE_consolidada.pdf
  - Directiva_2015_719.pdf
  - Reg_UE_1230_2012_Massas_Dimensoes.pdf
  - Reg_UE_2018_858_Homologacao.pdf
  - Reg_UE_2019_2144_GSR.pdf
```

### OT-2026-011 — Normas Fixação de Carga
```
Pasta: knowledge-base/tecnico/normas/fixacao-carga/
Fontes:
  - https://www.iru.org → IRU Safe Load Securing Guidelines
  - Comissão Europeia DG MOVE → EU Best Practice Guidelines Cargo Securing
  - BSI/CEN → EN 12195 partes 1-4, EN 12640, EN 12642
Documentos alvo:
  - IRU_Guidelines_Safe_Load_Securing.pdf
  - EU_Best_Practice_Guidelines_Cargo_Securing.pdf
  - EN_12195-1_Calculo_Forcas_Fixacao.pdf
  - EN_12195-2_Cintas_Lashing.pdf
  - EN_12640_Pontos_Amarracao.pdf
  - EN_12642_Resistencia_Estrutural.pdf
  - VDI_2700_Fixacao_Carga.pdf
```

### OT-2026-012 — Normas UNECE (iluminação, pára-lamas, protecções)
```
Pasta: knowledge-base/tecnico/normas/unece/
Fontes: https://unece.org/transport/vehicle-regulations
Documentos alvo:
  - UNECE_R48_Iluminacao.pdf
  - UNECE_R58_Para_Choques_Traseiro.pdf
  - UNECE_R73_Para_Lamas.pdf
  - UNECE_R55_Engates_Mecanicos.pdf
```

### OT-2026-016 — Normas Soldadura e Estrutura
```
Pasta: knowledge-base/tecnico/normas/soldadura-estrutura/
Fontes: BSI/CEN/ISO
Documentos alvo:
  - EN_1090-1_Execucao_Estruturas_Aco.pdf
  - EN_1090-2_Requisitos_Tecnicos_Aco.pdf
  - EN_ISO_3834-3_Qualidade_Soldadura.pdf
  - EN_ISO_15614-1_Qualificacao_WPS.pdf
  - EN_ISO_9606-1_Certificacao_Soldadores.pdf
  - EN_ISO_5817_Qualidade_Imperfeicoes.pdf
  - EN_ISO_17637_Inspecao_Visual.pdf
```

---

## GRUPO 2 — MARCAS DE CHASSI

### OT-2026-001 — Fuso (já iniciada)
```
Pasta: Marcas - Veiculos/Fuso/
Estado: ✅ Parcialmente feita
Ficheiros existentes:
  - FUSO_Configuracoes_Completas.xlsx
  - FUSO_Registo_Validacao_FBM.docx
  - Mounting Directives FE/FG EuroVI 2025
Falta ainda:
  - Ficha de fabricante (contactos, programa parceiros, newsletter)
  - Dados técnicos completos por modelo em tabela estruturada
  - Verificar se existe boletim técnico / jornal
Próxima verificação: 01/04/2026
```

### OT-2026-002 — Stellantis (em curso)
```
Pasta: Marcas - Veiculos/Stellantis/
Modelos alvo: Fiat Ducato, Citroën Jumper, Peugeot Boxer
O que extrair:
  - Mounting directives por modelo
  - Dados técnicos: PBV, tara, eixos, overhang, CoG, PTO
  - Ficha de fabricante
  - Newsletter técnica / boletim
```

### OT-2026-017 — Renault (completar)
```
Pasta: Marcas - Veiculos/Renault/
Estado: ✅ GT XDD ICE e E-TECH descarregados
Falta ainda:
  - Ficha de fabricante Renault Trucks Portugal
  - Dados técnicos Master XDD em tabela estruturada
  - Outros modelos: Renault Trucks T, C, K (pesados)
  - Newsletter técnica Renault Bodybuilder
```

### OT-2026-018 — Mercedes-Benz (completar)
```
Pasta: Marcas - Veiculos/Mercedes-Benz/
Estado: ✅ Sprinter mounting directives descarregado
Falta:
  - Dados técnicos estruturados Sprinter por variante
  - Modelos pesados: Actros, Arocs, Atego
  - Ficha de fabricante
  - Portal bodybuilder Mercedes: https://bodybuilder.mercedes-benz-trucks.com
```

### OT-2026-019 — MAN
```
Pasta: Marcas - Veiculos/MAN/
Portal: https://www.man.eu/de/trucks/bodybuilder-portal.html
Modelos alvo: TGE (ligeiro), TGL, TGM, TGS, TGX (pesados)
O que extrair:
  - Mounting guidelines por modelo
  - Dados técnicos: PBV, tara, eixos, overhang, CoG max, PTO
  - Ficha de fabricante + contactos PT
```

### OT-2026-020 — DAF
```
Pasta: Marcas - Veiculos/DAF/
Portal: https://www.daf.com/en/for-operators/bodybuilder-information
Modelos alvo: LF, XB, XD, XF
O que extrair:
  - Body Builder Instructions por modelo
  - Dados técnicos completos
  - Ficha de fabricante + contactos PT
```

### OT-2026-021 — Iveco
```
Pasta: Marcas - Veiculos/Iveco/
Portal: https://www.iveco.com/italy/Pages/bodybuilders.aspx
Modelos alvo: Daily (ligeiro), Eurocargo, S-Way (pesados)
O que extrair:
  - Body Builder Instructions por modelo
  - Dados técnicos completos
  - Ficha de fabricante + contactos PT
```

---

## GRUPO 3 — EQUIPAMENTOS

### OT-2026-013 — Gruas de Coluna
```
Pasta: Marcas - Veiculos/Equipamentos/Gruas/
Marcas alvo: Hiab, Fassi, Palfinger, PM, Effer, Amco Veba
Por cada modelo extrair:
  - Curva de carga (capacidade kg × alcance m) — tabela ou PDF
  - Peso próprio (kg)
  - Dimensões em posição de transporte
  - Dimensões estabilizadores abertos
  - Requisitos PTO (pressão, caudal)
  - Certificação EN 12999
  - Manual de instalação
Portais:
  - https://www.hiab.com
  - https://www.fassi.com
  - https://www.palfinger.com
  - https://www.pmcranes.com
```

### OT-2026-014 — Plataformas de Carga Traseira
```
Pasta: Marcas - Veiculos/Equipamentos/Plataformas/
Marcas alvo: Zepro, Anteo, Dhollandia, Palfinger, Dautel
Por cada modelo extrair:
  - Capacidade nominal (kg)
  - Peso próprio (kg)
  - Dimensões plataforma (L × W)
  - Comprimento em posição dobrada
  - Altura de trabalho
  - Certificação EN 1756-1
  - Compatibilidade com marcas de chassi
Portais:
  - https://www.zepro.com
  - https://www.anteo.it
  - https://www.dhollandia.com
```

### OT-2026-015 — Engates de Reboque
```
Pasta: Marcas - Veiculos/Equipamentos/Engates/
Marcas alvo: Westfalia, Brink, Bosal, Oris
Por cada modelo extrair:
  - D-value certificado (kN)
  - S-value máximo (kg)
  - Peso do conjunto (kg)
  - Compatibilidade por marca/modelo chassi
  - Certificação UNECE R55
Portais:
  - https://www.westfalia-automotive.com
  - https://www.brinkautomotive.com
```

---

## GRUPO 4 — NORMAS ADICIONAIS

### OT-2026-022 — Normas Equipamentos
```
Pasta: knowledge-base/tecnico/normas/equipamentos/
Documentos alvo:
  - EN_12999_2020_Gruas_Carga_Veiculos.pdf
  - EN_1756-1_2001_Plataformas_Elevatórias.pdf
  - EN_1756-2_Plataformas_Laterais.pdf
  - UNECE_R55_Engates_Mecanicos.pdf (já em OT-012)
  - ISO_11092_Engates_Veiculos.pdf
```

### OT-2026-023 — ISO 9001 e EN 1090 documentos de apoio
```
Pasta: knowledge-base/tecnico/normas/qualidade/
Documentos alvo:
  - ISO_9001_2015_Sistema_Gestao_Qualidade.pdf
  - EN_1090-1_Marcacao_CE_Estruturas.pdf
  - EN_1090-2_Requisitos_EXC2.pdf
  - Manual_FPC_template.pdf (se disponível)
```

---

## MONITORIZAÇÃO CONTÍNUA

Todas as OTs acima passam a ter verificação mensal automática:
- Dia 1 de cada mês — verificar se existem actualizações
- Comparar com versões arquivadas
- Se novo documento → descarregar + alertar Luísa
- Se versão actualizada → marcar anterior como obsoleta

---

## Resumo de OTs

| OT | Tema | Estado |
|---|---|---|
| OT-2026-001 | Fuso | 🔄 Parcial |
| OT-2026-002 | Stellantis | 🔄 Em curso |
| OT-2026-010 | Legislação pesos/dimensões | ❌ Por fazer |
| OT-2026-011 | Normas fixação carga | ❌ Por fazer |
| OT-2026-012 | UNECE R48/R58/R73/R55 | ❌ Por fazer |
| OT-2026-013 | Gruas de coluna | ❌ Por fazer |
| OT-2026-014 | Plataformas de carga | ❌ Por fazer |
| OT-2026-015 | Engates de reboque | ❌ Por fazer |
| OT-2026-016 | Normas soldadura/estrutura | ❌ Por fazer |
| OT-2026-017 | Renault (completar) | 🔄 Parcial |
| OT-2026-018 | Mercedes (completar) | 🔄 Parcial |
| OT-2026-019 | MAN | ❌ Por fazer |
| OT-2026-020 | DAF | ❌ Por fazer |
| OT-2026-021 | Iveco | ❌ Por fazer |
| OT-2026-022 | Normas equipamentos | ❌ Por fazer |
| OT-2026-023 | ISO 9001 + EN 1090 docs | ❌ Por fazer |
