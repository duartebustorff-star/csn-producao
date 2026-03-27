import { NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET() {
  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from("colaboradores_rh")
    .select("id, nome_completo, nif, niss, regime, taxa_ss_trabalhador, categoria_profissional, tem_km_viatura, ativo")
    .eq("ativo", true)
    .order("id")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
