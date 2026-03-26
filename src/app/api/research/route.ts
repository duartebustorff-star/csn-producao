import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

// GET /api/research — listar tarefas (com filtros opcionais)
export async function GET(req: NextRequest) {
  const supabase = getServiceSupabase()
  const estado = req.nextUrl.searchParams.get("estado")
  const tipo = req.nextUrl.searchParams.get("tipo")

  let query = supabase
    .from("research_tasks")
    .select("*")
    .order("created_at", { ascending: false })

  if (estado) {
    query = query.eq("estado", estado)
  }
  if (tipo) {
    query = query.eq("tipo", tipo)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: "Erro ao listar tarefas research" }, { status: 500 })
  }

  return NextResponse.json({ tasks: data })
}

// POST /api/research — criar nova tarefa
export async function POST(req: NextRequest) {
  const supabase = getServiceSupabase()
  const body = await req.json()

  const { tema, tipo, descricao, solicitado_por } = body

  if (!tema || !tipo) {
    return NextResponse.json(
      { error: "Campos obrigatórios: tema, tipo" },
      { status: 400 }
    )
  }

  const validTypes = ["marca", "legal", "norma", "equip", "mercado", "tech", "geral"]
  if (!validTypes.includes(tipo)) {
    return NextResponse.json(
      { error: `Tipo inválido. Valores: ${validTypes.join(", ")}` },
      { status: 400 }
    )
  }

  // Gerar código sequencial: RT-AAAA-NNN
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from("research_tasks")
    .select("*", { count: "exact", head: true })
    .like("codigo", `RT-${year}-%`)

  const seq = String((count || 0) + 1).padStart(3, "0")
  const slug = tema
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
  const codigo = `RT-${year}-${seq}`
  const pastaLocal = `_research/${codigo}-${slug}/`

  const { data, error } = await supabase
    .from("research_tasks")
    .insert({
      codigo,
      tema,
      tipo,
      descricao: descricao || null,
      solicitado_por: solicitado_por || "sistema",
      pasta_local: pastaLocal,
      estado: "pendente",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Erro ao criar tarefa research" }, { status: 500 })
  }

  await audit({
    entidade_tipo: "research_task",
    entidade_id: data.id,
    acao: "criar",
    valor_novo: JSON.stringify({ codigo, tema, tipo }),
    utilizador_id: solicitado_por || "sistema",
  })

  return NextResponse.json({ task: data }, { status: 201 })
}
