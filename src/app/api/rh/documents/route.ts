import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const colaboradorId = req.nextUrl.searchParams.get("colaborador_id")
  const role = req.nextUrl.searchParams.get("role")
  const tipo = req.nextUrl.searchParams.get("tipo")

  const supabase = getServiceSupabase()

  let query = supabase
    .from("documentos_rh")
    .select("*")
    .order("created_at", { ascending: false })

  // Workers only see their own documents
  if (role !== "admin" && colaboradorId) {
    query = query.eq("colaborador_id", colaboradorId)
  } else if (colaboradorId && role === "admin") {
    // Admin filtering by specific collaborator
    const filterColab = req.nextUrl.searchParams.get("filter_colaborador")
    if (filterColab) {
      query = query.eq("colaborador_id", filterColab)
    }
  }

  if (tipo) {
    query = query.eq("tipo", tipo)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar documentos" }, { status: 500 })
  }

  return NextResponse.json({ documentos: data || [] })
}
