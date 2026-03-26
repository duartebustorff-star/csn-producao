import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

// GET /api/research/[id] — ver tarefa específica
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceSupabase()

  const { data, error } = await supabase
    .from("research_tasks")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 })
  }

  return NextResponse.json({ task: data })
}

// PATCH /api/research/[id] — actualizar estado e metadados
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceSupabase()
  const body = await req.json()

  // Campos actualizáveis
  const allowedFields = [
    "estado", "data_inicio", "data_conclusao",
    "fontes_consultadas", "documentos_encontrados", "documentos_descarregados",
    "relatorio_path", "incorporado_rag", "incorporado_supabase", "notas",
  ]

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  // Ler estado anterior para audit
  const { data: before } = await supabase
    .from("research_tasks")
    .select("estado, codigo")
    .eq("id", id)
    .single()

  if (!before) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("research_tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Erro ao actualizar tarefa" }, { status: 500 })
  }

  if (updates.estado && updates.estado !== before.estado) {
    await audit({
      entidade_tipo: "research_task",
      entidade_id: id,
      acao: "mudar_estado",
      campo_alterado: "estado",
      valor_anterior: before.estado,
      valor_novo: updates.estado as string,
      utilizador_id: "sistema",
    })
  }

  return NextResponse.json({ task: data })
}
