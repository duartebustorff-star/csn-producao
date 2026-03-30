import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const colaborador_id = formData.get("colaborador_id") as string
    const colaborador_rh_id = formData.get("colaborador_rh_id") as string
    const nome = formData.get("nome") as string
    const data_inicio = formData.get("data_inicio") as string
    const data_fim = formData.get("data_fim") as string
    const tipo_cit = (formData.get("tipo_cit") as string) || "inicial"

    if (!data_inicio || !data_fim) {
      return NextResponse.json({ error: "Data inicio e fim obrigatorias" }, { status: 400 })
    }

    const supabase = getServiceSupabase()
    let fileUrl = ""

    // Upload file if provided
    if (file && file.size > 0) {
      const timestamp = Date.now()
      const ext = file.name.split(".").pop() || "pdf"
      const path = `cits/${colaborador_id || "sem-id"}/${timestamp}.${ext}`

      const arrayBuffer = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(path, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        return NextResponse.json({ error: "Erro ao carregar ficheiro" }, { status: 500 })
      }

      const { data: urlData } = supabase.storage
        .from("documentos")
        .getPublicUrl(path)

      fileUrl = urlData?.publicUrl || path
    }

    // Calculate days
    const d1 = new Date(data_inicio)
    const d2 = new Date(data_fim)
    const numeroDias = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (numeroDias < 1) {
      return NextResponse.json({ error: "Data fim deve ser igual ou posterior a data inicio" }, { status: 400 })
    }

    // Insert CIT
    const { data: cit, error: citError } = await supabase
      .from("cits")
      .insert({
        tipo_cit,
        data_inicio,
        data_fim,
        numero_dias: numeroDias,
        nome_utente: nome || null,
        url_ficheiro: fileUrl,
        uploaded_by: colaborador_id || null,
        colaborador_id: colaborador_id || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (citError) {
      console.error("CIT insert error:", citError)
      return NextResponse.json({ error: "Erro ao registar CIT" }, { status: 500 })
    }

    // Create ausencia
    let ausencia = null
    if (colaborador_id) {
      const { data: ausenciaData } = await supabase
        .from("ausencias")
        .insert({
          colaborador_id,
          data_inicio,
          data_fim,
          tipo: "baixa",
          notas: `CIT ${numeroDias} dias (submetido pelo portal)`,
          aprovado: false,
        })
        .select()
        .single()

      ausencia = ausenciaData
      if (ausenciaData) {
        await supabase.from("cits").update({ ausencia_id: ausenciaData.id }).eq("id", cit.id)
      }
    }

    return NextResponse.json({
      success: true,
      cit,
      ausencia,
      mensagem: `Baixa registada: ${numeroDias} dias (${data_inicio} a ${data_fim}). ${ausencia ? "Ausencia criada (pendente aprovacao)." : ""}`,
    })
  } catch (error) {
    console.error("CIT upload error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
