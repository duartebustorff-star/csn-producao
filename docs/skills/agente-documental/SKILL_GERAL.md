# SKILL_GERAL — Agente Documental · Classificador
### Código: CSN-L3-DOC-SKL-000-2026
### Nível ISA-95: L3-DOC (Document Management)
### Camada: 1 — Classificação (executa SEMPRE, antes de qualquer skill de fornecedor)

---

## PROPÓSITO

Este skill é o PRIMEIRO a executar para qualquer documento que entra no sistema.
Determina 4 coisas:

1. **Tipo de documento** — FAT, CERT31, GR, FT, EXTRACTO, ORCAMENTO, COBRANCA, EMAIL
2. **Categoria** — PRODUCAO, CONTABILIDADE, SEGUROS, DEALERS-CLIENTES, ENGENHARIA, UTILITIES, INTERNO-CSN, OUTROS
3. **Fornecedor** — identificação por domínio email ou padrão de nome
4. **Afecta stock/produção?** — SIM ou NÃO → esta é a decisão crítica

Se afecta stock → dispara SKILL_FORNECEDOR (Camada 2).
Se não afecta → regista e encaminha (financeiro, arquivo, etc.).

---

## REGRAS DE CLASSIFICAÇÃO POR TIPO

### FAT (Factura)
**Como reconhecer:**
- Assunto contém: `Fatura`, `Factura`, `Invoice`, `FT `, `FR `, `FE `, `Recibo`
- Anexo PDF com nome contendo: `fatura`, `invoice`, `FT_`, `FR_`, `FE_`
- Remetente com domínio `fatura*@`, `faturacao@`, `billing@`, `noreply@` + contexto factura

**Nota:** Um email que ACOMPANHA uma factura (ex: "Segue em anexo a factura") é EMAIL, não FAT. A FAT é o anexo PDF.

### CERT31 (Certificado de Material 3.1 · EN 10204)
**Como reconhecer:**
- Assunto contém: `Certificado`, `Certificate`, `Cert 3.1`, `certificados material`
- Anexo com: `cert`, `certificate`, `3.1`, `material_cert`
- Remetente é fornecedor de produção conhecido (Chagas, etc.)

**REGRA:** CERT31 é SEMPRE relevante para produção. Sempre dispara Camada 2.

### GR (Guia de Remessa)
**Como reconhecer:**
- Assunto contém: `Guia`, `Remessa`, `Entrega`, `Delivery note`, `GR `
- Anexo com: `guia`, `remessa`, `delivery`, `GR_`

**Avaliar:** Se de fornecedor de produção → afecta stock. Se de contabilidade (guia impostos) → não afecta stock.

### FT (Ficha Técnica)
**Como reconhecer:**
- Assunto contém: `Ficha técnica`, `Technical data`, `Especificação`, `Specification`
- Anexo com: `ficha_tecnica`, `TDS`, `spec`, `datasheet`

**Avaliar:** Se de fornecedor de material → associar ao catálogo de materiais. Se de dealer → associar à lead/obra.

### EXTRACTO (Extracto de Conta)
**Como reconhecer:**
- Assunto contém: `Extracto`, `Extrato`, `conta corrente`, `Pendentes`, `Statement`
- Anexo com: `extracto`, `extrato`, `conta_corrente`, `statement`

**Acção:** Sempre encaminhar para Agente Financeiro. Nunca afecta stock.

### ORCAMENTO (Orçamento / Cotação)
**Como reconhecer:**
- Assunto contém: `Orçamento`, `Cotação`, `Quotation`, `Oferta`, `Proforma`, `PROFORMA`
- Anexo com: `orcamento`, `cotacao`, `quotation`, `oferta`, `proforma`

**Acção:** Registar como cotação pendente. Se de fornecedor produção → flag para comparação de preços.

### COBRANCA (Aviso de Cobrança / Vencimento)
**Como reconhecer:**
- Assunto contém: `Cobrança`, `Vencimento`, `Pagamento`, `Dívida`, `Overdue`

