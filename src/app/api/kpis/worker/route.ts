import { getServiceSupabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const supabase = getServiceSupabase()
  const colaboradorId = req.nextUrl.searchParams.get("colaborador_id")

  if (!colaboradorId) {
    return NextResponse.json({ error: "colaborador_id required" }, { status: 400 })
  }

  try {
    // 1. Worker Efficiency Ratio (horas_estimadas / horas_reais)
    const { data: fases } = await supabase
      .from("fases_obra")
      .select("horas_estimadas, horas_reais, estado, completed_at, obra_id")
      .eq("responsavel", colaboradorId)

    const fasesCompletas = (fases || []).filter(f => f.estado === "concluido" && f.horas_reais > 0)
    const totalEstimado = fasesCompletas.reduce((s, f) => s + f.horas_estimadas, 0)
    const totalReal = fasesCompletas.reduce((s, f) => s + f.horas_reais, 0)
    const workerEfficiency = totalReal > 0 ? Math.round((totalEstimado / totalReal) * 100) : null

    // 2. Actual Production Time (horas esta semana)
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    monday.setHours(0, 0, 0, 0)

    const { data: timeWeek } = await supabase
      .from("timetracking")
      .select("duracao_minutos")
      .eq("colaborador_id", colaboradorId)
      .gte("inicio", monday.toISOString())
      .not("duracao_minutos", "is", null)

    const horasSemana = Math.round(((timeWeek || []).reduce((s, t) => s + (t.duracao_minutos || 0), 0)) / 60 * 10) / 10

    // 3. Actual Production Time (horas este mês)
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data: timeMonth } = await supabase
      .from("timetracking")
      .select("duracao_minutos")
      .eq("colaborador_id", colaboradorId)
      .gte("inicio", firstOfMonth.toISOString())
      .not("duracao_minutos", "is", null)

    const horasMes = Math.round(((timeMonth || []).reduce((s, t) => s + (t.duracao_minutos || 0), 0)) / 60 * 10) / 10

    // 4. Throughput Rate (fases concluídas esta semana)
    const fasesEstaSemana = (fases || []).filter(f => {
      if (!f.completed_at) return false
      return new Date(f.completed_at) >= monday
    }).length

    // 5. Throughput Rate (fases concluídas este mês)
    const fasesEsteMes = (fases || []).filter(f => {
      if (!f.completed_at) return false
      return new Date(f.completed_at) >= firstOfMonth
    }).length

    // 6. Obra actual em curso
    const { data: timerActivo } = await supabase
      .from("timetracking")
      .select("obra_id, fase_obra_id, inicio, fases_obra(nome)")
      .eq("colaborador_id", colaboradorId)
      .is("fim", null)
      .limit(1)
      .maybeSingle()

    // 7. Progresso obra actual (% fases concluídas)
    let obraProgresso = null
    if (timerActivo?.obra_id) {
      const { data: fasesObra } = await supabase
        .from("fases_obra")
        .select("estado")
        .eq("obra_id", timerActivo.obra_id)

      const { data: obraAtual } = await supabase
        .from("obras")
        .select("id, matricula, vin, leads(cliente, tipo_carrocaria)")
        .eq("id", timerActivo.obra_id)
        .maybeSingle()

      if (fasesObra && fasesObra.length > 0) {
        const concluidas = fasesObra.filter(f => f.estado === "concluido").length
        const lead = (obraAtual?.leads as { cliente?: string; tipo_carrocaria?: string } | null) || null
        const descricao = lead?.tipo_carrocaria
          ? `${timerActivo.obra_id} · ${lead.tipo_carrocaria}`
          : timerActivo.obra_id
        const chassis = obraAtual?.matricula || obraAtual?.vin || null

        obraProgresso = {
          obra_id: timerActivo.obra_id,
          fase_actual: (timerActivo.fases_obra as any)?.nome || null,
          inicio_timer: timerActivo.inicio,
          total_fases: fasesObra.length,
          fases_concluidas: concluidas,
          percentagem: Math.round((concluidas / fasesObra.length) * 100),
          descricao,
          chassis
        }
      }
    }

    // 8. Allocation Efficiency (horas trabalhadas / horas disponíveis este mês)
    // Dias úteis aproximados no mês actual
    const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const diasUteisAprox = Math.round(diasNoMes * 5 / 7)
    const horasDisponiveis = diasUteisAprox * 8
    const allocationEfficiency = horasDisponiveis > 0 ? Math.round((horasMes / horasDisponiveis) * 100) : null

    return NextResponse.json({
      colaborador_id: colaboradorId,
      periodo: {
        semana_inicio: monday.toISOString().slice(0, 10),
        mes: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      },
      kpis: {
        worker_efficiency: {
          valor: workerEfficiency,
          unidade: "%",
          descricao: "Eficiência (estimado vs real)",
          iso22400: "Worker Efficiency Ratio",
          fases_medidas: fasesCompletas.length
        },
        horas_semana: {
          valor: horasSemana,
          unidade: "h",
          descricao: "Horas esta semana",
          iso22400: "Actual Production Time"
        },
        horas_mes: {
          valor: horasMes,
          unidade: "h",
          descricao: "Horas este mês",
          iso22400: "Actual Production Time"
        },
        throughput_semana: {
          valor: fasesEstaSemana,
          unidade: "fases",
          descricao: "Fases concluídas esta semana",
          iso22400: "Throughput Rate"
        },
        throughput_mes: {
          valor: fasesEsteMes,
          unidade: "fases",
          descricao: "Fases concluídas este mês",
          iso22400: "Throughput Rate"
        },
        allocation_efficiency: {
          valor: allocationEfficiency,
          unidade: "%",
          descricao: "Utilização do tempo disponível",
          iso22400: "Allocation Efficiency"
        }
      },
      obra_actual: obraProgresso
    })
  } catch (err) {
    return NextResponse.json({ error: "Erro ao calcular KPIs" }, { status: 500 })
  }
}
