// /src/app/api/router/classificar/route.ts
// CSN-L3-PRD-038-2026 — Router ISA-95 (Camada 3 Nucleus)
// Classifica mensagens, identifica remetente, cria tickets ISA-95
// ISA-95 Level: L3-MOM

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Vercel: allow up to 30s for this function
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Departamentos ISA-95 activos
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

// --- STEP 1: Identificar remetente via funcao PostgreSQL ---
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

// --- STEP 2: Classificar mensagem via Claude Haiku (rapido) ---
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

// --- STEP 3: Deduplicacao 3 niveis ---
async function verificarDuplicado(
  email: string,
  assunto: string,
  corpo: string
): Promise<{ duplicado: boolean; ticket_existente?: string }> {
  // Nivel 1: Email exacto nos ultimos 5 minutos
  const { data: recente } = await supabase
    .from('tickets')
    .select('id')
    .eq('remetente', email)
    .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .limit(1)

  if (recente && recente.length > 0) {
    return { duplicado: true, ticket_existente: recente[0].id }
  }

  // Nivel 2: Mesmo assunto nas ultimas 24h
  const { data: mesmoAssunto } = await supabase
    .from('tickets')
    .select('id')
    .eq('remetente', email)
    .eq('assunto', assunto)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1)

  if (mesmoAssunto && mesmoAssunto.length > 0) {
    return { duplicado: true, ticket_existente: mesmoAssunto[0].id }
  }

  // Nivel 3: Corpo identico nos ultimos 7 dias
  const corpoHash = corpo.trim().toLowerCase().slice(0, 500)
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
  anexos?: any[]
): Promise<string> {
  const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  const nivelIsa95Map: Record<string, string> = {
    COM: 'L4-COM',
    PRD: 'L3-MOM/PRD',
    DOC: 'L3-MOM/DOC',
    PER: 'L3-MOM/PER',
    FIN: 'L4-BPL/FIN',
  }

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
      corpo
    )

    if (duplicado) {
      // Se tem anexos novos, actualizar o ticket existente
      if (anexos && anexos.length > 0 && ticket_existente) {
        await supabase
          .from('tickets')
          .update({ anexos: JSON.stringify(anexos) })
          .eq('id', ticket_existente)
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
      anexos
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
