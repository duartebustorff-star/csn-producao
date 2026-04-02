---
name: CSN Opus — Fornecedor Chagas
version: 1.0
date: 02/04/2026
isa95_level: L3-DOC
department: Fornecedores
norm: EN 10204 · EN 1090-2 · ISO 9001 cl. 8.4
status: active
---

## Contexto

A Chagas e o fornecedor principal de aco e perfis da CSN.
Fornece: aco estrutural, tubos, perfis, chapa, aluminio.
Dominio email: @chagas.pt

### Contactos conhecidos

| Nome | Email | Funcao |
|------|-------|--------|
| Martim Sousa | martim.sousa@chagas.pt | Comercial |
| Paula Alves | paula.alves@chagas.pt | Comercial |
| Ana Ramos | ana.ramos@chagas.pt | Comercial |
| Marisa Goncalves | marisa.goncalves@chagas.pt | Comercial |
| Margarida Cardoso | margarida.cardoso@chagas.pt | Comercial |
| Nuno Figueiredo | nuno.figueiredo@chagas.pt | Comercial |
| Sandra Reis | sandra.reis@chagas.pt | Comercial |
| Jaime Rosa | jaime.rosa@chagas.pt | Comercial |
| — | faturacao@chagas.pt | Faturacao |

### Volume documental (Jan 2024 — Mar 2026)

| Tipo | Quantidade | Descricao |
|------|-----------|-----------|
| EMAIL | 102 | Pedidos orcamento, confirmacoes, extractos |
| ANEXO | 32 | Guias, orcamentos, extractos conta, NIBs |
| FAT | 27 | Faturas de material (aco, perfis, chapa) |
| CERT31 | 6 | Certificados material EN 10204 3.1 |
| **Total** | **167** | |

---

## KPIs Fornecedor — ISO 9001 cl. 8.4

| KPI | Nome | Formula | Estado | Fonte |
|-----|------|---------|--------|-------|
| I-2 | Prazo entrega vs prometido | dias_reais - dias_prometidos | **futuro** | requer campo data_prometida e data_recebida na encomenda |
| I-3 | Conformidade lote (cert. 3.1) | lotes_com_cert / total_lotes x 100 | **futuro** | requer tabela certificados_material ligada a recepcao |
| I-4 | Fornecedores activos com NIF | count where nif IS NOT NULL | **activo** | fornecedores (Chagas tem NIF) |
| I-5 | Faturado vs pago | total_faturado - total_pago | **activo** | /api/fornecedores/conta-corrente |
| Q-8 | Rastreabilidade materiais % | materiais com cert / total | **futuro** | mig. 017 materiais + certificados |

### Avaliacao fornecedor (ISO 9001 cl. 8.4)

A tabela `fornecedores` tem campos de avaliacao:
- `nota_qualidade` (1–5) — qualidade do material
- `nota_prazo` (1–5) — cumprimento de prazos
- `ultima_avaliacao` (DATE)
- `aprovado` (BOOLEAN)

---

## Pipeline de classificacao documental

Emails de @chagas.pt sao processados pelo Roteador (L3-DOC):

```
Email de @chagas.pt
  |
  +-- PDF com "Fatura" no nome? → FAT
  |     └ Extrair: n.o fatura, valor, data, NIF
  |     └ Registar em efatura
  |     └ Conciliar com movimentos_bancarios
  |
  +-- Assunto com "Certificado" ou "CERTIFICADOS"? → CERT31
  |     └ Extrair: n.o cert, qualidade aco, lote, composicao
  |     └ Registar em certificados_material
  |     └ Associar a recepcao de material + obra
  |     └ ALERTA se material usado sem certificado
  |
  +-- Contem "40050035" ou "extracto"? → EXTRACTO
  |     └ Encaminhar para dept. Financeiro
  |
  +-- Restante → EMAIL (arquivo com metadados)
```

---

## Instrucoes ao Agente

