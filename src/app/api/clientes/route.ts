import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

/**
 * GET /api/clientes — lista clientes (filtros opcionais: tipo, verificado)
 * POST /api/clientes — cria novo cliente
 */
export async function GET(req: NextRequest) {
  const supabase = getServiceSupabase()
  const { searchParams } = req.nextUrl

  let query = supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false })

  const tipo = searchParams.get("tipo")
  if (tipo) query = query.eq("tipo", tipo)

  const verificado = searchParams.get("verificado")
  if (verificado === "true") query = query.eq("verificado", true)
  if (verificado === "false") query = query.eq("verificado", false)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 })
  }

  return NextResponse.json({ clientes: data || [] })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getServiceSupabase()

    const { nome, email, whatsapp, empresa, nif, tipo, canal_origem, notas } = body

    if (!nome) {
      return NextResponse.json({ error: "Campo 'nome' obrigatório" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nome,
        email: email || null,
        whatsapp: whatsapp || null,
        empresa: empresa || null,
        nif: nif || null,
        tipo: tipo || "final",
        canal_origem: canal_origem || null,
        notas: notas || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email ou WhatsApp já registado" }, { status: 409 })
      }
      console.error("clientes insert:", error)
      return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 })
    }

    await audit({
      entidade_tipo: "cliente",
      entidade_id: data.id,
      acao: "criar",
      utilizador_id: "sistema",
      metadata: { nome, canal_origem },
    })

    return NextResponse.json({ ok: true, cliente: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
