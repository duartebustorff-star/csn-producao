# ESTADO OPUS — Sessão S52

**Projecto:** CSN Opus — ISA-95 Integrated Management System
**Repo:** `duartebustorff-star/csn-producao` (local: `C:\Users\Utilizador\Projectos-AI\csn-producao`)
**Supabase:** `oysfxhlzilazeznpaafc`
**Produção:** `csn-producao.vercel.app`
**Sessão anterior:** S51 (11/04/2026)
**HEAD S51:** `1649e7d`
**Commits S51:** `fecd024` → `1e40584` → `d8e3dcc` → `1649e7d`

---

## CONTEXTO S51 — O QUE FOI FEITO

### Pipeline Email End-to-End AUTOMÁTICO ✅
Email → O365 → Gmail → Apps Script v9 (5min, por mensagem) → Storage + Router v10 → ticket `pendente` → pg_cron (5min, timeout 58s) → Ag. Documental Sonnet → `documentos_fornecedor` + linhas + stock

**Testado e confirmado em produção** — facturas entram automaticamente sem intervenção humana.

### Arquitectura Documental por Ecossistema ✅
**Decisão S51:** Cada fornecedor tem as suas próprias tabelas com campos específicos. O NIF determina o ecossistema. Prompt Sonnet específico por fornecedor.

```
documentos_fornecedor (registo central genérico — NIF, ATCUD, total)
  ├── Ecossistema Chagas (NIF 500117152, fornecedor_id=10)
  │     ├── facturas_chagas + facturas_chagas_linhas (12 colunas por linha)
  │     ├── notas_credito_chagas + notas_credito_chagas_linhas
  │     └── extratos_chagas + extratos_chagas_movimentos
  ├── Ecossistema Pecol (NIF 501425527, fornecedor_id=34)
  │     └── facturas_pecol + facturas_pecol_linhas
  └── Genérico (fornecedores sem ecossistema)
        └── documentos_fornecedor_linhas
```

### Tabelas Criadas S51
- `documentos_fornecedor` — registo central genérico
- `documentos_fornecedor_linhas` — linhas genéricas
- `movimentos_stock` — trigger automático (factura→entrada, NC→saída)
- `materiais_fornecedor_ref` — mapeamento ref fornecedor → material CSN (UNIQUE fornecedor_id + referencia)
- `facturas_chagas` + `facturas_chagas_linhas` — 4 FT migradas, 24 linhas com dados reais
- `notas_credito_chagas` + `notas_credito_chagas_linhas` — vazias, prontas
- `extratos_chagas` + `extratos_chagas_movimentos` — vazias, prontas
- `facturas_pecol` + `facturas_pecol_linhas` — vazias, prontas
- UNIQUE index no ATCUD em `documentos_fornecedor` (anti-duplicados)

### Campos Específicos Chagas (12 colunas por linha)
| # | Campo | Exemplo |
|---|---|---|
| 1 | GR (guia_remessa) | 80234676 / 0080001089 |
| 2 | Data GR (data_guia) | 20/08/2025 |
| 3 | N.º Ref (referencia_encomenda) | Sr Luisa |
| 4 | N.º (numero_linha_chagas) | 1, 2, 3... |
| 5 | Código (referencia_chagas) | 1057110 |
| 6 | Descrição (descricao) | CH.GOTAS S235JR 2500x1250x3/5 |
| 7 | Qtd (quantidade) | 0.405 |
| 8 | Un (unidade) | TO, CH, M, CAL, CA, VAR |
| 9 | Preço Uni. (preco_unitario) | 1350.00 |
| 10 | Desc. (desconto_pct) | 30% — POR LINHA, não global |
| 11 | V.Líquido (valor_liquido) | 382.72 |
| 12 | V.c/ Imposto (valor_com_imposto) | 470.74 |

**Formatos Chagas:**
- **v1 (2024)**: GR com zeros (0080001089), "N.º Ref." com "Sr Luisa", 1 página
- **v2 (2025+)**: GR sem zeros (80234676), dimensões separadas na descrição, 2 páginas
- Campos extra por linha: `taxa_iva`, `qualidade_aco` (S235JR, S275JR, Zincor), `dimensoes_mm`

### Campos Específicos Pecol
- `serie_numero`: 25ALV/5328, 25NAC/55541
- `codigo_pecol` + `codigo_cliente`: 001022200000 / P222
- `guia_remessa`, `confirmacao_encomenda`, `encomenda_cliente`
- `local_carga`: ALVERCA, ÁGUEDA
- `portes`: valor portes (ex: €5.90)
- Unidade especial: **Ml = milheiro = 1000 unidades**

### Ficheiros de Código S51
| Ficheiro | Descrição |
|---|---|
| `src/lib/document-processors.ts` | Núcleo Ag. Documental (~550 linhas). Sonnet classifica+extrai. `normalizarNIF()`. Exporta `processarDocumento()` |
| `src/app/api/documental/processar/route.ts` | 3 modos: batch, upload multipart, reprocess storage paths |
| `src/app/api/router/classificar/route.ts` | Router v10: dedup por `message_id` |
| Apps Script v9 | Trigger 5min, processa por mensagem, dedup anexos por messageId |

