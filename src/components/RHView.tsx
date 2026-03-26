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

interface ColabRH {
  id: number
  nome_completo: string
  nif: string
  niss: string
  regime: string
  taxa_ss_trabalhador: number
  categoria_profissional: string
  tem_km_viatura: boolean
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("pt-PT")
  } catch {
    return dateStr
  }
}

// ============================================
// SUB-TAB: SALÁRIOS (Carolina)
// ============================================

function SalariosTab() {
  const [colabs, setColabs] = useState<ColabRH[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [selectedMes, setSelectedMes] = useState<Record<number, number>>({})
  const [selectedAno, setSelectedAno] = useState<Record<number, number>>({})
  const [selectedAnoDecl, setSelectedAnoDecl] = useState<Record<number, number>>({})

  useEffect(() => {
    fetch("/api/carolina/colaboradores")
      .then((r) => r.json())
      .then((data) => {
        setColabs(data)
        const defaults: Record<number, number> = {}
        const defaultsAno: Record<number, number> = {}
        const defaultsAnoDecl: Record<number, number> = {}
        for (const c of data) {
          defaults[c.id] = 2
          defaultsAno[c.id] = 2026
          defaultsAnoDecl[c.id] = 2025
        }
        setSelectedMes(defaults)
        setSelectedAno(defaultsAno)
        setSelectedAnoDecl(defaultsAnoDecl)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted text-sm">A carregar colaboradores...</p>
      </div>
    )
  }

  if (colabs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted text-sm">Sem colaboradores RH registados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {colabs.map((c) => {
        const isExpanded = expandedId === c.id
        const mes = selectedMes[c.id] || 1
        const ano = selectedAno[c.id] || 2026
        const anoDecl = selectedAnoDecl[c.id] || 2025

        return (
          <div key={c.id} className="bg-card rounded-xl overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : c.id)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-card-hover transition-colors"
            >
              <span className="text-xl">💰</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{c.nome_completo}</p>
                <p className="text-xs text-muted">
                  NIF {c.nif} · {c.categoria_profissional || "Serralheiro civil"}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                c.regime === "reformado"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-success/20 text-success"
              }`}>
                {c.regime === "reformado" ? "Reformado" : "Normal"}
              </span>
              <span className="text-xs font-mono text-muted">SS {c.taxa_ss_trabalhador}%</span>
              <span className="text-muted text-xs">{isExpanded ? "▲" : "▼"}</span>
            </button>

            {/* Expanded: PDF actions */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {/* Info row */}
                <div className="bg-accent/5 border border-accent/10 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-muted">NISS: </span>
                      <span className="text-foreground font-mono">{c.niss}</span>
                    </div>
                    <div>
                      <span className="text-muted">Taxa SS: </span>
                      <span className="text-foreground font-mono">{c.taxa_ss_trabalhador}%</span>
                    </div>
                    <div>
                      <span className="text-muted">Regime: </span>
                      <span className="text-foreground">{c.regime === "reformado" ? "Reformado (pensionista)" : "Normal"}</span>
                    </div>
                    <div>
                      <span className="text-muted">KM viatura: </span>
                      <span className="text-foreground">{c.tem_km_viatura ? "Sim" : "Não"}</span>
                    </div>
                  </div>
                </div>

                {/* Recibo mensal */}
                <div className="bg-card-hover rounded-lg p-3">
                  <p className="text-xs font-semibold text-foreground mb-2">Recibo de Vencimento</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={mes}
                      onChange={(e) => setSelectedMes({ ...selectedMes, [c.id]: Number(e.target.value) })}
                      className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {MESES.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={ano}
                      onChange={(e) => setSelectedAno({ ...selectedAno, [c.id]: Number(e.target.value) })}
                      className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                    <button
                      onClick={() => {
                        window.open(
                          `/api/carolina/recibo?colaborador_rh_id=${c.id}&ano=${ano}&mes=${mes}`,
                          "_blank"
                        )
                      }}
                      className="ml-auto bg-accent hover:bg-accent/80 text-background font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Gerar Recibo PDF
                    </button>
                  </div>
                </div>

                {/* Declaração anual */}
                <div className="bg-card-hover rounded-lg p-3">
                  <p className="text-xs font-semibold text-foreground mb-2">Declaração Anual (Art. 119 CIRS)</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={anoDecl}
                      onChange={(e) => setSelectedAnoDecl({ ...selectedAnoDecl, [c.id]: Number(e.target.value) })}
                      className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                    <button
                      onClick={() => {
                        window.open(
                          `/api/carolina/declaracao-anual?colaborador_rh_id=${c.id}&ano=${anoDecl}`,
                          "_blank"
                        )
                      }}
                      className="ml-auto bg-foreground/10 hover:bg-foreground/20 text-foreground font-semibold text-xs px-3 py-1.5 rounded-lg border border-border transition-colors"
                    >
                      Gerar Declaração PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// MAIN: RHView com sub-tabs
// ============================================

export default function RHView({ user }: { user: Colaborador }) {
  const [data, setData] = useState<CapacidadeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedColab, setExpandedColab] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"equipa" | "salarios">("equipa")
  const isAdmin = user.role === "admin"

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/capacidade?user_id=${user.id}&role=${user.role}`)
      const json = await res.json()
      setData(json)
    } catch { /* ignore */ }
    setLoading(false)
  }, [user.id, user.role])

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

  const visibleColabs = isAdmin
    ? COLABORADORES_LIST
    : COLABORADORES_LIST.filter((c) => c.id === user.id)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Sub-tabs */}
      <div className="px-4 pt-3 pb-0 flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("equipa")}
          className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
            activeTab === "equipa"
              ? "bg-card text-accent border-b-2 border-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          Equipa
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("salarios")}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
              activeTab === "salarios"
                ? "bg-card text-accent border-b-2 border-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            Salários
          </button>
        )}
      </div>

      {/* Tab: Equipa (original RH content) */}
      {activeTab === "equipa" && (
        <>
          {/* Colaboradores */}
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground mb-3">Colaboradores</h2>
            <div className="space-y-2">
              {visibleColabs.map((c) => {
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
        </>
      )}

      {/* Tab: Salários (Carolina) */}
      {activeTab === "salarios" && isAdmin && (
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Gestão Salarial
            <span className="ml-2 text-xs text-muted font-normal">Carolina · Nível 4 ERP</span>
          </h2>
          <SalariosTab />
        </div>
      )}
    </div>
  )
}
