"use client"

import { useState, useEffect } from "react"
import type { FaseObra } from "@/lib/types"

const ESTADO_DASH: Record<string, { label: string; color: string }> = {
  espera_documentacao: { label: "Espera docs", color: "text-yellow-400" },
  espera_projeto: { label: "Espera projeto", color: "text-blue-400" },
  espera_veiculo: { label: "Espera veículo", color: "text-purple-400" },
  veiculo_recebido: { label: "Veíc. recebido", color: "text-cyan-400" },
  producao: { label: "Produção", color: "text-accent" },
  concluida: { label: "Concluída", color: "text-success" },
  entregue: { label: "Entregue", color: "text-success" },
}

interface DashboardData {
  resumo: { em_producao: number; em_espera: number; concluidas: number }
  por_estado: Record<string, number>
  parque: { total: number; ocupados: number }
  timers_ativos: Array<{
    id: number
    colaborador_id: string
    inicio: string
    fases_obra?: { nome: string; obra_id: string }
    colaboradores?: { nome: string }
  }>
  horas_por_colaborador: Record<string, { nome: string; horas: number }>
  total_horas: number
  obras: Array<{
    id: string
    estado: string
    fases_obra: FaseObra[]
    leads?: { cliente: string; tipo_carrocaria: string } | null
  }>
}

interface CapacidadeData {
  dias_uteis_semana: number
  dias_uteis_mes: number
  horas_disponiveis_semana: number
  horas_disponiveis_mes: number
  horas_trabalhadas_semana: number
  horas_trabalhadas_mes: number
  ocupacao_percentual: number
  por_operador: Array<{
    id: string
    nome: string
    horas_trabalhadas_semana: number
    horas_disponiveis_semana: number
    horas_trabalhadas_ano: number
    ferias_usadas: number
    ferias_total: number
    estado: "ativo" | "baixa" | "ferias" | "ausente"
  }>
  proximos_feriados: Array<{ data: string; descricao: string; tipo: string }>
  ausencias_ativas: Array<{
    colaborador_id: string
    colaborador_nome: string
    tipo: string
    data_inicio: string
    data_fim: string
  }>
  capacidade_anual: {
    total_horas: number
    horas_trabalhadas: number
    percentual: number
  }
}

