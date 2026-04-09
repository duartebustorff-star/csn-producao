# ESTADO OPUS — Sessão 48 (FECHADA)
**Data:** 09/04/2026  
**HEAD:** 46fad79 (após BFG git-filter-repo 8.2GB→139MB)  
**Deploy:** csn-producao.vercel.app (2x deploy esta sessão)  
**Tabelas:** 84 | **Migrations:** 79 | **RPCs KPI:** 9+1 master

---

## REALIZADO S48

### Git Cleanup (crítico)
- `Marcas - Veiculos/` (8GB DXFs+ZIPs) removido do tracking
- `public/modelo-carrocaria.stl` (16MB) removido
- BFG git-filter-repo reescreveu histórico: 8.2GB → 139MB
- Force push com `--set-upstream origin main --force`

### CRM Pipeline Email Automático (OPERACIONAL)
- **Fluxo completo testado:** Email → Outlook geral@ → Reencaminha Gmail → Apps Script (5min) → Router Haiku → Ticket Supabase → Lead automática
- Google Apps Script v7 instalado em carrocariascsn@gmail.com
- IGNORAR mínimo (só sistema MS/Google/LinkedIn) — tudo resto vai ao Router
- Política anti-spam O365 desbloqueada (security.microsoft.com → forwarding enabled)
- Power Automate descartado (HTTP genérico é Premium pago)
- Router Haiku classifica: orcamento→COM+lead | factura→FIN | spam→arquivado
- Trigger `fn_ticket_to_lead` (AFTER INSERT): ticket COM orcamento → lead automática
- Trigger `fn_auto_close_spam` (BEFORE INSERT): spam → estado='arquivado'
- `identificar_remetente()` melhorada: consulta emails_indice (18k) + fornecedores + clientes

### KPIs
- Mapa completo 97 KPIs em 12 secções ISA-95 com 14 normas (HTML)
- 9 funções RPC: throughput, delivery, rentabilidade, custos, revenue_employee, pipeline, workforce, capacity, kpi_dashboard (master)
- `kpi_dashboard()` retorna 12 KPIs em tempo real num só call

### Tabelas Novas (5)
- `formacoes` (ISO 30414 §7.1 + ISO 45001 §7.2)
- `acidentes` (ISO 45001 §9.1.1)
- `residuos` (ISO 14001 §9.1.1)
- `auditorias` (ISO 9001 §9.2)
- `riscos` (ISO 31000 + ISO 9001 §6.1, score+nivel GENERATED)

### Colunas Novas em Obras
- valor_facturado, custo_materiais, custo_mao_obra, custo_servicos, horas_producao

### Pipeline Estendido
- estados leads: +em_producao, +entregue, +facturada (ciclo completo)
- Lead JAP (L2026-001): estado=entregue, prazo=07/01, entrega=28/02, nota protótipo

### Correcções
- PINs colaboradores: Bohdan=1001, José=1002, João=1003, Duarte=1234
- 6 docs fecho S47 gerados (ESTADO + PDF + 3 HTML)

---

## DADOS KPIs ACTUAIS (via kpi_dashboard)
| KPI | Valor | Norma |
|-----|-------|-------|
| Margem Bruta | 44.9% | SNC/IAS |
| EBITDA | €6.939 | SNC/IAS |
| Custo Hora Fábrica | €64.88/h | ISO 22400 |
| Win Rate | 100% | CRM |
| Revenue/Employee | €145.052 | ISO 30414 |
| Throughput YTD | 6 obras | ISO 22400 |
| On-Time Delivery | 0% (protótipo) | ISO 22400 |
| Workforce Cost | 8.0% | ISO 30414 |

---

## PENDENTE S49

### Imediato
- [ ] Gerar 6 docs fecho S48 (ESTADO+PDF+3 HTML)
- [ ] Testar email real (não manual) via reencaminhamento Outlook→Gmail
- [ ] Confirmar custos obras JAP: matrículas (~€12), inspecção facultativa, material, horas
- [ ] Facturar 6 obras JAP no InvoiceXpress (€2.100+IVA cada)
- [ ] Commit + push com docs S48

### Prioridades Médias
- [ ] pgvector (Mig025) para RAG — emails similares como exemplos ao Router
- [ ] IES 2023 via processar-ies
- [ ] Worker portal deploy
- [ ] Gate docs lead→obra (validação medidas antes produção)
- [ ] Ligar wake/emit/sleep a todas as routes
- [ ] Mudar password csnopusprod@gmail.com
- [ ] Delete invoice duplicado InvoiceXpress 253708521
- [ ] Cancelar subscrição Vendus
- [ ] Desligar Power Automate no O365

### Próximas Funcionalidades
- [ ] Dashboard React com kpi_dashboard() em tempo real
- [ ] COC Electrónico IMT (deadline julho 2026)
- [ ] Ciclo fim-de-obra automático (F9→COC+DoP+CE+factura+dossier)
- [ ] Worker UI: MNT-001 a MNT-004 como botões grandes

---

## ARQUITECTURA EMAIL (NOVO S48)
```
Email externo → geral@carrocariascsn.pt (Office 365)
  → Reencaminhamento automático → carrocariascsn@gmail.com
    → Google Apps Script (trigger 5 min)
      → POST /api/router/classificar (Vercel)
        → Claude Haiku classifica (consulta identificar_remetente)
          → INSERT tickets
            → BEFORE INSERT: fn_auto_close_spam (spam→arquivado)
            → AFTER INSERT: fn_ticket_to_lead (COM orcamento→lead)
```

## STACK
Next.js 14 | TypeScript | Supabase (84 tabelas) | Claude Haiku (Router) | Vercel | Google Apps Script | Office 365
