// /src/app/api/voz/twilio/route.ts
// ISA-95: L3-MOM/COM — Agente Marta Voz (Camada 3 Nucleus)
// S39 — Agente de voz premium com gestão de conversa
// Código interno: CSN-L3-COM-039-2026

import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getServiceSupabase } from "@/lib/supabase"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = "claude-sonnet-4-20250514"

// Voz Google WaveNet portuguesa — natural e premium
const VOZ = "Google.pt-PT-Wavenet-A"
const LINGUA = "pt-PT"
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://csn-producao.vercel.app"

// ============================================================
// SYSTEM PROMPT — Marta por telefone
// ============================================================
const MARTA_VOZ_PROMPT = `Tu és a Marta, assistente telefónica da CSN — Carlos dos Santos Nascimento, Lda.
A CSN fabrica carroçarias para veículos comerciais em Mafra, Portugal.
Tipos de carroçaria: basculante traseira, basculante trilateral (tribenne), estrado (dropside/plataforma).
Materiais: aço, alumínio, misto, alumínio com piso em madeira.
Marcas de chassis: Iveco, Mercedes, MAN, Renault, Citroën, Peugeot, Fiat, Ford, Toyota, Mitsubishi, Isuzu, Nissan, Volkswagen, Opel, Maxus.

REGRAS ABSOLUTAS PARA FALAR AO TELEFONE:
1. Respostas CURTAS — máximo 2 frases. A pessoa está ao telefone, não a ler.
2. Fala como uma portuguesa natural, não como um robot. Usa "olhe", "então", "pronto".
3. NUNCA digas URLs, emails, códigos, números longos, formatação.
4. NUNCA faças listas. Dá uma opção de cada vez.
5. Faz UMA pergunta de cada vez. Espera a resposta antes de perguntar outra coisa.
6. Se não percebeste, pede para repetir com naturalidade: "Desculpe, não apanhei bem. Pode repetir?"
7. Quando tens informação suficiente, confirma: "Então é um Daily basculante em aço, correcto?"
8. Sê simpática mas eficiente. Não enroles.

O TEU OBJECTIVO NESTA CHAMADA:
Tens de recolher informação e registar o contacto. Segue esta ordem natural:

PASSO 1 — SAUDAÇÃO + NOME
"CSN, bom dia/boa tarde, fala a Marta. Com quem tenho o prazer de falar?"
Regista o nome.

PASSO 2 — CONTACTO
Se o número de onde liga não é o melhor para contacto, pergunta:
"Este número que está a ligar é o melhor para a gente entrar em contacto? Tem WhatsApp neste número?"
Regista telefone alternativo e se tem WhatsApp.

PASSO 3 — O QUE PRECISA
"Diga-me, em que é que o posso ajudar?"
Ouve e classifica:

A) Se é ORÇAMENTO / CARROÇARIA:
- Pergunta que veículo tem (marca, modelo, ou matrícula)
- Pergunta que tipo de carroçaria quer (basculante, tribenne, estrado)
- Se sabe, pergunta material (aço ou alumínio)
- Pergunta medidas ou se quer o comprimento máximo
- NÃO dês preço ao telefone. Diz: "Vou preparar uma proposta e envio-lhe por WhatsApp/email."

B) Se é ESTADO DE OBRA / ENTREGA:
- Pergunta matrícula ou nome
- Diz: "Vou verificar e dou-lhe retorno ainda hoje."

C) Se é RECLAMAÇÃO / GARANTIA:
- Ouve com empatia
- Regista o problema
- Diz: "Compreendo perfeitamente. Vou passar ao responsável e entramos em contacto consigo."

D) Se é OUTRO ASSUNTO:
- Ouve, regista
- Diz: "Tomei nota. Vamos analisar e damos-lhe resposta o mais breve possível."

PASSO 4 — CONFIRMAR E DESPEDIR
Resume o que registaste: "Então, Sr./Sra. [nome], ficou registado [resumo]. Vamos entrar em contacto por [WhatsApp/telefone]. Obrigada pela chamada!"

FORMATO DA RESPOSTA:
Responde APENAS com JSON (sem markdown):
{
  "fala": "o que a Marta diz ao telefone",
  "dados_recolhidos": {
    "nome": "...",
    "telefone": "...",
    "whatsapp": true/false,
    "telefone_alternativo": "...",
    "intencao": "orcamento|estado_obra|reclamacao|garantia|informacao|outro",
    "veiculo_marca": "...",
    "veiculo_modelo": "...",
    "veiculo_matricula": "...",
    "carrocaria_tipo": "...",
    "carrocaria_material": "...",
    "medidas": "...",
    "notas": "..."
  },
  "conversa_completa": false,
  "proximo_passo": "identificar|contacto|intencao|detalhes_orcamento|confirmar|despedir"
}
Preenche apenas os campos que já tens. Deixa os outros como null.
"conversa_completa" = true quando tens tudo e estás a despedir.`

