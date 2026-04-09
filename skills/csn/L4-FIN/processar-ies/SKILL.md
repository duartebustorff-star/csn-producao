---
name: processar-ies
codigo: CSN-L4-FIN-0002-2026
nivel_isa95: L4-BPL (FIN)
camada: C3 (Agente Documental + Agente Financeiro)
description: >
  Processa documentos IES/DA (Informação Empresarial Simplificada) da AT. Extrai automaticamente a Demonstração de Resultados, Balanço, detalhe FSE, pessoal, e metadados da declaração. Insere em demonstracao_resultados + ies_declaracoes. Usa esta skill quando o utilizador fizer upload de uma IES, quando o sistema classificar um documento como tipo 'IES', ou quando for mencionado "IES", "declaração anual", "informação empresarial simplificada", "demonstração de resultados AT".
---

# Processar IES/DA — CSN-L4-FIN-0002-2026

**Nível ISA-95:** L4-BPL (FIN)
**Camada:** C3 (Agente Documental + Agente Financeiro)
**Route:** `/api/documentos/processar-ies` (CSN-L3-DOC-0004-2026)
**Fonte legal:** Código do IRC, Portaria 208/2007 (IES)
**Modelo IA:** claude-haiku-4-5-20251001

## Objectivo

Extrair todos os dados financeiros de uma IES/DA submetida à AT e inserir nas tabelas `demonstracao_resultados` (CSN-L4-FIN-0003-2026) e `ies_declaracoes` (CSN-L4-FIN-0004-2026) do Supabase. Zero intervenção manual.

## Quando usar

- Upload de PDF com nome contendo "IES" ou "Ies"
- Documento classificado como tipo `IES` pelo route `/api/documentos/classificar`
- Utilizador pede para processar declaração anual ou demonstração de resultados
- Novo ano fiscal fechado — processar IES do ano anterior

## Endpoint

```
POST /api/documentos/processar-ies
Content-Type: application/json
Body: { "pdf_base64": "...", "documento_id": "uuid (opcional)" }
```

## Resposta

```json
{
  "success": true,
  "ano": 2024,
  "resumo": {
    "vendas_servicos": 435155.64,
    "cmvmc": 239818.12,
    "fse": 54894.15,
    "gastos_pessoal": 137427.33,
    "ebitda": 6938.98,
    "resultado_liquido": 58.96,
    "ativo_total": 481968.42,
    "capital_proprio": 157056.18,
    "nr_pessoas": 8
  },
  "tabelas": ["demonstracao_resultados", "ies_declaracoes"]
}
```

## Campos extraídos

### Página 1 — Metadados
| Campo | Fonte IES |
|-------|-----------|
| ano | Campo 01 PERÍODO TRIBUTAÇÃO |
| identificacao | Identificação da Declaração |
| codigo_validacao | Cód. Validação |
| data_rececao | Data de Receção |
| nif | Campo 03 |
| cae_principal | Campo 04 |
| cc_nif | Campo 09.2 |
| representante_legal_nif | Campo 09.1 |
| referencial | Campo 02-A (NC-ME/NCRF-PE/NCRF/NIC) |

### Secção 03-A — Demonstração Resultados
| Campo | Código IES |
|-------|-----------|
| vendas_servicos | A5001 |
| subsidios_exploracao | A5002 |
| variacao_inventarios_producao | A5004 |
| cmvmc | A5006 |
| fse | A5007 |
| gastos_pessoal | A5008 |
| outros_rendimentos_ganhos | A5015 |
| outros_gastos_perdas | A5016 |
| depreciacao_amortizacao | A5018 |
| juros_gastos | A5022 |
| imposto_rendimento | A5024 |
| resultado_liquido | A5025 |

### Secção 04-A — Balanço
| Campo | Código IES |
|-------|-----------|
| ativo_total | A5127 |
| ativo_fixo_tangivel | A5101 |
| inventarios | A5113 |
| clientes | A5115 |
| caixa_depositos | A5125 |
| capital_proprio | A5141 |
| passivo_total | A5160 |
| fornecedores | A5148 |

### Secção 061-A — Detalhe FSE (contas SNC)
6221 trabalhos especializados, 6223 vigilância, 6226 conservação, 6231 ferramentas, 6233 material escritório, 6234 artigos oferta, 6241 electricidade, 6242 combustíveis, 6243 água, 6251 deslocações, 6261 rendas, 6262 comunicação, 6263 seguros, 6265 contencioso, 6267 limpeza

### Secção 05291-A / 05292-A — Pessoal
Nr médio pessoas, horas trabalhadas, remunerações (A6027), encargos SS (A6035), seguros AT (A6036), formação (A6039)

### Secção 0526-A — Imposto
Tributações autónomas (A5957), taxa efectiva (A5958)

## Tabelas destino

- `demonstracao_resultados` — UPSERT por campo `ano` (UNIQUE)
- `ies_declaracoes` — UPSERT por campo `ano` (UNIQUE)
- `documentos` — UPDATE `processado = true` (se documento_id fornecido)

## REGRA BANDEIRA

Nenhum valor pode ser inventado ou estimado. Se o campo não existir no PDF, o Haiku retorna null e fica NULL no Supabase. Nenhuma excepção.

## Uso via PowerShell

```powershell
cd C:\Users\Utilizador\Projectos-AI\csn-producao
$bytes = [System.IO.File]::ReadAllBytes("C:\Users\Utilizador\Downloads\IES_2023.pdf")
$base64 = [Convert]::ToBase64String($bytes)
$body = @{pdf_base64=$base64} | ConvertTo-Json -Depth 1
Invoke-WebRequest -Uri "https://csn-producao.vercel.app/api/documentos/processar-ies" -Method POST -Body $body -ContentType "application/json"
```
