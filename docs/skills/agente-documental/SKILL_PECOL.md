# SKILL_PECOL — Agente Documental
### Código: CSN-L3-DOC-SKL-003-2026
### Nível ISA-95: L0-MAT (Material Model)
### Fornecedor: Pecol — Parafusos, colas, silicone, fio de solda, consumíveis

---

## IDENTIFICAÇÃO

| Campo | Valor |
|-------|-------|
| Nome comercial | Pecol — Sistemas de Fixação, S.A. |
| Domínio email | `pecol.pt` |
| Contactos conhecidos | `apoiocliente@pecol.pt` (apoio), `fatura.eletronica@pecol.pt` (facturação) |
| Material ISA-95 | Parafusos, porcas, anilhas, colas, silicone, fio de solda, consumíveis diversos |
| Módulo Opus | L0-MAT → L3-INV (stock consumíveis) |

---

## PERFIL DOCUMENTAL (17030 registos, Jan 2024 — Mar 2026)

| Tipo Doc | Qtd | Relevância |
|----------|-----|------------|
| EMAIL | 22 | Encomendas, registo loja online, confirmações |
| FAT | 10 | Facturas electrónicas — formato estruturado |

**Volume médio:** ~3 registos/mês. Activo Abr-Ago 2025. Sem actividade em 2024.

---

## REGRAS DE CLASSIFICAÇÃO

### FAT (Factura)
**Padrão assunto:** `Fatura XXNAC/NNNNN de AAAA-MM-DD`, `Fatura XXALV/NNNN de AAAA-MM-DD`
**Formato referência:** `25NAC/42299` (nacional) ou `25ALV/4053` (Alvaiázere)
**Nota:** Pecol envia facturas electrónicas com formato muito estruturado — fácil de parsear.
**Acção:**
1. Extrair: nº fatura (regex `\d{2}[A-Z]{3}/\d+`), valor, data, itens
2. Registar em `invoicexpress_faturas`
3. Actualizar stock consumíveis em `materiais_consumiveis`
4. Se contém fio de solda → marcar como consumível EN 3834 (rastreabilidade obrigatória)
5. Reconciliar com `movimentos_bancarios`

### EMAIL (Correspondência)
**Padrões assunto:**
- `Encomenda XX/NNNNN [Nome]` → confirmação de encomenda. Extrair nº encomenda.
- `Registo Loja Online` → informação administrativa, arquivar
- `Fatura...` → email acompanha factura, arquivar com link à FAT
**Acção:** Extrair nº encomenda se presente. Arquivar com metadata.

---

## PIPELINE DE PROCESSAMENTO

```
Email chega de @pecol.pt
  ├─ De fatura.eletronica@pecol.pt? → FAT
  │   └─ Extrair: nº fatura, valor, data, itens
  │   └─ Se fio de solda → flag EN 3834
  │   └─ Registar em invoicexpress_faturas
  │   └─ Actualizar stock consumíveis
  │
  ├─ Assunto contém "Encomenda"? → ENCOMENDA
  │   └─ Extrair: nº encomenda, items, valor
  │   └─ Registar em tabela encomendas (futuro)
  │
  └─ Resto → EMAIL (arquivar)
```

---

## NORMAS APLICÁVEIS

| Norma | Requisito | Impacto Pecol |
|-------|-----------|---------------|
| EN ISO 3834-3 §10 | Controlo consumíveis soldadura | Fio de solda: rastrear lote, certificado, validade |
| EN 1090-2 §5.6 | Consumíveis de soldadura | Consumíveis conformes com WPS |
| EN ISO 18276 / 14341 | Classificação fios de solda | Verificar classe do fio vs WPS aprovado |
| ISO 9001 §7.4 | Controlo de compras | Registos de encomenda e recepção |

---

## ALERTAS AUTOMÁTICOS

1. **Fio de solda sem cert:** Encomenda de fio de solda sem certificado de lote → alerta QMS
2. **Stock baixo:** Consumível com stock < 2 semanas de consumo médio → alerta reposição
3. **Encomenda sem factura:** Encomenda confirmada sem factura correspondente em 30 dias → alerta
