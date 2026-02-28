import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET() {
  const supabase = getServiceSupabase()

  const { data: lugares, error } = await supabase
    .from("lugares_parque")
    .select("*, obras(id, vin, leads(cliente, tipo_carrocaria))")
    .order("numero")

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar parque" }, { status: 500 })
  }

  const total = lugares?.length || 0
  const ocupados = lugares?.filter((l) => l.ocupado).length || 0

  return NextResponse.json({
    lugares: lugares || [],
    resumo: { total, ocupados, livres: total - ocupados },
  })
}

// Assign a parking spot to an obra (vehicle reception)
export async function POST(req: NextRequest) {
  try {
    const { obra_id, lugar_numero } = await req.json()

    if (!obra_id || !lugar_numero) {
      return NextResponse.json({ error: "Faltam campos" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Check if spot is free
    const { data: lugar } = await supabase
      .from("lugares_parque")
      .select("ocupado")
      .eq("numero", lugar_numero)
      .single()

    if (!lugar) {
      return NextResponse.json({ error: "Lugar não existe" }, { status: 404 })
    }

    if (lugar.ocupado) {
      return NextResponse.json({ error: "Lugar já ocupado" }, { status: 409 })
    }

    // Assign spot
    await supabase
      .from("lugares_parque")
      .update({ ocupado: true, obra_id, updated_at: new Date().toISOString() })
      .eq("numero", lugar_numero)

    // Update obra
    await supabase
      .from("obras")
      .update({
        lugar_parque: lugar_numero,
        estado: "veiculo_recebido",
        updated_at: new Date().toISOString(),
      })
      .eq("id", obra_id)

    return NextResponse.json({ sucesso: true, lugar: lugar_numero, obra_id })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
