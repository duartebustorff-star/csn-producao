"use client"

import { useState, useEffect, useCallback } from "react"
import type { Obra, FaseObra } from "@/lib/types"
import type { Lang } from "@/lib/translations"
import { t } from "@/lib/translations"
import ObraDetail from "./ObraDetail"

const ESTADO_FALLBACK = { label: "Desconhecido", color: "text-muted" }

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  espera_documentacao: { label: "Espera docs", color: "text-yellow-400" },
  espera_projeto: { label: "Espera projeto", color: "text-blue-400" },
  espera_veiculo: { label: "Espera veículo", color: "text-purple-400" },
  veiculo_recebido: { label: "Veículo recebido", color: "text-cyan-400" },
  producao: { label: "Produção", color: "text-accent" },
  concluida: { label: "Concluída", color: "text-success" },
  entregue: { label: "Entregue", color: "text-success" },
}

interface ObraWithDocs extends Obra {
  has_dav?: boolean
  has_fam?: boolean
}

export default function ObrasView({ lang }: { lang: Lang }) {
  const [obras, setObras] = useState<ObraWithDocs[]>([])
  const [selectedObra, setSelectedObra] = useState<ObraWithDocs | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("todas")

  const fetchObras = useCallback(async () => {
    try {
      const res = await fetch(`/api/obras?estado=${filter}`)
      const data = await res.json()
      setObras(data.obras || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchObras()
  }, [fetchObras])

  if (selectedObra) {
    return <ObraDetail obra={selectedObra} onClose={() => { setSelectedObra(null); fetchObras() }} />
  }

  // Group by lead
  const byLead = obras.reduce<Record<string, ObraWithDocs[]>>((acc, obra) => {
    const key = obra.lead_id || "sem_lead"
    if (!acc[key]) acc[key] = []
    acc[key].push(obra)
    return acc
  }, {})

  const filters = [
    { value: "todas", label: "Todas" },
    { value: "producao", label: "Produção" },
    { value: "espera_documentacao", label: "Espera docs" },
    { value: "concluida", label: t(lang, "obras_concluidas") },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setLoading(true) }}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
              filter === f.value ? "bg-accent text-white" : "bg-card text-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <p className="text-center text-muted text-sm py-12">{t(lang, "a_pensar")}</p>
        ) : Object.keys(byLead).length === 0 ? (
          <p className="text-center text-muted text-sm py-12">{t(lang, "sem_tarefas")}</p>
        ) : (
          Object.entries(byLead).map(([leadId, leadObras]) => {
            const firstObra = leadObras[0]
            const lead = firstObra.leads
            return (
              <div key={leadId} className="space-y-2">
                {/* Lead header */}
                <div className="flex items-center gap-2 px-1">
                  <span className="font-mono text-xs text-accent font-medium">{leadId}</span>
                  {lead && (
                    <>
                      <span className="text-xs text-muted">·</span>
                      <span className="text-xs text-muted">{lead.cliente}</span>
                      <span className="text-xs text-muted">·</span>
                      <span className="text-xs text-muted">{lead.tipo_carrocaria}</span>
                    </>
                  )}
                  <span className="text-xs text-muted ml-auto">{leadObras.length} obras</span>
                </div>
                {/* Obras */}
                {leadObras.map((obra) => (
                  <ObraCard key={obra.id} obra={obra} onClick={() => setSelectedObra(obra)} />
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ObraCard({ obra, onClick }: { obra: ObraWithDocs; onClick: () => void }) {
  const fases = obra.fases_obra || []
  const concluidas = fases.filter((f: FaseObra) => f.estado === "concluido").length
  const total = fases.length
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0
  const faseAtual = fases.find((f: FaseObra) => f.estado === "em_curso")
  const estado = ESTADO_LABELS[obra.estado] || ESTADO_FALLBACK

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card hover:bg-card-hover rounded-xl p-3 transition-colors space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-foreground">{obra.id}</span>
          <span className={`text-[10px] ${estado.color}`}>{estado.label}</span>
        </div>
        {/* Doc status */}
        <div className="flex gap-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${obra.has_dav ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}>
            DAV
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${obra.has_fam ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}>
            FAM
          </span>
        </div>
      </div>

      {/* VIN + Matrícula + Parque */}
      <div className="flex items-center gap-3 text-xs text-muted">
        {obra.vin && <span className="font-mono">VIN ...{obra.vin.slice(-6)}</span>}
        {obra.matricula && <span className="font-mono">{obra.matricula}</span>}
        {obra.lugar_parque && <span>P{obra.lugar_parque}</span>}
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 bg-background rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progresso}%`, background: "linear-gradient(90deg, #e8930b, #f0a832)" }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{concluidas}/{total} · {progresso}%</span>
            {faseAtual && <span className="text-accent">{faseAtual.nome}</span>}
          </div>
        </div>
      )}
    </button>
  )
}
