// /src/app/api/marta/mensagem/route.ts
// CSN-L4-COM — Marta Conversational Engine
// Motor da conversa de qualificação de leads via WhatsApp/site
// ISA-95 Level: L4-COM (Persona C2 → Agente C3)

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

// ============================================================
// SISTEMA PROMPT DA MARTA
// ============================================================
const MARTA_SYSTEM_PROMPT = `És a Marta, assistente comercial da CSN — Carroçarias Carlos dos Santos Nascimento, Lda, em Mafra, Portugal. A CSN fabrica carroçarias para veículos comerciais de 3.5T a 8.5T: basculantes, plataformas, estrados, furgões e frigoríficos.

O teu único objectivo nesta conversa é recolher os dados mínimos para preparar um orçamento. Fazes isso de forma natural e simpática, em português europeu.

## REGRAS ABSOLUTAS
- Nunca inventas ou estimas números. Se não sabes, perguntas.
- Nunca dás preços. Só dizes que vais preparar o orçamento e enviá-lo por email.
- Só avanças para o próximo passo quando tiveres confirmado o actual.
- Se o cliente sair do assunto, respondes brevemente e voltas ao objectivo.
- Sê concisa. Máximo 2-3 frases por resposta.

## PASSOS DA QUALIFICAÇÃO (por esta ordem)

### PASSO 1 — Tipo de veículo
Pergunta se o veículo é novo ou usado.
- Usado → pede a matrícula
- Novo → pede marca, modelo e cabine (simples ou dupla)
Quando tiveres esta info, diz PASSO_1_OK:[matricula OU marca/modelo/cabine]

### PASSO 2 — Tipo de carroçaria
Pergunta que tipo de carroçaria precisa.
Opções: basculante traseira, basculante trilateral, plataforma/estrado, caixa aberta, furgão, frigorífico.
Quando confirmado, diz PASSO_2_OK:[tipo_carrocaria]

### PASSO 3 — Dimensões
Pergunta o comprimento e largura pretendidos (em metros ou mm, tanto faz).
Se o cliente não souber a largura, podes dizer que o standard é 2.10m interior.
Quando tiveres os dois valores, diz PASSO_3_OK:[comprimento_mm]x[largura_mm]

### PASSO 4 — Contacto e verificação
Pede o nome e email para enviar o orçamento.
Diz que vais enviar um código de confirmação para o email.
Quando tiveres nome e email, diz PASSO_4_OK:[nome]|[email]

### PASSO 5 — Concluído
Diz ao cliente que recebeu tudo e que ele vai receber um código no email para confirmar.
Diz QUALIFICACAO_COMPLETA:{
  "tipo_veiculo": "novo|usado",
  "matricula": "XX-XX-XX ou null",
  "veiculo_marca": "marca ou null",
  "veiculo_modelo": "modelo ou null",
  "veiculo_cabine": "simples|dupla ou null",
  "tipo_carrocaria": "tipo",
  "comprimento_mm": numero,
  "largura_mm": numero,
  "contacto_nome": "nome",
  "contacto_email": "email"
}

## CLIENTES CONHECIDOS (verificados=true)
Se o cliente já está verificado no sistema, saltas o PASSO 4 e vais directo para QUALIFICACAO_COMPLETA sem pedir email.

## CONTEXTO ACTUAL
O teu passo actual é indicado no campo step_marta do histórico. Começa sempre pelo primeiro passo não completo.
`

// ============================================================
// TIPOS
// ============================================================
interface MartaMensagemBody {
  canal: 'whatsapp' | 'email' | 'site' | 'telegram' | 'app'
  remetente: string  // número WhatsApp ou email
  conteudo: string
  ticket_id?: string
  cliente_id?: string
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const body: MartaMensagemBody = await req.json()
    const { canal, remetente, conteudo, ticket_id: ticketIdInput } = body

    if (!remetente || !conteudo || !canal) {
      return NextResponse.json(
        { error: 'remetente, conteudo e canal são obrigatórios' },
        { status: 400 }
      )
    }

    // 1. Identificar ou criar cliente
    const cliente = await identificarCliente(canal, remetente)

    // 2. Identificar ou criar ticket
    const ticketId = ticketIdInput || await obterOuCriarTicket(canal, remetente, cliente?.id)

    // 3. Buscar histórico da conversa
    const historico = await buscarHistorico(ticketId)

    // 4. Determinar step actual
    const stepActual = historico.length > 0
      ? (historico[historico.length - 1].step_marta || 'inicio')
      : 'inicio'

    // 5. Guardar mensagem do cliente
    await guardarMensagem({
      ticket_id: ticketId,
      cliente_id: cliente?.id || null,
      canal,
      remetente_externo: remetente,
      direcao: 'entrada',
      conteudo,
      step_marta: stepActual,
    })

