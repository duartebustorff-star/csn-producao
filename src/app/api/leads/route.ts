import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET() {
  const supabase = getServiceSupabase()

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*, obras(id, vin, matricula, lugar_parque, estado, fases_obra(*))")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 })
  }

  return NextResponse.json({ leads: leads || [] })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getServiceSupabase()

    const { data: lead, error } = await supabase
      .from("leads")
      .insert(body)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Erro ao criar lead" }, { status: 500 })
    }

    return NextResponse.json({ lead })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
