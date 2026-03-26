import Anthropic from "@anthropic-ai/sdk"
import { getServiceSupabase } from "./supabase"
import { audit } from "./audit"
import { promises as fs } from "fs"
import path from "path"

// ============================================
// TYPES
// ============================================

export interface ResearchTask {
  id: string
  codigo: string
  tema: string
  tipo: string
  descricao: string | null
  solicitado_por: string
  pasta_local: string
  estado: string
  data_inicio: string | null
  data_conclusao: string | null
  fontes_consultadas: number
  documentos_encontrados: number
  documentos_descarregados: number
  relatorio_path: string | null
  notas: string | null
}

interface ResearchSource {
  url: string
  titulo: string
  estado: "ok" | "bloqueado" | "erro"
  resumo: string
}

interface ResearchResult {
  sources: ResearchSource[]
  findings: string[]
  structured_data: Record<string, unknown>[]
  recommendations: string[]
  quality_assessment: string
  unfinished: string[]
}

// ============================================
// TOOLS — o que o Claude pode usar durante a pesquisa
// ============================================

const RESEARCH_TOOLS: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Pesquisa na web por informação técnica. Usa termos específicos da indústria de carroçarias comerciais, normas EN/ISO, legislação europeia, ou dados de chassis de fabricantes.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string" as const,
          description: "Termos de pesquisa (em inglês para melhores resultados técnicos)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "fetch_url",
    description:
      "Descarrega o conteúdo de uma URL específica. Usa para páginas de fabricantes, normas, portais técnicos, PDFs públicos.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string" as const,
          description: "URL completo a descarregar",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "save_finding",
    description:
      "Regista uma descoberta estruturada. Usa para cada pedaço de informação relevante encontrado.",
    input_schema: {
      type: "object" as const,
      properties: {
        titulo: { type: "string" as const },
        conteudo: { type: "string" as const },
        fonte: { type: "string" as const, description: "URL ou nome da fonte" },
        tipo: {
          type: "string" as const,
          enum: ["dado_tecnico", "documento", "norma", "legislacao", "preco", "contacto", "outro"],
        },
        fiabilidade: {
          type: "string" as const,
          enum: ["alta", "media", "baixa"],
          description: "Fiabilidade da fonte: alta=fabricante/oficial, media=portal técnico, baixa=fórum/blog",
        },
      },
      required: ["titulo", "conteudo", "fonte", "tipo", "fiabilidade"],
    },
  },
  {
    name: "conclude_research",
    description:
      "Termina a pesquisa e apresenta o resumo final com recomendações. Usa quando já recolheste informação suficiente ou esgotaste as fontes disponíveis.",
    input_schema: {
      type: "object" as const,
      properties: {
        resumo: { type: "string" as const, description: "Resumo do que foi encontrado" },
        qualidade: { type: "string" as const, description: "Avaliação da qualidade/fiabilidade geral" },
        recomendacoes: {
          type: "array" as const,
          items: { type: "string" as const },
          description: "Lista de recomendações para o sistema incorporar",
        },
        por_fazer: {
          type: "array" as const,
          items: { type: "string" as const },
          description: "O que ficou por fazer ou não foi possível aceder",
        },
      },
      required: ["resumo", "qualidade", "recomendacoes", "por_fazer"],
    },
  },
]

// ============================================
// TOOL EXECUTION
// ============================================

async function executeResearchTool(
  toolName: string,
  input: Record<string, unknown>,
  context: { sources: ResearchSource[]; findings: ResearchResult["structured_data"] }
): Promise<string> {
  switch (toolName) {
    case "web_search": {
      const query = input.query as string
      try {
        const res = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
          {
            headers: {
              Accept: "application/json",
              "Accept-Encoding": "gzip",
              "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY || "",
            },
          }
        )
        if (!res.ok) {
          // Fallback: return a message that search is unavailable
          return JSON.stringify({
            status: "search_unavailable",
            message: `Web search API not configured. Query was: "${query}". Use fetch_url with known URLs instead.`,
          })
        }
        const data = await res.json()
        const results = (data.web?.results || []).slice(0, 8).map(
          (r: { title: string; url: string; description: string }) => ({
            title: r.title,
            url: r.url,
            snippet: r.description,
          })
        )
        return JSON.stringify({ results })
      } catch {
        return JSON.stringify({ status: "error", message: "Search failed" })
      }
    }

    case "fetch_url": {
      const url = input.url as string
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "CSN-Research-Agent/1.0" },
          signal: AbortSignal.timeout(15000),
        })
        if (!res.ok) {
          context.sources.push({ url, titulo: url, estado: "erro", resumo: `HTTP ${res.status}` })
          return JSON.stringify({ status: "error", http_status: res.status })
        }
        const contentType = res.headers.get("content-type") || ""
        if (contentType.includes("application/pdf")) {
          context.sources.push({ url, titulo: url, estado: "ok", resumo: "PDF detectado" })
          return JSON.stringify({
            status: "ok",
            type: "pdf",
            message: "PDF detected. Content not extractable inline — logged as download.",
            url,
          })
        }
        const html = await res.text()
        // Strip HTML tags, keep text, limit to 12k chars
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 12000)
        context.sources.push({ url, titulo: url, estado: "ok", resumo: text.slice(0, 200) })
        return JSON.stringify({ status: "ok", type: "html", content: text })
      } catch {
        context.sources.push({ url, titulo: url, estado: "bloqueado", resumo: "Timeout ou bloqueado" })
        return JSON.stringify({ status: "blocked", message: "Request timed out or was blocked" })
      }
    }

    case "save_finding": {
      context.findings.push(input)
      return JSON.stringify({ status: "saved", total_findings: context.findings.length })
    }

    case "conclude_research": {
      return JSON.stringify({ status: "concluded", ...input })
    }

    default:
      return JSON.stringify({ error: "Tool desconhecida" })
  }
}

