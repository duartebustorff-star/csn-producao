# SKILL_POLIFER — Agente Documental
### Código: CSN-L3-DOC-SKL-004-2026
### Nível ISA-95: L0-MAT (Material Model)
### Fornecedor: Polifer — Tinta

---

## IDENTIFICAÇÃO

| Campo | Valor |
|-------|-------|
| Nome comercial | Polifer |
| Domínio email | `polifer.pt` |
| Contactos conhecidos | `encomendas@polifer.pt` |
| Material ISA-95 | Tinta, primários, diluentes, acessórios pintura |
| Módulo Opus | L0-MAT → L3-INV (stock tinta) → L0-PHY (cabine pintura) |

---

## PERFIL DOCUMENTAL (17030 registos, Jan 2024 — Mar 2026)

| Tipo Doc | Qtd | Relevância |
|----------|-----|------------|
| EMAIL | 6 | Pedidos cotação, encomendas, listagem produtos |
| ANEXO | 10 | Orçamentos PDF, fotos produto (jpg) |

**Volume:** Baixo (16 registos total). Activo Mai-Jun e Ago 2025. Sem facturas no email — facturação provavelmente em papel ou outro canal.

---

## REGRAS DE CLASSIFICAÇÃO

### ANEXO (Genérico)
**Padrões identificados:**
- `Orcamento_INTL2_NNN.pdf` → orçamento Polifer (formato `INTL2_` + sequencial)
- `1000027105__1_.jpg` → foto produto / amostra
**Acção:**
1. Orçamentos → extrair itens, quantidades, preços. Registar como cotação.
2. Fotos → associar ao produto/cor para referência futura.

### EMAIL (Correspondência)
**Padrões assunto:**
- `listagem de produtos` → catálogo ou lista de preços
- `Encomenda` → confirmação encomenda
- `Orçamento` → acompanha orçamento em anexo
- `Braçadeiras com base` → pedido específico (acessórios)
**Acção:** Arquivar. Se assunto menciona "Encomenda" ou "Orçamento" → associar aos anexos.

---

## PIPELINE DE PROCESSAMENTO

```
Email chega de @polifer.pt
  ├─ Tem anexo PDF "Orcamento_*"? → ORCAMENTO
  │   └─ Extrair: nº orçamento, itens, quantidades, preços
  │   └─ Registar como cotação pendente
  │
  ├─ Tem anexo imagem (jpg/png)? → FOTO_PRODUTO
  │   └─ Associar ao produto / cor / referência
  │
  ├─ Assunto "listagem de produtos"? → CATALOGO
  │   └─ Guardar como referência de preços
  │
  └─ Resto → EMAIL (arquivar)
```

---

## NORMAS APLICÁVEIS

| Norma | Requisito | Impacto Polifer |
|-------|-----------|-----------------|
| EN 1090-2 §10 | Protecção anti-corrosão | Tinta deve ser adequada à classe de corrosividade |
| EN ISO 12944 | Sistemas de pintura anti-corrosão | Especificação do sistema de pintura por ambiente |
| ISO 9001 §7.4 | Controlo de compras | Registos de produto e lote |

---

## ALERTAS AUTOMÁTICOS

1. **Orçamento expirado:** Orçamento recebido > 60 dias sem encomenda → lembrete de renovação
2. **Stock tinta baixo:** Sem encomenda de tinta > 3 meses e obras em produção → alerta reposição

---

## NOTAS

- Volume documental baixo — Polifer é fornecedor pontual, não recorrente mensal
- Facturação pode chegar por outro canal (papel, outro email). Monitorizar.
- Quando Migration 017 implementar `materiais_consumiveis`, incluir tintas com referência EN 12944
