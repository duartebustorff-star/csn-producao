import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const plate = req.nextUrl.searchParams.get("plate")
  if (!plate) {
    return NextResponse.json({ error: "Falta matrícula" }, { status: 400 })
  }

  const clean = plate.replace(/[^A-Z0-9]/gi, "").toUpperCase()

  try {
    // matricula.co.pt API (€0.20/consulta)
    const apiKey = process.env.MATRICULA_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key não configurada" }, { status: 500 })
    }

    const res = await fetch(
      `https://api.matricula.co.pt/v1/vehicle/${clean}`,
      { headers: { "Authorization": `Bearer ${apiKey}` } }
    )

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: "Matrícula não encontrada" }, { status: 404 })
      }
      return NextResponse.json({ error: `Erro API: ${res.status}` }, { status: res.status })
    }

    const vehicle = await res.json()

    // Map to our format
    const result = {
      matricula: plate,
      vin: vehicle.vin || "",
      marca: vehicle.make || vehicle.marca || "",
      modelo: vehicle.model || vehicle.modelo || "",
      pbt: vehicle.gross_weight || vehicle.pbt || null,
      tara: vehicle.kerb_weight || vehicle.tara || null,
      distancia_eixos: vehicle.wheelbase || vehicle.distancia_eixos || null,
      combustivel: vehicle.fuel_type || vehicle.combustivel || "",
      data_matricula: vehicle.first_registration || vehicle.data_matricula || "",
      cor: vehicle.color || vehicle.cor || "",
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Matricula API error:", error)
    return NextResponse.json({ error: "Erro ao consultar matrícula" }, { status: 500 })
  }
}
