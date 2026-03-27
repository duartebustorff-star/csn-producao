import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const obraId = req.nextUrl.searchParams.get("obra_id")

  if (!obraId) {
    return NextResponse.json(
      { error: "Parâmetro obra_id é obrigatório" },
      { status: 400 }
    )
  }

  const supabase = getServiceSupabase()

  const { data: faturas, error } = await supabase
    .from("faturas")
    .select("*, clientes_faturacao(*)")
    .eq("obra_id", obraId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao listar faturas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar faturas" },
      { status: 500 }
    )
  }

  return NextResponse.json({ faturas: faturas || [] })
}
