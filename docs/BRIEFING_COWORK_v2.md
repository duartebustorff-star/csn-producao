# CSN Brain — Briefing Cowork v2
## Ordens de Trabalho — Cowork vs Agente Research

**Data:** 21/03/2026
**Versão:** 2.0

---

## Divisão de Responsabilidades

```
Agente Research  → scraping, pesquisa, extracção de dados de portais
Cowork           → organizar ficheiros, fazer upload, commits GitHub, trabalhar documentos
Claude Code      → código, migrations, desenvolvimento
Este chat        → arquitectura, decisões, ADRs
```

**Princípio:** O Research extrai. O Cowork organiza e regista. O Claude Code constrói.

---

## TRABALHO DO COWORK — O que faz

### Após o Agente Research entregar ficheiros:
1. Mover ficheiros para as pastas correctas do repo
2. Renomear segundo convenção CSN
3. Fazer commit no GitHub
4. Registar na tabela `ordens_trabalho_cowork` do Supabase
5. Gerar relatório de OT e guardar na pasta

### Trabalho independente do Cowork:
- Extrair dados de PDFs para Excel (mounting directives → tabela estruturada)
- Validar dados cruzando múltiplas fontes
- Preencher tabelas Excel por modelo de chassi
- Upload de ficheiros grandes para GitHub

---

## INSTRUÇÕES GERAIS PARA O COWORK

**Formato do relatório de cada OT:**
```
OT: [referência]
Executado por: Cowork
Data: [data]
Ficheiros recebidos do Research: [lista]
Ficheiros organizados: [lista com paths]
Commit GitHub: [hash]
Registado no Supabase: sim/não
Próxima verificação: [data]
```

**Convenção de nomes de ficheiros:**
```
[MARCA]_[MODELO]_[TIPO]_[ANO].pdf
Ex: FUSO_FE_FG_MountingDirectives_2025.pdf
Ex: RENAULT_Master_XDD_ICE_DimensoesMassas.pdf
```

---

## OTs DO COWORK

### OT-COWORK-001 — Organizar ficheiros Fuso
```
Estado: ❌ Por fazer
Fonte: ficheiros já existentes no repo
Tarefa:
  1. Mover para estrutura correcta:
     Marcas - Veiculos/Fuso/fabricante/
     Marcas - Veiculos/Fuso/dados_tecnicos/
  2. Renomear segundo convenção
  3. Commit
  4. Registar no Supabase
```

### OT-COWORK-002 — Extrair dados Renault XDD ICE para tabela
```
Estado: ❌ Por fazer
Fonte: Marcas - Veiculos/Renault/SGQ_Veiculos/
Tarefa:
  1. Ler PDFs das secções 02_Massas_Dimensoes/
  2. Extrair para Excel: PBV, tara, eixos, overhang, CoG, pesos/eixo
  3. Validar cruzando com portal Renault
  4. Guardar como: Renault_Master_XDD_ICE_DadosTecnicos_Validados.xlsx
  5. Commit + registo Supabase
```

### OT-COWORK-003 — Organizar ficheiros Mercedes Sprinter
```
Estado: ❌ Por fazer
Fonte: Marcas - Veiculos/Mercedes-Benz/
Tarefa:
  1. Organizar em subpastas: fabricante/ dados_tecnicos/
  2. Renomear ficheiros
  3. Commit
```

### OT-COWORK-004 — Organizar ficheiros Research quando entregues
```
Estado: ⏳ Aguarda Research
Tarefa: quando o Agente Research entregar ficheiros de MAN/DAF/Iveco/Stellantis:
  1. Criar estrutura de pastas
  2. Mover e renomear
  3. Commit por marca
  4. Registar OTs no Supabase
```

### OT-COWORK-005 — Organizar normas quando Research entregar PDFs
```
Estado: ⏳ Aguarda Research
Tarefa: quando Research entregar PDFs de legislação:
  1. Organizar em knowledge-base/tecnico/normas/
  2. Estrutura: pesos-dimensoes/ fixacao-carga/ unece/ soldadura/ equipamentos/
  3. Commit
  4. Registar no Supabase
```

---

## OTs DO AGENTE RESEARCH — Para referência do Cowork

O Cowork recebe os resultados destas OTs e organiza:

| OT Research | Tema | O que entrega ao Cowork |
|---|---|---|
| OT-R-001 | Legislação PT+EU | PDFs DL 132/2017, Reg. 1230/2012, Dir. 96/53/CE, etc. |
| OT-R-002 | Normas EN fixação carga | PDFs EN 12195, EN 12640, EN 12642, IRU Guidelines |
| OT-R-003 | UNECE R48/R58/R73/R55 | PDFs regulamentos UNECE |
| OT-R-004 | MAN bodybuilder | PDFs mounting guidelines + dados técnicos |
| OT-R-005 | DAF bodybuilder | PDFs mounting guidelines + dados técnicos |
| OT-R-006 | Iveco bodybuilder | PDFs mounting guidelines + dados técnicos |
| OT-R-007 | Stellantis (completar) | PDFs Fiat Ducato, Citroën Jumper, Peugeot Boxer |
| OT-R-008 | Gruas (Hiab, Fassi, Palfinger) | Curvas de carga, pesos, certificados EN 12999 |
| OT-R-009 | Plataformas (Zepro, Anteo, Dhollandia) | Specs, pesos, certificados EN 1756 |
| OT-R-010 | Engates (Westfalia, Brink) | D-value, S-value, certificados UNECE R55 |
| OT-R-011 | Normas soldadura ISO/EN | PDFs EN 1090, EN ISO 3834, EN ISO 9606, etc. |
| OT-R-012 | Normas equipamentos | PDFs EN 12999, EN 1756-1, ISO 11092 |

---

## Notas de Teste

Esta divisão Research/Cowork é nova — vamos testar e ajustar.
Se o Research não conseguir aceder a um portal → o Cowork tenta directamente.
Se o Cowork bloquear → o Research faz o scraping.
Registar o que funcionou e o que não funcionou para melhorar o processo.
