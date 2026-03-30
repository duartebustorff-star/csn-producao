import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const colaboradorRhId = req.nextUrl.searchParams.get("colaborador_rh_id")

  if (!colaboradorRhId) {
    return NextResponse.json({ error: "Falta colaborador_rh_id" }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  const { data: recibos, error } = await supabase
    .from("recibos_vencimento")
    .select("ano, mes, liquido, numero_recibo, colaborador_rh_id")
    .eq("colaborador_rh_id", colaboradorRhId)
    .order("ano", { ascending: false })
    .order("mes", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar recibos" }, { status: 500 })
  }

  return NextResponse.json({ recibos: recibos || [] })
}