**Acção:** Alerta imediato Agente Financeiro. Nunca afecta stock.

### EMAIL (Correspondência genérica)
**Default:** Tudo o que não encaixa nos tipos acima.

---

## DECISÃO CRÍTICA: AFECTA STOCK/PRODUÇÃO?

### SIM — dispara SKILL_FORNECEDOR (Camada 2)
O documento afecta stock se cumpre QUALQUER destes critérios:

1. **Remetente é fornecedor de produção registado:**
   - @chagas.pt → aço, tubos, perfis
   - @coprial.pt → gases soldadura, equipamentos
   - @pecol.pt → parafusos, colas, fio de solda
   - @polifer.pt → tinta
   - @madeicentro.pt → madeira, taipais
   - bielco.elio@bielco.pt → alumínio, réguas
   - corte@silfesan.pt → corte laser, subcontratação
   - comercial@publispeed.com → chapas impressas alumínio

2. **Tipo é CERT31** — sempre produção, independente do remetente

3. **Conteúdo da factura menciona materiais de produção:**
   - Aço, chapa, tubo, perfil, alumínio
   - Gás, argon, CO2, oxigénio, Arco 15
   - Fio de solda, eléctrodo, consumível soldadura
   - Tinta, primário, diluente
   - Parafuso, porca, anilha, rebite
   - Madeira, taipal, contraplacado

### NÃO — registo genérico
- Facturas de utilities (NOS, Plenitude, portagens)
- Facturas de serviços (contabilidade, seguros, SaaS)
- Newsletters, marketing, spam
- Correspondência interna CSN
- Emails de plataformas (Pipedrive, Machineseeker, Alibaba)

---

## ROUTING POR CATEGORIA

| Categoria | Afecta Stock? | Destino |
|-----------|--------------|---------|
| PRODUCAO | **SIM** | SKILL_FORNECEDOR → materiais, lotes, stock |
| CONTABILIDADE | Não | Agente Financeiro (facturas, impostos, guias pgto) |
| SEGUROS | Não | Agente Financeiro (apólices, cobranças) |
| DEALERS-CLIENTES | Parcial* | Se CERT31/GR de chassis → associar obra. Resto → CRM |
| ENGENHARIA | Parcial* | Se material/equipamento → stock. Se formação/CAD → arquivo |
| UTILITIES | Não | Agente Financeiro (facturas recorrentes) |
| INTERNO-CSN | Parcial* | Depende do conteúdo — reencaminhar para departamento |
| OUTROS | Não | Arquivo |

*Parcial = precisa análise do conteúdo, não basta a categoria.

---

## PIPELINE COMPLETO

```
EMAIL CHEGA
  │
  ├─ 1. IDENTIFICAR REMETENTE
  │   └─ Match domínio email → fornecedor conhecido?
  │   └─ Match nome remetente → variante conhecida?
  │   └─ Resultado: fornecedor_id + categoria
  │
  ├─ 2. CLASSIFICAR TIPO DOCUMENTO
  │   └─ Analisar assunto (patterns acima)
  │   └─ Analisar nome dos anexos
  │   └─ Resultado: tipo_doc (FAT, CERT31, GR, FT, etc.)
  │
  ├─ 3. DECISÃO: AFECTA STOCK?
  │   └─ Fornecedor de produção? → SIM
  │   └─ Tipo = CERT31? → SIM
  │   └─ Conteúdo menciona materiais produção? → SIM
  │   └─ Nenhum dos anteriores? → NÃO
  │
  ├─ 4A. SE AFECTA STOCK → CAMADA 2
  │   └─ Carregar SKILL_FORNECEDOR correspondente
  │   └─ Extrair: materiais, quantidades, preços, lotes
  │   └─ Registar em: materiais + lotes_material + consumos
  │   └─ Actualizar stock
  │   └─ Se CERT31 → registar em certificados_material
  │   └─ Se factura → registar em invoicexpress_faturas + reconciliar
  │
  └─ 4B. SE NÃO AFECTA STOCK → REGISTO GENÉRICO
      └─ Registar documento (tipo, categoria, fornecedor, data)
      └─ Se FAT → invoicexpress_faturas (sem detalhe material)
      └─ Se COBRANCA/EXTRACTO → alerta Agente Financeiro
      └─ Arquivar com metadata
```

