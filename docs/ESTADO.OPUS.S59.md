# ESTADO OPUS S59 — 13/05/2026

## Foco da sessão
S59 dedicada exclusivamente a facturação 2025+2026 e recuperação IVA. Sem alterações arquitecturais. Documentos canónicos mantidos (bump S58 → S59 sem alteração de conteúdo).

## Trabalho real executado

### Migrations aplicadas
- `correspondencia_email.efatura_id`: INTEGER → UUID (zero rows afectados — coluna estava 0% preenchida)

### Tabela criada
- `s59_atcuds_joana` (957 ATCUDs: 150 amarelos + 807 brancos)

### Análises
- **Sub Q:** 1.182 facturas 2025+2026 identificadas como "a procurar" (excluído amarelo Joana)
- **Sub O:** cruzamento Joana ↔ CSN ↔ AT efatura
- **Sub R.TEST Chagas:** 35 PDFs `correspondencia_email` — 0 matches úteis ($0.38)
- **M.2022 SAPO:** 1.051 PDFs processados — descobriu que ATCUD impossível pré-2023 ($14.75)
- **R.CHAGAS-TEMP Desktop:** 105 PDFs verificados — todos wrappers email (0 facturas reais)

### Entregáveis (ficheiros)
- `CHAGAS_Facturas_Em_Falta.xlsx` (267 facturas, todos os anos)
- `CHAGAS_Facturas_Em_Falta_2025_2026.xlsx` (33 fact, €6.525 IVA)
- `CSN_Efatura_2025_para_contabilista.xlsx` (Joana cruzamento)
- `atcuds_joana_amarelo.txt` + `atcuds_joana_branco.txt`

### Descobertas críticas
1. **ATCUD obrigatório só desde 2023** — match impossível para 2022 via ATCUD
2. **Bug schema:** `correspondencia_email.efatura_id` era INTEGER, conflito com `efatura.id` (UUID) — fix aplicado
3. **Pasta CHAGAS-TEMP Desktop:** wrappers email sem PDFs reais

### Custo Sonnet (real desta sessão)
- M.2025: $1.32
- M.2022: $14.75
- R.TEST Chagas: $0.38
- (Subs anteriores: ver relatórios Claude Code)

## Backlog → S60
- Enviar XLSX Chagas 2025+2026 à Marisa Gonçalves (decisão pendente Duarte)
- Gerar XLSX 2025+2026 para próximos top fornecedores (Madeicentro, Bielco, Multiplacas, Dhollandia, Eni)
- Sub R.FULL `correspondencia_email` (385 PDFs ~$6)
- Variáveis iLogic — `Floor-assembly-version-4_2-V2-params.xml`
- Webhook Vercel↔GitHub broken desde 30/04
- Briefing Murtaza inglês (longeron Fiat)

## Estado bandeira
Sub R.TEST revelou que o pipeline Router Apps Script NÃO está a correr extractor ATCUD em PDFs com `tipo_doc='FAT'` ou `'ANEXO'`. Decisão de fix arquitectural adiada para S60.