### Quando pedem a conta corrente da Chagas
1. Identificar o fornecedor_id da Chagas na tabela `fornecedores`
2. Chamar `/api/fornecedores/conta-corrente?fornecedor_id=X`
3. Apresentar: total faturado, total pago, saldo divida
4. Mostrar historico mensal (ultimos 6 meses)
5. Se saldo_divida > 0, destacar

### Quando pedem emails da Chagas
1. Consultar `emails_indice` WHERE fornecedor = 'Chagas'
2. Filtrar por tipo_doc se especificado (FAT, CERT31, EMAIL, ANEXO)
3. Ordenar por data_email DESC
4. Mostrar: assunto, remetente, data, tipo_doc

### Quando pedem documentos/faturas da Chagas
1. Consultar `documentos` WHERE fornecedor_id = X OR entidade_nome ILIKE '%chagas%'
2. Filtrar por tipo_documento se especificado
3. Devolver link Storage (signed URL)

### Quando pedem certificados de material
1. Consultar `emails_indice` WHERE fornecedor = 'Chagas' AND tipo_doc = 'CERT31'
2. Mostrar: certificado, lote, qualidade, data
3. Se pedirem certificado para uma obra especifica, cruzar com materiais da obra
4. ALERTA: material sem certificado EN 10204 3.1 e nao-conforme para EN 1090

### Quando pedem avaliacao do fornecedor
1. Consultar `fornecedores` WHERE nome ILIKE '%chagas%'
2. Mostrar: nota_qualidade, nota_prazo, aprovado, ultima_avaliacao
3. Se ultima_avaliacao > 12 meses, sugerir reavaliacao (ISO 9001 cl. 8.4)

---

## Tools disponiveis

### Leitura (Interface Departamental pode usar)
- `/api/fornecedores/conta-corrente` — faturado vs pago, historico mensal
- `emails_indice` — pesquisa directa Supabase (WHERE fornecedor = 'Chagas')
- `documentos` — pesquisa directa Supabase (WHERE fornecedor_id ou entidade_nome)

### Escrita (so nucleo)
- `/api/roteador` — classifica documento novo via Claude API
- `/api/documentos/upload` — upload documento ao Storage

---

## Tabelas Supabase envolvidas

| Tabela | Uso | Filtro Chagas |
|--------|-----|---------------|
| fornecedores | NIF, avaliacao, aprovacao | WHERE nome ILIKE '%chagas%' |
| efatura | faturas emitidas pelo fornecedor | WHERE fornecedor_id = X |
| movimentos_bancarios | pagamentos (match por NIF na descricao) | WHERE descricao ILIKE '%NIF%' |
| emails_indice | 102+ emails classificados | WHERE fornecedor = 'Chagas' |
| documentos | PDFs no Storage com metadados | WHERE fornecedor_id = X |

---

## Escalacao

- Saldo em divida > 30 dias → escalar para dept. Financeiro (Duarte)
- Fatura sem pagamento correspondente > 60 dias → alertar reconciliacao
- Material recebido sem certificado EN 10204 3.1 → **bloquear uso** e alertar Qualidade
- Avaliacao expirada (> 12 meses) → agendar reavaliacao ISO 9001
- Divergencia entre fatura e guia de remessa → solicitar esclarecimento a Chagas
- Preco unitario > 15% acima da ultima compra → alertar para renegociacao

---

## Pendentes para desbloquear KPIs

| KPI | O que falta | Prioridade |
|-----|-------------|-----------|
| I-2 | Tabela encomendas (data_prometida, data_recebida) | alta |
| I-3 | Tabela certificados_material ligada a recepcao_material | alta — critico EN 1090 |
| Q-8 | Migration 017 materiais + rastreabilidade lote → obra | media |

---

*CSN Opus · L3-DOC · EN 10204 · EN 1090-2 · ISO 9001 cl. 8.4 · 02/04/2026*
