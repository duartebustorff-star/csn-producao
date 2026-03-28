# SKILL_MADEICENTRO — Agente Documental
### Código: CSN-L3-DOC-SKL-005-2026
### Nível ISA-95: L0-MAT (Material Model)
### Fornecedor: Madeicentro — Madeira / taipais

---

## IDENTIFICAÇÃO

| Campo | Valor |
|-------|-------|
| Nome comercial | Madeicentro |
| Domínio email | `madeicentro.pt` |
| Contactos conhecidos | `romi@madeicentro.pt`, `nunomarques@madeicentro.pt`, `joaonunes@madeicentro.pt`, `gildamonteiro@madeicentro.pt`, `noreply@madeicentro.pt` |
| Material ISA-95 | Madeira (Sapelli, Carvalho Francês), taipais, contraplacado marítimo |
| Módulo Opus | L0-MAT → L3-INV (stock madeira) |

---

## PERFIL DOCUMENTAL (17030 registos, Jan 2024 — Mar 2026)

| Tipo Doc | Qtd | Relevância |
|----------|-----|------------|
| EMAIL | 14 | Encomendas, extractos, prazos entrega, convites feira |
| ANEXO | 6 | Cartas, extractos conta |
| FAT | 2 | Facturas de madeira |

**Volume:** Baixo (22 registos total). Activo Jan-Mar 2024 e pontualmente depois. Fornecedor esporádico — encomendas por projecto, não recorrente.

---

## REGRAS DE CLASSIFICAÇÃO

### FAT (Factura)
**Padrão assunto:** `Entrega e valor encomenda`, `factura em divida`
**Acção:**
1. Extrair: nº fatura, valor, espécie madeira, dimensões
2. Registar em `invoicexpress_faturas`
3. Associar a obra (taipais são sempre para obra específica)
4. Reconciliar com `movimentos_bancarios`

### ANEXO (Genérico)
**Padrões identificados:**
- `Carta_CSN.pdf` → correspondência formal
- `CarlosNascimento.pdf` / `cARLOSnASCIMENTO_EXT.pdf` → extracto conta
- `CSN_ERxtrato.pdf` → extracto conta (typo no nome original)
**Acção:** Extractos → Agente Financeiro. Cartas → arquivar.

### EMAIL (Correspondência)
**Padrões assunto:**
- `Prazo de entrega de mercadoria` → seguimento encomenda
- `Extrato de conta` → acompanha extracto
- `CONVITE MADEICENTRO - FEIRA TEKTONICA` → marketing, arquivar
- `Carta` → correspondência formal
- `Transferencia da factura em divida` → cobrança
**Acção:** Emails de cobrança → alerta Agente Financeiro. Resto → arquivar.

---

## PIPELINE DE PROCESSAMENTO

```
Email chega de @madeicentro.pt
  ├─ Assunto contém "factura" ou "encomenda" + valor? → FAT
  │   └─ Extrair: valor, espécie madeira, dimensões
  │   └─ Registar em invoicexpress_faturas
  │   └─ Associar a obra activa
  │
  ├─ Anexo com "Extrato" ou "EXT"? → EXTRACTO
  │   └─ Encaminhar para Agente Financeiro
  │
  ├─ Assunto contém "divida" ou "transferencia"? → COBRANCA
  │   └─ Alerta Agente Financeiro — pagamento pendente
  │
  └─ Resto → EMAIL (arquivar)
```

---

## NORMAS APLICÁVEIS

| Norma | Requisito | Impacto Madeicentro |
|-------|-----------|---------------------|
| ISO 9001 §7.4 | Controlo de compras | Registos de encomenda e recepção |
| EN 12642 §5 | Componentes estruturais carroçaria | Taipais contribuem para resistência → especificação correcta |

---

## ALERTAS AUTOMÁTICOS

1. **Cobrança pendente:** Email com "dívida" ou "transferência" → alerta imediato Agente Financeiro
2. **Obra sem taipais:** Obra em fase de montagem sem encomenda Madeicentro registada → alerta produção

---

## NOTAS

- Fornecedor esporádico — pedidos por projecto, não stock recorrente
- Vários contactos (5 pessoas) — empresa com departamentos distintos
- Taipais de madeira são componente estrutural da carroçaria basculante — especificação de espécie e espessura deve constar no dossiê de obra (EN 12642)
