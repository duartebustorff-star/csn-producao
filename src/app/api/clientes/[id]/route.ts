import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

/**
 * GET /api/clientes/[id] — detalhe de um cliente
 * PATCH /api/clientes/[id] — actualizar cliente
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceSupabase()

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
  }

  return NextResponse.json({ cliente: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const supabase = getServiceSupabase()

  const allowed = ["nome", "email", "whatsapp", "empresa", "nif", "tipo", "verificado", "portal_access", "ver_precos", "notas"]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido para actualizar" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("clientes")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email ou WhatsApp já registado" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erro ao actualizar cliente" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, cliente: data })
}
