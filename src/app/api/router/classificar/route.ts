// /src/app/api/router/classificar/route.ts
// CSN-L3-PRD-038-2026 — Router ISA-95 (Camada 3 Nucleus)
// Classifica mensagens, identifica remetente, cria tickets ISA-95
// ISA-95 Level: L3-MOM
// v10: dedup por message_id (fix para Apps Script v9 que envia por mensagem)

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const DEPT_ACTIVOS = ['COM', 'PRD', 'DOC', 'PER', 'FIN'] as const
type DeptActivo = (typeof DEPT_ACTIVOS)[number]

interface RemetenteInfo {
  tipo: string
  id: string | null
  nome: string | null
  nif: string | null
  departamento_isa95: string
  emails_anteriores: number
}

interface ClassificacaoResult {
  departamento: DeptActivo
  classificacao: string
  assunto_resumo: string
  urgencia: 'baixa' | 'media' | 'alta'
  confianca: number
}

// --- STEP 1: Identificar remetente ---
async function identificarRemetente(email: string): Promise<RemetenteInfo> {
  const { data, error } = await supabase.rpc('identificar_remetente', {
    p_email: email.toLowerCase().trim(),
  })

  if (error || !data || data.length === 0) {
    return {
      tipo: 'desconhecido',
      id: null,
      nome: null,
      nif: null,
      departamento_isa95: 'ATT',
      emails_anteriores: 0,
    }
  }

  return data[0] as RemetenteInfo
}

// --- STEP 2: Classificar mensagem via Claude Haiku ---
async function classificarMensagem(
  assunto: string,
  corpo: string,
  remetente: RemetenteInfo
): Promise<ClassificacaoResult> {
  const prompt = `Classifica esta mensagem recebida pela CSN (fabricante de carrocarias para veiculos comerciais).

REMETENTE: ${remetente.nome || 'Desconhecido'} (${remetente.tipo})
ASSUNTO: ${assunto}
CORPO: ${corpo.slice(0, 1000)}

Departamentos (ISA-95):
- COM: Comercial (orcamentos, encomendas, pedidos info)
- PRD: Producao (questoes tecnicas, obras, entregas, prazos)
- DOC: Documentacao (COC, DoP, certificados, homologacoes)
- PER: Pessoal (ferias, faltas, recibos, RH)
- FIN: Financeiro (faturas, pagamentos, cobrancas)

Responde APENAS com JSON:
{"departamento":"COM","classificacao":"orcamento","assunto_resumo":"resumo curto","urgencia":"baixa","confianca":85}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean) as ClassificacaoResult

    if (!DEPT_ACTIVOS.includes(parsed.departamento as DeptActivo)) {
      parsed.departamento = 'COM'
      parsed.confianca = Math.min(parsed.confianca, 50)
    }

    return parsed
  } catch (err) {
    console.error('Erro classificacao Claude:', err)
    return {
      departamento: 'COM',
      classificacao: 'nao_classificado',
      assunto_resumo: assunto.slice(0, 60),
      urgencia: 'media',
      confianca: 0,
    }
  }
}

// --- STEP 3: Deduplicacao (message_id primeiro, depois heuristicas) ---
async function verificarDuplicado(
  email: string,
  assunto: string,
  corpo: string,
  messageId?: string
): Promise<{ duplicado: boolean; ticket_existente?: string }> {
  // Nivel 0: message_id exacto (mais fiavel — cada email tem ID unico)
  if (messageId) {
    const { data: byMsgId } = await supabase
      .from('tickets')
      .select('id')
      .eq('message_id', messageId)
      .limit(1)

    if (byMsgId && byMsgId.length > 0) {
      return { duplicado: true, ticket_existente: byMsgId[0].id }
    }
  }

  // Nivel 1: Corpo identico nos ultimos 7 dias (catch forwarded duplicates)
  const corpoHash = corpo.trim().toLowerCase().slice(0, 500)
  if (corpoHash.length > 20) {
    const { data: mesmoCorpo } = await supabase
      .from('tickets')
      .select('id, corpo')
      .eq('remetente', email)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (mesmoCorpo) {
      const dup = mesmoCorpo.find(
        (t) => t.corpo?.trim().toLowerCase().slice(0, 500) === corpoHash
      )
      if (dup) return { duplicado: true, ticket_existente: dup.id }
    }
  }

  return { duplicado: false }
}

// --- STEP 4: Criar ticket ---
async function criarTicket(
  canal: string,
  email: string,
  assunto: string,
  corpo: string,
  remetente: RemetenteInfo,
  classificacao: ClassificacaoResult,
  anexos?: any[],
  dataEmail?: string,
  messageId?: string
): Promise<string> {
  const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  const nivelIsa95Map: Record<string, string> = {
    COM: 'L4-COM',
    PRD: 'L3-MOM/PRD',
    DOC: 'L3-MOM/DOC',
    PER: 'L3-MOM/PER',
    FIN: 'L4-BPL/FIN',
  }

  const temAnexosPDF = anexos && anexos.some((a: any) => a.url && a.tipo?.includes('pdf'))

  const { error } = await supabase.from('tickets').insert({
    id: ticketId,
    canal,
    remetente: email,
    remetente_tipo: remetente.tipo,
    cliente_id: remetente.tipo === 'cliente' ? remetente.id : null,
    fornecedor_id: remetente.tipo === 'fornecedor' ? parseInt(remetente.id!) : null,
    assunto: classificacao.assunto_resumo,
    corpo: corpo.slice(0, 5000),
    classificacao: classificacao.classificacao,
    departamento: classificacao.departamento,
    estado: 'aberto',
    nivel_isa95: nivelIsa95Map[classificacao.departamento] || 'L3-MOM',
    anexos: anexos ? JSON.stringify(anexos) : null,
    anexos_estado: temAnexosPDF ? 'pendente' : null,
    data_email: dataEmail || null,
    message_id: messageId || null,
    metadata: {
      remetente_nome: remetente.nome,
      remetente_nif: remetente.nif,
      emails_anteriores: remetente.emails_anteriores,
      classificacao_confianca: classificacao.confianca,
      urgencia: classificacao.urgencia,
      assunto_original: assunto,
    },
  })

  if (error) {
    console.error('Erro ao criar ticket:', error)
    throw new Error(`Falha ao criar ticket: ${error.message}`)
  }

  return ticketId
}

// --- STEP 5: Trigger Ag. Documental (fire-and-forget) ---
async function triggerDocumental() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://csn-producao.vercel.app'

    fetch(`${baseUrl}/api/documental/processar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {})
  } catch {
    // silencioso
  }
}

