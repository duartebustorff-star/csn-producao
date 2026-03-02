import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const colaboradorId = req.nextUrl.searchParams.get("colaborador_id")

  if (!colaboradorId) {
    return NextResponse.json({ error: "Falta colaborador_id" }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  // Load last 50 messages for this collaborator, ordered by creation date
  const { data, error } = await supabase
    .from("mensagens")
    .select("role, content, created_at")
    .eq("colaborador_id", colaboradorId)
    .order("created_at", { ascending: true })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: "Erro ao carregar mensagens" }, { status: 500 })
  }

  return NextResponse.json({ mensagens: data || [] })
}
