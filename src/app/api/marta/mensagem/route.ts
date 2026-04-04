import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getServiceSupabase } from "@/lib/supabase"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.ANTHROPIC_MODEL_MARTA?.trim() || "claude-sonnet-4-20250514"

const MARTA_SYSTEM = `Es a Marta, assistente comercial da Carlos dos Santos Nascimento Lda (CSN), empresa de metalomecanica em Mafra que fabrica carrocarias para veiculos comerciais.

Personalidade: profissional, simpatica, directa. Tratas clientes por "voce". Respondes sempre em portugues europeu.

Tipos de carrocaria que a CSN faz: caixa aberta, basculante, frigorifica, estrado, plataforma, furgao.

REGRAS ESTRITAS:
1. SEM VERIFICACAO do cliente, NAO das precos, prazos ou propostas.
2. Segues SEMPRE os 3 portoes obrigatorios para leads de orcamento.
3. O VIN NUNCA e pedido ao cliente — e extraido silenciosamente pela API.
4. Se alguma validacao falhar, avisas e suges alternativas.
5. Nunca crias lead com dados invalidos.

PORTAO 1 — Dados do veiculo (bloqueante):
- Veiculo usado: pede matricula. API vai buscar VIN + dados automaticamente.
- Veiculo novo: pede marca, modelo, versao, cabine, PBT.
- Sem dados do veiculo -> conversa NAO avanca.

PORTAO 2 — Configuracao validada (bloqueante):
- Tipo de carrocaria
- Comprimento (mm) — validar contra entre-eixos
- Largura (mm) — max 2.550mm
- Altura (mm) — max 4.000mm total
- Opcionais: material, acessorios, pintura

PORTAO 3 — Contacto (bloqueante):
- Nome (obrigatorio)
- Telefone (obrigatorio)
- Email (obrigatorio)
- Empresa (opcional)

Responde com JSON:
{
  "resposta": "texto para enviar ao cliente",
  "step": "identificacao|veiculo|configuracao|contacto|verificacao|concluido",
  "dados_recolhidos": { ... campos preenchidos ate agora ... },
  "acao": null | "lookup_matricula" | "validar_config" | "criar_lead" | "enviar_codigo",
  "acao_dados": { ... dados para a acao ... }
}`

/**
 * POST /api/marta/mensagem
 * Recebe mensagem do cliente, processa passo actual, devolve resposta.
 * Body: { ticket_id, canal, remetente_externo, conteudo, cliente_id?, step_atual?, dados_recolhidos? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ticket_id, canal, remetente_externo, conteudo, cliente_id, step_atual, dados_recolhidos } = body

    if (!conteudo || !canal) {
      return NextResponse.json({ error: "Campos 'conteudo' e 'canal' obrigatórios" }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada" }, { status: 500 })
    }

    const supabase = getServiceSupabase()

    // Load conversation history for context
    let historico: { direcao: string; conteudo: string }[] = []
    if (ticket_id) {
      const { data: msgs } = await supabase
        .from("conversas_marta")
        .select("direcao, conteudo")
        .eq("ticket_id", ticket_id)
        .order("created_at", { ascending: true })
        .limit(20)
      historico = msgs || []
    }

    // Build messages for Claude
    const messages: Anthropic.MessageParam[] = []

    // Add history
    for (const msg of historico) {
      messages.push({
        role: msg.direcao === "entrada" ? "user" : "assistant",
        content: msg.conteudo,
      })
    }

    // Add current message with context
    const contextPrefix = step_atual
      ? `[Estado actual: ${step_atual}] [Dados recolhidos: ${JSON.stringify(dados_recolhidos || {})}]\n\n`
      : ""

    messages.push({
      role: "user",
      content: contextPrefix + conteudo,
    })

    const claudeRes = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: MARTA_SYSTEM,
      messages,
    })

    const rawText = claudeRes.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")

    let parsed: Record<string, unknown>
    try {
      let cleaned = rawText.trim()
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "")
      const start = cleaned.indexOf("{")
      const end = cleaned.lastIndexOf("}")
      if (start !== -1 && end > start) cleaned = cleaned.substring(start, end + 1)
      parsed = JSON.parse(cleaned)
    } catch {
      // If Claude returns plain text instead of JSON, wrap it
      parsed = {
        resposta: rawText,
        step: step_atual || "identificacao",
        dados_recolhidos: dados_recolhidos || {},
        acao: null,
        acao_dados: null,
      }
    }

    // Save incoming message
    await supabase.from("conversas_marta").insert({
      ticket_id: ticket_id || null,
      cliente_id: cliente_id || null,
      canal,
      remetente_externo: remetente_externo || null,
      direcao: "entrada",
      conteudo,
      step_marta: step_atual || "identificacao",
      metadata: {},
    })

    // Save Marta's response
    const resposta = String(parsed.resposta || rawText)
    await supabase.from("conversas_marta").insert({
      ticket_id: ticket_id || null,
      cliente_id: cliente_id || null,
      canal,
      remetente_externo: null,
      direcao: "saida",
      conteudo: resposta,
      step_marta: String(parsed.step || step_atual || "identificacao"),
      metadata: { acao: parsed.acao, acao_dados: parsed.acao_dados },
    })

    return NextResponse.json({
      ok: true,
      resposta,
      step: parsed.step || step_atual,
      dados_recolhidos: parsed.dados_recolhidos || dados_recolhidos || {},
      acao: parsed.acao || null,
      acao_dados: parsed.acao_dados || null,
    })
  } catch (e) {
    console.error("marta/mensagem error:", e)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
