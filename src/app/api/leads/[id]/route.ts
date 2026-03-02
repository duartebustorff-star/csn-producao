import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

const ALLOWED_FIELDS = [
  "estado",
  "plataforma_elevatoria",
  "grua_coluna",
  "distancia_entre_eixos",
  "dist_eixo_frontal_frente",
  "dist_eixo_traseiro_retaguarda",
  "dist_eixo_frontal_traseira_cabine",
  "largura_cabine",
  "dist_topo_chassi_topo_cabine",
]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    // Filter to allowed fields only
    const updates: Record<string, unknown> = {}
    for (const key of ALLOWED_FIELDS) {
      if (key in body) {
        updates[key] = body[key]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 })
    }

    const supabase = getServiceSupabase()
    const { data: lead, error } = await supabase
      .from("leads")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Lead update error:", error)
      return NextResponse.json({ error: "Erro ao atualizar lead" }, { status: 500 })
    }

    return NextResponse.json({ lead })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
