import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getServiceSupabase } from "@/lib/supabase"
import { CLAUDE_TOOLS, executeTool } from "@/lib/chat-tools"
import { audit } from "@/lib/audit"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(
  colaborador: { nome: string; funcao: string; lang: string },
  obras: unknown[],
  timer: unknown | null
): string {
  const langLabel: Record<string, string> = {
    pt: "PortuguÃªs",
    en: "English",
    ua: "Ð£ÐºÑ€Ð°Ñ—Ð½ÑÑŒÐºÐ°",
  }

  return `Tu Ã©s o assistente de produÃ§Ã£o da CSN CarroÃ§arias (Carlos dos Santos Nascimento Lda), uma metalomecÃ¢nica em Mafra, Portugal, que fabrica carroÃ§arias para veÃ­culos comerciais.

EstÃ¡s a falar com: ${colaborador.nome} (${colaborador.funcao})
LÃ­ngua preferida: ${langLabel[colaborador.lang] || "PortuguÃªs"}

REGRAS:
- Responde SEMPRE na lÃ­ngua do colaborador (pt/en/ua)
- SÃª conciso e prÃ¡tico â€” Ã© uma fÃ¡brica, nÃ£o um escritÃ³rio
- Usa emojis com moderaÃ§Ã£o para clareza visual
- Quando o colaborador pede tarefas, mostra primeiro as "em_curso", depois "pendentes"
- Quando o colaborador diz que acabou uma tarefa, confirma e mostra a prÃ³xima
- Quando hÃ¡ notas numa fase, mostra-as
- Nunca inventes dados â€” usa apenas o que estÃ¡ no contexto fornecido
- Se o colaborador pedir algo fora do Ã¢mbito (receitas, piadas...), redireciona educadamente para o trabalho
- Formata as respostas de forma legÃ­vel com listas e negrito quando Ãºtil

DETEÃ‡ÃƒO DE PEDIDOS DE ORÃ‡AMENTO:
Quando o utilizador mencionar orÃ§amento, carroÃ§aria, basculante, caixa, estrado, furgÃ£o, plataforma, grua ou qualquer trabalho para veÃ­culo:

REGRA FUNDAMENTAL: Faz APENAS UMA pergunta de cada vez. NUNCA listes mÃºltiplas perguntas. NUNCA mostres formulÃ¡rios. Conversa naturalmente como se estivesses ao telefone com o cliente.

Fluxo:
1. ComeÃ§a SEMPRE por perguntar: "O veÃ­culo Ã© novo ou usado?"
2. Espera resposta. Depois faz a PRÃ“XIMA pergunta apenas.
3. Se USADO â†’ pede matrÃ­cula â†’ pede foto do DUA â†’ pede tipo de trabalho â†’ pede medidas
4. Se NOVO â†’ pede marca/modelo â†’ pede PBT â†’ pede tipo carroÃ§aria â†’ pede medidas â†’ pergunta equipamentos
5. Em AMBOS â†’ pede nome do cliente â†’ pede telefone â†’ pede email
6. Quando tiveres tudo (mÃ­nimo: nome, contacto, marca/modelo, tipo trabalho) â†’ mostra RESUMO â†’ pede confirmaÃ§Ã£o â†’ sÃ³ entÃ£o usa criar_lead

EXEMPLO CORRETO (uma pergunta por mensagem):
- Utilizador: "Preciso de orÃ§amento para uma caixa aberta"
- Tu: "O veÃ­culo Ã© novo ou usado?"
- Utilizador: "Novo"
- Tu: "Qual a marca e modelo?"
- Utilizador: "Mercedes Sprinter"
- Tu: "Qual o PBT?"
- (continua assim, UMA pergunta de cada vez)

DADOS ATUAIS DAS OBRAS:
${JSON.stringify(obras, null, 2)}

TIMER ATIVO:
${timer ? JSON.stringify(timer, null, 2) : "Nenhum timer ativo"}

ANÃLISE DE IMAGENS:
Quando recebes imagens, analisa-as com atenÃ§Ã£o. Extrai toda a informaÃ§Ã£o visÃ­vel: matrÃ­cula, VIN, marca, modelo, tipo de carroÃ§aria actual, dados de documentos fotografados (DUA, FAM, certificados). Nunca digas que nÃ£o consegues ler â€” tenta sempre. Se a imagem estiver desfocada, diz exactamente que parte nÃ£o consegues ler e pede nova foto sÃ³ dessa parte. Se vires um veÃ­culo, descreve-o e pergunta se o colaborador quer registar como lead ou associar a uma obra.

Usa as tools disponÃ­veis para consultar dados atualizados e executar aÃ§Ãµes.`
}

