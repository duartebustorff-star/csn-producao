import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

/**
 * POST /api/tickets/evoluir
 * Evolui ticket COM -> PRD (cria obra automaticamente)
 * Body: { ticket_id: string, lead_id: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { ticket_id, lead_id } = await req.json()

    if (!ticket_id || !lead_id) {
      return NextResponse.json({ error: "Campos 'ticket_id' e 'lead_id' obrigatórios" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Verify ticket exists and is COM
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticket_id)
      .single()

    if (ticketErr || !ticket) {
      return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 })
    }

    if (ticket.departamento !== "COM") {
      return NextResponse.json({ error: "Ticket não é do departamento COM" }, { status: 400 })
    }

    // Get lead data
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single()

    if (leadErr || !lead) {
      return NextResponse.json({ error: "Lead não encontrada" }, { status: 404 })
    }

    // Count existing obras for this lead to create unique ID
    const { count } = await supabase
      .from("obras")
      .select("id", { count: "exact", head: true })

    const obraNum = (count || 0) + 1
    const obraId = `OBR-${new Date().getFullYear()}-${String(obraNum).padStart(3, "0")}`

    // Create obra with estado F1-Recepcao (mapped to espera_veiculo)
    const { data: obra, error: obraErr } = await supabase
      .from("obras")
      .insert({
        id: obraId,
        lead_id,
        vin: lead.vin || null,
        matricula: lead.matricula || null,
        estado: "espera_veiculo",
        notas: `Criada automaticamente via ticket ${ticket_id}`,
      })
      .select()
      .single()

    if (obraErr) {
      console.error("obras insert:", obraErr)
      return NextResponse.json({ error: "Erro ao criar obra" }, { status: 500 })
    }

    // Create default phases from template
    const { data: templates } = await supabase
      .from("templates_fases")
      .select("*")
      .eq("tipo_carrocaria", lead.tipo_carrocaria)
      .order("fase_numero")

    if (templates && templates.length > 0) {
      const fases = templates.map((t: { fase_numero: number; nome: string; horas_estimadas: number }) => ({
        obra_id: obraId,
        fase_numero: t.fase_numero,
        nome: t.nome,
        horas_estimadas: t.horas_estimadas,
        estado: "pendente",
      }))
      await supabase.from("fases_obra").insert(fases)
    }

    // Update ticket: departamento COM -> PRD, link obra
    await supabase
      .from("tickets")
      .update({
        departamento: "PRD",
        obra_id: obraId,
        estado: "em_tratamento",
      })
      .eq("id", ticket_id)

    // Update lead estado_pipeline to ganha
    await supabase
      .from("leads")
      .update({ estado_pipeline: "ganha" })
      .eq("id", lead_id)

    await audit({
      entidade_tipo: "ticket",
      entidade_id: ticket_id,
      acao: "mudar_estado",
      campo_alterado: "departamento",
      valor_anterior: "COM",
      valor_novo: "PRD",
      utilizador_id: "sistema",
      metadata: { obra_id: obraId, lead_id },
    })

    await audit({
      entidade_tipo: "obra",
      entidade_id: obraId,
      acao: "criar",
      utilizador_id: "sistema",
      metadata: { via_ticket: ticket_id, lead_id },
    })

    return NextResponse.json({
      ok: true,
      ticket_id,
      obra_id: obraId,
      novo_departamento: "PRD",
      obra,
    })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
