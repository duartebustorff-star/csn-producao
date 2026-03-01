import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const tipo = req.nextUrl.searchParams.get("tipo")
  const supabase = getServiceSupabase()

  try {
    if (tipo === "davs") {
      const { data, error } = await supabase
        .from("davs")
        .select("id, vin, matricula, marca, modelo, cod_homologacao, url_ficheiro, created_at")
        .order("created_at", { ascending: false })
      if (error) throw error
      return NextResponse.json({ documentos: data || [] })
    }

    if (tipo === "fams") {
      const { data, error } = await supabase
        .from("fams")
        .select("id, numero_homologacao_nacional, extensao, campo_0_1_marca, campo_0_2_modelo, url_ficheiro, created_at")
        .order("created_at", { ascending: false })
      if (error) throw error
      return NextResponse.json({ documentos: data || [] })
    }

    if (tipo === "inspecoes") {
      const { data, error } = await supabase
        .from("inspecoes")
        .select("id, matricula, data_inspecao, peso_estatico_total, resultado, uploaded_by, url_ficheiro, created_at")
        .order("created_at", { ascending: false })
      if (error) throw error
      return NextResponse.json({ documentos: data || [] })
    }

    if (tipo === "cits") {
      const { data, error } = await supabase
        .from("cits")
        .select("id, nome_utente, colaborador_id, data_inicio, data_fim, numero_dias, uploaded_by, url_ficheiro, created_at")
        .order("created_at", { ascending: false })
      if (error) throw error
      return NextResponse.json({ documentos: data || [] })
    }

    if (tipo === "outros") {
      const { data, error } = await supabase
        .from("documentos_rh")
        .select("id, nome_ficheiro, uploaded_by, url, created_at")
        .eq("tipo", "outro")
        .order("created_at", { ascending: false })
      if (error) throw error
      return NextResponse.json({ documentos: data || [] })
    }

    // Return counts for all types
    const [davs, fams, inspecoes, cits, outros] = await Promise.all([
      supabase.from("davs").select("id", { count: "exact", head: true }),
      supabase.from("fams").select("id", { count: "exact", head: true }),
      supabase.from("inspecoes").select("id", { count: "exact", head: true }),
      supabase.from("cits").select("id", { count: "exact", head: true }),
      supabase.from("documentos_rh").select("id", { count: "exact", head: true }).eq("tipo", "outro"),
    ])

    return NextResponse.json({
      counts: {
        davs: davs.count || 0,
        fams: fams.count || 0,
        inspecoes: inspecoes.count || 0,
        cits: cits.count || 0,
        outros: outros.count || 0,
      },
    })
  } catch (error) {
    console.error("Documentos list error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
