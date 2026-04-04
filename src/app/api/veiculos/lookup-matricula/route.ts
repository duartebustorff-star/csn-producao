import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/veiculos/lookup-matricula
 * Chama regcheck.org.uk para obter VIN + dados basicos a partir da matricula.
 * Env: MATRICULA_USERNAME (ex: CSN)
 * Body: { matricula: string, pais?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { matricula, pais } = await req.json()

    if (!matricula || typeof matricula !== "string") {
      return NextResponse.json({ error: "Campo 'matricula' obrigatório" }, { status: 400 })
    }

    const username = process.env.MATRICULA_USERNAME
    if (!username) {
      return NextResponse.json({ error: "MATRICULA_USERNAME não configurada" }, { status: 500 })
    }

    const country = pais || "pt"
    const cleanPlate = matricula.replace(/[\s\-]/g, "").toUpperCase()

    // regcheck.org.uk REST/JSON endpoint (CheckPortugal)
    const url = `https://www.regcheck.org.uk/api/reg.asmx/CheckPortugal?RegistrationNumber=${encodeURIComponent(cleanPlate)}&username=${encodeURIComponent(username)}`

    const res = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("regcheck.org.uk error:", res.status, text)
      return NextResponse.json(
        { error: "Erro na API regcheck.org.uk", status: res.status },
        { status: 502 }
      )
    }

    const data = await res.json()

    // Extract key fields from response
    const result = {
      matricula: cleanPlate,
      pais: country,
      vin: data.vin || data.VIN || null,
      marca: data.make || data.Make || data.Description?.split(" ")[0] || null,
      modelo: data.model || data.Model || null,
      cor: data.color || data.Color || data.Colour || null,
      ano: data.year || data.Year || data.YearOfManufacture || null,
      combustivel: data.fuel || data.Fuel || data.FuelType || null,
      cilindrada: data.engineSize || data.EngineSize || data.EngineCC || null,
      potencia: data.power || data.Power || null,
      tipo_veiculo: data.vehicleType || data.VehicleType || null,
      raw: data,
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error("lookup-matricula error:", e)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
