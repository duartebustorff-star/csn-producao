import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const colaboradorId = req.nextUrl.searchParams.get("colaborador_id")

  if (!colaboradorId) {
    return NextResponse.json({ error: "Falta colaborador_id" }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  const { data: cits, error } = await supabase
    .from("cits")
    .select("id, data_inicio, data_fim, numero_dias, tipo_cit, created_at")
    .eq("colaborador_id", colaboradorId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar CITs" }, { status: 500 })
  }

  return NextResponse.json({ cits: cits || [] })
}
