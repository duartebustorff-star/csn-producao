// /app/api/voz/twilio/route.ts
// ISA-95: L3-MOM/COM — Webhook Twilio Voice (Marta por telefone)
// Camada 3 (Nucleus) — ponte entre chamada telefónica e Router/Marta
// S39 — Marta atende o telefone

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Voz portuguesa natural (Twilio TTS)
const VOZ = 'Polly.Ines' // Voz feminina pt-PT da Amazon Polly via Twilio
const LINGUA = 'pt-PT'

// ============================================================
// POST — Twilio envia webhook quando alguém liga
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get('CallSid') as string || ''
    const from = formData.get('From') as string || ''
    const to = formData.get('To') as string || ''
    const callStatus = formData.get('CallStatus') as string || ''
    const speechResult = formData.get('SpeechResult') as string || ''
    const digits = formData.get('Digits') as string || ''

    console.log(`[Voz] CallSid=${callSid} From=${from} Status=${callStatus} Speech="${speechResult}"`)

    // Se não há speechResult, é a primeira interação → saudação
    if (!speechResult && !digits) {
      return saudacao()
    }

    // Se há speechResult → processar com Router/Marta
    if (speechResult) {
      return await processarFala(speechResult, from, callSid)
    }

    // Fallback
    return saudacao()

  } catch (error) {
    console.error('[Voz] Erro:', error)
    return twimlResponse(`
      <Say voice="${VOZ}" language="${LINGUA}">
        Peço desculpa, ocorreu um erro. Por favor tente ligar novamente.
      </Say>
      <Hangup/>
    `)
  }
}

// ============================================================
// Saudação inicial — Marta apresenta-se e ouve
// ============================================================
function saudacao() {
  const baseUrl = getBaseUrl()

  return twimlResponse(`
    <Say voice="${VOZ}" language="${LINGUA}">
      C S N Veículos, bom dia! Sou a Marta, assistente da C S N. 
      Em que posso ajudá-lo?
    </Say>
    <Gather input="speech" language="${LINGUA}" speechTimeout="3" timeout="10" action="${baseUrl}/api/voz/twilio" method="POST">
      <Say voice="${VOZ}" language="${LINGUA}">
        Pode falar agora.
      </Say>
    </Gather>
    <Say voice="${VOZ}" language="${LINGUA}">
      Não consegui ouvi-lo. Se precisar de ajuda, ligue novamente. Obrigada!
    </Say>
    <Hangup/>
  `)
}

// ============================================================
// Processar fala — Router + Marta + responder por voz
// ============================================================
async function processarFala(texto: string, telefone: string, callSid: string) {
  const baseUrl = getBaseUrl()

  console.log(`[Voz] Texto reconhecido: "${texto}"`)

  // 1. Verificar se já existe ticket para esta chamada
  const { data: ticketExistente } = await supabase
    .from('tickets')
    .select('id, departamento, estado')
    .eq('remetente', telefone)
    .eq('canal', 'telefone')
    .in('estado', ['aberto', 'em_progresso'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let respostaMarta = ''

  if (ticketExistente) {
    // Ticket existe → Marta continua
    respostaMarta = await chamarMarta(ticketExistente.id, texto, telefone)
  } else {
    // Novo → Router classifica + Marta responde
    const routerResult = await chamarRouter(texto, telefone)

    if (routerResult.ok && routerResult.ticket_id) {
      respostaMarta = await chamarMarta(routerResult.ticket_id, texto, telefone)
    } else {
      respostaMarta = 'Obrigada pelo seu contacto. Vou registar o seu pedido e alguém da equipa entrará em contacto consigo.'
    }
  }

  // 2. Marta fala a resposta e volta a ouvir
  return twimlResponse(`
    <Say voice="${VOZ}" language="${LINGUA}">
      ${escapeXml(respostaMarta)}
    </Say>
    <Gather input="speech" language="${LINGUA}" speechTimeout="3" timeout="10" action="${baseUrl}/api/voz/twilio" method="POST">
      <Say voice="${VOZ}" language="${LINGUA}">
        Posso ajudar em mais alguma coisa?
      </Say>
    </Gather>
    <Say voice="${VOZ}" language="${LINGUA}">
      Obrigada pela sua chamada. Tenha um bom dia!
    </Say>
    <Hangup/>
  `)
}

// ============================================================
// Chamar Router — classifica e cria ticket
// ============================================================
async function chamarRouter(conteudo: string, telefone: string) {
  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/api/router/classificar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canal: 'telefone',
        conteudo,
        remetente: telefone,
      }),
    })

    if (!res.ok) {
      console.error(`[Voz→Router] HTTP ${res.status}`)
      return { ok: false }
    }

    return await res.json()
  } catch (err) {
    console.error('[Voz→Router] Erro:', err)
    return { ok: false }
  }
}

// ============================================================
// Chamar Marta — continua conversa
// ============================================================
async function chamarMarta(ticketId: string, conteudo: string, telefone: string) {
  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/api/marta/mensagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: ticketId,
        conteudo,
        canal: 'telefone',
        remetente: telefone,
      }),
    })

    if (!res.ok) {
      console.error(`[Voz→Marta] HTTP ${res.status}`)
      return 'Obrigada pelo contacto. Vamos analisar o seu pedido.'
    }

    const data = await res.json()
    return data.resposta || 'Obrigada pelo contacto.'
  } catch (err) {
    console.error('[Voz→Marta] Erro:', err)
    return 'Obrigada pelo contacto. Vamos responder brevemente.'
  }
}

// ============================================================
// Helpers
// ============================================================
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function twimlResponse(body: string): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
${body}
</Response>`

  return new NextResponse(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}
