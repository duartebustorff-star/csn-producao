// src/app/api/veiculo/identificar/route.ts
// CSN Opus â€” L3-MOM Gate 1
// VIN â†’ Vincario decode â†’ catalogo_chassis (upsert)
// CÃ³digo: CSN-L3-PRD-001-2026

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Calcular controlSum Vincario: SHA1(VIN|id|apiKey|secretKey) â†’ primeiros 10 chars
function vincarioHash(vin: string, id: string): string {
  const apiKey = process.env.VINCARIO_API_KEY!
  const secretKey = process.env.VINCARIO_SECRET_KEY!
  const input = `${vin}|${id}|${apiKey}|${secretKey}`
  return createHash('sha1').update(input).digest('hex').substring(0, 10)
}

// Extrair valor de um campo do array decode por label
function getField(decode: Array<{ label: string; value: unknown }>, label: string): unknown {
  const item = decode.find((d) => d.label === label)
  return item?.value ?? null
}

// Mapear response Vincario â†’ estrutura catalogo_chassis
function mapVincarioToChassis(vin: string, decode: Array<{ label: string; value: unknown }>) {
  return {
    vin,
    fonte_dados: 'vincario',
    data_consulta: new Date().toISOString(),

    // Identidade
    marca: getField(decode, 'Make'),
    modelo: getField(decode, 'Model'),
    variante: getField(decode, 'Vehicle Specification'),
    ano_modelo: getField(decode, 'Model Year'),
    tipo_veiculo: getField(decode, 'Product Type'),
    serie: getField(decode, 'Series'),

    // Motor
    motor_cc: getField(decode, 'Engine Displacement (ccm)'),
    potencia_kw: getField(decode, 'Engine Power (kW)'),
    potencia_cv: getField(decode, 'Engine Power (HP)'),
    combustivel: getField(decode, 'Fuel Type - Primary'),
    transmissao: getField(decode, 'Transmission'),
    num_velocidades: getField(decode, 'Number of Gears'),
    traccao: getField(decode, 'Drive'),
    norma_emissoes: getField(decode, 'Emission Standard'),
    codigo_motor: getField(decode, 'Engine Code'),
    fabricante_motor: getField(decode, 'Engine Manufacturer'),
    tipo_motor: getField(decode, 'Engine Type'),
    rpm_motor: getField(decode, 'Engine RPM'),
    co2_wltp: getField(decode, 'CO2 Emission (g/km) (WLTP)'),
    consumo_urbano: getField(decode, 'Fuel Consumption Urban (l/100km) (WLTP)'),

    // DimensÃµes
    entre_eixos_mm: getField(decode, 'Wheelbase (mm)'),
    comp_total_mm: getField(decode, 'Length (mm)'),
    largura_caixa_max_mm: getField(decode, 'Width (mm)'),
    altura_total_mm: getField(decode, 'Height (mm)'),
    overhang_traseiro_mm: getField(decode, 'Rear Overhang (mm)'),
    overhang_frontal_mm: getField(decode, 'Front Overhang (mm)'),
    via_frente_mm: getField(decode, 'Track Front (mm)'),
    via_traseira_mm: getField(decode, 'Track Rear (mm)'),

    // Pesos
    pbt_kg: getField(decode, 'Max Weight (kg)'),
    // tara_kg â†’ NULL, preenchida manualmente pelo operador via DUA
    carga_tecto_kg: getField(decode, 'Max roof load (kg)'),
    reboque_sem_travoes_kg: getField(decode, 'Permitted trailer load without brakes (kg)'),
    reboque_com_travoes_8_kg: getField(decode, 'Permitted trailer load with brakes 8% (kg)'),

    // Chassis
    num_eixos: getField(decode, 'Number of Axles'),
    racio_eixo: getField(decode, 'Axle Ratio'),
    travoes_frente: getField(decode, 'Front Brakes'),
    travoes_traseiros: getField(decode, 'Rear Brakes'),
    sistema_travagem: getField(decode, 'Brake System'),
    suspensao: getField(decode, 'Suspension'),
    suspensao_frente: getField(decode, 'Front Suspension'),
    suspensao_traseira: getField(decode, 'Rear Suspension'),
    tipo_direcao: getField(decode, 'Steering Type'),
    abs: getField(decode, 'ABS'),

    // Pneus / Jantes
    dimensao_pneu: getField(decode, 'Wheel Size'),
    jante: getField(decode, 'Wheel Rims Size'),

    // Fabricante
    fabricante: getField(decode, 'Manufacturer'),
    pais_fabrico: getField(decode, 'Plant Country'),
    cidade_fabrico: getField(decode, 'Plant City'),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vin } = body

    if (!vin || vin.length !== 17) {
      return NextResponse.json(
        { error: 'VIN invÃ¡lido â€” deve ter 17 caracteres' },
        { status: 400 }
      )
    }

    const vinUpper = vin.toUpperCase()

    // 1. Verificar se jÃ¡ existe no catalogo_chassis
    const { data: existing } = await supabase
      .from('catalogo_chassis')
      .select('*')
      .eq('vin', vinUpper)
      .single()

    if (existing) {
      return NextResponse.json({
        source: 'cache',
        message: 'VIN jÃ¡ existe no catÃ¡logo',
        data: existing,
      })
    }

    // 2. Chamar Vincario
    const apiKey = process.env.VINCARIO_API_KEY!
    const hash = vincarioHash(vinUpper, 'decode')
    const url = `https://api.vincario.com/3.2/${apiKey}/${hash}/decode/${vinUpper}.json`

    const vincarioRes = await fetch(url)
    const vincarioData = await vincarioRes.json()

    if (vincarioData.error) {
      return NextResponse.json(
        { error: `Vincario: ${vincarioData.message}` },
        { status: 502 }
      )
    }

    const decode = vincarioData.decode
    if (!decode || !Array.isArray(decode)) {
      return NextResponse.json(
        { error: 'Resposta Vincario invÃ¡lida' },
        { status: 502 }
      )
    }

    // 3. Mapear e guardar no catalogo_chassis
    const chassisData = mapVincarioToChassis(vinUpper, decode)

    const { data: inserted, error: insertError } = await supabase
      .from('catalogo_chassis')
      .upsert(chassisData, { onConflict: 'vin' })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: `Supabase: ${insertError.message}` },
        { status: 500 }
      )
    }

    // 4. Devolver resultado
    return NextResponse.json({
      source: 'vincario',
      creditos_restantes: vincarioData.balance?.['API VIN Decode'] ?? null,
      data: inserted,
    })
  } catch (err) {
    console.error('[veiculo/identificar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET â€” consultar VIN existente no catÃ¡logo sem consumir crÃ©dito
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const vin = searchParams.get('vin')

  if (!vin) {
    return NextResponse.json({ error: 'VIN em falta' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('catalogo_chassis')
    .select('*')
    .eq('vin', vin.toUpperCase())
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'VIN nÃ£o encontrado no catÃ¡logo' }, { status: 404 })
  }

  return NextResponse.json({ source: 'cache', data })
}