    // 6. Chamar Claude com contexto completo
    const resposta = await chamarMarta({
      historico,
      mensagemNova: conteudo,
      clienteVerificado: cliente?.verificado || false,
      stepActual,
    })

    // 7. Processar sinais do Claude
    const { textoLimpo, novoStep, dadosLead } = processarResposta(resposta)

    // 8. Guardar resposta da Marta
    await guardarMensagem({
      ticket_id: ticketId,
      cliente_id: cliente?.id || null,
      canal,
      remetente_externo: remetente,
      direcao: 'saida',
      conteudo: textoLimpo,
      step_marta: novoStep,
      metadata: dadosLead ? { dados_lead: dadosLead } : {},
    })

    // 9. Se qualificação completa → criar lead e enviar código
    if (dadosLead && novoStep === 'qualificacao_completa') {
      await criarLeadEEnviarCodigo(ticketId, cliente?.id || null, remetente, dadosLead)
    }

    return NextResponse.json({
      resposta: textoLimpo,
      ticket_id: ticketId,
      step: novoStep,
      qualificado: novoStep === 'qualificacao_completa',
    })

  } catch (err: any) {
    console.error('[Marta] Erro:', err)
    return NextResponse.json(
      { error: 'Erro interno', detalhes: err.message },
      { status: 500 }
    )
  }
}

// ============================================================
// IDENTIFICAR CLIENTE
// ============================================================
async function identificarCliente(canal: string, remetente: string) {
  const campo = canal === 'whatsapp' || canal === 'telegram'
    ? 'whatsapp'
    : 'email'

  const { data } = await supabase
    .from('clientes')
    .select('id, nome, verificado, ver_precos, email, whatsapp')
    .eq(campo, remetente)
    .single()

  return data
}

// ============================================================
// OBTER OU CRIAR TICKET
// ============================================================
async function obterOuCriarTicket(
  canal: string,
  remetente: string,
  clienteId?: string
): Promise<string> {
  // Verificar se existe ticket aberto recente (últimas 24h)
  const ontemISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('tickets')
    .select('id')
    .eq('canal', canal)
    .eq('remetente', remetente)
    .eq('departamento', 'COM')
    .in('estado', ['aberto', 'em_tratamento'])
    .gte('created_at', ontemISO)
    .order('created_at', { ascending: false })
    .limit(1)

  const { data: ticketExistente } = await query

  if (ticketExistente && ticketExistente.length > 0) {
    return ticketExistente[0].id
  }

  // Criar novo ticket
  const ticketId = `TKT-${Date.now()}-COM`

  await supabase.from('tickets').insert({
    id: ticketId,
    canal,
    remetente,
    remetente_tipo: clienteId ? 'cliente' : 'desconhecido',
    cliente_id: clienteId || null,
    departamento: 'COM',
    estado: 'aberto',
    assunto: 'Pedido de orçamento via ' + canal,
    nivel_isa95: 'L4-COM',
  })

  return ticketId
}

