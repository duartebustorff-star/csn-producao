---
name: analise-fabricante
description: >
  Analisa documentos técnicos de fabricantes de veículos (Body Builder Guidelines, fichas técnicas, manuais de carroçaria) e extrai TODOS os dados necessários para projectar e montar carroçarias em chassis-cabina comerciais (3.5T–8.5T). Usa esta skill sempre que o utilizador fizer upload de PDFs de fabricantes como Mercedes, FUSO, Renault, MAN, Iveco, DAF, Ford, ou qualquer outro fabricante de veículos comerciais. Também se aplica quando o utilizador mencionar "body builder guidelines", "BBG", "ficha técnica de chassis", "dados do fabricante", "análise de chassis", "extrair dados do fabricante". Mesmo que o utilizador apenas diga "analisa este PDF do fabricante" ou "preciso dos dados deste chassis", esta skill deve ser activada.
---

# Análise de Documentação Técnica de Fabricante de Veículos

## Contexto

A CSN fabrica carroçarias para veículos comerciais em Mafra, Portugal — caixas abertas, basculantes, caixas fechadas, estrados e plataformas para chassis-cabina de 3.5T a 8.5T. Para cada veículo, a carroçaria tem de caber no chassis sem exceder limites de peso por eixo, respeitar a legislação europeia, e não comprometer sistemas de segurança.

Esta skill extrai de documentos técnicos de fabricantes toda a informação necessária para esse trabalho de engenharia.

## Regra Fundamental

**Nunca inventar, estimar ou aproximar qualquer valor numérico.** Se um valor não está nos documentos, registar como `NULL` com a nota: *"não encontrado nos documentos fornecidos — confirmar com fabricante"*. Qualquer conversão ou cálculo deve indicar a fórmula usada e o valor-fonte original.

**MAS: se o valor ESTÁ no documento, TEM de ser extraído.** A skill não pode dizer NULL para dados que existem no PDF. Cada secção do documento tem de ser lida com atenção aos detalhes — part numbers, valores em tabelas, specs em diagramas, notas de rodapé. Um NULL quando o dado existe é uma FALHA.

## Referência de Medição CSN

Medidas longitudinais: **X=0 = centro do eixo frontal**, positivo para trás. Se o fabricante mede de outro ponto de referência, converter e registar explicitamente a conversão com fórmula.

## Workflow

### Passo 1: Ler os documentos — TODOS, SEM SALTAR SECÇÕES

Ler os PDFs fornecidos **na totalidade**. Não saltar secções. Cada capítulo pode ter dados técnicos relevantes. Tomar nota de:
- Fabricante e modelos cobertos
- Versão/data do documento
- Estrutura e organização (capítulos, secções)
- Terminologia específica do fabricante
- Unidades de medida

**ATENÇÃO ESPECIAL a estas secções (nomes variam por fabricante):**
- Secção de PTO / Power Take-Off — EXTRAIR part numbers, torque, rpm, tipos, terceiros compatíveis
- Secção de eléctrica / Power Supply — EXTRAIR voltagem exacta (12V, 24V, misto), alternadores (tipo + Amperes), potência disponível motor parado E a rodar
- Secção de furação / Drilling — EXTRAIR diâmetros máximos, distâncias mínimas entre furos, distância a arestas
- Secção de reforço / Reinforcement — EXTRAIR método exacto, tipo fixação, passo, materiais
- Secção de soldadura / Welding — EXTRAIR condições, eléctrodos, restrições
- Tabelas de dados técnicos por modelo — EXTRAIR TODOS os valores numéricos

### Passo 2: Extrair dados por tema — COM DETALHE DE ENGENHARIA

Seguir as 12 categorias definidas em `references/categorias-extracao.md`. Para cada categoria:
- Extrair **TODOS** os valores encontrados — incluindo part numbers, referências, notas de rodapé
- Registar a página ou secção de cada valor
- Distinguir entre OBRIGATÓRIO e RECOMENDADO
- Extrair valores de diagramas e cotas
- **Extrair tabelas completas** — não resumir, copiar todos os valores

**DETALHES QUE NÃO PODEM FALTAR:**

#### PTO (Tomada de Força)
O basculante e a grua precisam de PTO. Sem part numbers e torque, não se pode encomendar.
- TODOS os part numbers do fabricante (ex: ME536138, ME530661)
- Torque por PTO (Nm) e rotação (rpm)
- Tipo: MT (manual), AMT (automática), engine-driven
- PTOs de terceiros compatíveis com part numbers (ex: Bezares ME537270)
- Restrições: funciona parado ou em movimento? Requer reprogramação ECU?
- Tabela completa — não resumir

#### Sistema Eléctrico
Plataformas e gruas eléctricas precisam de potência. Se o alternador standard não chega, tem de ser encomendado ANTES do veículo chegar.
- Sistema EXACTO: 12V, 24V, ou **MISTO 12V/24V** (duas baterias + equaliser) — isto é CRÍTICO para segurança
- Alternador standard: tipo e Amperes
- Alternador alta capacidade: tipo e Amperes
- Potência com motor PARADO: Amperes contínuo e burst (com duração)
- Potência com motor A RODAR: Amperes por RPM
- Conectores SAM/body: corrente admissível por circuito (tabela completa)
- Procedimento de desconexão de baterias (especialmente em sistemas mistos)

#### Furação do Chassis
Furar no sítio errado racha a longarina.
- Diâmetro MÁXIMO dos furos (mm)
- Distância MÍNIMA entre furos (mm)
- Distância MÍNIMA à aresta da longarina (mm)
- Zonas proibidas (diagrama se existir)
- Zonas permitidas (diagrama se existir)

#### Reforço de Chassis
Gruas e equipamentos pesados concentram carga. O fabricante especifica como reforçar.
- Método: outer stiffener, inner stiffener, box construction
- Tipo fixação: rebites (∅mm), parafusos (Mmm), soldadura
- Passo máximo entre fixações (mm)
- Material do reforço
- Comprimento do mounting frame por tipo de cabine (mm)
- Limites de stress do frame (MPa) por material e tipo de estrada

#### Soldadura
- Onde é permitida e proibida (lista completa)
- Tipo de eléctrodo recomendado
- Pré-aquecimento necessário?
- Protecção pós-soldadura

### Passo 3: Gerar outputs

Produzir **dois ficheiros**:

#### A) Markdown estruturado
Ficheiro `.md` com as 9 secções de output definidas em `references/formato-output.md`.

#### B) Excel (.xlsx)
Ficheiro `.xlsx` com separadores por secção. Usar a skill `xlsx` para criação.

### Passo 4: Verificação

Antes de entregar, verificar:
- [ ] Todos os campos NULL — confirmar que NÃO existem no documento (reler a secção relevante)
- [ ] PTO: part numbers extraídos? torque? rpm? Se a secção existe, não pode estar NULL
- [ ] Eléctrica: voltagem exacta (não "inferido")? alternador specs? potência disponível?
- [ ] Furação: diâmetro máximo? distâncias mínimas?
- [ ] Reforço: método? fixação? passo? materiais?
- [ ] Nenhum valor inventado
- [ ] Conversões com fórmula e valor original
- [ ] Referências de página presentes
- [ ] Cálculos derivados mostram fórmula

## Referências

- `references/categorias-extracao.md` — 12 categorias com todos os campos e explicação
- `references/formato-output.md` — estrutura exacta do output Markdown
