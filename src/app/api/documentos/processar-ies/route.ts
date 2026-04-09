/**
 * CSN-L3-DOC-0004-2026 — Processar IES/DA
 * Nível ISA-95: L4-BPL (FIN) / Executado por L3-DOC (Ag. Documental)
 * Camada: C3
 * 
 * Extrai automaticamente DR, Balanço, FSE, Pessoal e metadados
 * de documentos IES/DA da AT via Claude API (Haiku).
 * Insere em demonstracao_resultados + ies_declaracoes.
 * 
 * POST: { documento_id } ou { ficheiro_path } ou { pdf_base64 }
 * GET: info sobre o endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXTRACTION_PROMPT = `Extrai os seguintes campos deste documento IES/DA português.
Responde APENAS em JSON válido sem markdown, sem backticks, sem texto adicional.
Todos os valores numéricos em formato decimal (ex: 435155.64). Sem separadores de milhar.
Se um campo não existir ou estiver vazio, usa null.

{
  "metadados": {
    "ano": null,
    "identificacao": null,
    "codigo_validacao": null,
    "data_rececao": null,
    "nif": null,
    "cae_principal": null,
    "cc_nif": null,
    "representante_legal_nif": null,
    "referencial": null,
    "tipo": null
  },
  "dr": {
    "vendas_servicos": null,
    "subsidios_exploracao": null,
    "variacao_inventarios_producao": null,
    "trabalhos_propria_entidade": null,
    "cmvmc": null,
    "fse": null,
    "gastos_pessoal": null,
    "outros_rendimentos_ganhos": null,
    "outros_gastos_perdas": null,
    "depreciacao_amortizacao": null,
    "imparidade_investimentos": null,
    "juros_rendimentos": null,
    "juros_gastos": null,
    "imposto_rendimento": null,
    "resultado_liquido_conferencia": null
  },
  "balanco": {
    "ativo_total": null,
    "ativo_fixo_tangivel": null,
    "inventarios": null,
    "clientes": null,
    "caixa_depositos": null,
    "capital_proprio": null,
    "capital_realizado": null,
    "reservas_legais": null,
    "resultados_transitados": null,
    "passivo_total": null,
    "fornecedores": null,
    "estado_entes_publicos": null
  },
  "fse_detalhe": {
    "trabalhos_especializados": null,
    "vigilancia": null,
    "conservacao_reparacao": null,
    "ferramentas": null,
    "material_escritorio": null,
    "artigos_oferta": null,
    "electricidade": null,
    "combustiveis": null,
    "agua": null,
    "deslocacoes": null,
    "rendas": null,
    "comunicacao": null,
    "seguros": null,
    "limpeza": null,
    "contencioso": null
  },
  "pessoal_detalhe": {
    "nr_medio": null,
    "horas_trabalhadas": null,
    "remuneracoes": null,
    "encargos_ss": null,
    "seguros_at": null,
    "formacao": null
  },
  "imposto": {
    "tributacoes_autonomas": null,
    "taxa_efectiva_pct": null
  },
  "deliberacao": {
    "contas_aprovadas": null,
    "data_aprovacao": null,
    "unanimidade": null
  },
  "estabelecimento": {
    "area_total_m2": null,
    "area_armazenagem_m2": null,
    "area_servicos_m2": null,
    "data_inicio_exploracao": null
  },
  "facturacao": {
    "certificado_numero": null
  }
}

INSTRUÇÕES DE EXTRACÇÃO:
- metadados.ano: campo 01 "PERÍODO DE TRIBUTAÇÃO" / "ANO"
- metadados.identificacao: "Identificação da Declaração" (ex: 1546-I1707-48)
- metadados.codigo_validacao: "Cód. Validação"
- metadados.data_rececao: "Data de Receção" formato YYYY-MM-DD
- metadados.nif: campo 03 "NÚMERO DE IDENTIFICAÇÃO FISCAL"
- metadados.cae_principal: campo 04 "CÓDIGO CAE"
- metadados.cc_nif: campo 09.2 "NIF do Contabilista Certificado"
- metadados.representante_legal_nif: campo 09.1 "NIF do Representante Legal"
- metadados.referencial: campo 02-A, valores possíveis: "NC-ME" "NCRF-PE" "NCRF" "NIC"
- metadados.tipo: "1a_declaracao" se campo 07 marca 1ª, "substituicao" se marca substituição
- dr.*: secção 03-A "DEMONSTRAÇÃO DOS RESULTADOS POR NATUREZAS" coluna N (período actual)
- dr.vendas_servicos: A5001
- dr.subsidios_exploracao: A5002
- dr.variacao_inventarios_producao: A5004
- dr.trabalhos_propria_entidade: A5005
- dr.cmvmc: A5006
- dr.fse: A5007
- dr.gastos_pessoal: A5008
- dr.outros_rendimentos_ganhos: A5015
- dr.outros_gastos_perdas: A5016
- dr.depreciacao_amortizacao: A5018
- dr.imparidade_investimentos: A5019
- dr.juros_rendimentos: A5021
- dr.juros_gastos: A5022
- dr.imposto_rendimento: A5024
- dr.resultado_liquido_conferencia: A5025
- balanco.*: secção 04-A "BALANÇO" coluna N
- balanco.ativo_total: A5127
- balanco.ativo_fixo_tangivel: A5101
- balanco.inventarios: A5113
- balanco.clientes: A5115
- balanco.caixa_depositos: A5125
- balanco.capital_proprio: A5141
- balanco.capital_realizado: A5128
- balanco.reservas_legais: A5132
- balanco.resultados_transitados: A5134
- balanco.passivo_total: A5160
- balanco.fornecedores: A5148
- balanco.estado_entes_publicos: A5150
- fse_detalhe.*: secção 061-A "CONTAS DE GASTOS" contas 62xx
- pessoal_detalhe.*: secção 05291-A e 05292-A
- pessoal_detalhe.remuneracoes: A6027
- pessoal_detalhe.encargos_ss: A6035
- pessoal_detalhe.seguros_at: A6036
- pessoal_detalhe.formacao: A6039
- imposto.tributacoes_autonomas: A5957
- imposto.taxa_efectiva_pct: A5958
- deliberacao: secção 07
- estabelecimento: secção 04-A Anexo R (última página)
- facturacao.certificado_numero: secção 12`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documento_id, pdf_base64 } = body;

    if (!pdf_base64) {
      return NextResponse.json({
        error: 'Fornecer pdf_base64 (PDF em base64)',
        uso: 'POST { pdf_base64: "...", documento_id?: "uuid" }'
      }, { status: 400 });
    }

    // 1. Enviar para Claude API para extracção
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdf_base64,
                },
              },
              {
                type: 'text',
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      return NextResponse.json({
        error: 'Erro na Claude API',
        status: claudeResponse.status,
        detail: errText.substring(0, 500),
      }, { status: 502 });
    }

    const claudeData = await claudeResponse.json();

    // 2. Parse resposta
    const responseText = claudeData.content
      ?.filter((block: any) => block.type === 'text')
      ?.map((block: any) => block.text)
      ?.join('') || '';

    let extracted: any;
    try {
      const clean = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extracted = JSON.parse(clean);
    } catch (parseError) {
      return NextResponse.json({
        error: 'Falha a parsear JSON da extracção',
        raw_response: responseText.substring(0, 1000),
      }, { status: 500 });
    }

    const { metadados, dr, balanco, fse_detalhe, pessoal_detalhe, imposto, deliberacao, estabelecimento, facturacao } = extracted;
    const ano = metadados?.ano;

    if (!ano) {
      return NextResponse.json({ error: 'Não foi possível extrair o ano fiscal', extracted }, { status: 400 });
    }

    // 3. UPSERT demonstracao_resultados
    const drRow: Record<string, any> = {
      ano,
      fonte: `IES ${ano} (NIF ${metadados.nif || '500861790'}, entregue ${metadados.data_rececao || 'desconhecido'})`,
      vendas_servicos: dr?.vendas_servicos ?? null,
      subsidios_exploracao: dr?.subsidios_exploracao ?? 0,
      variacao_inventarios_producao: dr?.variacao_inventarios_producao ?? 0,
      trabalhos_propria_entidade: dr?.trabalhos_propria_entidade ?? 0,
      outros_rendimentos_ganhos: dr?.outros_rendimentos_ganhos ?? 0,
      cmvmc: dr?.cmvmc ?? null,
      fse: dr?.fse ?? null,
      gastos_pessoal: dr?.gastos_pessoal ?? null,
      imparidade_dividas: 0,
      provisoes: 0,
      outras_imparidades: 0,
      outros_gastos_perdas: dr?.outros_gastos_perdas ?? 0,
      depreciacao_amortizacao: dr?.depreciacao_amortizacao ?? 0,
      imparidade_investimentos: dr?.imparidade_investimentos ?? 0,
      juros_rendimentos: dr?.juros_rendimentos ?? 0,
      juros_gastos: dr?.juros_gastos ?? 0,
      imposto_rendimento: dr?.imposto_rendimento ?? 0,
      tributacoes_autonomas: imposto?.tributacoes_autonomas ?? 0,
      fse_trabalhos_especializados: fse_detalhe?.trabalhos_especializados ?? 0,
      fse_vigilancia: fse_detalhe?.vigilancia ?? 0,
      fse_conservacao_reparacao: fse_detalhe?.conservacao_reparacao ?? 0,
      fse_ferramentas: fse_detalhe?.ferramentas ?? 0,
      fse_material_escritorio: fse_detalhe?.material_escritorio ?? 0,
      fse_artigos_oferta: fse_detalhe?.artigos_oferta ?? 0,
      fse_electricidade: fse_detalhe?.electricidade ?? 0,
      fse_combustiveis: fse_detalhe?.combustiveis ?? 0,
      fse_agua: fse_detalhe?.agua ?? 0,
      fse_deslocacoes: fse_detalhe?.deslocacoes ?? 0,
      fse_rendas: fse_detalhe?.rendas ?? 0,
      fse_comunicacao: fse_detalhe?.comunicacao ?? 0,
      fse_seguros: fse_detalhe?.seguros ?? 0,
      fse_limpeza: fse_detalhe?.limpeza ?? 0,
      fse_contencioso: fse_detalhe?.contencioso ?? 0,
      pessoal_remuneracoes: pessoal_detalhe?.remuneracoes ?? 0,
      pessoal_encargos_ss: pessoal_detalhe?.encargos_ss ?? 0,
      pessoal_seguros_at: pessoal_detalhe?.seguros_at ?? 0,
      pessoal_formacao: pessoal_detalhe?.formacao ?? 0,
      pessoal_nr_medio: pessoal_detalhe?.nr_medio ?? null,
      pessoal_horas_trabalhadas: pessoal_detalhe?.horas_trabalhadas ?? null,
      ativo_total: balanco?.ativo_total ?? null,
      ativo_fixo_tangivel: balanco?.ativo_fixo_tangivel ?? 0,
      inventarios: balanco?.inventarios ?? 0,
      clientes: balanco?.clientes ?? 0,
      caixa_depositos: balanco?.caixa_depositos ?? 0,
      capital_proprio: balanco?.capital_proprio ?? null,
      passivo_total: balanco?.passivo_total ?? null,
      fornecedores: balanco?.fornecedores ?? 0,
      estado_entes_publicos: balanco?.estado_entes_publicos ?? 0,
      notas: `Processado automaticamente Ag. Documental (CSN-L3-DOC-0004-2026). RL conferência: ${dr?.resultado_liquido_conferencia ?? 'N/A'}`,
    };

    const { data: drData, error: drError } = await supabase
      .from('demonstracao_resultados')
      .upsert(drRow, { onConflict: 'ano' })
      .select('id')
      .single();

    if (drError) {
      return NextResponse.json({ error: 'Erro UPSERT demonstracao_resultados', detail: drError.message }, { status: 500 });
    }

    // 4. UPSERT ies_declaracoes
    const iesRow: Record<string, any> = {
      ano,
      nif: metadados.nif ?? '500861790',
      identificacao: metadados.identificacao,
      codigo_validacao: metadados.codigo_validacao,
      data_rececao: metadados.data_rececao,
      tipo: metadados.tipo ?? '1a_declaracao',
      referencial_contabilistico: metadados.referencial,
      cc_nif: metadados.cc_nif,
      representante_legal_nif: metadados.representante_legal_nif,
      anexo_a: true,
      anexo_r: true,
      cae_principal: metadados.cae_principal,
      area_total_m2: estabelecimento?.area_total_m2,
      area_armazenagem_m2: estabelecimento?.area_armazenagem_m2,
      area_servicos_m2: estabelecimento?.area_servicos_m2,
      data_inicio_exploracao: estabelecimento?.data_inicio_exploracao,
      contas_aprovadas: deliberacao?.contas_aprovadas,
      data_aprovacao: deliberacao?.data_aprovacao,
      aprovacao_unanimidade: deliberacao?.unanimidade,
      programa_facturacao_certificado: !!facturacao?.certificado_numero,
      certificado_numero: facturacao?.certificado_numero,
      dr_id: drData?.id,
      notas: `Processado automaticamente. Taxa efectiva IRC: ${imposto?.taxa_efectiva_pct ?? 'N/A'}%.`,
    };

    const { error: iesError } = await supabase
      .from('ies_declaracoes')
      .upsert(iesRow, { onConflict: 'ano' });

    if (iesError) {
      return NextResponse.json({ error: 'Erro UPSERT ies_declaracoes', detail: iesError.message }, { status: 500 });
    }

    // 5. Marcar documento como processado (se fornecido)
    if (documento_id) {
      await supabase
        .from('documentos')
        .update({ processado: true, processado_em: new Date().toISOString() })
        .eq('id', documento_id);
    }

    // 6. Retornar resumo
    return NextResponse.json({
      success: true,
      ano,
      resumo: {
        vendas_servicos: dr?.vendas_servicos,
        cmvmc: dr?.cmvmc,
        fse: dr?.fse,
        gastos_pessoal: dr?.gastos_pessoal,
        ebitda: drRow.vendas_servicos + (drRow.subsidios_exploracao || 0) + (drRow.variacao_inventarios_producao || 0) + (drRow.outros_rendimentos_ganhos || 0) - drRow.cmvmc - drRow.fse - drRow.gastos_pessoal - (drRow.outros_gastos_perdas || 0),
        resultado_liquido: dr?.resultado_liquido_conferencia,
        ativo_total: balanco?.ativo_total,
        capital_proprio: balanco?.capital_proprio,
        nr_pessoas: pessoal_detalhe?.nr_medio,
      },
      tabelas: ['demonstracao_resultados', 'ies_declaracoes'],
    });

  } catch (error: any) {
    console.error('Erro processar-ies:', error);
    return NextResponse.json({ error: 'Erro interno', detail: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    skill: 'processar-ies',
    codigo: 'CSN-L3-DOC-0004-2026',
    nivel_isa95: 'L4-BPL (FIN)',
    camada: 'C3 (Agente Documental)',
    descricao: 'Processa IES/DA da AT. Extrai DR, Balanço, FSE, Pessoal, Metadados via Claude Haiku.',
    uso: 'POST { pdf_base64: "..." }',
    tabelas: ['demonstracao_resultados', 'ies_declaracoes'],
  });
}
