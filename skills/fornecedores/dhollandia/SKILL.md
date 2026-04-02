---
name: CSN Opus — Fornecedor Dhollandia
version: 1.0
date: 02/04/2026
isa95_level: L3-DOC
department: Fornecedores
norm: EN 1756 · Directiva Maquinas 2006/42/CE · ISO 9001 cl. 8.4
status: active
---

## Contexto

Dhollandia - Plataformas, Lda e o fornecedor de plataformas elevatorias (tail lifts) da CSN.
Fornece: plataformas elevatorias hidraulicas para montagem nas carrocarias fabricadas pela CSN.
Dominio email: @dhollandia.pt
NIF: 505121042
Fornecedor ID: 12
Categoria: producao | Nivel ISA-95: L0-EQP

### Produto

Plataformas elevatorias (tail lifts) hidraulicas montadas na retaguarda das carrocarias.
Utilizadas em carrocarias de caixa aberta, fechada e estrado para carga/descarga de mercadorias.
A instalacao e feita pela CSN na fase F8 (Palas e extras) ou como operacao dedicada pos-F6.

Aspectos tecnicos relevantes:
- Capacidade de carga: tipicamente 750 kg, 1000 kg, 1500 kg, 2000 kg
- Tipos: retractil (DH-R), dobravel (DH-F), coluna (DH-C)
- Alimentacao: hidraulica 12V/24V (ligacao ao sistema electrico do veiculo)
- Norma: EN 1756-1 (plataformas elevatorias para veiculos) + Directiva Maquinas 2006/42/CE
- Marcacao CE obrigatoria em cada unidade
- Manual de utilizacao e declaracao de conformidade entregues com cada plataforma

### Contactos conhecidos

| Nome | Email | Funcao |
|------|-------|--------|
| Liliana Rufino | liliana.rufino@dhollandia.pt | Comercial (contacto principal, 12 emails) |
| Rodrigo Figueiredo | rodrigo.figueiredo@dhollandia.pt | Comercial / Tecnico |
| Claudia Martins | Claudia.Martins@dhollandia.pt | Comercial |

### Volume documental no sistema

| Fonte | Tipo | Quantidade | Periodo |
|-------|------|-----------|---------|
| efatura | Faturas | 12 | Jun 2022 — Mai 2025 |
| efatura | Notas de credito | 1 | Mai 2024 |
| emails_indice | EMAIL | 12 | — |
| emails_indice | FAT | 2 | — |
| emails_indice | FT | 2 | — |
| emails_indice | ANEXO | 1 | — |
| **Total emails** | | **17** | |

### Facturacao historica

| Metrica | Valor |
|---------|-------|
| Total faturado | 48.773,50 EUR |
| Primeira fatura | 06/06/2022 |
| Ultima fatura | 28/05/2025 |
| Media por fatura | ~4.070 EUR |
| Fatura mais alta | 8.150,47 EUR (Abr 2025) |

---

## KPIs Fornecedor — ISO 9001 cl. 8.4

| KPI | Nome | Formula | Estado | Fonte |
|-----|------|---------|--------|-------|
| I-2 | Prazo entrega vs prometido | dias_reais - dias_prometidos | **futuro** | requer campo data_prometida e data_recebida |
| I-3 | Conformidade equipamento | unidades conformes / total | **futuro** | requer tabela recepcao_equipamento |
| I-4 | Fornecedor activo com NIF | NIF 505121042 registado | **activo** | fornecedores.id = 12 |
| I-5 | Faturado vs pago | total_faturado - total_pago | **activo** | /api/fornecedores/conta-corrente?fornecedor_id=12 |

### Avaliacao fornecedor (ISO 9001 cl. 8.4)

A tabela `fornecedores` suporta avaliacao mas os campos ainda nao estao preenchidos para Dhollandia:
- `categoria`: producao
- `nivel_isa95`: L0-EQP
- `ativo`: true
- Campos por preencher: email, telefone, morada, iban, notas

---

## Pipeline de classificacao documental

Emails de @dhollandia.pt processados pelo Roteador (L3-DOC):

```
Email de @dhollandia.pt
  |
  +-- PDF com "Fatura" ou "FT" no nome? → FAT
  |     └ Extrair: n.o fatura, valor, data, NIF
  |     └ Conciliar com efatura (NIF 505121042)
  |
  +-- PDF com "Declaracao" ou "CE"? → CERT_CE
  |     └ Declaracao conformidade Directiva Maquinas
  |     └ Associar a obra onde a plataforma foi instalada
  |
  +-- PDF com "Manual" ou "Instrucoes"? → MANUAL
  |     └ Guardar no Storage por modelo de plataforma
  |     └ Associar ao dossier da obra
  |
  +-- Orcamento / proposta? → ORC
  |     └ Extrair: modelo, capacidade, preco
  |     └ Associar ao lead/obra
  |
  +-- Restante → EMAIL (arquivo com metadados)
```

