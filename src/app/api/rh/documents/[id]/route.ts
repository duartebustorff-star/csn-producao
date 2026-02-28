import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const role = req.nextUrl.searchParams.get("role")

    if (role !== "admin") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const supabase = getServiceSupabase()

    // Delete linked ausencias first
    await supabase.from("ausencias").delete().eq("documento_rh_id", parseInt(id))

    // Delete document record
    const { error } = await supabase
      .from("documentos_rh")
      .delete()
      .eq("id", parseInt(id))

    if (error) {
      return NextResponse.json({ error: "Erro ao apagar" }, { status: 500 })
    }

    return NextResponse.json({ deleted: true })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