// ============================================================
// POST — Twilio envia webhook a cada interacção
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string || ""
    const from = formData.get("From") as string || ""
    const to = formData.get("To") as string || ""
    const speechResult = formData.get("SpeechResult") as string || ""
    const callStatus = formData.get("CallStatus") as string || ""

    const supabase = getServiceSupabase()

    console.log(`[Voz] CallSid=${callSid} From=${from} Speech="${speechResult}"`)

    // ── Primeira interacção: saudação ──
    if (!speechResult) {
      // Guardar sessão de chamada
      await supabase.from("tickets").insert({
        id: `CALL-${callSid.substring(0, 8)}`,
        canal: "telefone",
        remetente: from,
        remetente_tipo: "desconhecido",
        assunto: "Chamada telefónica em curso",
        corpo: "",
        classificacao: "outro",
        departamento: "COM",
        estado: "em_progresso",
        metadata: {
          call_sid: callSid,
          tipo: "chamada_voz",
          historico: [],
        },
      }).select().single()

      const hora = new Date().getUTCHours() + 1 // Portugal = UTC+1 (simplificado)
      const saudacao = hora < 13 ? "bom dia" : hora < 20 ? "boa tarde" : "boa noite"

      return twimlGather(
        `C S N, ${saudacao}, fala a Marta. Com quem tenho o prazer de falar?`,
        callSid
      )
    }

    // ── Interacções seguintes: Claude processa ──

    // Buscar ticket da chamada para ter histórico
    const { data: ticket } = await supabase
      .from("tickets")
      .select("*")
      .eq("canal", "telefone")
      .like("metadata->>call_sid", callSid)
      .maybeSingle()

    const historico: Array<{role: string, content: string}> = ticket?.metadata?.historico || []

    // Adicionar o que a pessoa disse
    historico.push({ role: "user", content: speechResult })

    // Chamar Claude com todo o histórico
    const messages = historico.map(h => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    }))

    const claudeRes = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: MARTA_VOZ_PROMPT,
      messages,
    })

    const rawText = claudeRes.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text)
      .join("")

    // Parse resposta da Marta
    let parsed: {
      fala: string
      dados_recolhidos: Record<string, unknown>
      conversa_completa: boolean
      proximo_passo: string
    }

    try {
      let cleaned = rawText.trim()
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "")
      const start = cleaned.indexOf("{")
      const end = cleaned.lastIndexOf("}")
      if (start !== -1 && end > start) cleaned = cleaned.substring(start, end + 1)
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = {
        fala: "Peço desculpa, houve um problema. Pode repetir por favor?",
        dados_recolhidos: {},
        conversa_completa: false,
        proximo_passo: "intencao",
      }
    }

    // Adicionar resposta da Marta ao histórico
    historico.push({ role: "assistant", content: parsed.fala })

    // Atualizar ticket com dados recolhidos e histórico
    const updatedMetadata = {
      ...ticket?.metadata,
      call_sid: callSid,
      tipo: "chamada_voz",
      historico,
      dados_recolhidos: parsed.dados_recolhidos,
      proximo_passo: parsed.proximo_passo,
    }

    // Atualizar assunto com nome se já temos
    const nome = parsed.dados_recolhidos?.nome as string | null
    const intencao = parsed.dados_recolhidos?.intencao as string | null

    await supabase
      .from("tickets")
      .update({
        corpo: historico.map(h => `${h.role}: ${h.content}`).join("\n"),
        assunto: nome
          ? `Chamada ${nome}${intencao ? ` — ${intencao}` : ""}`
          : "Chamada telefónica em curso",
        classificacao: intencao || "outro",
        metadata: updatedMetadata,
      })
      .eq("canal", "telefone")
      .like("metadata->>call_sid", callSid)

    // Se conversa completa, despedir e desligar
    if (parsed.conversa_completa) {
      return twimlSay(parsed.fala, true)
    }

    // Continuar a conversa
    return twimlGather(parsed.fala, callSid)

  } catch (error) {
    console.error("[Voz] Erro:", error)
    return twimlSay(
      "Peço desculpa, houve um problema técnico. Por favor tente ligar novamente. Obrigada.",
      true
    )
  }
}

// ============================================================
// TwiML helpers
// ============================================================

function twimlGather(text: string, callSid: string): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOZ}" language="${LINGUA}">${escapeXml(text)}</Say>
  <Gather input="speech" language="${LINGUA}" speechTimeout="3" speechModel="phone_call" timeout="8" action="${BASE_URL}/api/voz/twilio" method="POST">
    <Say voice="${VOZ}" language="${LINGUA}"> </Say>
  </Gather>
  <Say voice="${VOZ}" language="${LINGUA}">Não consegui ouvir. Se precisar, ligue novamente. Obrigada!</Say>
  <Hangup/>
</Response>`

  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  })
}

function twimlSay(text: string, hangup: boolean = false): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOZ}" language="${LINGUA}">${escapeXml(text)}</Say>
  ${hangup ? "<Hangup/>" : ""}
</Response>`

  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  })
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