---

## TABELA DE DOMÍNIOS → FORNECEDOR + CATEGORIA

### PRODUÇÃO (afecta stock)
```
@chagas.pt           → CHAGAS        → PRODUCAO
@coprial.pt          → COPRIAL       → PRODUCAO
@pecol.pt            → PECOL         → PRODUCAO
@polifer.pt          → POLIFER       → PRODUCAO
@madeicentro.pt      → MADEICENTRO   → PRODUCAO
bielco.elio@bielco.pt → BIELCO       → PRODUCAO
*@silfesan.pt        → SILFESAN      → PRODUCAO
comercial@publispeed.com → PUBLISPEED → PRODUCAO
*@multiplacas.pt     → MULTIPLACAS   → PRODUCAO
*@hidraulicentro.pt  → HIDRAULICENTRO → PRODUCAO
```

### CONTABILIDADE (não afecta stock)
```
*@assertiva.pt       → ASSERTIVA     → CONTABILIDADE
*@gestecla.pt        → GESTECLA      → CONTABILIDADE
*@saphety.com        → SAPHETY       → CONTABILIDADE
*@seg-social.pt      → SEG_SOCIAL    → CONTABILIDADE
```

### SEGUROS (não afecta stock)
```
*@villasboas.pt      → VILLASBOAS    → SEGUROS
*@allianz.pt         → ALLIANZ       → SEGUROS
*@mapfre.pt          → MAPFRE        → SEGUROS
```

### UTILITIES (não afecta stock)
```
*@eniplenitude.pt    → PLENITUDE     → UTILITIES
*@nos*.pt            → NOS           → UTILITIES
*@geiratlantico.pt   → PORTAGENS     → UTILITIES
*@securitas*.pt      → SECURITAS     → UTILITIES
```

### DEALERS-CLIENTES (parcial)
```
*@domcarro.pt        → DOMCARRO      → DEALERS-CLIENTES
*@csantosvp.pt       → CSANTOS_VP    → DEALERS-CLIENTES
*@santogal.pt        → SANTOGAL      → DEALERS-CLIENTES
*@stellantis.com     → STELLANTIS    → DEALERS-CLIENTES
*@grupojap.pt        → GRUPOJAP      → DEALERS-CLIENTES
```

### ENGENHARIA (parcial)
```
*@castrocomposites.com → CASTRO_COMP  → ENGENHARIA
*@cadflow.pt         → CADFLOW       → ENGENHARIA
*@ochmann-maschinen.de → OCHMANN     → ENGENHARIA
*@jjmf.pt           → JJMF          → ENGENHARIA
```

---

## PORQUÊ SKILLS POR FORNECEDOR?

Cada fornecedor de produção apresenta os MESMOS materiais em formatos DIFERENTES nas facturas:

- **Chagas** usa referências internas (40050035) e nomes genéricos ("chapa 3mm S355")
- **Coprial** usa referências FE (FE 120B2226/XX) e nomes de gás ("Arco 15", "O2 ind")
- **Pecol** usa referências NAC/ALV (25NAC/42299) e códigos produto
- **Bielco** usa referências de oferta (52103) e proformas (1005145)

Sem skills específicas por fornecedor, o sistema não consegue extrair quantidades e preços correctamente. O SKILL_GERAL classifica. O SKILL_FORNECEDOR extrai.

---

## RELAÇÃO COM OUTROS AGENTES

| Agente | Recebe do Classificador |
|--------|------------------------|
| Agente Financeiro | FAT genéricas, extractos, cobranças, guias pgto |
| Agente RH | Recibos, declarações, correspondência RH |
| Sr. Manuel | Alertas de material recebido (stock actualizado) |
| Luísa | Resumo semanal de documentos processados |
