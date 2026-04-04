import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/veiculos/lookup
 * Cadeia completa: matricula -> VIN -> specs
 * Body: { matricula: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { matricula } = body

    if (!matricula || typeof matricula !== "string") {
      return NextResponse.json({ error: "Campo 'matricula' obrigatório" }, { status: 400 })
    }

    const baseUrl = req.nextUrl.origin

    // Step 1: matricula -> VIN + dados basicos
    const step1Res = await fetch(`${baseUrl}/api/veiculos/lookup-matricula`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula }),
    })

    const step1 = await step1Res.json()
    if (!step1Res.ok || !step1.ok) {
      return NextResponse.json({
        ok: false,
        step: "matricula",
        error: step1.error || "Falha no lookup de matrícula",
        fallback: "foto_dua",
      }, { status: 502 })
    }

    // Step 2: VIN -> specs completas
    if (!step1.vin) {
      return NextResponse.json({
        ok: true,
        step: "matricula_only",
        matricula_data: step1,
        vin_data: null,
        aviso: "VIN não encontrado pela API. Necessário foto do DUA ou dados manuais.",
        fallback: "foto_dua",
      })
    }

    const step2Res = await fetch(`${baseUrl}/api/veiculos/lookup-vin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vin: step1.vin }),
    })

    const step2 = await step2Res.json()
    if (!step2Res.ok || !step2.ok) {
      // Partial success: matricula data available, VIN decode failed
      return NextResponse.json({
        ok: true,
        step: "vin_fallback",
        matricula_data: step1,
        vin_data: null,
        aviso: "Matrícula encontrada mas VIN decode falhou. Dados parciais disponíveis.",
      })
    }

    // Full success: both APIs returned data
    return NextResponse.json({
      ok: true,
      step: "completo",
      matricula: step1.matricula,
      vin: step1.vin,
      marca: step2.marca || step1.marca,
      modelo: step2.modelo || step1.modelo,
      ano: step2.ano || step1.ano,
      pbt: step2.pbt,
      tara: step2.tara,
      entre_eixos: step2.entre_eixos,
      cabine: step2.cabine,
      num_eixos: step2.num_eixos,
      comprimento: step2.comprimento,
      largura: step2.largura,
      altura: step2.altura,
      combustivel: step2.combustivel || step1.combustivel,
      tipo_veiculo: step2.tipo_veiculo || step1.tipo_veiculo,
      matricula_data: step1,
      vin_data: step2,
    })
  } catch (e) {
    console.error("veiculos/lookup error:", e)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
