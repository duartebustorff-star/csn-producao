import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const colaboradorId = String(formData.get("colaborador_id") || "")

    if (!file || !colaboradorId) {
      return NextResponse.json({ error: "Faltam campos obrigatórios" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Apenas imagens são suportadas" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    const { data: timerAtivo } = await supabase
      .from("timetracking")
      .select("id, obra_id, fase_obra_id")
      .eq("colaborador_id", colaboradorId)
      .is("fim", null)
      .maybeSingle()

    if (!timerAtivo) {
      return NextResponse.json({ error: "Sem fase ativa para associar foto" }, { status: 409 })
    }

    const ext = file.name.split(".").pop() || "jpg"
    const fileName = `FASE_${timerAtivo.obra_id}_${timerAtivo.fase_obra_id}_${Date.now()}.${ext}`
    const bytes = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(fileName, bytes, { contentType: file.type })

    if (uploadError) {
      return NextResponse.json({ error: "Erro ao guardar foto" }, { status: 500 })
    }

    const { data: signed } = await supabase.storage
      .from("documentos")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365)

    const fotoUrl = signed?.signedUrl || ""
    const texto = JSON.stringify({
      tipo: "foto_fase",
      obra_id: timerAtivo.obra_id,
      fase_obra_id: timerAtivo.fase_obra_id,
      timer_id: timerAtivo.id,
      foto_url: fotoUrl,
    })

    await supabase.from("notas_obra").insert({
      obra_id: timerAtivo.obra_id,
      colaborador_id: colaboradorId,
      texto,
      tipo: "foto",
    })

    return NextResponse.json({
      ok: true,
      obra_id: timerAtivo.obra_id,
      fase_obra_id: timerAtivo.fase_obra_id,
      foto_url: fotoUrl,
      mensagem: "Foto associada à fase ativa",
    })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

