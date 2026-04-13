import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getServiceSupabase()

    const {
      colaborador_id, colaborador_nome,
      tipo_veiculo, matricula, vin, marca, modelo, pbt, tara,
      tipo_carrocaria, comprimento_mm, largura_mm, altura_chassi_piso_mm,
      nome_cliente, telefone_cliente, notas, fotos,
    } = body

    // Insert lead
    const { data: lead, error } = await supabase.from("leads").insert({
      origem: "portal_proposta",
      estado: "novo",
      cliente: nome_cliente || "A definir",
      telefone: telefone_cliente || null,
      tipo_carrocaria: tipo_carrocaria || null,
      veiculo_marca: marca || null,
      veiculo_modelo: modelo || null,
      matricula: matricula || null,
      vin: vin || null,
      pbt: pbt || null,
      tara: tara || null,
      notas: [
        tipo_veiculo === "usado" ? "Veículo usado" : "Veículo novo",
        comprimento_mm ? `Comprimento: ${comprimento_mm}mm` : null,
        largura_mm ? `Largura: ${largura_mm}mm` : null,
        altura_chassi_piso_mm ? `Altura chassi-piso: ${altura_chassi_piso_mm}mm` : null,
        fotos?.length ? `${fotos.length} foto(s) anexadas` : null,
        notas || null,
        `Registado por: ${colaborador_nome}`,
      ].filter(Boolean).join(" | "),
      metadata: {
        tipo_veiculo,
        medidas: { comprimento_mm, largura_mm, altura_chassi_piso_mm },
        fotos: fotos || [],
        colaborador_id,
      },
    }).select("id").single()

    if (error) {
      console.error("Proposta insert error:", error)
      return NextResponse.json({ error: "Erro ao criar lead" }, { status: 500 })
    }

    // Audit
    await audit({
      entidade_tipo: "lead",
      entidade_id: lead.id,
      acao: "criar",
      utilizador_id: colaborador_id,
      utilizador_nome: colaborador_nome,
      metadata: { origem: "portal_proposta", tipo_carrocaria, marca },
    })

    return NextResponse.json({ id: lead.id, success: true })
  } catch (error) {
    console.error("Proposta API error:", error)
    return NextResponse.json({ error: "Erro ao processar proposta" }, { status: 500 })
  }
}
