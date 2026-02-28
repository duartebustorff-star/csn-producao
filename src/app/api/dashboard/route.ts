import { NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function GET() {
  const supabase = getServiceSupabase()

  // Buscar tudo em paralelo
  const [obrasRes, timersRes, timetrackingRes, parqueRes] = await Promise.all([
    supabase.from("obras").select("*, fases_obra(*), leads(id, cliente, tipo_carrocaria)"),
    supabase.from("timetracking").select("*, fases_obra(nome, obra_id), colaboradores(nome)").is("fim", null),
    supabase
      .from("timetracking")
      .select("colaborador_id, duracao_minutos, colaboradores(nome)")
      .not("duracao_minutos", "is", null),
    supabase.from("lugares_parque").select("numero, obra_id"),
  ])

  const obras = obrasRes.data || []
  const timersAtivos = timersRes.data || []
  const registos = timetrackingRes.data || []
  const lugares = parqueRes.data || []

  // Contadores por estado
  const porEstado: Record<string, number> = {}
  for (const o of obras) {
    porEstado[o.estado] = (porEstado[o.estado] || 0) + 1
  }

  const emProducao = porEstado["producao"] || 0
  const emEspera = (porEstado["espera_documentacao"] || 0) +
    (porEstado["espera_projeto"] || 0) +
    (porEstado["espera_veiculo"] || 0)
  const concluidas = (porEstado["concluida"] || 0) + (porEstado["entregue"] || 0)

  // Parque stats
  const totalLugares = lugares.length
  const lugaresOcupados = lugares.filter((l) => l.obra_id).length

  // Horas por colaborador
  const horasPorColaborador: Record<string, { nome: string; horas: number }> = {}
  for (const r of registos) {
    const id = r.colaborador_id
    if (!horasPorColaborador[id]) {
      const colabData = r.colaboradores as unknown as { nome: string } | null
      horasPorColaborador[id] = { nome: colabData?.nome || id, horas: 0 }
    }
    horasPorColaborador[id].horas += (r.duracao_minutos || 0) / 60
  }

  // Arredondar horas
  for (const id in horasPorColaborador) {
    horasPorColaborador[id].horas = Math.round(horasPorColaborador[id].horas * 10) / 10
  }

  // Total horas
  const totalHoras = Object.values(horasPorColaborador).reduce((sum, c) => sum + c.horas, 0)

  return NextResponse.json({
    resumo: { em_producao: emProducao, em_espera: emEspera, concluidas },
    por_estado: porEstado,
    parque: { total: totalLugares, ocupados: lugaresOcupados },
    timers_ativos: timersAtivos,
    horas_por_colaborador: horasPorColaborador,
    total_horas: Math.round(totalHoras * 10) / 10,
    obras,
  })
}
