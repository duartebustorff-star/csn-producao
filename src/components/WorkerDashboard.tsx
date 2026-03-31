"use client"

import { useState, useEffect, useCallback } from "react"
import type { Colaborador } from "@/lib/types"

interface KpiValue {
  valor: number | null
  unidade: string
  descricao: string
  iso22400: string
  fases_medidas?: number
}

interface KpiData {
  colaborador_id: string
  periodo: { semana_inicio: string; mes: string }
  kpis: {
    worker_efficiency: KpiValue
    horas_semana: KpiValue
    horas_mes: KpiValue
    throughput_semana: KpiValue
    throughput_mes: KpiValue
    allocation_efficiency: KpiValue
  }
  obra_actual: {
    obra_id: number
    descricao: string
    cliente: string
    chassis: string
    total_fases: number
    fases_concluidas: number
    fase_actual: string | null
    progresso: number
  } | null
}

function gaugeColor(value: number | null): string {
  if (value === null) return "var(--color-border-secondary)"
  if (value >= 80) return "#1D9E75"
  if (value >= 50) return "#EF9F27"
  return "#E24B4A"
}

function Gauge({ value, label, sublabel }: { value: number | null; label: string; sublabel: string }) {
  const R = 48
  const circumference = 2 * Math.PI * R
  const arcLength = circumference * 0.75
  const offset = value !== null ? arcLength * (1 - value / 100) : arcLength
  const color = gaugeColor(value)

  return (
    <div className="flex-1 flex flex-col items-center bg-card rounded-xl py-4 px-2">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60" cy="60" r={R} fill="none"
          stroke="var(--color-border-tertiary, rgba(0,0,0,0.1))"
          strokeWidth="8" strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset="0" transform="rotate(135 60 60)" strokeLinecap="round"
        />
        <circle
          cx="60" cy="60" r={R} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset} transform="rotate(135 60 60)" strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="60" y="54" textAnchor="middle" dominantBaseline="central"
          fontSize="26" fontWeight="500" fill="var(--color-text-primary, #fff)">
          {value !== null ? Math.round(value) : "—"}
        </text>
        <text x="60" y="76" textAnchor="middle"
          fontSize="12" fill="var(--color-text-secondary, #aaa)">
          {value !== null ? "%" : ""}
        </text>
      </svg>
      <span className="text-xs text-muted mt-1">{label}</span>
      <span className="text-[10px] text-muted/60">{sublabel}</span>
    </div>
  )
}

function StatCard({ label, value, unit, iso }: { label: string; value: number | null; unit: string; iso: string }) {
  return (
    <div className="bg-card rounded-lg p-3.5">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="text-xl font-medium text-foreground">
        {value !== null ? value : "—"}
        <span className="text-sm font-normal text-muted ml-1">{unit}</span>
      </div>
      <div className="text-[10px] text-muted/50 mt-0.5">{iso}</div>
    </div>
  )
}

export default function WorkerDashboard({ user }: { user: Colaborador }) {
  const [data, setData] = useState<KpiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKpis = useCallback(async () => {
    try {
      const res = await fetch(`/api/kpis/worker?colaborador_id=${user.id}`)
      if (!res.ok) throw new Error("Erro ao carregar KPIs")
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    fetchKpis()
    const interval = setInterval(fetchKpis, 60000)
    return () => clearInterval(interval)
  }, [fetchKpis])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-accent text-lg font-medium animate-pulse">A carregar KPIs...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="text-red-400 text-sm">{error || "Sem dados"}</div>
        <button onClick={fetchKpis} className="text-accent text-sm underline">Tentar novamente</button>
      </div>
    )
  }

  const { kpis, obra_actual } = data
  const progresso = obra_actual ? Math.round(obra_actual.progresso) : 0

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Section: Efficiency gauges */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted/60 mb-2">
          Eficiência ISO 22400
        </div>
        <div className="flex gap-3">
          <Gauge
            value={kpis.worker_efficiency.valor}
            label="Worker efficiency"
            sublabel="Estimado vs real"
          />
          <Gauge
            value={kpis.allocation_efficiency.valor}
            label="Allocation efficiency"
            sublabel="Tempo utilizado"
          />
        </div>
      </div>

      {/* Section: Activity stats */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted/60 mb-2">
          Actividade
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Horas semana"
            value={kpis.horas_semana.valor}
            unit="h"
            iso="Actual production time"
          />
          <StatCard
            label="Horas mês"
            value={kpis.horas_mes.valor}
            unit="h"
            iso="Actual production time"
          />
          <StatCard
            label="Fases semana"
            value={kpis.throughput_semana.valor}
            unit="fases"
            iso="Throughput rate"
          />
          <StatCard
            label="Fases mês"
            value={kpis.throughput_mes.valor}
            unit="fases"
            iso="Throughput rate"
          />
        </div>
      </div>

      {/* Section: Current obra */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted/60 mb-2">
          Obra actual
        </div>
        {obra_actual ? (
          <div className="bg-card rounded-xl p-4">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-medium text-foreground">{obra_actual.descricao}</span>
              <span className="text-xs text-muted">{obra_actual.chassis}</span>
            </div>
            {obra_actual.fase_actual && (
              <div className="text-xs text-muted mb-3">
                Fase actual: {obra_actual.fase_actual}
              </div>
            )}
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progresso}%`,
                  backgroundColor: progresso >= 80 ? "#1D9E75" : progresso >= 40 ? "#378ADD" : "var(--color-text-secondary)",
                }}
              />
            </div>
            <div className="text-[11px] text-muted text-right mt-1.5">
              {obra_actual.fases_concluidas} / {obra_actual.total_fases} fases ({progresso}%)
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl p-4 text-center">
            <div className="text-sm text-muted">Nenhuma obra em curso</div>
          </div>
        )}
      </div>

      {/* Footer: last update */}
      <div className="text-[10px] text-muted/40 text-center pb-2">
        Período: semana {data.periodo.semana_inicio} · mês {data.periodo.mes}
      </div>
    </div>
  )
}
