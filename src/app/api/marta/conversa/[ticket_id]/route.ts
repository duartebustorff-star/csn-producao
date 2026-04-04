import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

/**
 * GET /api/marta/conversa/[ticket_id]
 * Historico da conversa de um ticket.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticket_id: string }> }
) {
  const { ticket_id } = await params
  const supabase = getServiceSupabase()

  const { data, error } = await supabase
    .from("conversas_marta")
    .select("*")
    .eq("ticket_id", ticket_id)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar conversa" }, { status: 500 })
  }

  return NextResponse.json({ mensagens: data || [] })
}
