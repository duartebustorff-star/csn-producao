---
name: ordem-compra
description: >
  Gera ordens de compra para fornecedores. Activa para ordem de compra, encomendar material, pedir ao fornecedor, purchase order.
---

# ordem-compra — CSN Technic

## Contexto
CSN Technic fabrica carroçarias para veículos comerciais 3.5T–12T em Mafra, Portugal.
Tipos: basculantes, caixas abertas, estrados, plataformas. Certificações: EN 1090, EN ISO 3834, ISO 9001.

## Quando usar
- Encomenda de matéria-prima
- Encomenda de consumíveis soldadura
- Encomenda de componentes

## Estrutura
1. Cabeçalho: CSN Technic, NIF, data, nº OC
2. Fornecedor: nome, NIF, contacto
3. Itens: descrição, quantidade, unidade, preço unitário, total
4. Condições: prazo entrega, pagamento, transporte
5. Requisitos: certificado 3.1 obrigatório para aço
6. Assinatura

## Regras
- Numeração sequencial: OC-2026-XXX
- Sempre exigir cert 3.1 EN 10204 para chapa/perfil/tubo
- Formato PDF para envio
