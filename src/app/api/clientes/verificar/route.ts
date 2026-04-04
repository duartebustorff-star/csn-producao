import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

/**
 * POST /api/clientes/verificar
 * Gera codigo de verificacao 6 digitos e guarda no cliente.
 * Body: { cliente_id: string, canal: "whatsapp" | "email" }
 *
 * Em producao, envia o codigo pelo canal indicado.
 * Para agora, devolve o codigo na resposta (dev mode).
 */
export async function POST(req: NextRequest) {
  try {
    const { cliente_id, canal } = await req.json()

    if (!cliente_id) {
      return NextResponse.json({ error: "Campo 'cliente_id' obrigatório" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Generate 6-digit code
    const codigo = String(Math.floor(100000 + Math.random() * 900000))
    const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min

    // Store code in cliente metadata
    const { error } = await supabase
      .from("clientes")
      .update({
        notas: `VERIFICACAO:${codigo}:${expira}`,
      })
      .eq("id", cliente_id)

    if (error) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    // TODO: In production, send code via WhatsApp or email
    // For now, return code in response (dev mode)
    return NextResponse.json({
      ok: true,
      canal: canal || "whatsapp",
      expira,
      // DEV ONLY — remove in production
      codigo_dev: codigo,
    })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