### Infra Activa
- **pg_cron**: `agente-documental-batch` — `*/5 * * * *`, timeout 58s
- **Apps Script v9**: trigger 5min em `carrocariascsn@gmail.com`
- **ATCUD UNIQUE**: constraint em `documentos_fornecedor` — rejeita duplicados
- **Trigger stock**: `trg_movimento_stock_after_linha` — auto-cria `movimentos_stock`

### NOTA IMPORTANTE
O `documental/processar/route.ts` deployed em Vercel AINDA tem o batch mode antigo com Haiku. O modo reprocess e upload directo usam `processarDocumento` do `document-processors.ts` (Sonnet). O batch via pg_cron usa o código antigo. **PRECISA de actualização na S52.**

---

## OBJECTIVOS S52

### Prioridade 1 — Extractores Específicos por Fornecedor
O `document-processors.ts` precisa de routing por NIF:

```typescript
if (nif === '500117152') {          // Chagas
  return await processarFacturaChagas(pdf, supabase)
} else if (nif === '501425527') {   // Pecol
  return await processarFacturaPecol(pdf, supabase)
} else {
  return await processarFacturaGenerica(pdf, supabase)
}
```

Cada extractor tem prompt Sonnet dedicado com os campos exactos daquele fornecedor.

**Tarefas:**
- [ ] Extractor Chagas: prompt Sonnet 12 colunas → `facturas_chagas` + `_linhas`
- [ ] Extractor NC Chagas: mesma lógica → `notas_credito_chagas` + `_linhas`
- [ ] Extractor Pecol: prompt Sonnet campos Pecol → `facturas_pecol` + `_linhas`
- [ ] Unificar batch mode com Sonnet (substituir Haiku no batch do pg_cron)
- [ ] Deploy Vercel

### Prioridade 2 — Processar PDFs do Storage
- [ ] 44 PDFs Chagas (13 faturacao@ + 19 Marisa + 2 Ana + 2 Margarida NC + outros)
- [ ] 10 PDFs Pecol
- [ ] Usar modo reprocess em batches de 3

### Prioridade 3 — Materiais e Stock
- [ ] Quando ref desconhecida: Sonnet cria entrada em `materiais_fornecedor_ref` (confirmado=false)
- [ ] Matching automático: lookup `materiais_fornecedor_ref` antes de inserir linha
- [ ] Propagar `material_id` para `movimentos_stock`

### Prioridade 4 — Novos Fornecedores
- [ ] Bielco (36 PDFs) — analisar formato, criar ecossistema se justificar
- [ ] Coprial (34 PDFs) — analisar formato
- [ ] Fornecedores pequenos: tabela genérica é suficiente

### Pendentes S50 (ainda não feitos)
- [ ] Docs fecho S50 (6 ficheiros obrigatórios)
- [ ] Obras JAP custos + facturar 6×€2.100+IVA InvoiceXpress
- [ ] Desligar Power Automate O365
- [ ] FUSO CANTER-TUDO.json → tabela veiculos_tecnicos

---

## PDFs NO STORAGE POR PROCESSAR

| Fornecedor | Pasta Storage | PDFs | NIF | fornecedor_id |
|---|---|---|---|---|
| Chagas (faturacao) | FATURACAO-CHAGAS-PT | 13 | 500117152 | 10 |
| Chagas (Marisa) | MARISA-GON-ALVES-CHAGAS | 19 | 500117152 | 10 |
| Chagas (outros) | ANA-RAMOS/MARGARIDA/JAIME/JOAO | 6 | 500117152 | 10 |
| Chagas (CSN interno) | CSN-DEP-ADMINISTRATIVO/COMERCIAL | ~6 | 500117152 | 10 |
| Pecol | PECOL-FATURA-O | 10 | 501425527 | 34 |
| Bielco | BIELCO | 36 | ? | ? |
| Coprial | NATALIA-CUNHA-COPRIAL | 34 | ? | ? |

---

## DADOS NO SISTEMA (fim S51)

- **6** registos em `documentos_fornecedor` (4 Chagas + 2 outros)
- **4** facturas em `facturas_chagas` com **24 linhas** (campos específicos preenchidos)
- **19** referências Chagas em `materiais_fornecedor_ref` (1 match material CSN)
- **28** movimentos de stock
- **~90** tabelas Supabase
- **49+** migrations

---

## REGRAS IMPORTANTES

1. **Ecossistema por fornecedor é inviolável** — cada fornecedor tem tabelas próprias com campos específicos. Nunca forçar dados para tabela genérica quando existe ecossistema.
2. **O desconto é por LINHA** (Chagas) — nunca assumir desconto global. Extrair exactamente o que o PDF mostra.
3. **Nunca inventar valores** — direct source or NULL. Se o Sonnet não conseguir extrair um campo, fica NULL.
4. **ATCUD é UNIQUE** — constraint na BD, duplicados rejeitados automaticamente.
5. **NIF determina o ecossistema** — `normalizarNIF()` strip "PT" para NIFs portugueses.
6. **Sonnet em todo o lado** — volume baixo, custo irrelevante, elimina variância vs Haiku.

---

## COMANDOS INÍCIO S52

```powershell
cd C:\Users\Utilizador\Projectos-AI\csn-producao
Get-Content ESTADO_OPUS_S52.md
git log --oneline -5
```

Fazer download e upload dos docs:
- `docs/CSN-Controlo-OPUS-S51.pdf`
- `docs/csn-architecture-OPUS-S51.html`
