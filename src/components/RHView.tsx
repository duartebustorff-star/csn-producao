"use client"

import { useState, useEffect, useCallback } from "react"
import type { Colaborador, Ausencia } from "@/lib/types"

const COLABORADORES_LIST = [
  { id: "duarte", nome: "Duarte", funcao: "Gestor", avatar: "📋" },
  { id: "bohdan", nome: "Bohdan", funcao: "Operador", avatar: "⚙️" },
  { id: "joao", nome: "João António", funcao: "Operador", avatar: "🔧" },
  { id: "jose", nome: "José Julio", funcao: "Operador", avatar: "🎨" },
]

const TIPO_AUSENCIA_LABELS: Record<string, string> = {
  ferias: "Férias",
  baixa: "Baixa",
  falta_justificada: "Falta justificada",
  falta_injustificada: "Falta injustificada",
}

const TIPO_AUSENCIA_COLORS: Record<string, string> = {
  ferias: "bg-blue-500/20 text-blue-400",
  baixa: "bg-red-500/20 text-red-400",
  falta_justificada: "bg-yellow-500/20 text-yellow-400",
  falta_injustificada: "bg-orange-500/20 text-orange-400",
}

interface CapacidadeData {
  operadores?: Array<{
    id: string
    nome: string
    status: string
    horas_trabalhadas_semana: number
    horas_disponiveis_semana: number
    ferias_usadas: number
  }>
  ausencias_ativas?: Ausencia[]
  proximos_feriados?: Array<{ data: string; descricao: string }>
  semanal?: { horas_disponiveis: number; horas_trabalhadas: number }
  mensal?: { horas_disponiveis: number; horas_trabalhadas: number }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("pt-PT")
  } catch {
    return dateStr
  }
}

export default function RHView({ user }: { user: Colaborador }) {
  const [data, setData] = useState<CapacidadeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedColab, setExpandedColab] = useState<string | null>(null)
  const isAdmin = user.role === "admin"

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/capacidade")
      const json = await res.json()
      setData(json)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted text-sm">A carregar...</p>
      </div>
    )
  }

  const operadores = data?.operadores || []
  const ausenciasAtivas = data?.ausencias_ativas || []
  const feriados = data?.proximos_feriados || []

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Colaboradores */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-3">Colaboradores</h2>
        <div className="space-y-2">
          {COLABORADORES_LIST.map((c) => {
            const opData = operadores.find((o) => o.id === c.id)
            const colabAusencias = ausenciasAtivas.filter(
              (a) => a.colaborador_id === c.id
            )
            const isExpanded = expandedColab === c.id

            return (
              <div key={c.id} className="bg-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedColab(isExpanded ? null : c.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-card-hover transition-colors"
                >
                  <span className="text-xl">{c.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.nome}</p>
                    <p className="text-xs text-muted">{c.funcao}</p>
                  </div>
                  {opData && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      opData.status === "ativo"
                        ? "bg-success/20 text-success"
                        : opData.status === "baixa"
                        ? "bg-danger/20 text-danger"
                        : opData.status === "férias"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {opData.status}
                    </span>
                  )}
                  {colabAusencias.length > 0 && (
                    <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
                      {colabAusencias.length}
                    </span>
                  )}
                  <span className="text-muted text-xs">{isExpanded ? "▲" : "▼"}</span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2">
                    {/* Capacity info */}
                    {opData && (
                      <div className="bg-accent/5 border border-accent/10 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div>
                            <span className="text-muted">Horas/semana: </span>
                            <span className="text-foreground font-mono">
                              {opData.horas_trabalhadas_semana}h / {opData.horas_disponiveis_semana}h
                            </span>
                          </div>
                          <div>
                            <span className="text-muted">Férias usadas: </span>
                            <span className="text-foreground font-mono">
                              {opData.ferias_usadas} / 22 dias
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Active absences */}
                    {colabAusencias.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted font-medium">Ausências ativas</p>
                        {colabAusencias.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-2 text-xs bg-card-hover rounded-lg px-3 py-2"
                          >
                            <span className={`px-1.5 py-0.5 rounded-full ${TIPO_AUSENCIA_COLORS[a.tipo] || "bg-border text-muted"}`}>
                              {TIPO_AUSENCIA_LABELS[a.tipo] || a.tipo}
                            </span>
                            <span className="text-muted">
                              {formatDate(a.data_inicio)} → {formatDate(a.data_fim)}
                            </span>
                            {a.notas && (
                              <span className="text-muted truncate flex-1">— {a.notas}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Active absences summary */}
      {ausenciasAtivas.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Ausências ativas
            <span className="ml-2 text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
              {ausenciasAtivas.length}
            </span>
          </h2>
          <div className="space-y-1">
            {ausenciasAtivas.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 text-xs bg-card rounded-lg px-3 py-2"
              >
                <span className="text-foreground font-medium">
                  {COLABORADORES_LIST.find((c) => c.id === a.colaborador_id)?.nome || a.colaborador_id}
                </span>
                <span className={`px-1.5 py-0.5 rounded-full ${TIPO_AUSENCIA_COLORS[a.tipo] || "bg-border text-muted"}`}>
                  {TIPO_AUSENCIA_LABELS[a.tipo] || a.tipo}
                </span>
                <span className="text-muted">
                  {formatDate(a.data_inicio)} → {formatDate(a.data_fim)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming holidays */}
      {feriados.length > 0 && (
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground mb-3">Próximos feriados</h2>
          <div className="space-y-1">
            {feriados.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs bg-card rounded-lg px-3 py-2"
              >
                <span className="text-accent font-mono">{formatDate(f.data)}</span>
                <span className="text-foreground">{f.descricao}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
