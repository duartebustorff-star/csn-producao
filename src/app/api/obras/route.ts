import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const estado = req.nextUrl.searchParams.get("estado")
  const leadId = req.nextUrl.searchParams.get("lead_id")
  const supabase = getServiceSupabase()

  let query = supabase
    .from("obras")
    .select("*, fases_obra(*), leads(id, cliente, cliente_final, tipo_carrocaria, tipo_taipais, dimensoes, veiculo_marca, veiculo_modelo)")
    .order("created_at", { ascending: false })

  if (estado && estado !== "todas") {
    query = query.eq("estado", estado)
  }

  if (leadId) {
    query = query.eq("lead_id", leadId)
  }

  const { data: obras, error } = await query

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar obras" }, { status: 500 })
  }

  // Check DAV/FAM status for each obra
  const obrasWithDocs = await Promise.all(
    (obras || []).map(async (obra) => {
      let davStatus = false
      let famStatus = false

      if (obra.vin) {
        const { data: dav } = await supabase
          .from("davs")
          .select("id, cod_homologacao, matricula")
          .eq("vin", obra.vin)
          .maybeSingle()

        if (dav) {
          davStatus = true
          if (dav.cod_homologacao) {
            const { data: fam } = await supabase
              .from("fams")
              .select("id")
              .eq("numero_homologacao_nacional", dav.cod_homologacao)
              .maybeSingle()
            famStatus = !!fam
          }
        }
      }

      return { ...obra, has_dav: davStatus, has_fam: famStatus }
    })
  )

  return NextResponse.json({ obras: obrasWithDocs })
}
