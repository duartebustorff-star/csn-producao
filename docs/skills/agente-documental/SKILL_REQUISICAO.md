# SKILL_REQUISICAO — Agente Documental · Nota de Encomenda
### Código: CSN-L3-DOC-SKL-100-2026
### Nível ISA-95: L3-DOC (Document Management) → L4-COM (Commercial)
### Camada: 1.5 — Tipo de documento (série 1xx)
### Sessão: 29

---

## PROPÓSITO

A nota de encomenda (NE) é o documento mais importante do ciclo comercial.
É o momento contratual — quando o cliente aceita as condições e autoriza o trabalho.

Sem NE:
- Não se abre obra
- Não se factura (grupos grandes rejeitam facturas sem nº de NE)
- Não há protecção contratual para a CSN

Este skill executa quando o SKILL_GERAL classifica um documento como tipo **REQ** (Requisição / Nota de Encomenda).

---

## COMO RECONHECER UMA NOTA DE ENCOMENDA

Um documento é NE se contém **3 ou mais** destes indicadores:

### Indicadores fortes (1 destes quase confirma):
- Texto: "Nota de Encomenda", "Purchase Order", "Encomenda Nº"
- Campo explícito: "Matrícula ou Chassis", "VIN"
- Frase: "O presente número de encomenda terá de ser indicado em toda a documentação"
- Estrutura de linhas com: Qtd | Descrição | P.Unit | Total

### Indicadores de suporte:
- "Condições Pagamento" ou "Prazo Previsto Entrega"
- "Data Encomenda" ou "Data Entrega"
- "Local de Entrega"
- NIF do emissor (cliente) + NIF do destinatário (CSN: 500861790)
- Referência a proposta/orçamento CSN (ex: "NB523.24.1")
- Nome de contacto de departamento de compras

### NÃO é NE (falsos positivos):
- Orçamento da CSN para o cliente → tipo ORCAMENTO (nós enviamos, não recebemos)
- Factura de fornecedor → tipo FAT (nós pagamos, não recebemos encomenda)
- Guia de remessa → tipo GR (acompanha entrega, não encomenda)
- Email de confirmação verbal → tipo EMAIL (sem força contratual)

---

## CAMPOS A EXTRAIR

### Obrigatórios (sem estes, não é NE válida)

| Campo | Descrição | Exemplo Vesauto | Exemplo Entreposto |
|-------|-----------|-----------------|-------------------|
| numero_encomenda | Identificador único da NE | NE897290 | 2025010286986 |
| data_encomenda | Data de emissão | 24-11-2025 | 15-01-2025 |
| empresa_cliente | Quem encomenda | Vesauto - Automóveis e Reparações, S.A. | Carby Motion, SA |
| nif_facturacao | NIF para factura | 501316272 | 501410171 |
| vin_chassis | VIN ou chassis dos veículos | VF1RDB00075409005 (nas obs.) | VXEYDF6H3RMA29962 (campo dedicado) |
| linhas | Artigos encomendados | 3 × Taipais Madeira @ 2100€ | 1 × Caixa aberta alu @ 1750€ |
| total_sem_iva | Valor total sem IVA | 6300.00€ | 1835.00€ |

### Opcionais (extrair se presentes)

| Campo | Descrição |
|-------|-----------|
| condicoes_pagamento | Ex: "90 dias, 0% desconto" |
| prazo_entrega | Data ou nº dias úteis |
| data_entrega | Data concreta se indicada |
| local_entrega | Morada de entrega |
| contacto_nome | Quem fez a encomenda |
| contacto_email | Email do contacto |
| contacto_telefone | Telefone do contacto |
| referencia_proposta | Ref. do orçamento CSN aceite (ex: NB523.24.1) |
| comercial_csn | Quem negociou do lado CSN |
| taxa_iva | Percentagem IVA |
| total_com_iva | Valor total com IVA |
| observacoes | Texto livre, pode conter VINs ou instruções |
| linhas_extra | Serviços adicionais (ex: inspecção facultativa 85€) |
| grupo_empresarial | Grupo a que pertence (ex: Grupo JAP, Grupo Entreposto) |

---

## REGRA CRÍTICA: VIN

O VIN pode aparecer em 3 locais diferentes:

1. **Campo dedicado** — "Matrícula ou Chassis: VXEYDF6H3RMA29962" (Entreposto)
2. **Nas observações** — cortado ou junto com outros dados (Vesauto)
3. **Na descrição da linha** — junto com modelo do veículo