// ============================================================
// BUSCAR HISTÓRICO
// ============================================================
async function buscarHistorico(ticketId: string) {
  const { data } = await supabase
    .from('conversas_marta')
    .select('direcao, conteudo, step_marta, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
    .limit(20)

  return data || []
}

// ============================================================
// GUARDAR MENSAGEM
// ============================================================
async function guardarMensagem(params: {
  ticket_id: string
  cliente_id: string | null
  canal: string
  remetente_externo: string
  direcao: 'entrada' | 'saida'
  conteudo: string
  step_marta: string
  metadata?: Record<string, any>
}) {
  await supabase.from('conversas_marta').insert({
    ticket_id: params.ticket_id,
    cliente_id: params.cliente_id,
    canal: params.canal,
    remetente_externo: params.remetente_externo,
    direcao: params.direcao,
    conteudo: params.conteudo,
    step_marta: params.step_marta,
    metadata: params.metadata || {},
    nivel_isa95: 'L4-COM',
  })
}

// ============================================================
// CHAMAR CLAUDE (MARTA)
// ============================================================
async function chamarMarta(params: {
  historico: any[]
  mensagemNova: string
  clienteVerificado: boolean
  stepActual: string
}): Promise<string> {
  const { historico, mensagemNova, clienteVerificado, stepActual } = params

  // Construir mensagens para o Claude
  const messages: { role: 'user' | 'assistant'; content: string }[] = []

  // Adicionar histórico
  for (const msg of historico) {
    messages.push({
      role: msg.direcao === 'entrada' ? 'user' : 'assistant',
      content: msg.conteudo,
    })
  }

  // Adicionar nova mensagem
  messages.push({
    role: 'user',
    content: mensagemNova,
  })

  // Se não há histórico, adicionar contexto inicial
  const systemComContexto = MARTA_SYSTEM_PROMPT +
    `\n\nESTADO ACTUAL: step_marta="${stepActual}"` +
    (clienteVerificado ? '\nCLIENTE: já verificado — não pedir email.' : '')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: systemComContexto,
    messages,
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

// ============================================================
// PROCESSAR RESPOSTA — extrair sinais e limpar texto
// ============================================================
function processarResposta(resposta: string): {
  textoLimpo: string
  novoStep: string
  dadosLead: any | null
} {
  let novoStep = 'inicio'
  let dadosLead = null
  let texto = resposta

  // Detectar passos
  if (resposta.includes('PASSO_1_OK:')) {
    novoStep = 'passo_1_completo'
    texto = texto.replace(/PASSO_1_OK:[^\n]*/g, '').trim()
  } else if (resposta.includes('PASSO_2_OK:')) {
    novoStep = 'passo_2_completo'
    texto = texto.replace(/PASSO_2_OK:[^\n]*/g, '').trim()
  } else if (resposta.includes('PASSO_3_OK:')) {
    novoStep = 'passo_3_completo'
    texto = texto.replace(/PASSO_3_OK:[^\n]*/g, '').trim()
  } else if (resposta.includes('PASSO_4_OK:')) {
    novoStep = 'passo_4_completo'
    texto = texto.replace(/PASSO_4_OK:[^\n]*/g, '').trim()
  }

  // Detectar qualificação completa
  if (resposta.includes('QUALIFICACAO_COMPLETA:')) {
    novoStep = 'qualificacao_completa'
    const match = resposta.match(/QUALIFICACAO_COMPLETA:\s*(\{[\s\S]*?\})/m)
    if (match) {
      try {
        dadosLead = JSON.parse(match[1])
      } catch (e) {
        console.error('[Marta] Erro a parsear dados lead:', e)
      }
    }
    texto = texto.replace(/QUALIFICACAO_COMPLETA:[\s\S]*$/m, '').trim()
  }

  return { textoLimpo: texto, novoStep, dadosLead }
}

// ============================================================
// CRIAR LEAD E ENVIAR CÓDIGO DE VERIFICAÇÃO
// ============================================================
async function criarLeadEEnviarCodigo(
  ticketId: string,
  clienteId: string | null,
  remetente: string,
  dados: any
) {
  try {
    // Criar lead no Supabase
    const leadId = `L${new Date().getFullYear()}-${Date.now()}`

    await supabase.from('leads').insert({
      id: leadId,
      cliente: dados.contacto_nome || 'Desconhecido',
      cliente_id: clienteId,
      ticket_id: ticketId,
      tipo_carrocaria: dados.tipo_carrocaria || 'plataforma',
      veiculo_novo: dados.tipo_veiculo === 'novo',
      matricula: dados.matricula || null,
      veiculo_marca: dados.veiculo_marca || null,
      veiculo_modelo: dados.veiculo_modelo || null,
      veiculo_cabine: dados.veiculo_cabine || null,
      comprimento_ext: dados.comprimento_mm || null,
      largura_ext: dados.largura_mm || null,
      contacto_nome: dados.contacto_nome || null,
      contacto_email: dados.contacto_email || null,
      contacto_telefone: remetente,
      estado: 'novo',
      estado_pipeline: 'nova',
      canal_origem: 'whatsapp',
    })

    // Actualizar ticket com lead_id
    await supabase
      .from('tickets')
      .update({ lead_id: leadId, estado: 'em_tratamento' })
      .eq('id', ticketId)

    // Enviar código de verificação por email (se tiver email)
    if (dados.contacto_email) {
      await enviarCodigoVerificacao(ticketId, dados.contacto_nome, dados.contacto_email)
    }

  } catch (err) {
    console.error('[Marta] Erro a criar lead:', err)
  }
}

// ============================================================
// ENVIAR CÓDIGO DE VERIFICAÇÃO
// ============================================================
async function enviarCodigoVerificacao(
  ticketId: string,
  nome: string,
  email: string
) {
  try {
    // Gerar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos

    // Guardar código no ticket (metadata)
    await supabase
      .from('tickets')
      .update({
        metadata: {
          verificacao_codigo: codigo,
          verificacao_expira: expira,
          verificacao_email: email,
        },
      })
      .eq('id', ticketId)

    // TODO: Chamar endpoint de email para enviar o código
    // Por agora apenas regista — a integração de email será S51+
    console.log(`[Marta] Código ${codigo} para ${email} (ticket ${ticketId})`)

  } catch (err) {
    console.error('[Marta] Erro a gerar código:', err)
  }
}