// --- MAIN HANDLER ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      canal = 'email',
      email_remetente,
      assunto = '',
      corpo = '',
      anexos,
      data,
      message_id,
    } = body

    if (!email_remetente) {
      return NextResponse.json(
        { error: 'email_remetente e obrigatorio' },
        { status: 400 }
      )
    }

    // 1. Identificar remetente
    const remetente = await identificarRemetente(email_remetente)

    // 2. Deduplicacao
    const { duplicado, ticket_existente } = await verificarDuplicado(
      email_remetente,
      assunto,
      corpo,
      message_id
    )

    if (duplicado) {
      // Se tem anexos novos, actualizar o ticket existente
      if (anexos && anexos.length > 0 && ticket_existente) {
        const temPDF = anexos.some((a: any) => a.url && a.tipo?.includes('pdf'))
        await supabase
          .from('tickets')
          .update({
            anexos: JSON.stringify(anexos),
            anexos_estado: temPDF ? 'pendente' : null,
          })
          .eq('id', ticket_existente)

        if (temPDF) triggerDocumental()
      }
      return NextResponse.json({
        status: 'duplicado',
        ticket_id: ticket_existente,
        remetente,
        mensagem: `Mensagem duplicada. Ticket existente: ${ticket_existente}`,
      })
    }

    // 3. Classificar
    const classificacao = await classificarMensagem(assunto, corpo, remetente)

    // 4. Criar ticket
    const ticketId = await criarTicket(
      canal,
      email_remetente,
      assunto,
      corpo,
      remetente,
      classificacao,
      anexos,
      data,
      message_id
    )

    // 5. Accoes automaticas
    let accao_automatica: string | null = null

    if (
      classificacao.departamento === 'COM' &&
      ['orcamento', 'encomenda', 'pedido_informacao'].includes(classificacao.classificacao)
    ) {
      accao_automatica = 'lead_sugerido'
    }

    if (classificacao.departamento === 'FIN') {
      accao_automatica = 'reconciliacao_pendente'
    }

    // 6. Trigger Ag. Documental se tem PDFs
    const temAnexosPDF = anexos && anexos.some((a: any) => a.url && a.tipo?.includes('pdf'))
    if (temAnexosPDF) {
      triggerDocumental()
    }

    return NextResponse.json({
      status: 'criado',
      ticket_id: ticketId,
      remetente: {
        tipo: remetente.tipo,
        nome: remetente.nome,
        nif: remetente.nif,
        emails_anteriores: remetente.emails_anteriores,
      },
      classificacao: {
        departamento: classificacao.departamento,
        tipo: classificacao.classificacao,
        urgencia: classificacao.urgencia,
        confianca: classificacao.confianca,
        nivel_isa95: `L3-MOM/${classificacao.departamento}`,
      },
      accao_automatica,
    })
  } catch (err: any) {
    console.error('Router error:', err)
    return NextResponse.json(
      { error: 'Erro interno do Router', detalhes: err.message },
      { status: 500 }
    )
  }
}
