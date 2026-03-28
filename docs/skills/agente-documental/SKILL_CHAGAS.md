# SKILL_CHAGAS — Agente Documental
### Código: CSN-L3-DOC-SKL-001-2026
### Nível ISA-95: L0-MAT (Material Model)
### Fornecedor: Chagas — Aço, tubos, perfis, alumínio

---

## IDENTIFICAÇÃO

| Campo | Valor |
|-------|-------|
| Nome comercial | Chagas |
| Domínio email | `chagas.pt` |
| Contactos conhecidos | `martim.sousa@chagas.pt`, `paula.alves@chagas.pt`, `ana.ramos@chagas.pt`, `marisa.goncalves@chagas.pt`, `margarida.cardoso@chagas.pt`, `nuno.figueiredo@chagas.pt`, `sandra.reis@chagas.pt`, `jaime.rosa@chagas.pt`, `faturacao@chagas.pt` |
| Material ISA-95 | Aço estrutural, tubos, perfis, chapa, alumínio |
| Módulo Opus | L0-MAT → L3-INV (rastreabilidade) → L3-QMS (certificados 3.1) |

---

## PERFIL DOCUMENTAL (17030 registos, Jan 2024 — Mar 2026)

| Tipo Doc | Qtd | Relevância |
|----------|-----|------------|
| EMAIL | 102 | Pedidos cotação, confirmações encomenda, conta corrente |
| ANEXO | 32 | Guias, orçamentos, extractos conta, NIBs |
| FAT | 27 | Facturas de material (aço, perfis, chapas) |
| CERT31 | 6 | Certificados de material 3.1 (EN 10204) — CRÍTICO para EN 1090 |

**Volume médio:** ~7 registos/mês. Picos em Mai-Jun 2025 (37 registos) e Jan 2026 (18).

---

## REGRAS DE CLASSIFICAÇÃO

### FAT (Factura)
**Padrão assunto:** `Envio de Fatura`, `Fatura-Recibo`, `Fatura FR`, `Facturas`
**Padrão ficheiro:** `*CARLOS_SANTOS_NASCIMENTO*`, `*CSN*`, `*40050035*`
**Acção:** Registar em `invoicexpress_faturas` (campo `fornecedor_id`). Associar a obra se referência de GR presente. Reconciliar com `movimentos_bancarios`.

### CERT31 (Certificado de Material 3.1)
**Padrão assunto:** `CERTIFICADOS`, `GR 80*` (referência guia remessa Chagas)
**Acção CRÍTICA:** 
1. Extrair: qualidade aço, composição química, propriedades mecânicas, nº lote, nº certificado
2. Registar em tabela `certificados_material` (Migration 017)
3. Associar ao lote de material recebido
4. Vincular à obra em produção (rastreabilidade EN 1090)
5. **Sem certificado 3.1 → material NÃO pode ser usado em produção**

### ANEXO (Genérico)
**Padrões identificados:**
- `*40050035*` → extracto de conta / conta corrente Chagas
- `*Lista_NIBS*` → dados bancários
- `*30307249*`, `*30279964*` → guias de remessa / notas de encomenda
**Acção:** Classificar sub-tipo (extracto | guia | orçamento | outro). Extractos → Agente Financeiro. Guias → associar a material recebido.

### EMAIL (Correspondência)
**Padrão assunto:** `Pedido de cotação`, `conta corrente`, `encomenda`
**Acção:** Arquivar. Se contém referência a encomenda ou GR → extrair número e associar.

---

## PIPELINE DE PROCESSAMENTO

```
Email chega de @chagas.pt
  ├─ Tem anexo PDF com "Fatura" no nome? → FAT
  │   └─ Extrair: nº fatura, valor, data, NIF
  │   └─ Registar em invoicexpress_faturas
  │   └─ Tentar match com movimentos_bancarios
  │
  ├─ Tem anexo com "Certificado" ou assunto "CERTIFICADOS"? → CERT31
  │   └─ Extrair: nº cert, qualidade, lote, composição
  │   └─ Registar em certificados_material
  │   └─ Associar a recepção de material + obra
  │   └─ ⚠️ ALERTA se material usado sem cert
  │
  ├─ Tem anexo com "40050035" ou "extracto"? → EXTRACTO
  │   └─ Encaminhar para Agente Financeiro
  │
  └─ Resto → EMAIL (arquivar com metadata)
```

---

## NORMAS APLICÁVEIS

| Norma | Requisito | Impacto Chagas |
|-------|-----------|----------------|
| EN 10204 | Certificado 3.1 por lote | Cada entrega de aço DEVE ter cert 3.1 |
| EN 1090-2 | Rastreabilidade material → obra | Cada peça rastreável ao lote e cert |
| EN ISO 3834-3 | Controlo consumíveis soldadura | Fio de solda da Chagas (se aplicável) |
| ISO 9001 §7.4 | Controlo de compras | Avaliação fornecedor + registos |

---

## ALERTAS AUTOMÁTICOS

1. **CERT31 em falta:** Material recebido (GR) sem certificado 3.1 associado → alerta Duarte + bloquear uso
2. **Factura sem GR:** Factura recebida sem guia de remessa correspondente → alerta reconciliação
3. **Conta corrente divergente:** Saldo extracto Chagas ≠ saldo calculado Opus → alerta Agente Financeiro
