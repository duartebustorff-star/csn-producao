import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json()

    if (!pin || typeof pin !== "string" || pin.length !== 4) {
      return NextResponse.json(
        { error: "PIN deve ter 4 digitos" },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    const { data: colab, error } = await supabase
      .from("colaboradores_rh")
      .select("id, nome_completo, colaborador_id, portal_activo, categoria_profissional")
      .eq("pin_portal", pin)
      .eq("portal_activo", true)
      .maybeSingle()

    if (error || !colab) {
      return NextResponse.json(
        { error: "PIN invalido ou portal desactivado" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      colaborador_rh_id: colab.id,
      colaborador_id: colab.colaborador_id,
      nome: colab.nome_completo,
      categoria: colab.categoria_profissional,
    })
  } catch {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    )
  }
}
