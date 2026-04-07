# ADR-035: Google Calendar como Camada Temporal ISA-95

**Código interno:** CSN-L3-DOC-035-2026  
**Nível ISA-95:** L3-MOM / L4-BPL (multi-nível)  
**Camada:** C3 (decisão arquitectural)  
**Data:** 07/04/2026  
**Sessão:** S42  
**Estado:** Aceite  

## Contexto

O sistema CSN Opus necessita de uma camada temporal fiável para:
- Timestamps de tickets criados pelo Router (`/api/router/classificar`)
- Deadlines de obras, auditorias, certificações e obrigações fiscais
- Agendamento de manutenções preventivas, férias, formações
- Alertas automáticos por área funcional ISA-95

O Supabase é a fonte de verdade dos dados mas não oferece gestão de calendário, alertas ou integração nativa com notificações.

## Decisão

Adoptar o **Google Calendar** (conta **carrocariascsn@gmail.com**) como camada temporal do sistema, com **9 calendários separados por nível ISA-95**:

### L4-BPL — Business Planning & Logistics (3 calendários)

| Calendário | Secção | Conteúdo | Agente C3 | Persona C2 |
|---|---|---|---|---|
| CSN-L4-COM | Comercial | Orçamentos, visitas, follow-ups, CSN Connect | Agente Comercial | Marta |
| CSN-L4-FIN | Financeiro | IVA, IRC, SS, pagamentos, recebimentos, InvoiceXpress | Agente Financeiro | Luísa |
| CSN-L4-ENG | Engenharia | Projectos, homologações, COC electrónico Jul/2026 | Agente Engenharia | Luísa |

### L3-MOM — Manufacturing Operations Management (6 calendários)

| Calendário | Secção | Conteúdo | Agente C3 | Persona C2 |
|---|---|---|---|---|
| CSN-L3-PRD | Produção | Obras F1→F9, milestones, entregas | Agente Produção | Fernando |
| CSN-L3-QMS | Qualidade | Auditorias, certificados soldadores EN 9606 (2 anos), calibrações | Agente Qualidade | Fernando |
| CSN-L3-MNT | Manutenção | Preventivas MNT-001→004, Bodor 60kW, KUKA | Agente Manutenção | Fernando |
| CSN-L3-INV | Inventário | Entregas material, alertas stock mínimo | Agente Inventário | Fernando |
| CSN-L3-PER | Pessoal | Férias, faltas, formações, renovações contrato | Agente RH | Carolina |
| CSN-L3-DOC | Documental | Deadlines legais, licenças, seguros, certificações ISO/EN | Agente Documental | Luísa |

## Regras de Acesso C2/C3

- **Agentes C3:** Leitura + Escrita no calendário da sua secção
- **Personas C2:** Leitura apenas — mostram informação temporal ao humano
- **Portais satélite (trabalhadores, clientes, CSN Connect):** Sem acesso directo ao Calendar. Recebem informação filtrada via personas C2.

## Relação Supabase / Google Calendar

- **Supabase** = dados (conteúdo, estados, valores, registos)
- **Google Calendar** = tempo (timestamps, deadlines, alertas, agendamento)
- Sem duplicação: cada sistema tem papel distinto
- Tickets recebem timestamp do servidor Google no momento de criação

## Regra Bandeira (aplicação temporal)

Nenhum agente pode inventar, estimar ou aproximar datas/horas. Valor temporal sem fonte verificável (Calendar API ou registo Supabase) = NULL + flag "a preencher".

## Consequências

- Cada ticket do Router passa a ter timestamp + evento no calendário da secção destino
- Alertas automáticos possíveis (ex: 7 dias antes de vencimento de certificado)
- Integração MCP Google Calendar via conta carrocariascsn@gmail.com
- Necessário reconectar MCP Calendar com conta CSN (actualmente ligado a conta pessoal)

## Alternativas Consideradas

1. **Timestamps apenas Supabase** — rejeitado: sem alertas nativos, sem calendário visual
2. **Calendário custom no Opus** — rejeitado: reinventar roda, sem notificações push
3. **Microsoft 365** — rejeitado: CSN já usa ecossistema Google

## Referência

- Documento técnico: `CSN-L3-DOC-041-2026-Google-Calendar-ISA95.pdf`
- ISA-95 Part 3 (Activity Models of MOM)
- ISA-95 Part 4 (Objects and Attributes for MOM Integration)
