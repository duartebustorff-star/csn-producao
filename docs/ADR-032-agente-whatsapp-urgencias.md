# ADR-032 — Agente WhatsApp Urgências

**Código interno:** CSN-L3-COM-032-2026  
**ISA-95:** L3-MOM (COM)  
**Camada:** 3 — Nucleus Agent  
**Estado:** Aceite  
**Data:** 2026-04-03  
**Sessão:** S37  

---

## Contexto

A CSN necessita de um canal de comunicação para urgências operacionais (acidentes, avarias críticas, ausências não planeadas) que notifique automaticamente contactos de emergência dos colaboradores e o administrador. O WhatsApp é o canal preferencial por ser universal entre os colaboradores e seus contactos familiares.

Atualmente não existe nenhum mecanismo automatizado de notificação de urgência — tudo depende de chamadas telefónicas manuais.

## Decisão

Criar o **Agente WhatsApp** como 12.º agente autónomo do nucleus (Camada 3). Este agente:

1. **Recebe** mensagens via webhook da WhatsApp Business API (`/api/whatsapp/recepcao`)
2. **Classifica** o tipo de mensagem (urgência, informação, pedido)
3. **Actua** conforme a classificação:
   - **Urgência** → notifica contactos de emergência (tabela `contactos_urgentes`, M026) + admin (PIN 1234)
   - **Informação** → regista e encaminha para o agente apropriado
   - **Pedido** → regista e coloca em fila de processamento
4. **Regista** todas as mensagens recebidas e enviadas para auditoria

## Arquitectura

### Posição no sistema

```
Camada 2 (Personas)     → Fernando, Carolina, Marta, Luísa — UI only
Camada 3 (Nucleus)      → 12 agentes autónomos (inclui Agente WhatsApp)
Camada infraestrutura   → Supabase, WhatsApp Business API, Claude API
```

### Componentes

| Componente | Tipo | Localização |
|---|---|---|
| Webhook receiver | Next.js Route Handler | `/api/whatsapp/recepcao` |
| Classificador de mensagens | Função interna (Claude API) | Agente WhatsApp |
| Notificador de urgências | Função interna (WhatsApp API) | Agente WhatsApp |
| Tabela contactos_urgentes | Supabase | M026 (executada) |
| Tabela whatsapp_mensagens | Supabase | M027 (futura) |

### Fluxo de urgência

```
Mensagem WhatsApp entrada
  → POST /api/whatsapp/recepcao
    → Validar assinatura webhook
    → Extrair remetente + conteúdo
    → Classificar (Claude API): urgência? informação? pedido?
    → SE urgência:
        → Buscar colaborador pelo telefone
        → Buscar contactos_urgentes (ORDER BY prioridade)
        → Enviar notificação WhatsApp a cada contacto
        → Enviar notificação ao admin
        → Registar em whatsapp_mensagens
    → Resposta 200 imediata ao webhook (processamento assíncrono)
```

## Regras invioláveis

1. **Camada 3 — nucleus agent.** O Agente WhatsApp processa, classifica e envia. Não é persona, não tem dashboard, não apresenta informação a humanos via UI.
2. **Sem FK a "system".** Acções automáticas usam `colaborador_id = null` conforme regra FK do sistema.
3. **Resposta 200 imediata.** O webhook do WhatsApp exige resposta rápida; todo o processamento é assíncrono após o acknowledge.
4. **Auditoria completa.** Toda a mensagem recebida e enviada é registada com timestamp, remetente, destinatário, conteúdo e classificação.
5. **Telefones em formato internacional.** Todos os números na tabela `contactos_urgentes` e no processamento usam formato E.164 (+351XXXXXXXXX).

## Dependências

| Dependência | Estado |
|---|---|
| Tabela `contactos_urgentes` (M026) | ✅ Executada |
| Tabela `whatsapp_mensagens` (M027) | ⏳ Futura |
| WhatsApp Business API account | ⏳ Por configurar |
| Webhook URL público (Vercel) | ✅ Disponível via csn-producao.vercel.app |
| Claude API (classificação) | ✅ Disponível |

## Consequências

### Positivas
- Notificação automática de emergência sem depender de acção manual
- Canal familiar para colaboradores e famílias (WhatsApp)
- Registo auditável de todas as comunicações de urgência
- Base para futuras comunicações operacionais (avisos de turno, confirmações)

### Negativas
- Custo mensal da WhatsApp Business API
- Dependência de serviço externo (Meta) para canal crítico
- Necessidade de fallback (Telegram ou SMS) se WhatsApp falhar

## Mitigação

- Telegram como canal secundário (já previsto na arquitectura de comunicações)
- Retry com backoff exponencial para falhas temporárias
- Alerta ao admin se notificação de urgência falhar após 3 tentativas

## ADRs relacionados

- ADR-031: Arquitectura departamental 3 camadas
- Futuro: ADR para Agente Telegram (canal secundário)

---

*CSN — Engenharia de Veículos Comerciais · Mafra · Documento interno*
