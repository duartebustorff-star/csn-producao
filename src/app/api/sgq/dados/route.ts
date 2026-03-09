/**
 * CSN Produção — API Route: Dados SGQ
 *
 * GET /api/sgq/dados?tipo=documentos  → sgq_documentos (ativos)
 * GET /api/sgq/dados?tipo=objetivos   → sgq_objetivos (ativos)
 * GET /api/sgq/dados?tipo=registos    → sgq_objetivos_registos
 */

import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const tipo = request.nextUrl.searchParams.get("tipo") || "documentos"
  const sb = getServiceSupabase()

  try {
    switch (tipo) {
      case "documentos": {
        const { data, error } = await sb
          .from("sgq_documentos")
          .select("*")
          .eq("ativo", true)
          .order("tipo")
        if (error) throw error
        return NextResponse.json({ data })
      }

      case "objetivos": {
        const { data, error } = await sb
          .from("sgq_objetivos")
          .select("*")
          .eq("ativo", true)
          .order("processo")
        if (error) throw error
        return NextResponse.json({ data })
      }

      case "registos": {
        const objetivo_id = request.nextUrl.searchParams.get("objetivo_id")
        let query = sb
          .from("sgq_objetivos_registos")
          .select("*")
          .order("periodo", { ascending: false })
        if (objetivo_id) {
          query = query.eq("objetivo_id", objetivo_id)
        }
        const { data, error } = await query
        if (error) throw error
        return NextResponse.json({ data })
      }

      default:
        return NextResponse.json({ error: `Tipo '${tipo}' não reconhecido` }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Erro SGQ dados:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
