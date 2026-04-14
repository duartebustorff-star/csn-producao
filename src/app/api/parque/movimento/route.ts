import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

// GET → returns the lowest-numbered free parking spot
export async function GET() {
  const supabase = getServiceSupabase()

  const { data, error } = await supabase
    .from("lugares_parque")
    .select("numero")
    .eq("ocupado", false)
    .order("numero", { ascending: true })
    .limit(1)

  if (error) {
    return NextResponse.json({ error: "Erro ao consultar parque" }, { status: 500 })
  }

  const lugar_livre = data && data.length > 0 ? data[0].numero : null
  return NextResponse.json({ lugar_livre })
}

// POST → regista entrada/saída de viatura
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const form = await req.formData()

    const tipo = String(form.get("tipo") || "entrada")
    const matricula = String(form.get("matricula") || "").trim().toUpperCase()
    const marca = String(form.get("marca") || "").trim()
    const modelo = String(form.get("modelo") || "").trim()
    const lugarRaw = form.get("lugar_numero")
    const lugar_numero = lugarRaw ? Number(lugarRaw) : null
    const colaborador_id = String(form.get("colaborador_id") || "")

    if (!matricula) {
      return NextResponse.json({ error: "Matrícula obrigatória" }, { status: 400 })
    }

    // Upload photos to Supabase Storage (best-effort)
    const fotos: Record<string, string> = {}
    for (const key of ["foto_veiculo", "foto_vin"]) {
      const file = form.get(key) as File | null
      if (file && file.size > 0) {
        const ext = file.name.split(".").pop() || "jpg"
        const path = `parque/${Date.now()}_${key}.${ext}`
        const bytes = await file.arrayBuffer()
        const { error: upErr } = await supabase.storage
          .from("documentos")
          .upload(path, bytes, { contentType: file.type || "image/jpeg" })
        if (!upErr) {
          const { data: pub } = supabase.storage.from("documentos").getPublicUrl(path)
          fotos[key] = pub.publicUrl
        }
      }
    }

    // Update lugar_parque occupancy
    if (lugar_numero) {
      if (tipo === "entrada") {
        const { data: lugar } = await supabase
          .from("lugares_parque")
          .select("ocupado")
          .eq("numero", lugar_numero)
          .single()

        if (lugar?.ocupado) {
          return NextResponse.json({ error: "Lugar já ocupado" }, { status: 409 })
        }

        await supabase
          .from("lugares_parque")
          .update({ ocupado: true, updated_at: new Date().toISOString() })
          .eq("numero", lugar_numero)
      } else {
        await supabase
          .from("lugares_parque")
          .update({ ocupado: false, obra_id: null, updated_at: new Date().toISOString() })
          .eq("numero", lugar_numero)
      }
    }

    await audit({
      entidade_tipo: "parque_movimento",
      entidade_id: matricula,
      acao: "criar",
      utilizador_id: colaborador_id || "sistema",
      metadata: { tipo, matricula, marca, modelo, lugar_numero, fotos },
    })

    return NextResponse.json({ sucesso: true, tipo, matricula, lugar_numero, fotos })
  } catch (e) {
    return NextResponse.json({ error: "Erro interno", detail: String(e) }, { status: 500 })
  }
}
