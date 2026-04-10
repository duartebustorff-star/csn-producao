// /src/app/api/documental/processar/route.ts
// CSN-L3-DOC-049-2026 — Agente Documental (Camada 3 Nucleus)
// Processa anexos de tickets: classifica PDFs, extrai dados, liga a entidades
// ISA-95 Level: L3-MOM/DOC
// ADR-034: Pipeline de Entrada Unificado — Fase 2

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const BATCH_SIZE = 3 // PDFs por execução (limite 60s Vercel)

interface AnexoInfo {
  nome: string
  tipo: string
  tamanho: number
  path: string
  url: string
  classificacao?: string
  dados_extraidos?: Record<string, any>
  processado?: boolean
  erro?: string
}

// --- Classificar documento com Claude ---
async function classificarDocumento(
  pdfBase64: string,
  nomeArquivo: string,
  contextoTicket: { remetente: string; assunto: string; departamento: string }
): Promise<{ classificacao: string; dados_extraidos: Record<string, any> }> {
  const prompt = `Analisa este documento recebido pela CSN (fabricante de carroçarias para veículos comerciais).

CONTEXTO:
- Remetente: ${contextoTicket.remetente}
- Assunto do email: ${contextoTicket.assunto}
- Departamento: ${contextoTicket.departamento}
- Nome do ficheiro: ${nomeArquivo}

CLASSIFICA o documento numa destas categorias:
- factura_fornecedor: factura/recibo de fornecedor
- factura_cliente: factura emitida a cliente
- certificado_material_31: certificado de material EN 10204 3.1
- certificado_soldador: certificado de qualificação de soldador
- cit: certificado de incapacidade temporária
- dav: declaração aduaneira de veículo
- fam: ficha de aptidão do material
- guia_transporte: guia de transporte/remessa
- orcamento: orçamento/proposta
- contrato: contrato/acordo
- coc: certificado de conformidade de veículo
- inspecao: relatório de inspeção
- recibo_vencimento: recibo de vencimento/salário
- outro: documento não classificável

EXTRAI dados relevantes conforme o tipo:
- factura: numero, data, valor_total, valor_iva, nif_emitente, atcud, linhas resumo
- certificado_material: qualidade_aco, composicao, propriedades_mecanicas, lote, vazamento
- cit: nome_colaborador, data_inicio, data_fim, motivo
- orcamento: descricao, valor, validade
- Para outros tipos: extrai o que for relevante

Responde APENAS com JSON:
{"classificacao":"factura_fornecedor","dados_extraidos":{"numero":"FT 2026/123","data":"2026-03-15","valor_total":1500.00,"nif_emitente":"500123456","atcud":"ABC123"}}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const clean = text.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    if (start !== -1 && end > start) {
      return JSON.parse(clean.substring(start, end + 1))
    }

    return { classificacao: 'outro', dados_extraidos: {} }
  } catch (err) {
    console.error('Erro classificacao documento:', err)
    return { classificacao: 'erro_classificacao', dados_extraidos: {} }
  }
}

// --- Download PDF do Storage ---
async function downloadFromStorage(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('documentos')
      .download(path)

    if (error || !data) {
      console.error('Storage download error:', error)
      return null
    }

    const buffer = await data.arrayBuffer()
    return Buffer.from(buffer).toString('base64')
  } catch (err) {
    console.error('Download error:', err)
    return null
  }
}

// --- Acções pós-classificação ---
async function executarAccoes(
  ticketId: string,
  anexo: AnexoInfo,
  classificacao: string,
  dados: Record<string, any>,
  remetente: string
) {
  // Factura fornecedor → tentar match e-Fatura por ATCUD
  if (classificacao === 'factura_fornecedor' && dados.atcud) {
    const { data: efatura } = await supabase
      .from('efatura')
      .select('id')
      .eq('atcud', dados.atcud)
      .limit(1)

    if (efatura && efatura.length > 0) {
      dados.efatura_match = true
      dados.efatura_id = efatura[0].id
    } else {
      dados.efatura_match = false
    }
  }

  // Certificado material 3.1 → inserir na tabela
  if (classificacao === 'certificado_material_31' && dados.qualidade_aco) {
    const { data: forn } = await supabase
      .from('fornecedores')
      .select('id')
      .or(`email.ilike.%${remetente.split('@')[1]}%`)
      .limit(1)

    await supabase.from('certificados_material').insert({
      qualidade_aco: dados.qualidade_aco,
      composicao_quimica: dados.composicao || null,
      propriedades_mecanicas: dados.propriedades_mecanicas || null,
      lote: dados.lote || null,
      vazamento: dados.vazamento || null,
      fornecedor_id: forn?.[0]?.id || null,
      url_certificado: anexo.url,
      notas: `Auto-processado pelo Ag. Documental. Ticket: ${ticketId}`,
    }).then(({ error }) => {
      if (error) console.error('Insert certificado_material erro:', error)
    })
  }

  // CIT → ligar ao colaborador
  if (classificacao === 'cit' && dados.nome_colaborador) {
    const nomeSearch = dados.nome_colaborador.toLowerCase()
    const { data: colab } = await supabase
      .from('colaboradores')
      .select('id, nome')
      .or(`nome.ilike.%${nomeSearch}%`)
      .limit(1)

    if (colab && colab.length > 0) {
      dados.colaborador_id = colab[0].id
      dados.colaborador_nome = colab[0].nome
    }
  }
}

// --- MAIN: Processar batch de tickets pendentes ---
async function processarBatch(): Promise<{
  processados: number
  erros: number
  detalhes: string[]
}> {
  const resultado = { processados: 0, erros: 0, detalhes: [] as string[] }

  // Buscar tickets com anexos pendentes
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('id, remetente, assunto, departamento, anexos')
    .eq('anexos_estado', 'pendente')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error || !tickets || tickets.length === 0) {
    resultado.detalhes.push('Nenhum ticket pendente')
    return resultado
  }

  for (const ticket of tickets) {
    // Marcar como a_processar
    await supabase
      .from('tickets')
      .update({ anexos_estado: 'a_processar' })
      .eq('id', ticket.id)

    let anexos: AnexoInfo[]
    try {
      anexos = typeof ticket.anexos === 'string'
        ? JSON.parse(ticket.anexos)
        : ticket.anexos || []
    } catch {
      anexos = []
    }

    let todosProcessados = true

    for (let i = 0; i < anexos.length; i++) {
      const anexo = anexos[i]

      // Só processar PDFs (imagens e outros ficam como estão)
      if (!anexo.tipo || !anexo.tipo.includes('pdf')) {
        anexo.processado = true
        anexo.classificacao = 'nao_pdf'
        continue
      }

      if (!anexo.path) {
        anexo.processado = true
        anexo.erro = 'sem_path'
        continue
      }

      try {
        // Download do Storage
        const pdfBase64 = await downloadFromStorage(anexo.path)
        if (!pdfBase64) {
          anexo.processado = true
          anexo.erro = 'download_falhou'
          todosProcessados = false
          resultado.erros++
          continue
        }

        // Classificar com Claude
        const { classificacao, dados_extraidos } = await classificarDocumento(
          pdfBase64,
          anexo.nome,
          {
            remetente: ticket.remetente,
            assunto: ticket.assunto,
            departamento: ticket.departamento,
          }
        )

        // Acções pós-classificação
        await executarAccoes(ticket.id, anexo, classificacao, dados_extraidos, ticket.remetente)

        // Actualizar anexo
        anexo.classificacao = classificacao
        anexo.dados_extraidos = dados_extraidos
        anexo.processado = true

        resultado.processados++
        resultado.detalhes.push(
          `${ticket.id}: ${anexo.nome} → ${classificacao}`
        )
      } catch (err: any) {
        anexo.processado = true
        anexo.erro = err.message?.slice(0, 100)
        todosProcessados = false
        resultado.erros++
        resultado.detalhes.push(
          `${ticket.id}: ${anexo.nome} → ERRO: ${err.message?.slice(0, 60)}`
        )
      }
    }

    // Actualizar ticket com anexos processados
    await supabase
      .from('tickets')
      .update({
        anexos: JSON.stringify(anexos),
        anexos_estado: todosProcessados ? 'processado' : 'erro',
      })
      .eq('id', ticket.id)
  }

  return resultado
}

// --- POST: Processar batch ---
export async function POST(request: NextRequest) {
  try {
    const resultado = await processarBatch()

    return NextResponse.json({
      status: 'ok',
      agente: 'L3-DOC Agente Documental',
      ...resultado,
    })
  } catch (err: any) {
    console.error('Agente Documental error:', err)
    return NextResponse.json(
      { error: 'Erro no Agente Documental', detalhes: err.message },
      { status: 500 }
    )
  }
}

// --- GET: Estado dos documentos pendentes ---
export async function GET(request: NextRequest) {
  try {
    const { data: pendentes } = await supabase
      .from('tickets')
      .select('id, remetente, assunto, anexos_estado, created_at')
      .eq('anexos_estado', 'pendente')
      .order('created_at', { ascending: true })

    const { data: processados } = await supabase
      .from('tickets')
      .select('id')
      .eq('anexos_estado', 'processado')

    const { data: erros } = await supabase
      .from('tickets')
      .select('id')
      .eq('anexos_estado', 'erro')

    return NextResponse.json({
      agente: 'L3-DOC Agente Documental',
      pendentes: pendentes?.length || 0,
      processados: processados?.length || 0,
      erros: erros?.length || 0,
      fila: pendentes || [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