export default function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [capData, setCapData] = useState<CapacidadeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAll = async () => {
    const [dashRes, capRes] = await Promise.all([
      fetch("/api/dashboard").then((r) => r.json()).catch(() => null),
      fetch("/api/capacidade").then((r) => r.json()).catch(() => null),
    ])
    if (dashRes) setData(dashRes)
    if (capRes) setCapData(capRes)
    setLoading(false)
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-muted text-sm">A carregar...</span>
      </div>
    )
  }

  const { resumo, timers_ativos, horas_por_colaborador, total_horas, obras } = data

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Produção" value={resumo.em_producao} color="text-accent" />
        <SummaryCard label="Espera" value={resumo.em_espera} color="text-muted" />
        <SummaryCard label="Concluídas" value={resumo.concluidas} color="text-success" />
      </div>

      {/* Parque + Estado breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {/* Parque occupancy */}
        <div className="bg-card rounded-xl p-4 space-y-2">
          <h3 className="text-xs text-muted uppercase tracking-wider">Parque</h3>
          <p className="text-2xl font-bold font-mono text-foreground">
            {data.parque.ocupados}<span className="text-muted text-sm">/{data.parque.total}</span>
          </p>
          <CapacityBar used={data.parque.ocupados} total={data.parque.total} />
          <p className="text-xs text-muted">lugares ocupados</p>
        </div>

        {/* Obras por estado */}
        <div className="bg-card rounded-xl p-4 space-y-1.5">
          <h3 className="text-xs text-muted uppercase tracking-wider mb-1">Por estado</h3>
          {Object.entries(ESTADO_DASH).map(([key, info]) => {
            const count = data.por_estado[key] || 0
            if (count === 0) return null
            return (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className={info.color}>{info.label}</span>
                <span className="font-mono text-foreground">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Capacity section */}
      {capData && (
        <>
          {/* Weekly capacity */}
          <div className="bg-card rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Capacidade Semanal</h3>
              <span className="text-xs font-mono text-accent">{capData.ocupacao_percentual}%</span>
            </div>
            <CapacityBar
              used={capData.horas_trabalhadas_semana}
              total={capData.horas_disponiveis_semana}
            />
            <div className="flex justify-between text-xs text-muted">
              <span>{capData.horas_trabalhadas_semana}h trabalhadas</span>
              <span>{capData.horas_disponiveis_semana}h disponíveis</span>
            </div>
          </div>

          {/* Monthly capacity */}
          <div className="bg-card rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-medium text-foreground">Capacidade Mensal</h3>
            <CapacityBar
              used={capData.horas_trabalhadas_mes}
              total={capData.horas_disponiveis_mes}
            />
            <div className="flex justify-between text-xs text-muted">
              <span>{capData.horas_trabalhadas_mes}h trabalhadas</span>
              <span>{capData.horas_disponiveis_mes}h disponíveis</span>
            </div>
          </div>

          {/* Annual capacity */}
          <div className="bg-card rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Capacidade Anual</h3>
              <span className="text-xs font-mono text-accent">{capData.capacidade_anual.percentual}%</span>
            </div>
            <CapacityBar
              used={capData.capacidade_anual.horas_trabalhadas}
              total={capData.capacidade_anual.total_horas}
            />
            <div className="flex justify-between text-xs text-muted">
              <span>{capData.capacidade_anual.horas_trabalhadas}h</span>
              <span>{capData.capacidade_anual.total_horas}h total</span>
            </div>
          </div>

          {/* Per operator cards */}
          <div>
            <h3 className="text-xs text-muted uppercase tracking-wider mb-2 px-1">Operadores</h3>
            <div className="space-y-2">
              {capData.por_operador.map((op) => {
                const estadoBadge: Record<string, { label: string; color: string }> = {
                  ativo: { label: "Ativo", color: "bg-success/20 text-success" },
                  baixa: { label: "Baixa", color: "bg-danger/20 text-danger" },
                  ferias: { label: "Férias", color: "bg-blue-500/20 text-blue-400" },
                  ausente: { label: "Ausente", color: "bg-muted/20 text-muted" },
                }
                const badge = estadoBadge[op.estado]

                return (
                  <div key={op.id} className="bg-card rounded-xl px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{op.nome}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted">
                        {op.ferias_usadas}/{op.ferias_total} férias
                      </span>
                    </div>
                    <CapacityBar
                      used={op.horas_trabalhadas_semana}
                      total={op.horas_disponiveis_semana}
                    />
                    <div className="flex justify-between text-xs text-muted">
                      <span>{op.horas_trabalhadas_semana}h esta semana</span>
                      <span>{op.horas_disponiveis_semana}h disp.</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active absences */}
          {capData.ausencias_ativas.length > 0 && (
            <div>
              <h3 className="text-xs text-muted uppercase tracking-wider mb-2 px-1">Ausências ativas</h3>
              <div className="space-y-1.5">
                {capData.ausencias_ativas.map((a, i) => (
                  <div key={i} className="bg-danger/5 border border-danger/10 rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">{a.colaborador_nome}</p>
                      <p className="text-xs text-muted capitalize">{a.tipo}</p>
                    </div>
                    <span className="text-xs font-mono text-muted">
                      {new Date(a.data_inicio).toLocaleDateString("pt-PT")} — {new Date(a.data_fim).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming holidays */}
          {capData.proximos_feriados.length > 0 && (
            <div>
              <h3 className="text-xs text-muted uppercase tracking-wider mb-2 px-1">Próximos feriados</h3>
              <div className="space-y-1.5">
                {capData.proximos_feriados.map((f, i) => (
                  <div key={i} className="bg-card rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">{f.descricao}</p>
                      <p className="text-xs text-muted capitalize">{f.tipo}</p>
                    </div>
                    <span className="text-xs font-mono text-muted">
                      {new Date(f.data).toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Active timers */}
      {timers_ativos.length > 0 && (
        <div>
          <h3 className="text-xs text-muted uppercase tracking-wider mb-2 px-1">Timers ativos</h3>
          <div className="space-y-2">
            {timers_ativos.map((timer) => (
              <div key={timer.id} className="bg-accent/10 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {timer.colaboradores?.nome || timer.colaborador_id}
                  </p>
                  <p className="text-xs text-muted">
                    {timer.fases_obra?.obra_id} · {timer.fases_obra?.nome}
                  </p>
                </div>
                <TimerDisplay inicio={timer.inicio} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hours per worker */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs text-muted uppercase tracking-wider">Horas totais registadas</h3>
          <span className="text-xs font-mono text-accent">{total_horas}h</span>
        </div>
        <div className="space-y-2">
          {Object.entries(horas_por_colaborador).map(([id, info]) => {
            const maxHoras = Math.max(...Object.values(horas_por_colaborador).map((c) => c.horas), 1)
            const pct = (info.horas / maxHoras) * 100
            return (
              <div key={id} className="bg-card rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground">{info.nome}</span>
                  <span className="text-sm font-mono text-muted">{info.horas}h</span>
                </div>
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg, #e8930b, #f0a832)" }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Obras in production */}
      <div>
        <h3 className="text-xs text-muted uppercase tracking-wider mb-2 px-1">Progresso obras</h3>
        <div className="space-y-2">
          {obras
            .filter((o) => o.estado === "producao")
            .map((obra) => {
              const fases = obra.fases_obra || []
              const concluidas = fases.filter((f: FaseObra) => f.estado === "concluido").length
              const total = fases.length
              const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0
              const faseAtual = fases.find((f: FaseObra) => f.estado === "em_curso")

              return (
                <div key={obra.id} className="bg-card rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-medium text-foreground">{obra.id}</span>
                      <span className="text-xs text-muted ml-2">{obra.leads?.cliente}</span>
                    </div>
                    <span className="text-xs font-mono text-accent">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: "linear-gradient(90deg, #e8930b, #f0a832)" }}
                    />
                  </div>
                  {faseAtual && (
                    <p className="text-xs text-muted">
                      Fase atual: <span className="text-accent">{faseAtual.nome}</span>
                      {faseAtual.responsavel && ` (${faseAtual.responsavel})`}
                    </p>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  )
}

function CapacityBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0
  return (
    <div className="h-2 bg-background rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: pct > 90
            ? "linear-gradient(90deg, #ef4444, #dc2626)"
            : pct > 70
              ? "linear-gradient(90deg, #e8930b, #f0a832)"
              : "linear-gradient(90deg, #22c55e, #4ade80)",
        }}
      />
    </div>
  )
}

function TimerDisplay({ inicio }: { inicio: string }) {
  const [elapsed, setElapsed] = useState("")

  useEffect(() => {
    const update = () => {
      const start = new Date(inicio).getTime()
      const diff = Math.floor((Date.now() - start) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = diff % 60
      setElapsed(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [inicio])

  return <span className="font-mono text-sm text-accent font-medium">{elapsed}</span>
}
