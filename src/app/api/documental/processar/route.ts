// /src/app/api/documental/processar/route.ts
// CSN-L3-DOC-051-2026 — Agente Documental Unificado (Camada 3 Nucleus)
// Ponto ÚNICO de processamento documental — todas as entradas convergem aqui
// ISA-95 Level: L3-MOM/DOC
// S51: Refactor — Sonnet classifica+extrai, extractores dedicados por tipo

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { processarDocumento, ProcessResult } from '@/lib/document-processors'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const BATCH_SIZE = 3

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

// --- Download PDF do Storage ---
async function downloadFromStorage(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from('documentos').download(path)
    if (error || !data) { console.error('Storage download error:', error); return null }
    const buffer = await data.arrayBuffer()
    return Buffer.from(buffer).toString('base64')
  } catch (err) { console.error('Download error:', err); return null }
}

// --- MAIN: Processar batch de tickets pendentes ---
async function processarBatch(): Promise<{
  processados: number; erros: number; detalhes: string[]
}> {
  const resultado = { processados: 0, erros: 0, detalhes: [] as string[] }

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
    await supabase.from('tickets').update({ anexos_estado: 'a_processar' }).eq('id', ticket.id)

    let anexos: AnexoInfo[]
    try {
      anexos = typeof ticket.anexos === 'string' ? JSON.parse(ticket.anexos) : ticket.anexos || []
    } catch { anexos = [] }

    let todosProcessados = true

    for (let i = 0; i < anexos.length; i++) {
      const anexo = anexos[i]

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
        const pdfBase64 = await downloadFromStorage(anexo.path)
        if (!pdfBase64) {
          anexo.processado = true
          anexo.erro = 'download_falhou'
          todosProcessados = false
          resultado.erros++
          continue
        }

        // Chamar processador unificado
        const result: ProcessResult = await processarDocumento(
          pdfBase64,
          anexo.nome,
          anexo.path,
          anexo.url,
          { ticket_id: ticket.id, remetente: ticket.remetente },
          anthropic,
          supabase
        )

        anexo.classificacao = result.classificacao
        anexo.dados_extraidos = result.dados as Record<string, any>
        anexo.processado = true

        if (result.erro) {
          anexo.erro = result.erro
          todosProcessados = false
          resultado.erros++
        } else {
          resultado.processados++
        }

        resultado.detalhes.push(`${ticket.id}: ${anexo.nome} → ${result.classificacao} → ${result.tabela_destino || 'documentos'}`)

      } catch (err: any) {
        anexo.processado = true
        anexo.erro = err.message?.slice(0, 100)
        todosProcessados = false
        resultado.erros++
        resultado.detalhes.push(`${ticket.id}: ${anexo.nome} → ERRO: ${err.message?.slice(0, 60)}`)
      }
    }

    const primeiroErro = anexos.find((a) => a.erro)?.erro || null
    await supabase.from('tickets').update({
      anexos: JSON.stringify(anexos),
      anexos_estado: todosProcessados ? 'processado' : 'erro',
      anexos_erro: todosProcessados ? null : primeiroErro,
    }).eq('id', ticket.id)
  }

  return resultado
}

// --- POST: Processar batch (via Router trigger) ou reprocess ---
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      return await processarUploadDirecto(request)
    }

    // JSON body — reprocess ou batch
    const body = await request.json().catch(() => ({}))
    
    if (body.reprocess_paths && Array.isArray(body.reprocess_paths)) {
      return await reprocessarDoStorage(body.reprocess_paths)
    }

    // Batch trigger (do Router)
    const resultado = await processarBatch()
    return NextResponse.json({ status: 'ok', agente: 'L3-DOC Agente Documental', ...resultado })

  } catch (err: any) {
    console.error('Agente Documental error:', err)
    return NextResponse.json({ error: 'Erro no Agente Documental', detalhes: err.message }, { status: 500 })
  }
}

