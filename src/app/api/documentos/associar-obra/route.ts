import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH — Associar documento(s) a uma obra
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { documento_ids, obra_id } = body;

    if (!documento_ids || !obra_id) {
      return NextResponse.json(
        { error: 'documento_ids (array) e obra_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a obra existe
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('id, estado')
      .eq('id', obra_id)
      .single();

    if (obraError || !obra) {
      return NextResponse.json({ error: `Obra ${obra_id} não encontrada` }, { status: 404 });
    }

    // Associar documentos
    const ids = Array.isArray(documento_ids) ? documento_ids : [documento_ids];
    const { data, error } = await supabase
      .from('documentos')
      .update({
        obra_id,
        estado: 'associado',
        updated_at: new Date().toISOString()
      })
      .in('id', ids)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      obra_id,
      documentos_associados: data?.length || 0,
      documentos: data
    });

  } catch (error: any) {
    console.error('Erro associar obra:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET — Listar documentos de uma obra
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const obra_id = searchParams.get('obra_id');

    if (!obra_id) {
      return NextResponse.json({ error: 'obra_id obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('obra_id', obra_id)
      .order('tipo_documento', { ascending: true });

    if (error) throw error;

    // Agrupar por tipo
    const por_tipo: Record<string, any[]> = {};
    (data || []).forEach(doc => {
      const tipo = doc.tipo_documento;
      if (!por_tipo[tipo]) por_tipo[tipo] = [];
      por_tipo[tipo].push(doc);
    });

    return NextResponse.json({
      obra_id,
      total: data?.length || 0,
      por_tipo,
      documentos: data
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
