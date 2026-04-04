import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

/**
 * PATCH /api/leads/[id]/estado
 * Muda estado do pipeline da lead.
 * Body: { estado_pipeline: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { estado_pipeline } = body

  const validos = ["nova", "qualificada", "orcamentada", "ganha", "perdida", "cancelada"]
  if (!estado_pipeline || !validos.includes(estado_pipeline)) {
    return NextResponse.json({ error: `estado_pipeline inválido. Valores: ${validos.join(", ")}` }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  // Get current state for audit
  const { data: before } = await supabase
    .from("leads")
    .select("estado_pipeline")
    .eq("id", id)
    .single()

  const { data, error } = await supabase
    .from("leads")
    .update({ estado_pipeline })
    .eq("id", id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Lead não encontrada ou erro ao actualizar" }, { status: 404 })
  }

  await audit({
    entidade_tipo: "lead",
    entidade_id: id,
    acao: "mudar_estado",
    campo_alterado: "estado_pipeline",
    valor_anterior: before?.estado_pipeline || null,
    valor_novo: estado_pipeline,
    utilizador_id: body.utilizador_id || "sistema",
  })

  return NextResponse.json({ ok: true, lead: data })
}