O agente tem que procurar nos 3 locais. Padrão VIN: 17 caracteres alfanuméricos, começa geralmente com VF1 (Renault França), VXE (Opel/Vauxhall), W0L (Opel Alemanha), WDB (Mercedes), etc.

Se a NE refere múltiplos VINs (ex: Vesauto com 3 por NE), cada VIN gera uma obra separada mas ligada à mesma NE.

---

## REGRA CRÍTICA: ENTIDADE DE FACTURAÇÃO

A empresa que encomenda pode ser diferente da empresa que paga.

Exemplo real:
- Maria João Cruz (Grupo JAP / Grupo Entreposto) faz a encomenda
- Empresa que encomenda: CARBY MOTION, SA
- NIF de facturação: 501410171 (pode ser Carby, pode ser Entreposto Europauto — ambas usam o mesmo NIF)

O agente deve extrair:
- `empresa_cliente` = quem aparece no cabeçalho da NE
- `nif_facturacao` = NIF nos "Dados de Facturação"
- `grupo_empresarial` = grupo mãe (JAP, Entreposto, etc.)

Na factura InvoiceXpress, usa SEMPRE o `nif_facturacao` e a `empresa_cliente` dos "Dados de Facturação", não do cabeçalho.

---

## REGRA CRÍTICA: NÚMERO DA NE NA FACTURA

"O presente número de encomenda terá de ser indicado em toda a documentação."

Esta frase existe em quase todas as NE de grupos grandes. Significa que:

1. A factura CSN TEM que conter o `numero_encomenda` no campo observações
2. A guia de remessa TEM que conter o `numero_encomenda`
3. Qualquer correspondência sobre esta obra TEM que referenciar o `numero_encomenda`

Sem isto, o departamento financeiro do cliente rejeita a factura.

---

## RELAÇÃO COM O CICLO DA OBRA

```
NE chega (email/PDF)
  │
  ├─ SKILL_GERAL classifica como REQ
  │
  ├─ SKILL_REQUISICAO extrai campos base
  │   ├─ numero_encomenda
  │   ├─ empresa + NIF
  │   ├─ VINs
  │   ├─ linhas (artigos, quantidades, preços)
  │   └─ condições (pagamento, entrega)
  │
  ├─ Se cliente tem skill específico (SKILL_GRUPOJAP):
  │   └─ Refina extracção com formato do cliente
  │
  ├─ REGISTA em tabela requisicoes
  │   └─ Liga à lead existente ou cria nova
  │
  ├─ CRIA obras (1 por VIN)
  │   └─ Liga cada obra à requisição
  │
  └─ Quando obra termina:
      └─ FACTURA referencia nº NE + VINs + matrículas
```

---

## QUANDO NÃO EXISTE NE FORMAL

Muitos clientes pequenos ou particulares não emitem NE. Nesse caso:

- A "requisição" é o registo interno no sistema (ID da lead/obra)
- O campo `numero_encomenda` fica com o ID da obra (ex: L2026-001-01)
- O COC da carroçaria serve como referência do trabalho
- A factura referencia o ID da obra + VIN

A NE formal só é obrigatória para grupos grandes. Mas o sistema trata todos da mesma forma — simplesmente o `numero_encomenda` é interno em vez de externo.

---

## FORMATOS CONHECIDOS

| Cliente | Formato NE | Onde está o VIN | NIF | Exemplo |
|---------|-----------|-----------------|-----|---------|
| Vesauto | NE + 6 dígitos | Observações (cortado) | 501316272 | NE897290 |
| Grupo Entreposto / Carby Motion | Ano+seq (13 dígitos) | Campo dedicado | 501410171 | 2025010286986 |
| Grupo Entreposto / Europauto | Ano+seq (13 dígitos) | Campo dedicado | 501410171 | 2024040271286 |
| Sem NE (particular) | ID obra CSN | N/A — usa VIN da lead | Variável | L2026-001-01 |

Novos formatos são adicionados como skills de cliente (Camada 2) à medida que aparecem.

---

## RELAÇÃO COM OUTROS SKILLS

| Skill | Relação |
|-------|---------|
| SKILL_GERAL | Classifica como REQ → dispara este skill |
| SKILL_GRUPOJAP (futuro) | Refina extracção para formatos Vesauto/Entreposto |
| SKILL_FORNECEDOR (Chagas, etc.) | Não relacionado — fornecedores enviam facturas, não NE |
| Agente Financeiro | Recebe o total e condições de pagamento para controlo de cobranças |
| Agente Comercial (Marta) | Recebe a NE como confirmação de venda |