// ============================================
// SYSTEM PROMPT
// ============================================

function buildResearchSystemPrompt(task: ResearchTask): string {
  return `Tu és o Agente Research do sistema CSN Opus — um agente autónomo especializado em pesquisa técnica para a indústria de carroçarias de veículos comerciais.

TAREFA ACTUAL: ${task.codigo}
TEMA: ${task.tema}
TIPO: ${task.tipo}
DESCRIÇÃO: ${task.descricao || "Sem descrição adicional"}

O TEU OBJECTIVO:
Pesquisar de forma sistemática e exaustiva toda a informação disponível sobre o tema. Privilegia fontes oficiais (fabricantes, organismos de normalização, portais governamentais).

DOMÍNIO CSN TECHNIC:
- Empresa: metalomecânica em Mafra, Portugal — carroçarias para veículos comerciais
- Produtos: caixas abertas, basculantes, estrados, plataformas
- Normas relevantes: EN 1090, EN 12195, EN 12642, ISO 9001, UNECE
- Legislação: DL 132/2017, Reg. UE 1230/2012, Dir. 96/53/CE
- Marcas chassis: Renault, Mercedes-Benz, MAN, DAF, Iveco, Fuso, Stellantis

INSTRUÇÕES:
1. Começa com pesquisas web amplas sobre o tema
2. Aprofunda nos resultados mais relevantes usando fetch_url
3. Para cada descoberta importante, usa save_finding para a registar
4. Pesquisa em inglês para resultados técnicos mais abrangentes
5. Quando tiveres informação suficiente OU esgotares as fontes, usa conclude_research
6. Sê rigoroso na avaliação de fiabilidade das fontes
7. Não inventes informação — se não encontraste, diz que não encontraste

TIPOS DE FONTE POR FIABILIDADE:
- ALTA: sites de fabricantes (.man.eu, .renault-trucks.com), organismos oficiais (iso.org, cen.eu, eur-lex.europa.eu)
- MÉDIA: portais técnicos, revistas especializadas, distribuidores autorizados
- BAIXA: fóruns, blogs, artigos genéricos

Máximo 10 iterações de pesquisa. Sê eficiente.`
}

// ============================================
// MAIN EXECUTION
// ============================================

