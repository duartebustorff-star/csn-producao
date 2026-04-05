import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.ANTHROPIC_MODEL_ROUTER?.trim() || "claude-sonnet-4-20250514"

const ROUTER_PROMPT = `Es o Agente Router (L3-MOM) da Carlos dos Santos Nascimento Lda (metalomecanica / carrocarias).
Analisa a mensagem recebida e classifica-a para encaminhamento interno via ticket.

Responde APENAS com JSON valido (sem markdown):
{
  "remetente_tipo": "cliente" | "fornecedor" | "entidade" | "colaborador" | "desconhecido",
  "classificacao": "lead_orcamento" | "estado_obra" | "factura" | "certificado" | "cit" | "reclamacao" | "garantia" | "informacao" | "outro",
  "departamento": "COM" | "PRD" | "DOC" | "PER" | "FIN" | "ATT",
  "assunto_resumo": "frase curta do assunto",
  "urgencia": "normal" | "urgente",
  "confianca": 0.0-1.0
}

Regras de departamento:
- COM: pedidos de orcamento, leads, consultas comerciais, configuracoes de carrocaria
- PRD: estado de obras, prazos de producao, fases, entregas
- DOC: facturas, certificados, DAV, FAM, documentos legais
- PER: CITs, baixas, ferias, assuntos pessoais de colaboradores
- FIN: pagamentos, facturas a receber, contas correntes
- ATT: quando nao se encaixa noutro, desconhecido, ou escalar ao Duarte`

