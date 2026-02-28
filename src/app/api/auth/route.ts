import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { colaborador_id, pin } = await req.json()

    if (!colaborador_id || !pin) {
      return NextResponse.json(
        { error: "Faltam campos obrigatórios" },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    const { data: colaborador, error } = await supabase
      .from("colaboradores")
      .select("*")
      .eq("id", colaborador_id)
      .eq("ativo", true)
      .single()

    if (error || !colaborador) {
      return NextResponse.json(
        { error: "Colaborador não encontrado" },
        { status: 404 }
      )
    }

    // Verificar PIN (comparação simples — em produção usar bcrypt)
    if (colaborador.pin !== pin) {
      return NextResponse.json(
        { error: "PIN errado" },
        { status: 401 }
      )
    }

    // Não enviar o PIN para o frontend
    const { pin: _pin, ...safeColaborador } = colaborador

    return NextResponse.json({ colaborador: safeColaborador })
  } catch {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    )
  }
}
