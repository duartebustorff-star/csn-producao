import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function gerarNumeroNC(ano: number, seq: number): string {
  return `CSN-NC-${ano}-${String(seq).padStart(4, '0')}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { obra_id, fase, tipo, origem, descricao, norma_referencia, gravidade, 
            quantidade_afectada, responsavel_id, accao_imediata } = body

    if (!tipo || !origem || !descricao || !gravidade) {
      return NextResponse.json({ error: 'Campos obrigatórios: tipo, origem, descricao, gravidade' }, { status: 400 })
    }

    const ano = new Date().getFullYear()
    const { count } = await supabase
      .from('nao_conformidades')
      .select('*', { count: 'exact', head: true })
      .like('numero_nc', `CSN-NC-${ano}-%`)

    const numero_nc = gerarNumeroNC(ano, (count || 0) + 1)

    const { data, error } = await supabase
      .from('nao_conformidades')
      .insert({
        numero_nc, obra_id, fase, tipo, origem, descricao,
        norma_referencia, gravidade, quantidade_afectada,
        responsavel_id, accao_imediata, estado: 'aberta'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, nc: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const estado = searchParams.get('estado')
    const obra_id = searchParams.get('obra_id')

    let query = supabase.from('nao_conformidades').select('*').order('created_at', { ascending: false })
    if (estado) query = query.eq('estado', estado)
    if (obra_id) query = query.eq('obra_id', obra_id)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ ncs: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    if (updates.estado === 'fechada') {
      updates.data_fecho = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('nao_conformidades')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, nc: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