---

## Instrucoes ao Agente

### Quando pedem a conta corrente da Dhollandia
1. Chamar `/api/fornecedores/conta-corrente?fornecedor_id=12`
2. Apresentar: total faturado, total pago, saldo divida
3. Mostrar historico mensal (ultimos 6 meses)
4. Nota: valores tipicos por plataforma entre 4.000 e 8.000 EUR

### Quando pedem emails da Dhollandia
1. Consultar `emails_indice` WHERE email_remetente ILIKE '%dhollandia%'
2. Filtrar por tipo_doc se especificado
3. Contacto principal: Liliana Rufino (liliana.rufino@dhollandia.pt)

### Quando pedem faturas da Dhollandia
1. Consultar `efatura` WHERE nif_emitente = '505121042'
2. Mostrar: numero_fatura, data_emissao, total, tipo_documento
3. 12 faturas historicas no sistema (48.773,50 EUR total)

### Quando ha problema tecnico com uma plataforma instalada
1. Verificar se a plataforma esta em garantia (tipicamente 24 meses)
2. Identificar modelo e numero de serie
3. Se em garantia → contactar Dhollandia directamente (Rodrigo Figueiredo — tecnico)
4. Se fora de garantia → escalar para dept. Engenharia para avaliacao
5. Registar o problema como nota na obra (tipo: 'problema')

### Quando precisam de orcamento para nova plataforma
1. Identificar: modelo veiculo, PBT, tipo de carrocaria, capacidade pretendida
2. Contactar Liliana Rufino (liliana.rufino@dhollandia.pt)
3. Associar orcamento ao lead/obra correspondente

### Quando pedem declaracao CE de uma plataforma
1. Consultar documentos da obra onde a plataforma foi instalada
2. Cada plataforma deve ter: Declaracao Conformidade CE + Manual utilizacao
3. Se em falta → solicitar a Dhollandia referenciando n.o serie

---

## Tools disponiveis

### Leitura (Interface Departamental pode usar)
- `/api/fornecedores/conta-corrente` — faturado vs pago (fornecedor_id=12)
- `emails_indice` — pesquisa Supabase (WHERE email_remetente ILIKE '%dhollandia%')
- `efatura` — faturas (WHERE nif_emitente = '505121042')
- `documentos` — PDFs no Storage (WHERE fornecedor_id = 12)

### Escrita (so nucleo)
- `/api/roteador` — classifica documento novo via Claude API
- `/api/documentos/upload` — upload documento ao Storage
- `adicionar_nota` — nota/problema numa obra (problemas com plataforma)

---

## Tabelas Supabase envolvidas

| Tabela | Uso | Filtro Dhollandia |
|--------|-----|-------------------|
| fornecedores | id=12, NIF, categoria, ativo | WHERE id = 12 |
| efatura | 12 faturas, 48.773 EUR | WHERE nif_emitente = '505121042' |
| movimentos_bancarios | pagamentos (match NIF) | WHERE descricao ILIKE '%505121042%' |
| emails_indice | 17 registos classificados | WHERE email_remetente ILIKE '%dhollandia%' |
| documentos | PDFs no Storage | WHERE fornecedor_id = 12 |

---

## Escalacao

- **Problema tecnico com plataforma instalada** → escalar para Engenharia (Duarte)
- **Plataforma em garantia com defeito** → contactar Dhollandia directamente (Rodrigo Figueiredo)
- **Saldo em divida > 30 dias** → escalar para dept. Financeiro
- **Fatura sem pagamento > 60 dias** → alertar reconciliacao
- **Plataforma entregue sem Declaracao CE** → **bloquear instalacao** e solicitar a Dhollandia
- **Plataforma entregue sem manual** → solicitar antes de entregar obra ao cliente
- **Preco > 15% acima da ultima compra** → alertar para renegociacao

---

## Pendentes para desbloquear KPIs

| KPI | O que falta | Prioridade |
|-----|-------------|-----------|
| I-2 | Tabela encomendas com data_prometida e data_recebida | media |
| I-3 | Tabela recepcao_equipamento (conformidade plataformas) | media |
| — | Preencher campos fornecedor: email, telefone, morada | baixa |
| — | Associar plataformas instaladas a obras (n.o serie → obra_id) | alta |

---

*CSN Opus · L3-DOC · EN 1756 · Directiva Maquinas 2006/42/CE · ISO 9001 cl. 8.4 · 02/04/2026*