/**
 * POST /api/router/classificar
 * Recebe mensagem, classifica com Claude, cria ticket.
 * Body: { canal, remetente, conteudo, whatsapp?, email?, thread_id?, in_reply_to? }
 *
 * DEDUPLICAÃ‡ÃƒO (S39):
 * - Se thread_id ou in_reply_to â†’ procura ticket com essa referÃªncia
 * - Se mesmo remetente + canal com ticket aberto â†’ reutiliza ticket existente
 * - SÃ³ cria ticket novo se nÃ£o encontrar correspondÃªncia
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { canal, remetente, conteudo, whatsapp, email, thread_id, in_reply_to } = body

    if (!canal || !conteudo) {
      return NextResponse.json({ error: "Campos 'canal' e 'conteudo' obrigatÃ³rios" }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY nÃ£o configurada" }, { status: 500 })
    }

    const supabase = getServiceSupabase()

    // ============================================================
    // 1. DEDUPLICAÃ‡ÃƒO â€” procurar ticket existente
    // ============================================================

    // 1a. Por thread_id ou in_reply_to (email threading)
    if (thread_id || in_reply_to) {
      const refId = thread_id || in_reply_to
      const { data: ticketByThread } = await supabase
        .from("tickets")
        .select("*")
        .eq("canal", canal)
        .in("estado", ["aberto", "em_progresso"])
        .or(`metadata->>thread_id.eq.${refId},metadata->>in_reply_to.eq.${refId}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (ticketByThread) {
        await audit({
          entidade_tipo: "ticket",
          entidade_id: ticketByThread.id,
          acao: "atualizar",
          utilizador_id: "sistema",
          metadata: { canal, remetente, motivo: "thread_match" },
        })

        return NextResponse.json({
          ok: true,
          ticket_id: ticketByThread.id,
          ticket_existente: true,
          departamento: ticketByThread.departamento,
          classificacao: ticketByThread.classificacao,
          motivo_reutilizacao: "thread_id",
          ticket: ticketByThread,
        })
      }
    }

    // 1b. Por remetente + canal com ticket aberto (WhatsApp, telefone, chatbot)
    if (remetente) {
      const { data: ticketByRemetente } = await supabase
        .from("tickets")
        .select("*")
        .eq("canal", canal)
        .eq("remetente", remetente)
        .in("estado", ["aberto", "em_progresso"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (ticketByRemetente) {
        // Verificar se o ticket nÃ£o Ã© demasiado antigo (>48h = novo contexto)
        const ticketAge = Date.now() - new Date(ticketByRemetente.created_at).getTime()
        const MAX_AGE_MS = 48 * 60 * 60 * 1000 // 48 horas

        if (ticketAge < MAX_AGE_MS) {
          await audit({
            entidade_tipo: "ticket",
            entidade_id: ticketByRemetente.id,
            acao: "atualizar",
            utilizador_id: "sistema",
            metadata: { canal, remetente, motivo: "remetente_match" },
          })

          return NextResponse.json({
            ok: true,
            ticket_id: ticketByRemetente.id,
            ticket_existente: true,
            departamento: ticketByRemetente.departamento,
            classificacao: ticketByRemetente.classificacao,
            motivo_reutilizacao: "remetente_canal",
            ticket: ticketByRemetente,
          })
        }
      }
    }

    // 1c. Por email do cliente (mesmo remetente, canal diferente)
    if (email) {
      const { data: ticketByEmail } = await supabase
        .from("tickets")
        .select("*, clientes!inner(email)")
        .eq("clientes.email", email)
        .in("estado", ["aberto", "em_progresso"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (ticketByEmail) {
        const ticketAge = Date.now() - new Date(ticketByEmail.created_at).getTime()
        const MAX_AGE_MS = 48 * 60 * 60 * 1000

        if (ticketAge < MAX_AGE_MS) {
          await audit({
            entidade_tipo: "ticket",
            entidade_id: ticketByEmail.id,
            acao: "atualizar",
            utilizador_id: "sistema",
            metadata: { canal, remetente, motivo: "email_match" },
          })

          return NextResponse.json({
            ok: true,
            ticket_id: ticketByEmail.id,
            ticket_existente: true,
            departamento: ticketByEmail.departamento,
            classificacao: ticketByEmail.classificacao,
            motivo_reutilizacao: "email_cliente",
            ticket: ticketByEmail,
          })
        }
      }
    }

    // ============================================================
    // 2. NOVO TICKET â€” classificar e criar
    // ============================================================

    // Check if sender is known client
    let clienteId: string | null = null
    let clienteNome: string | null = null
    if (whatsapp || email) {
      const lookupField = whatsapp ? "whatsapp" : "email"
      const lookupValue = whatsapp || email
      const { data: cliente } = await supabase
        .from("clientes")
        .select("id, nome")
        .eq(lookupField, lookupValue)
        .maybeSingle()
      if (cliente) {
        clienteId = cliente.id
        clienteNome = cliente.nome
      }
    }

    // Classify with Claude
    const claudeRes = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Canal: ${canal}\nRemetente: ${remetente || "desconhecido"}${clienteNome ? ` (cliente: ${clienteNome})` : ""}\n\nMensagem:\n${conteudo}`,
        },
      ],
      system: ROUTER_PROMPT,
    })

    const rawText = claudeRes.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")

    let parsed: Record<string, unknown>
    try {
      let cleaned = rawText.trim()
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "")
      const start = cleaned.indexOf("{")
      const end = cleaned.lastIndexOf("}")
      if (start !== -1 && end > start) cleaned = cleaned.substring(start, end + 1)
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = {
        remetente_tipo: "desconhecido",
        classificacao: "outro",
        departamento: "ATT",
        assunto_resumo: "NÃ£o classificado",
        urgencia: "normal",
        confianca: 0,
      }
    }

    const departamento = ["COM", "PRD", "DOC", "PER", "FIN", "QMS", "MNT", "INV", "ENG", "ATT"].includes(String(parsed.departamento))
      ? String(parsed.departamento)
      : "ATT"

    // Generate ticket ID
    const { data: ticketIdResult } = await supabase.rpc("generate_ticket_id")
    const ticketId = ticketIdResult || `TICK-${new Date().getFullYear()}-${Date.now()}`

    // Create ticket (with thread reference if provided)
    const ticketMetadata: Record<string, unknown> = {
      router_model: MODEL,
      router_confianca: parsed.confianca,
      urgencia: parsed.urgencia,
      cliente_nome: clienteNome,
    }
    if (thread_id) ticketMetadata.thread_id = thread_id
    if (in_reply_to) ticketMetadata.in_reply_to = in_reply_to

    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .insert({
        id: ticketId,
        canal,
        remetente: remetente || null,
        remetente_tipo: String(parsed.remetente_tipo || "desconhecido"),
        cliente_id: clienteId,
        assunto: String(parsed.assunto_resumo || ""),
        corpo: conteudo,
        classificacao: String(parsed.classificacao || "outro"),
        departamento,
        assigned_to: departamento === "ATT" ? "duarte" : null,
        metadata: ticketMetadata,
      })
      .select()
      .single()

    if (ticketErr) {
      console.error("router ticket insert:", ticketErr)
      return NextResponse.json({ error: "Erro ao criar ticket" }, { status: 500 })
    }

    await audit({
      entidade_tipo: "ticket",
      entidade_id: ticketId,
      acao: "criar",
      utilizador_id: "sistema",
      metadata: {
        router: "L3-MOM",
        departamento,
        classificacao: parsed.classificacao,
        canal,
      },
    })

    return NextResponse.json({
      ok: true,
      ticket_id: ticketId,
      ticket_existente: false,
      departamento,
      classificacao: parsed.classificacao,
      remetente_tipo: parsed.remetente_tipo,
      assunto: parsed.assunto_resumo,
      urgencia: parsed.urgencia,
      confianca: parsed.confianca,
      cliente: clienteId ? { id: clienteId, nome: clienteNome } : null,
      ticket,
    })
  } catch (e) {
    console.error("router/classificar error:", e)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
