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

    // Try colaboradores_rh first (workers with pin_portal)
    const { data: colabRH } = await supabase
      .from("colaboradores_rh")
      .select("id, nome_completo, colaborador_id, portal_activo, categoria_profissional")
      .eq("pin_portal", pin)
      .eq("portal_activo", true)
      .maybeSingle()

    if (colabRH && colabRH.colaborador_id) {
      // Worker found — fetch full record from colaboradores
      const { data: colaborador, error: colabError } = await supabase
        .from("colaboradores")
        .select("*")
        .eq("id", colabRH.colaborador_id)
        .eq("ativo", true)
        .single()

      if (colabError || !colaborador) {
        return NextResponse.json(
          { error: "Colaborador nao encontrado" },
          { status: 404 }
        )
      }

      const { pin: _pin, ...safeColaborador } = colaborador
      return NextResponse.json({
        colaborador: {
          ...safeColaborador,
          colaborador_rh_id: colabRH.id,
        },
      })
    }

    // Fallback: try colaboradores directly (admin with pin)
    const { data: adminColab } = await supabase
      .from("colaboradores")
      .select("*")
      .eq("pin", pin)
      .eq("ativo", true)
      .maybeSingle()

    if (adminColab) {
      const { pin: _pin, ...safeColaborador } = adminColab
      return NextResponse.json({
        colaborador: safeColaborador,
      })
    }

    return NextResponse.json(
      { error: "PIN invalido" },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    )
  }
}
