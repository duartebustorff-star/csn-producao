import { NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { HORARIO, OPERADORES, FERIAS_ANUAIS, CAPACIDADE_TOTAL_ANUAL } from "@/lib/constants"

export async function GET() {
  const supabase = getServiceSupabase()
  const now = new Date()
  const year = now.getFullYear()

  // Week boundaries (Monday to Sunday)
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + mondayOffset)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  // Month boundaries
  const monthStart = new Date(year, now.getMonth(), 1)
  const monthEnd = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999)

  // Year boundaries
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

  // Fetch all data in parallel
  const [calendarioRes, ausenciasRes, ausenciasAnoRes, timeWeekRes, timeMonthRes, timeYearRes, colabRes] =
    await Promise.all([
      supabase.from("calendario").select("*").gte("data", yearStart.toISOString().split("T")[0]).lte("data", yearEnd.toISOString().split("T")[0]),
      supabase.from("ausencias").select("*, colaboradores(nome)").lte("data_inicio", now.toISOString().split("T")[0]).gte("data_fim", now.toISOString().split("T")[0]),
      supabase.from("ausencias").select("*").gte("data_inicio", yearStart.toISOString().split("T")[0]).lte("data_fim", yearEnd.toISOString().split("T")[0]),
      supabase.from("timetracking").select("colaborador_id, duracao_minutos").gte("inicio", weekStart.toISOString()).lte("inicio", weekEnd.toISOString()).not("duracao_minutos", "is", null),
      supabase.from("timetracking").select("colaborador_id, duracao_minutos").gte("inicio", monthStart.toISOString()).lte("inicio", monthEnd.toISOString()).not("duracao_minutos", "is", null),
      supabase.from("timetracking").select("colaborador_id, duracao_minutos").gte("inicio", yearStart.toISOString()).lte("inicio", yearEnd.toISOString()).not("duracao_minutos", "is", null),
      supabase.from("colaboradores").select("id, nome, funcao").in("id", [...OPERADORES]),
    ])

  const calendario = calendarioRes.data || []
  const ausenciasAtivas = ausenciasRes.data || []
  const ausenciasAno = ausenciasAnoRes.data || []
  const timeWeek = timeWeekRes.data || []
  const timeMonth = timeMonthRes.data || []
  const timeYear = timeYearRes.data || []
  const colaboradores = colabRes.data || []

  // Count working days in a range, accounting for calendar and absences
  function countWorkingDays(start: Date, end: Date, operadorId?: string): number {
    let days = 0
    const current = new Date(start)
    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0]
      const dow = current.getDay()
      const calEntry = calendario.find((c) => c.data === dateStr)

      if (dow >= 1 && dow <= 5) {
        // Weekday
        if (calEntry && ["feriado", "ponte", "ferias_empresa", "encerramento"].includes(calEntry.tipo)) {
          // Day off
        } else if (operadorId) {
          // Check if operator is absent
          const absent = ausenciasAtivas.some(
            (a) => a.colaborador_id === operadorId && a.data_inicio <= dateStr && a.data_fim >= dateStr
          )
          if (!absent) days++
        } else {
          days++
        }
      } else if (calEntry && calEntry.tipo === "dia_extra_trabalho") {
        // Weekend but extra work day
        if (!operadorId) {
          days++ // Simplified: count as 1 day
        } else if (calEntry.colaboradores_ids?.includes(operadorId)) {
          days++
        }
      }
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  // Calculate hours from timetracking records
  function sumHours(records: { colaborador_id: string; duracao_minutos: number }[], operadorId?: string): number {
    const filtered = operadorId ? records.filter((r) => r.colaborador_id === operadorId) : records
    const mins = filtered.reduce((sum, r) => sum + (r.duracao_minutos || 0), 0)
    return Math.round((mins / 60) * 10) / 10
  }

  // Per-operator stats
  const porOperador = colaboradores.map((c) => {
    const horasSemanaTrab = sumHours(timeWeek, c.id)
    const diasSemanaDisp = countWorkingDays(weekStart, weekEnd, c.id)
    const horasSemanaDisp = diasSemanaDisp * HORARIO.horas_dia

    // Count used vacation days this year
    const feriasUsadas = ausenciasAno
      .filter((a) => a.colaborador_id === c.id && a.tipo === "ferias")
      .reduce((sum, a) => {
        const start = new Date(a.data_inicio)
        const end = new Date(a.data_fim)
        let days = 0
        const cur = new Date(start)
        while (cur <= end) {
          if (cur.getDay() >= 1 && cur.getDay() <= 5) days++
          cur.setDate(cur.getDate() + 1)
        }
        return sum + days
      }, 0)

    // Determine current status
    const activeAbsence = ausenciasAtivas.find((a) => a.colaborador_id === c.id)
    let estado: "ativo" | "baixa" | "ferias" | "ausente" = "ativo"
    if (activeAbsence) {
      if (activeAbsence.tipo === "baixa") estado = "baixa"
      else if (activeAbsence.tipo === "ferias") estado = "ferias"
      else estado = "ausente"
    }

    return {
      id: c.id,
      nome: c.nome,
      horas_trabalhadas_semana: horasSemanaTrab,
      horas_disponiveis_semana: horasSemanaDisp,
      horas_trabalhadas_ano: sumHours(timeYear, c.id),
      ferias_usadas: feriasUsadas,
      ferias_total: FERIAS_ANUAIS,
      estado,
    }
  })

  // Totals
  const diasUteisSemana = countWorkingDays(weekStart, weekEnd)
  const diasUteisMes = countWorkingDays(monthStart, monthEnd)
  const operadoresAtivos = porOperador.filter((o) => o.estado === "ativo").length
  const horasDisponiveisSemana = diasUteisSemana * HORARIO.horas_dia * operadoresAtivos
  const horasDisponiveisMes = diasUteisMes * HORARIO.horas_dia * operadoresAtivos
  const horasTrabalhadasSemana = sumHours(timeWeek)
  const horasTrabalhadasMes = sumHours(timeMonth)
  const horasTrabalhadasAno = sumHours(timeYear)

  // Upcoming holidays (next 30 days)
  const in30Days = new Date(now)
  in30Days.setDate(now.getDate() + 30)
  const proximosFeriados = calendario
    .filter((c) => {
      const d = new Date(c.data)
      return d >= now && d <= in30Days && ["feriado", "ponte"].includes(c.tipo)
    })
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((c) => ({ data: c.data, descricao: c.descricao, tipo: c.tipo }))

  // Active absences
  const ausenciasAtivasFormatted = ausenciasAtivas.map((a) => ({
    colaborador_id: a.colaborador_id,
    colaborador_nome: (a.colaboradores as unknown as { nome: string })?.nome || a.colaborador_id,
    tipo: a.tipo,
    data_inicio: a.data_inicio,
    data_fim: a.data_fim,
  }))

  return NextResponse.json({
    dias_uteis_semana: diasUteisSemana,
    dias_uteis_mes: diasUteisMes,
    horas_disponiveis_semana: horasDisponiveisSemana,
    horas_disponiveis_mes: horasDisponiveisMes,
    horas_trabalhadas_semana: horasTrabalhadasSemana,
    horas_trabalhadas_mes: horasTrabalhadasMes,
    ocupacao_percentual: horasDisponiveisSemana > 0
      ? Math.round((horasTrabalhadasSemana / horasDisponiveisSemana) * 100)
      : 0,
    por_operador: porOperador,
    proximos_feriados: proximosFeriados,
    ausencias_ativas: ausenciasAtivasFormatted,
    capacidade_anual: {
      total_horas: CAPACIDADE_TOTAL_ANUAL,
      horas_trabalhadas: horasTrabalhadasAno,
      percentual: Math.round((horasTrabalhadasAno / CAPACIDADE_TOTAL_ANUAL) * 100),
    },
  })
}
