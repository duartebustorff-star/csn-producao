# ADR-007 — Rastreabilidade de Materiais por Lote e FIFO

**Data:** 21/03/2026
**Estado:** ✅ Aceite
**Sessão:** 15

---

## Contexto

O sistema não tinha gestão de stock nem rastreabilidade de materiais. A EN 1090 e EN ISO 3834 obrigam a rastreabilidade de aço estrutural e consumíveis de soldadura por lote. Adicionalmente, materiais com prazo de validade (tintas, consumíveis) precisam de gestão FIFO para evitar uso de material degradado.

## Decisão

Dois níveis de rastreabilidade obrigatória e dois voluntários:

| Tipo de Material | Rastreabilidade | Norma |
|---|---|---|
| Aço estrutural (chapas, perfis, tubos) | **Obrigatória por lote** | EN 1090 + EN ISO 3834 |
| Consumíveis de soldadura (arame MIG, gás) | **Obrigatória por lote** | EN ISO 3834 |
| Fixações estruturais (parafusos estruturais) | **Obrigatória por caixa** | EN 1090 EXC2 |
| Madeira para taipais | **Recomendada** | EN 12642 + ISO 9001 |
| Tintas e primários | **Recomendada** | ISO 9001 + garantia |
| Consumo geral (parafusos não estruturais) | **Quantitativa** | Gestão interna |

**FIFO automático** aplicado a todos os materiais com prazo de validade.

**Qualificação de fornecedor**: fornecedores de aço estrutural e fixações estruturais devem fornecer certificados de conformidade. Fornecedores sem certificados são bloqueados pelo Agente Stock.

## Razão

A EN 1090 EXC2 obriga a que em caso de não-conformidade estrutural numa carroçaria entregue, seja possível identificar exactamente: que material (de que lote, de que fornecedor, com que certificado) foi usado em que junta, por que soldador, com que WPS. Sem esta rastreabilidade, a CSN não pode ser certificada EN 1090.

O FIFO é crítico para tintas (prazo de validade) e consumíveis de soldadura (absorvem humidade, afectam qualidade da soldadura e portanto a conformidade EN ISO 3834).

## Consequências

- Migration 016 cria tabelas: stocks, lotes_material, certificados_material, movimentos_stock
- O Agente Stock gere FIFO automaticamente — alerta quando lote mais recente está a ser usado antes do mais antigo
- A rastreabilidade lote → obra é a ligação entre o módulo Stock e o módulo QMS
- Fornecedores são qualificados pela Irina com base na capacidade de fornecer certificados
- A tabela `lotes_material` liga a `fornecedores` (via factura) e a `obras` (via consumo)