export async function executeResearchTask(taskId: string): Promise<ResearchResult> {
  const supabase = getServiceSupabase()
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // 1. Carregar tarefa
  const { data: task, error } = await supabase
    .from("research_tasks")
    .select("*")
    .eq("id", taskId)
    .single()

  if (error || !task) {
    throw new Error(`Tarefa ${taskId} não encontrada`)
  }

  // 2. Marcar como em_curso
  const dataInicio = new Date().toISOString()
  await supabase
    .from("research_tasks")
    .update({ estado: "em_curso", data_inicio: dataInicio, updated_at: dataInicio })
    .eq("id", taskId)

  // 3. Contexto partilhado entre tools
  const context: { sources: ResearchSource[]; findings: ResearchResult["structured_data"] } = {
    sources: [],
    findings: [],
  }

  // 4. Loop de pesquisa com Claude
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Executa a tarefa de pesquisa ${task.codigo}: "${task.tema}". ${task.descricao || ""}\n\nComeça a pesquisar agora.`,
    },
  ]

  let concluded = false
  let conclusionData: Record<string, unknown> = {}
  let iterations = 0
  const maxIterations = 10

  try {
    while (!concluded && iterations < maxIterations) {
      iterations++

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: buildResearchSystemPrompt(task as ResearchTask),
        tools: RESEARCH_TOOLS,
        messages,
      })

      // Se parou sem tool_use, terminou
      if (response.stop_reason !== "tool_use") {
        concluded = true
        break
      }

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      )

      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const toolUse of toolUseBlocks) {
        const result = await executeResearchTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
          context
        )
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result,
        })

        if (toolUse.name === "conclude_research") {
          concluded = true
          conclusionData = toolUse.input as Record<string, unknown>
        }
      }

      messages.push({ role: "assistant", content: response.content })
      messages.push({ role: "user", content: toolResults })
    }

    // 5. Construir resultado
    const result: ResearchResult = {
      sources: context.sources,
      findings: context.findings.map((f) => (f as { titulo?: string }).titulo || JSON.stringify(f)),
      structured_data: context.findings,
      recommendations: (conclusionData.recomendacoes as string[]) || [],
      quality_assessment: (conclusionData.qualidade as string) || "Não avaliado",
      unfinished: (conclusionData.por_fazer as string[]) || [],
    }

    // 6. Gerar relatório e gravar no filesystem
    const report = generateReport(task as ResearchTask, result, dataInicio)
    const taskDir = path.resolve(process.cwd(), task.pasta_local)

    await fs.mkdir(path.join(taskDir, "raw"), { recursive: true })
    await fs.mkdir(path.join(taskDir, "processado"), { recursive: true })
    await fs.mkdir(path.join(taskDir, "downloads"), { recursive: true })

    const reportPath = path.join(task.pasta_local, `RELATORIO_${task.codigo}.md`)
    await fs.writeFile(path.resolve(process.cwd(), reportPath), report, "utf-8")

    // Gravar dados estruturados como JSON
    if (context.findings.length > 0) {
      await fs.writeFile(
        path.join(taskDir, "processado", "dados_extraidos.json"),
        JSON.stringify(context.findings, null, 2),
        "utf-8"
      )
    }

    // Gravar lista de fontes
    await fs.writeFile(
      path.join(taskDir, "processado", "fontes.json"),
      JSON.stringify(context.sources, null, 2),
      "utf-8"
    )

    // 7. Actualizar tarefa como concluída
    const dataConclusao = new Date().toISOString()
    await supabase
      .from("research_tasks")
      .update({
        estado: "concluido",
        data_conclusao: dataConclusao,
        fontes_consultadas: context.sources.length,
        documentos_encontrados: context.findings.length,
        documentos_descarregados: context.sources.filter((s) => s.estado === "ok").length,
        relatorio_path: reportPath,
        updated_at: dataConclusao,
      })
      .eq("id", taskId)

    await audit({
      entidade_tipo: "research_task",
      entidade_id: taskId,
      acao: "mudar_estado",
      campo_alterado: "estado",
      valor_anterior: "em_curso",
      valor_novo: "concluido",
      utilizador_id: "agente_research",
    })

    return result
  } catch (err) {
    // Marcar como falhado
    await supabase
      .from("research_tasks")
      .update({
        estado: "falhado",
        notas: err instanceof Error ? err.message : "Erro desconhecido",
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)

    throw err
  }
}

// ============================================
// REPORT GENERATOR
// ============================================

function generateReport(task: ResearchTask, result: ResearchResult, dataInicio: string): string {
  const sourcesOk = result.sources.filter((s) => s.estado === "ok").length
  const sourcesFailed = result.sources.filter((s) => s.estado !== "ok").length

  const sourcesList = result.sources
    .map((s) => `- ${s.url} — ${s.estado}${s.estado !== "ok" ? ` (${s.resumo})` : ""}`)
    .join("\n")

  const findingsList = result.structured_data
    .map((f) => {
      const finding = f as { titulo?: string; conteudo?: string; fonte?: string; fiabilidade?: string }
      return `### ${finding.titulo || "Sem título"}\n${finding.conteudo || ""}\n**Fonte:** ${finding.fonte || "?"} | **Fiabilidade:** ${finding.fiabilidade || "?"}\n`
    })
    .join("\n")

  const recomendacoes = result.recommendations.map((r) => `- ${r}`).join("\n") || "- Nenhuma"
  const porFazer = result.unfinished.map((u) => `- ${u}`).join("\n") || "- Nada pendente"

  return `# RELATÓRIO DE TAREFA
Código: ${task.codigo}
Tema: ${task.tema}
Tipo: ${task.tipo}
Solicitado por: ${task.solicitado_por}
Data início: ${dataInicio}
Data conclusão: ${new Date().toISOString()}

## Fontes consultadas
${sourcesList || "- Nenhuma"}

## Documentos encontrados: ${result.structured_data.length}
## Fontes acedidas com sucesso: ${sourcesOk}
## Fontes sem acesso: ${sourcesFailed}

## Dados estruturados extraídos
${findingsList || "Nenhum dado extraído."}

## Qualidade da informação
${result.quality_assessment}

## O que ficou por fazer
${porFazer}

## Recomendações
${recomendacoes}
`
}
