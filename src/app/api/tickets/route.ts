import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

/**
 * GET /api/tickets — lista tickets (filtros: departamento, estado, cliente_id)
 * POST /api/tickets — cria novo ticket
 */
export async function GET(req: NextRequest) {
  const supabase = getServiceSupabase()
  const { searchParams } = req.nextUrl

  let query = supabase
    .from("tickets")
    .select("*, clientes(id, nome, empresa)")
    .order("created_at", { ascending: false })

  const departamento = searchParams.get("departamento")
  if (departamento) query = query.eq("departamento", departamento)

  const estado = searchParams.get("estado")
  if (estado) query = query.eq("estado", estado)

  const cliente_id = searchParams.get("cliente_id")
  if (cliente_id) query = query.eq("cliente_id", cliente_id)

  const limit = searchParams.get("limit")
  if (limit) query = query.limit(Number(limit))

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar tickets" }, { status: 500 })
  }

  return NextResponse.json({ tickets: data || [] })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getServiceSupabase()

    const { canal, remetente, remetente_tipo, cliente_id, assunto, corpo, classificacao, departamento, assigned_to, url_pdf, anexos, metadata } = body

    if (!canal || !departamento) {
      return NextResponse.json({ error: "Campos 'canal' e 'departamento' obrigatórios" }, { status: 400 })
    }

    // Generate ticket ID
    const { data: idResult } = await supabase.rpc("generate_ticket_id")
    const ticketId = idResult || `TICK-${new Date().getFullYear()}-${Date.now()}`

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        id: ticketId,
        canal,
        remetente: remetente || null,
        remetente_tipo: remetente_tipo || "desconhecido",
        cliente_id: cliente_id || null,
        assunto: assunto || null,
        corpo: corpo || null,
        classificacao: classificacao || null,
        departamento,
        assigned_to: assigned_to || null,
        url_pdf: url_pdf || null,
        anexos: anexos || [],
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error("tickets insert:", error)
      return NextResponse.json({ error: "Erro ao criar ticket" }, { status: 500 })
    }

    await audit({
      entidade_tipo: "ticket",
      entidade_id: ticketId,
      acao: "criar",
      utilizador_id: "sistema",
      metadata: { canal, departamento, classificacao },
    })

    return NextResponse.json({ ok: true, ticket: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
