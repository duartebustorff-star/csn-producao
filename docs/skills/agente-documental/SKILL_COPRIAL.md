# SKILL_COPRIAL — Agente Documental
### Código: CSN-L3-DOC-SKL-002-2026
### Nível ISA-95: L0-MAT (Material Model) + L0-EQP (Equipment Model)
### Fornecedor: Coprial — Gases soldadura + equipamentos

---

## IDENTIFICAÇÃO

| Campo | Valor |
|-------|-------|
| Nome comercial | Coprial |
| Domínio email | `coprial.pt` |
| Contactos conhecidos | `geral@coprial.pt`, `nataliacunha@coprial.pt`, `saraideia@coprial.pt` |
| Material ISA-95 | Gases soldadura (O₂, H₂, Arco 15/Argon+CO₂), equipamentos soldadura |
| Módulo Opus | L0-MAT + L0-EQP → L3-INV (stock gases) → L3-MNT (equipamento) |

---

## PERFIL DOCUMENTAL (17030 registos, Jan 2024 — Mar 2026)

| Tipo Doc | Qtd | Relevância |
|----------|-----|------------|
| EMAIL | 54 | Avisos vencimento, facturas, conta corrente |
| FAT | 33 | Facturas de gás e equipamento — maior volume de facturas entre fornecedores produção |
| ANEXO | 7 | Extractos conta, pendentes, scans |
| FT | 3 | Fichas técnicas / avisos vencimento classificados como FT |

**Volume médio:** ~4 registos/mês. Pico em Ago 2025 (21 registos). Facturação regular mensal.

---

## REGRAS DE CLASSIFICAÇÃO

### FAT (Factura)
**Padrão assunto:** `Fatura de Encargos FE`, `FE 120B2226/*`, `acail`
**Formato referência:** `FE 120B2226/XX` (numeração sequencial Coprial)
**Acção:**
1. Extrair: nº fatura, valor, data, itens (tipo gás, quantidade m³/garrafas)
2. Registar em `invoicexpress_faturas`
3. Actualizar stock consumíveis em `materiais_consumiveis` (Migration 017)
4. Reconciliar com `movimentos_bancarios`
5. **Nota:** Assunto "acail" é factura electrónica — mesmo tratamento

### FT (Ficha Técnica)
**Padrão assunto:** `Aviso de vencimento`
**Nota:** Cowork classificou avisos de vencimento como FT — na realidade são avisos financeiros.
**Acção:** Reclassificar como AVISO_FINANCEIRO. Encaminhar para Agente Financeiro com prazo de pagamento.

### ANEXO (Genérico)
**Padrões identificados:**
- `*carlosnascimento*` → extracto conta / pendentes
- `*PendentesDocnascimento*` → lista de documentos pendentes
- `S22C-*` → scan digitalizado (provavelmente guia assinada)
**Acção:** Extractos → Agente Financeiro. Scans → associar a entrega.

### EMAIL (Correspondência)
**Padrão assunto:** `Aviso de vencimento`, `Fatura de Encargos`, `acail`
**Acção:** Arquivar. Emails com "vencimento" → marcar prazo no calendario.

---

## PIPELINE DE PROCESSAMENTO

```
Email chega de @coprial.pt
  ├─ Assunto contém "Fatura" ou "FE 120B" ou "acail"? → FAT
  │   └─ Extrair: nº fatura, valor, itens (gás tipo + qty)
  │   └─ Registar em invoicexpress_faturas
  │   └─ Actualizar stock consumíveis
  │   └─ Reconciliar com movimentos_bancarios
  │
  ├─ Assunto contém "vencimento"? → AVISO_FINANCEIRO
  │   └─ Extrair: valor, prazo, referência
  │   └─ Encaminhar para Agente Financeiro
  │   └─ Criar alerta de prazo
  │
  ├─ Anexo com "Pendentes" ou "extracto"? → EXTRACTO
  │   └─ Encaminhar para Agente Financeiro
  │
  └─ Resto → EMAIL (arquivar com metadata)
```

---

## NORMAS APLICÁVEIS

| Norma | Requisito | Impacto Coprial |
|-------|-----------|-----------------|
| EN ISO 3834-3 §10 | Controlo consumíveis soldadura | Rastrear lote de gás por período de uso |
| EN 1090-2 §6.3 | Gases de protecção conformes | Gás correcto por WPS (ex: Arco 15 para MAG) |
| EN ISO 14175 | Classificação gases soldadura | Verificar tipo gás vs WPS aprovado |
| ISO 9001 §7.4 | Controlo de compras | Avaliação fornecedor + registos |

---

## ALERTAS AUTOMÁTICOS

1. **Stock gás baixo:** Se consumo mensal > entrega mensal por 2 meses → alerta reposição
2. **Gás errado:** Se WPS especifica Arco 15 e factura mostra outro gás → alerta QMS
3. **Factura vencida:** Aviso de vencimento sem pagamento registado em 15 dias → alerta Agente Financeiro
4. **Consumo anómalo:** Variação >30% no consumo mensal de gás → alerta para verificar fugas ou desperdício