export async function POST(req: NextRequest) {
  try {
    const { colaborador_id, message, history, images } = await req.json()

    if (!colaborador_id || !message) {
      return NextResponse.json({ error: "Faltam campos" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // 1. Buscar dados do colaborador
    const { data: colab } = await supabase
      .from("colaboradores")
      .select("*")
      .eq("id", colaborador_id)
      .single()

    if (!colab) {
      return NextResponse.json({ error: "Colaborador nÃ£o encontrado" }, { status: 404 })
    }

    // 2. Buscar obras em produÃ§Ã£o
    const { data: obras } = await supabase
      .from("obras")
      .select("*, fases_obra(*)")
      .in("estado", ["producao", "espera"])

    // 3. Buscar timer ativo
    const { data: timer } = await supabase
      .from("timetracking")
      .select("*, fases_obra(nome, obra_id)")
      .eq("colaborador_id", colaborador_id)
      .is("fim", null)
      .maybeSingle()

    // 4. Montar system prompt
    const systemPrompt = buildSystemPrompt(colab, obras || [], timer)

    // 5. Montar mensagens
    // Build user content: if images are attached, create multi-block content
    type ImageAttachment = { data: string; media_type: string }
    const hasImages = images && Array.isArray(images) && images.length > 0
    if (hasImages) {
      console.log(`[chat] Received ${images.length} image(s) from ${colab.nome}, sizes: ${(images as ImageAttachment[]).map(i => `${(i.data.length / 1024).toFixed(0)}KB`).join(", ")}`)
    }
    let userContent: Anthropic.ContentBlockParam[] | string = message
    if (hasImages) {
      const blocks: Anthropic.ContentBlockParam[] = []
      for (const img of images as ImageAttachment[]) {
        blocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.media_type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: img.data,
          },
        })
      }
      blocks.push({ type: "text", text: message })
      userContent = blocks
    }

    const messages: Anthropic.MessageParam[] = [
      ...(history || []).slice(-20).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: userContent },
    ]

    // 6. Chamar Claude API (more tokens when processing images)
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: hasImages ? 4096 : 2048,
      system: systemPrompt,
      tools: CLAUDE_TOOLS,
      messages,
    })

    // 7. Processar tool calls (loop para permitir mÃºltiplas tool calls)
    let iterations = 0
    while (response.stop_reason === "tool_use" && iterations < 5) {
      iterations++
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      )

      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
          colaborador_id
        )
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result,
        })
      }

      // Continuar conversa com resultados
      messages.push({ role: "assistant", content: response.content })
      messages.push({ role: "user", content: toolResults })

      response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: systemPrompt,
        tools: CLAUDE_TOOLS,
        messages,
      })
    }

    // 8. Extrair texto da resposta
    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")

    // 9. Guardar mensagens na DB
    const { data: msgs } = await supabase.from("mensagens").insert([
      { colaborador_id, role: "user", content: message },
      {
        colaborador_id,
        role: "assistant",
        content: responseText,
        metadata: { tool_calls: iterations > 0 },
      },
    ]).select("id")

    // 10. Audit
    if (msgs && msgs.length > 0) {
      await audit({
        entidade_tipo: "mensagem",
        entidade_id: String(msgs[0].id),
        acao: "criar",
        utilizador_id: colaborador_id,
        utilizador_nome: colab.nome,
        metadata: { tool_calls: iterations > 0 },
      })
    }

    return NextResponse.json({ response: responseText })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Erro ao processar mensagem" },
      { status: 500 }
    )
  }
}

