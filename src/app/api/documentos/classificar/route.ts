import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SKILL_GERAL — Árvore de decisão do Ag. Documental
// Fornecedores de produção (afectam stock)
const FORNECEDORES_PRODUCAO = [
  'chagas', 'coprial', 'pecol', 'polifer', 'madeicentro',
  'aciaria', 'metalogalva', 'f.ramada', 'ferpinta', 'thyssen'
];

function classificarTipo(nomeArquivo: string, assunto: string, remetente: string): {
  tipo: string;
  afecta_stock: boolean;
  agente_destino: string;
} {
  const nome = (nomeArquivo || '').toLowerCase();
  const subj = (assunto || '').toLowerCase();
  const from = (remetente || '').toLowerCase();

  // Certificado de material 3.1 — SEMPRE produção
  if (nome.includes('cert') || nome.includes('3.1') || nome.includes('certificado') ||
      subj.includes('certificado') || subj.includes('cert 3.1')) {
    return { tipo: 'CERT31', afecta_stock: true, agente_destino: 'L3-INV' };
  }

  // Guia de remessa
  if (nome.includes('guia') || nome.includes('remessa') || nome.includes('gr_') ||
      subj.includes('guia de remessa') || subj.includes('guia remessa')) {
    const isProd = FORNECEDORES_PRODUCAO.some(f => from.includes(f) || subj.includes(f));
    return { tipo: 'GR', afecta_stock: isProd, agente_destino: isProd ? 'L3-INV' : 'L4-FIN' };
  }

  // Factura
  if (nome.includes('fatura') || nome.includes('factura') || nome.includes('fat_') ||
      nome.includes('invoice') || subj.includes('fatura') || subj.includes('factura')) {
    const isProd = FORNECEDORES_PRODUCAO.some(f => from.includes(f) || subj.includes(f));
    return { tipo: 'FAT', afecta_stock: isProd, agente_destino: isProd ? 'L3-INV' : 'L4-FIN' };
  }

  // Ficha técnica
  if (nome.includes('ficha') || nome.includes('ft_') || nome.includes('technical') ||
      subj.includes('ficha técnica') || subj.includes('ficha tecnica')) {
    return { tipo: 'FT', afecta_stock: false, agente_destino: 'L3-DOC' };
  }

  // DAV — Declaração Aduaneira de Veículo
  if (nome.includes('dav') || subj.includes('dav') || subj.includes('declaração aduaneira')) {
    return { tipo: 'DAV', afecta_stock: false, agente_destino: 'L4-ENG' };
  }

  // FAM — Ficha de Aprovação de Modelo
  if (nome.includes('fam') || subj.includes('fam') || subj.includes('ficha de aprovação')) {
    return { tipo: 'FAM', afecta_stock: false, agente_destino: 'L4-ENG' };
  }

  // Cartão Único Veículo
  if (nome.includes('cartao') || nome.includes('cartão') || nome.includes('cuv') ||
      subj.includes('cartão único') || subj.includes('cartao unico')) {
    return { tipo: 'CUV', afecta_stock: false, agente_destino: 'L4-ENG' };
  }

  // Inspecção IMT
  if (nome.includes('inspec') || subj.includes('inspecção') || subj.includes('inspecao') ||
      subj.includes('imt')) {
    return { tipo: 'INSP', afecta_stock: false, agente_destino: 'L4-ENG' };
  }

  // Default
  return { tipo: 'ANEXO', afecta_stock: false, agente_destino: 'L3-DOC' };
}

// POST — Classificar documento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome_ficheiro, assunto, remetente, origem, url_ficheiro, storage_path, fornecedor_id, email_id } = body;

    if (!nome_ficheiro) {
      return NextResponse.json({ error: 'nome_ficheiro obrigatório' }, { status: 400 });
    }

    const classificacao = classificarTipo(nome_ficheiro, assunto || '', remetente || '');

    // Gerar código interno
    const { data: codigoData } = await supabase.rpc('gerar_codigo_documento');
    const codigo_interno = codigoData || `CSN-L3-DOC-0000-${new Date().getFullYear()}`;

    // Inserir documento classificado
    const { data, error } = await supabase
      .from('documentos')
      .insert({
        nome_ficheiro,
        url_ficheiro: url_ficheiro || null,
        storage_path: storage_path || null,
        origem: origem || 'email',
        tipo_entrada: 'automatico',
        tipo_documento: classificacao.tipo,
        tipo: classificacao.tipo,
        afecta_stock: classificacao.afecta_stock,
        agente: classificacao.agente_destino,
        estado: 'classificado',
        codigo_interno,
        fornecedor_id: fornecedor_id || null,
        email_id: email_id || null,
        classificacao: {
          metodo: 'SKILL_GERAL_v1',
          confianca: 'auto',
          remetente: remetente || null,
          assunto: assunto || null,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      documento: data,
      classificacao: {
        tipo: classificacao.tipo,
        afecta_stock: classificacao.afecta_stock,
        agente_destino: classificacao.agente_destino,
        codigo_interno
      }
    });

  } catch (error: any) {
    console.error('Erro classificar documento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET — Listar documentos com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');
    const obra_id = searchParams.get('obra_id');
    const afecta_stock = searchParams.get('afecta_stock');
    const processado = searchParams.get('processado');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('documentos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (tipo) query = query.eq('tipo_documento', tipo);
    if (estado) query = query.eq('estado', estado);
    if (obra_id) query = query.eq('obra_id', obra_id);
    if (afecta_stock === 'true') query = query.eq('afecta_stock', true);
    if (processado === 'false') query = query.eq('processado', false);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ documentos: data, total: data?.length || 0 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