// --- Reprocessar PDFs que já estão no Storage ---
async function reprocessarDoStorage(paths: string[]): Promise<NextResponse> {
  const resultados: ProcessResult[] = []

  for (const storagePath of paths) {
    try {
      const pdfBase64 = await downloadFromStorage(storagePath)
      if (!pdfBase64) {
        resultados.push({
          tipo: 'erro', classificacao: 'download_falhou',
          dados: { path: storagePath }, tabela_destino: null,
          registo_id: null, documento_id: null,
          mensagem: `Download falhou: ${storagePath}`,
        })
        continue
      }

      const { data: urlData } = await supabase.storage
        .from('documentos')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365)

      const fileName = storagePath.split('/').pop() || 'unknown.pdf'

      const result = await processarDocumento(
        pdfBase64, fileName, storagePath,
        urlData?.signedUrl || '',
        { uploaded_by: 'reprocess' },
        anthropic, supabase
      )
      resultados.push(result)
    } catch (err: any) {
      resultados.push({
        tipo: 'erro', classificacao: 'erro_processamento',
        dados: { path: storagePath }, tabela_destino: null,
        registo_id: null, documento_id: null,
        mensagem: `Erro: ${storagePath}`, erro: err.message,
      })
    }
  }

  return NextResponse.json({
    status: 'ok',
    agente: 'L3-DOC Agente Documental (reprocess)',
    total: paths.length,
    processados: resultados.filter(r => !r.erro).length,
    erros: resultados.filter(r => !!r.erro).length,
    resultados,
  })
}

// --- Upload directo de múltiplos ficheiros ---
async function processarUploadDirecto(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  const uploadedBy = (formData.get('uploaded_by') as string) || 'manual'

  // Suportar também campo singular "file"
  const singleFile = formData.get('file') as File | null
  if (singleFile && files.length === 0) files.push(singleFile)

  if (files.length === 0) {
    return NextResponse.json({ error: 'Nenhum ficheiro enviado' }, { status: 400 })
  }

  const resultados: ProcessResult[] = []

  for (const file of files) {
    if (file.type !== 'application/pdf') {
      resultados.push({
        tipo: 'erro', classificacao: 'nao_pdf',
        dados: { nome: file.name }, tabela_destino: null,
        registo_id: null, documento_id: null,
        mensagem: `${file.name}: apenas PDFs são suportados`,
      })
      continue
    }

    try {
      // Upload para Storage
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const storagePath = `uploads/${Date.now()}_${file.name}`

      await supabase.storage.from('documentos').upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: file.type,
      })

      const { data: urlData } = await supabase.storage
        .from('documentos')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365)

      const fileUrl = urlData?.signedUrl || ''

      // Processar
      const result = await processarDocumento(
        base64, file.name, storagePath, fileUrl,
        { uploaded_by: uploadedBy },
        anthropic, supabase
      )

      resultados.push(result)

    } catch (err: any) {
      resultados.push({
        tipo: 'erro', classificacao: 'erro_processamento',
        dados: { nome: file.name }, tabela_destino: null,
        registo_id: null, documento_id: null,
        mensagem: `Erro ao processar ${file.name}`, erro: err.message,
      })
    }
  }

  return NextResponse.json({
    status: 'ok',
    agente: 'L3-DOC Agente Documental',
    ficheiros: files.length,
    resultados,
  })
}

// --- GET: Estado ---
export async function GET(request: NextRequest) {
  try {
    const { data: pendentes } = await supabase
      .from('tickets').select('id, remetente, assunto, anexos_estado, created_at')
      .eq('anexos_estado', 'pendente').order('created_at', { ascending: true })

    const { data: processados } = await supabase.from('tickets').select('id').eq('anexos_estado', 'processado')
    const { data: erros } = await supabase.from('tickets').select('id').eq('anexos_estado', 'erro')

    const { data: docsForn } = await supabase.from('documentos_fornecedor').select('id')
    const { data: movStock } = await supabase.from('movimentos_stock').select('id')

    return NextResponse.json({
      agente: 'L3-DOC Agente Documental (Unificado S51)',
      tickets_pendentes: pendentes?.length || 0,
      tickets_processados: processados?.length || 0,
      tickets_erro: erros?.length || 0,
      documentos_fornecedor: docsForn?.length || 0,
      movimentos_stock: movStock?.length || 0,
      fila: pendentes || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
