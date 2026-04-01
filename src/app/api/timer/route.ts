import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

// GET — timer ativo do colaborador
export async function GET(req: NextRequest) {
  const colaboradorId = req.nextUrl.searchParams.get("colaborador_id")
  if (!colaboradorId) {
    return NextResponse.json({ error: "Falta colaborador_id" }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  const { data: timer } = await supabase
    .from("timetracking")
    .select("*, fases_obra(nome, obra_id, fase_numero)")
    .eq("colaborador_id", colaboradorId)
    .is("fim", null)
    .maybeSingle()

  return NextResponse.json({ timer })
}

// POST — iniciar ou parar timer
export async function POST(req: NextRequest) {
  try {
    const { colaborador_id, action, obra_id, fase_id } = await req.json()

    if (!colaborador_id || !action) {
      return NextResponse.json({ error: "Faltam campos" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    if (action === "start") {
      if (!obra_id || !fase_id) {
        return NextResponse.json({ error: "Faltam obra_id e fase_id" }, { status: 400 })
      }

      const { data: faseSelecionada } = await supabase
        .from("fases_obra")
        .select("id, obra_id, fase_numero, estado")
        .eq("id", fase_id)
        .maybeSingle()

      if (!faseSelecionada || faseSelecionada.obra_id !== obra_id) {
        return NextResponse.json({ error: "Fase inválida para a obra indicada" }, { status: 400 })
      }

      if (faseSelecionada.estado === "concluido") {
        return NextResponse.json({ error: "Esta fase já está concluída" }, { status: 409 })
      }

      const { data: fasesAnteriores } = await supabase
        .from("fases_obra")
        .select("id")
        .eq("obra_id", obra_id)
        .lt("fase_numero", faseSelecionada.fase_numero)
        .neq("estado", "concluido")

      if (fasesAnteriores && fasesAnteriores.length > 0) {
        return NextResponse.json(
          { error: "Só podes iniciar esta fase depois de concluir as anteriores" },
          { status: 409 }
        )
      }

      // Verificar se já tem timer ativo
      const { data: ativo } = await supabase
        .from("timetracking")
        .select("id")
        .eq("colaborador_id", colaborador_id)
        .is("fim", null)
        .maybeSingle()

      if (ativo) {
        return NextResponse.json(
          { error: "Já tens um timer ativo" },
          { status: 409 }
        )
      }

      const { data: timer, error } = await supabase
        .from("timetracking")
        .insert({
          colaborador_id,
          obra_id,
          fase_obra_id: fase_id,
          inicio: new Date().toISOString(),
        })
        .select("*, fases_obra(nome, obra_id, fase_numero)")
        .single()

      if (error) {
        return NextResponse.json({ error: "Erro ao iniciar" }, { status: 500 })
      }

      // Marcar fase como em_curso
      await supabase
        .from("fases_obra")
        .update({ estado: "em_curso", started_at: new Date().toISOString() })
        .eq("id", fase_id)
        .eq("estado", "pendente")

      return NextResponse.json({ timer })
    }

    if (action === "stop") {
      const { data: timer } = await supabase
        .from("timetracking")
        .select("*")
        .eq("colaborador_id", colaborador_id)
        .is("fim", null)
        .maybeSingle()

      if (!timer) {
        return NextResponse.json({ error: "Sem timer ativo" }, { status: 404 })
      }

      const fim = new Date()
      const inicio = new Date(timer.inicio)
      const duracaoMinutos =
        Math.round(((fim.getTime() - inicio.getTime()) / 60000) * 100) / 100

      // Atualizar timer
      await supabase
        .from("timetracking")
        .update({ fim: fim.toISOString(), duracao_minutos: duracaoMinutos })
        .eq("id", timer.id)

      // Somar horas à fase
      const duracaoHoras = Math.round((duracaoMinutos / 60) * 100) / 100
      const { data: fase } = await supabase
        .from("fases_obra")
        .select("horas_reais")
        .eq("id", timer.fase_obra_id)
        .single()

      if (fase) {
        await supabase
          .from("fases_obra")
          .update({ horas_reais: (fase.horas_reais || 0) + duracaoHoras })
          .eq("id", timer.fase_obra_id)
      }

      return NextResponse.json({
        stopped: true,
        duracao_minutos: duracaoMinutos,
      })
    }

    if (action === "complete") {
      if (!obra_id || !fase_id) {
        return NextResponse.json({ error: "Faltam obra_id e fase_id" }, { status: 400 })
      }

      const { data: faseAtual } = await supabase
        .from("fases_obra")
        .select("id, obra_id, estado")
        .eq("id", fase_id)
        .maybeSingle()

      if (!faseAtual || faseAtual.obra_id !== obra_id) {
        return NextResponse.json({ error: "Fase inválida para a obra indicada" }, { status: 400 })
      }

      const { data: timerAtivo } = await supabase
        .from("timetracking")
        .select("id")
        .eq("colaborador_id", colaborador_id)
        .eq("fase_obra_id", fase_id)
        .is("fim", null)
        .maybeSingle()

      if (timerAtivo) {
        const fim = new Date()
        const { data: timerInfo } = await supabase
          .from("timetracking")
          .select("id, inicio, fase_obra_id")
          .eq("id", timerAtivo.id)
          .single()

        if (timerInfo) {
          const inicio = new Date(timerInfo.inicio)
          const duracaoMinutos =
            Math.round(((fim.getTime() - inicio.getTime()) / 60000) * 100) / 100
          const duracaoHoras = Math.round((duracaoMinutos / 60) * 100) / 100

          await supabase
            .from("timetracking")
            .update({ fim: fim.toISOString(), duracao_minutos: duracaoMinutos })
            .eq("id", timerInfo.id)

          const { data: faseHoras } = await supabase
            .from("fases_obra")
            .select("horas_reais")
            .eq("id", timerInfo.fase_obra_id)
            .single()

          if (faseHoras) {
            await supabase
              .from("fases_obra")
              .update({ horas_reais: (faseHoras.horas_reais || 0) + duracaoHoras })
              .eq("id", timerInfo.fase_obra_id)
          }
        }
      }

      await supabase
        .from("fases_obra")
        .update({ estado: "concluido", completed_at: new Date().toISOString() })
        .eq("id", fase_id)

      const { data: pendentes } = await supabase
        .from("fases_obra")
        .select("id")
        .eq("obra_id", obra_id)
        .neq("estado", "concluido")

      const allDone = !pendentes || pendentes.length === 0
      if (allDone) {
        if (String(obra_id).startsWith("MNT-")) {
          await supabase
            .from("fases_obra")
            .update({
              estado: "pendente",
              horas_reais: 0,
              started_at: null,
              completed_at: null,
            })
            .eq("obra_id", obra_id)
        } else {
          await supabase
            .from("obras")
            .update({ estado: "concluida", updated_at: new Date().toISOString() })
            .eq("id", obra_id)
        }
      }

      return NextResponse.json({ completed: true, reset_cycle: allDone && String(obra_id).startsWith("MNT-") })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
