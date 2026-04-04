import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

/**
 * GET /api/tickets/[id] — detalhe de um ticket
 * PATCH /api/tickets/[id] — actualizar estado, departamento, assigned_to
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceSupabase()

  const { data, error } = await supabase
    .from("tickets")
    .select("*, clientes(id, nome, empresa, verificado)")
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 })
  }

  return NextResponse.json({ ticket: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const supabase = getServiceSupabase()

  const allowed = ["estado", "departamento", "assigned_to", "classificacao", "lead_id", "obra_id", "metadata"]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido para actualizar" }, { status: 400 })
  }

  // If resolving, set resolved_at
  if (updates.estado === "resolvido") {
    updates.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("tickets")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Erro ao actualizar ticket" }, { status: 500 })
  }

  if (updates.estado) {
    await audit({
      entidade_tipo: "ticket",
      entidade_id: id,
      acao: "mudar_estado",
      campo_alterado: "estado",
      valor_novo: String(updates.estado),
      utilizador_id: body.utilizador_id || "sistema",
    })
  }

  return NextResponse.json({ ok: true, ticket: data })
}
