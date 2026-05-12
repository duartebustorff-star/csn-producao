# S59 — Abertura

**Tema único:** Gestão Documental — Facturação 2025 para Contabilidade

**Estado:** S58 fechada. Carregar todos os 7 docs canónicos S58 + este ficheiro no início.

---

## Contexto — porquê esta sessão

Duarte precisa **com urgência** de entregar à contabilidade as facturas de 2025 da CSN. A entrega tem que **bater certo com o e-Fatura** (4.409 registos já importados na BD em sessões anteriores).

Esta sessão é **dedicada exclusivamente** a este tema. Outros tópicos pendentes (route.ts V3, KPIs, IWS, Eng. Validador) ficam para S60+.

---

## Estado factual da BD ao iniciar S59

### Dados disponíveis
- **`e_fatura`**: 4.409 registos importados (50 meses, abrange 2021-2026)
- **`movimentos_bancarios`**: 2.153 movimentos BPI importados
- **InvoiceXpress**: ligado, certificação AT 192, conta `carlosdossantosna`
- **`fornecedores`** (Mig016): existe, populada
- **`documentos_fornecedor`** + **`documentos_fornecedor_linhas`**: existem

### Lacunas conhecidas
- Falta tabela `empresa_dados` (SSoT da CSN) — backlog S57
- 4 fornecedores principais já em BD: **Chagas** (NIF 500117152, id=10), **Pecol** (501425527, id=34), **Ferromar/Ferpinta** (500911576, id=38)
- Estado da conciliação BPI ↔ e-Fatura ↔ InvoiceXpress: **não validado**

---

## Objectivos S59 (em ordem de execução)

### Bloco 1 — Diagnóstico (1ª hora)

1. **Inventário das facturas 2025**:
   - Quantas facturas de venda (emitidas) em 2025 estão em InvoiceXpress?
   - Quantas facturas de compra (recebidas) em 2025 em `e_fatura`?
   - Quantas estão classificadas vs por classificar?

2. **Gap analysis vs e-Fatura**:
   - Facturas no e-Fatura que ainda **não** estão em `documentos_fornecedor`
   - Facturas em `documentos_fornecedor` que **não** existem no e-Fatura
   - Discrepâncias de valor / data / NIF

3. **Estado contabilidade**:
   - Última factura entregue ao TOC e em que data?
   - Pergunta a fazer ao Duarte: prazo de entrega definitivo? formato preferido?

### Bloco 2 — Núcleos de fornecedor (2ª-3ª hora)

Cada fornecedor frequente precisa do seu próprio ecossistema BD — **não tabelas genéricas partilhadas**. Decisão arquitectural de sessões anteriores: *"É mais determinista, é mais fácil assim."*

**Núcleos a abrir** (priorizar pelos com mais facturas em 2025):

- **Chagas** (id=10) — aço estrutural
- **Pecol** (id=34) — parafusos / fixações
- **Ferromar/Ferpinta** (id=38) — chapa / perfis
- Outros a identificar pela análise de volume e-Fatura 2025

Cada núcleo terá:
- Tabela própria com schema dos documentos do fornecedor (ex: `chagas_facturas`, `pecol_facturas`)
- Skill `analise-factura-[fornecedor]` para parsing automático
- Workflow: PDF/email → skill → BD → conciliação e-Fatura

### Bloco 3 — Pipeline de entrega à contabilidade (4ª hora)

- Exportar Excel/PDF com todas as facturas 2025 + classificação
- Formato a definir com o TOC (consultar antes)
- Conciliar com e-Fatura para garantir que não há ausências
- Marcar como "entregue à contabilidade" na BD

---

## Decisões necessárias do Duarte no início

1. **Qual o TOC?** Nome + email para coordenar formato de entrega
2. **Prazo definitivo de entrega?** Hoje, esta semana, este mês?
3. **Já contactaste o TOC sobre preferência de formato?** (Excel? PDF? acesso a sistema?)
4. **Há facturas físicas em papel não digitalizadas?** Se sim, onde estão?
5. **Volume aproximado esperado de facturas 2025?** (estimativa para dimensionar trabalho)

---

## Documentos a carregar no início de S59

Os 7 docs canónicos S58:

1. `ESTADO.OPUS.S58.md`
2. `CSN-Controlo-OPUS-S58.pdf`
3. `csn-architecture-OPUS-S58.html`
4. `csn-kpis-isa95-S58.html`
5. `csn-skills-tools-registry-S58.html`
6. `CSN-CERT-ROADMAP-S58.html`
7. `mapa_normas_csn_v2.pdf` (estático, referência)

Plus este `S59_OPENING.md`.

---

## Comandos PowerShell de abertura

```powershell
cd C:\Users\Utilizador\Projectos-AI\csn-producao
git pull
Get-Content docs\ESTADO.OPUS.S58.md
```

Carregar os 7 docs no novo chat antes de qualquer pergunta.

---

## Notas importantes

- **REGRA BANDEIRA aplica:** nunca inventar valores, datas, NIFs, montantes. Tudo de fonte verificável (BD, e-Fatura, PDF original).
- **Verificar tabela `empresa_dados` antes de começar** — se ainda não existe, criar logo no início (migration 055).
- **PowerShell:** sempre `cd C:\Users\Utilizador\Projectos-AI\csn-producao` antes de tudo.
- **SQL:** sempre via Supabase SQL Editor, não PowerShell.

---

**Código documento:** `CSN-L4-FIN-OPN-001-2026`  
**Criado:** 11 de Maio 2026 (fim S58)  
**Próxima sessão:** S59
