import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

/**
 * POST /api/leads/[id]/orcamento
 * Regista valor do orcamento e avanca pipeline para 'orcamentada'.
 * Body: { valor_orcamento: number, notas?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { valor_orcamento, notas } = body

    if (!valor_orcamento || typeof valor_orcamento !== "number" || valor_orcamento <= 0) {
      return NextResponse.json({ error: "Campo 'valor_orcamento' obrigatório (número > 0)" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    const updates: Record<string, unknown> = {
      valor_orcamento,
      valor_unitario: valor_orcamento,
      estado_pipeline: "orcamentada",
      estado: "proposta_enviada",
    }

    if (notas) {
      // Append to existing notas_encomenda
      const { data: current } = await supabase
        .from("leads")
        .select("notas_encomenda")
        .eq("id", id)
        .single()

      const existing = current?.notas_encomenda || []
      updates.notas_encomenda = [...existing, `Orçamento: ${notas}`]
    }

    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Lead não encontrada ou erro ao actualizar" }, { status: 404 })
    }

    await audit({
      entidade_tipo: "lead",
      entidade_id: id,
      acao: "atualizar",
      campo_alterado: "valor_orcamento",
      valor_novo: String(valor_orcamento),
      utilizador_id: body.utilizador_id || "sistema",
      metadata: { estado_pipeline: "orcamentada" },
    })

    return NextResponse.json({ ok: true, lead: data })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
