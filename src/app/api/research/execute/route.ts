import { NextRequest, NextResponse } from "next/server"
import { executeResearchTask } from "@/lib/research-agent"

// POST /api/research/execute — arranca o Agente Research para uma tarefa
export async function POST(req: NextRequest) {
  const { task_id } = await req.json()

  if (!task_id) {
    return NextResponse.json({ error: "Campo obrigatório: task_id" }, { status: 400 })
  }

  try {
    // Executa de forma síncrona (Vercel tem timeout de 60s no hobby, 300s no pro)
    // Para tarefas longas, considerar background jobs futuramente
    const result = await executeResearchTask(task_id)

    return NextResponse.json({
      status: "concluido",
      sources: result.sources.length,
      findings: result.findings.length,
      recommendations: result.recommendations,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao executar pesquisa" },
      { status: 500 }
    )
  }
}
