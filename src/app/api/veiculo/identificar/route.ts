// src/app/api/veiculo/identificar/route.ts
// CSN Opus - L3-MOM Gate 1
// VIN -> Vincario decode -> catalogo_chassis (upsert)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function vincarioHash(vin: string, id: string): string {
  const apiKey = process.env.VINCARIO_API_KEY!
  const secretKey = process.env.VINCARIO_SECRET_KEY!
  const input = `${vin}|${id}|${apiKey}|${secretKey}`
  return createHash('sha1').update(input).digest('hex').substring(0, 10)
}

function getField(decode: Array<{ label: string; value: unknown }>, label: string): unknown {
  const item = decode.find((d) => d.label === label)
  return item?.value ?? null
}

function mapVincarioToChassis(vin: string, decode: Array<{ label: string; value: unknown }>) {
  return {
    vin,
    fonte_dados: 'vincario',
    data_consulta: new Date().toISOString(),
    marca: getField(decode, 'Make'),
    modelo: getField(decode, 'Model'),
    variante: getField(decode, 'Vehicle Specification'),
    ano_modelo: getField(decode, 'Model Year'),
    tipo_veiculo: getField(decode, 'Product Type'),
    serie: getField(decode, 'Series'),
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
    entre_eixos_mm: getField(decode, 'Wheelbase (mm)'),
    comprimento_total_mm: getField(decode, 'Length (mm)'),
    largura_total_mm: getField(decode, 'Width (mm)'),
    altura_total_mm: getField(decode, 'Height (mm)'),
    overhang_traseiro_mm: getField(decode, 'Rear Overhang (mm)'),
    overhang_frontal_mm: getField(decode, 'Front Overhang (mm)'),
    via_frente_mm: getField(decode, 'Track Front (mm)'),
    via_traseira_mm: getField(decode, 'Track Rear (mm)'),
    pbt_kg: getField(decode, 'Max Weight (kg)'),
    carga_tecto_kg: getField(decode, 'Max roof load (kg)'),
    reboque_sem_travoes_kg: getField(decode, 'Permitted trailer load without brakes (kg)'),
    reboque_com_travoes_8_kg: getField(decode, 'Permitted trailer load with brakes 8% (kg)'),
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
    dimensao_pneu: getField(decode, 'Wheel Size'),
    jante: getField(decode, 'Wheel Rims Size'),
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
      return NextResponse.json({ error: 'VIN invalido - deve ter 17 caracteres' }, { status: 400 })
    }
    const vinUpper = vin.toUpperCase()
    const { data: existing } = await supabase.from('catalogo_chassis').select('*').eq('vin', vinUpper).single()
    if (existing) {
      return NextResponse.json({ source: 'cache', message: 'VIN ja existe no catalogo', data: existing })
    }
    const apiKey = process.env.VINCARIO_API_KEY!
    const hash = vincarioHash(vinUpper, 'decode')
    const url = `https://api.vincario.com/3.2/${apiKey}/${hash}/decode/${vinUpper}.json`
    const vincarioRes = await fetch(url)
    const vincarioData = await vincarioRes.json()
    if (vincarioData.error) {
      return NextResponse.json({ error: `Vincario: ${vincarioData.message}` }, { status: 502 })
    }
    const decode = vincarioData.decode
    if (!decode || !Array.isArray(decode)) {
      return NextResponse.json({ error: 'Resposta Vincario invalida' }, { status: 502 })
    }
    const chassisData = mapVincarioToChassis(vinUpper, decode)
    const { data: inserted, error: insertError } = await supabase.from('catalogo_chassis').upsert(chassisData, { onConflict: 'vin' }).select().single()
    if (insertError) {
      return NextResponse.json({ error: `Supabase: ${insertError.message}` }, { status: 500 })
    }
    return NextResponse.json({ source: 'vincario', creditos_restantes: vincarioData.balance?.['API VIN Decode'] ?? null, data: inserted })
  } catch (err) {
    console.error('[veiculo/identificar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const vin = searchParams.get('vin')
  if (!vin) {
    return NextResponse.json({ error: 'VIN em falta' }, { status: 400 })
  }
  const { data, error } = await supabase.from('catalogo_chassis').select('*').eq('vin', vin.toUpperCase()).single()
  if (error || !data) {
    return NextResponse.json({ error: 'VIN nao encontrado no catalogo' }, { status: 404 })
  }
  return NextResponse.json({ source: 'cache', data })
}
