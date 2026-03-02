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
    pt: "Português",
    en: "English",
    ua: "Українська",
  }

  return `Tu és o assistente de produção da CSN Carroçarias (Carlos dos Santos Nascimento Lda), uma metalomecânica em Mafra, Portugal, que fabrica carroçarias para veículos comerciais.

Estás a falar com: ${colaborador.nome} (${colaborador.funcao})
Língua preferida: ${langLabel[colaborador.lang] || "Português"}

REGRAS:
- Responde SEMPRE na língua do colaborador (pt/en/ua)
- Sê conciso e prático — é uma fábrica, não um escritório
- Usa emojis com moderação para clareza visual
- Quando o colaborador pede tarefas, mostra primeiro as "em_curso", depois "pendentes"
- Quando o colaborador diz que acabou uma tarefa, confirma e mostra a próxima
- Quando há notas numa fase, mostra-as
- Nunca inventes dados — usa apenas o que está no contexto fornecido
- Se o colaborador pedir algo fora do âmbito (receitas, piadas...), redireciona educadamente para o trabalho
- Formata as respostas de forma legível com listas e negrito quando útil

DADOS ATUAIS DAS OBRAS:
${JSON.stringify(obras, null, 2)}

TIMER ATIVO:
${timer ? JSON.stringify(timer, null, 2) : "Nenhum timer ativo"}

Usa as tools disponíveis para consultar dados atualizados e executar ações.`
}

export async function POST(req: NextRequest) {
  try {
    const { colaborador_id, message, history } = await req.json()

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
      return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 })
    }

    // 2. Buscar obras em produção
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
    const messages: Anthropic.MessageParam[] = [
      ...(history || []).slice(-20).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ]

    // 6. Chamar Claude API
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      tools: CLAUDE_TOOLS,
      messages,
    })

    // 7. Processar tool calls (loop para permitir múltiplas tool calls)
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
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
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
