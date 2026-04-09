import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST — Registar documento manualmente (upload directo ou webhook email)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome_ficheiro,
      tipo_documento,
      obra_id,
      fornecedor_id,
      origem,
      url_ficheiro,
      storage_path,
      notas,
      afecta_stock,
      hash_ficheiro
    } = body;

    if (!nome_ficheiro || !tipo_documento) {
      return NextResponse.json(
        { error: 'nome_ficheiro e tipo_documento são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar duplicado por hash
    if (hash_ficheiro) {
      const { data: existente } = await supabase
        .from('documentos')
        .select('id, codigo_interno')
        .eq('hash_ficheiro', hash_ficheiro)
        .limit(1);

      if (existente && existente.length > 0) {
        return NextResponse.json({
          success: false,
          duplicado: true,
          documento_existente: existente[0],
          message: `Documento já existe: ${existente[0].codigo_interno}`
        }, { status: 409 });
      }
    }

    // Gerar código interno
    const { data: codigoData } = await supabase.rpc('gerar_codigo_documento');
    const codigo_interno = codigoData || `CSN-L3-DOC-0000-${new Date().getFullYear()}`;

    // Validar obra se fornecida
    if (obra_id) {
      const { data: obra } = await supabase
        .from('obras')
        .select('id')
        .eq('id', obra_id)
        .single();

      if (!obra) {
        return NextResponse.json({ error: `Obra ${obra_id} não encontrada` }, { status: 404 });
      }
    }

    const { data, error } = await supabase
      .from('documentos')
      .insert({
        nome_ficheiro,
        tipo_documento,
        tipo: tipo_documento,
        obra_id: obra_id || null,
        fornecedor_id: fornecedor_id || null,
        origem: origem || 'upload',
        tipo_entrada: 'manual',
        url_ficheiro: url_ficheiro || null,
        storage_path: storage_path || null,
        afecta_stock: afecta_stock || false,
        estado: obra_id ? 'associado' : 'registado',
        agente: 'L3-DOC',
        codigo_interno,
        hash_ficheiro: hash_ficheiro || null,
        classificacao: {
          metodo: 'manual',
          notas: notas || null,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      documento: data,
      codigo_interno
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro registar documento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — Actualizar estado/dados de documento existente
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
    }

    // Campos permitidos para update
    const allowed = ['estado', 'obra_id', 'tipo_documento', 'tipo', 'afecta_stock',
      'processado', 'processado_em', 'fornecedor_id', 'notas', 'classificacao'];
    const safeUpdates: Record<string, any> = { updated_at: new Date().toISOString() };

    for (const key of Object.keys(updates)) {
      if (allowed.includes(key)) {
        safeUpdates[key] = updates[key];
      }
    }

    const { data, error } = await supabase
      .from('documentos')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, documento: data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
