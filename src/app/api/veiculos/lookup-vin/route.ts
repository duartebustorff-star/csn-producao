import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/veiculos/lookup-vin
 * Chama vehicledatabases.com para obter especificacoes completas via VIN.
 * Env: VEHICLE_DB_API_KEY
 * Body: { vin: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { vin } = await req.json()

    if (!vin || typeof vin !== "string" || vin.length !== 17) {
      return NextResponse.json({ error: "VIN inválido (deve ter 17 caracteres)" }, { status: 400 })
    }

    const apiKey = process.env.VEHICLE_DB_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "VEHICLE_DB_API_KEY não configurada" }, { status: 500 })
    }

    const cleanVin = vin.toUpperCase().trim()

    // vehicledatabases.com VIN decode endpoint
    const url = `https://api.vehicledatabases.com/vin-decode/${cleanVin}`

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "x-AuthKey": apiKey,
      },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("vehicledatabases.com error:", res.status, text)
      return NextResponse.json(
        { error: "Erro na API vehicledatabases.com", status: res.status },
        { status: 502 }
      )
    }

    const data = await res.json()

    // Extract structured fields from vehicledatabases response
    const info = data.data || data
    const getField = (key: string): string | number | null => {
      if (info && typeof info === "object") {
        return info[key] ?? null
      }
      return null
    }

    const result = {
      vin: cleanVin,
      marca: getField("make") || getField("Make"),
      modelo: getField("model") || getField("Model"),
      ano: getField("year") || getField("model_year") || getField("Year"),
      tipo_veiculo: getField("vehicle_type") || getField("VehicleType"),
      tipo_carrocaria: getField("body_type") || getField("BodyType"),
      pbt: getField("gross_vehicle_weight_kg") || getField("GVWR"),
      tara: getField("curb_weight_kg") || getField("CurbWeight"),
      entre_eixos: getField("wheelbase_mm") || getField("Wheelbase"),
      comprimento: getField("length_mm") || getField("Length"),
      largura: getField("width_mm") || getField("Width"),
      altura: getField("height_mm") || getField("Height"),
      num_eixos: getField("number_of_axles") || getField("Axles"),
      motor_tipo: getField("engine_type") || getField("EngineType"),
      motor_cilindrada: getField("engine_displacement_ccm") || getField("DisplacementCC"),
      motor_potencia: getField("engine_power_kw") || getField("PowerKW"),
      combustivel: getField("fuel_type") || getField("FuelType"),
      emissoes_co2: getField("co2_emission") || getField("CO2"),
      num_portas: getField("number_of_doors") || getField("Doors"),
      num_lugares: getField("number_of_seats") || getField("Seats"),
      cabine: getField("cabin_type") || getField("CabType"),
      raw: data,
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error("lookup-vin error:", e)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
