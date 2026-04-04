import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

/**
 * GET /api/clientes/lookup?whatsapp=XXX ou ?email=XXX
 * Verifica se cliente existe pelo whatsapp ou email.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const whatsapp = searchParams.get("whatsapp")
  const email = searchParams.get("email")

  if (!whatsapp && !email) {
    return NextResponse.json({ error: "Parâmetro 'whatsapp' ou 'email' obrigatório" }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  let query = supabase.from("clientes").select("id, nome, tipo, verificado, empresa")

  if (whatsapp) {
    query = query.eq("whatsapp", whatsapp)
  } else if (email) {
    query = query.eq("email", email)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Erro ao procurar cliente" }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ encontrado: false })
  }

  return NextResponse.json({ encontrado: true, cliente: data })
}
