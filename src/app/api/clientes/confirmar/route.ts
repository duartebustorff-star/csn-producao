import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

/**
 * POST /api/clientes/confirmar
 * Confirma codigo de verificacao e marca cliente como verificado.
 * Body: { cliente_id: string, codigo: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { cliente_id, codigo } = await req.json()

    if (!cliente_id || !codigo) {
      return NextResponse.json({ error: "Campos 'cliente_id' e 'codigo' obrigatórios" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    const { data: cliente, error } = await supabase
      .from("clientes")
      .select("id, notas, verificado")
      .eq("id", cliente_id)
      .single()

    if (error || !cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    if (cliente.verificado) {
      return NextResponse.json({ ok: true, ja_verificado: true })
    }

    // Parse stored verification code from notas
    const notas = cliente.notas || ""
    const match = notas.match(/^VERIFICACAO:(\d{6}):(.+)$/)

    if (!match) {
      return NextResponse.json({ error: "Nenhuma verificação pendente" }, { status: 400 })
    }

    const [, storedCode, expiresAt] = match

    if (new Date(expiresAt) < new Date()) {
      return NextResponse.json({ error: "Código expirado. Solicite novo código." }, { status: 410 })
    }

    if (storedCode !== codigo) {
      return NextResponse.json({ error: "Código inválido" }, { status: 401 })
    }

    // Mark as verified and clear the code
    const { error: updateErr } = await supabase
      .from("clientes")
      .update({ verificado: true, notas: null })
      .eq("id", cliente_id)

    if (updateErr) {
      return NextResponse.json({ error: "Erro ao verificar cliente" }, { status: 500 })
    }

    await audit({
      entidade_tipo: "cliente",
      entidade_id: cliente_id,
      acao: "mudar_estado",
      campo_alterado: "verificado",
      valor_anterior: "false",
      valor_novo: "true",
      utilizador_id: "sistema",
    })

    return NextResponse.json({ ok: true, verificado: true })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
