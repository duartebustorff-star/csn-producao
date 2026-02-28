"use client"

import { useState, useEffect } from "react"
import type { Lead, Obra, FaseObra } from "@/lib/types"

const ESTADO_LEAD: Record<string, { label: string; color: string }> = {
  proposta: { label: "Proposta", color: "bg-blue-500/20 text-blue-400" },
  ganha: { label: "Ganha", color: "bg-success/20 text-success" },
  perdida: { label: "Perdida", color: "bg-danger/20 text-danger" },
  cancelada: { label: "Cancelada", color: "bg-muted/20 text-muted" },
}

export default function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads")
      const data = await res.json()
      setLeads(data.leads || [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><span className="text-muted text-sm">A carregar...</span></div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">CRM / Leads</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {leads.length === 0 ? (
          <p className="text-center text-muted text-sm py-12">Sem leads</p>
        ) : (
          leads.map((lead) => {
            const obras = (lead.obras || []) as Obra[]
            const estadoBadge = ESTADO_LEAD[lead.estado] || ESTADO_LEAD.proposta
            const totalProgresso = obras.length > 0
              ? Math.round(
                  obras.reduce((sum, obra) => {
                    const fases = obra.fases_obra || []
                    const done = fases.filter((f: FaseObra) => f.estado === "concluido").length
                    return sum + (fases.length > 0 ? (done / fases.length) * 100 : 0)
                  }, 0) / obras.length
                )
              : 0

            return (
              <div key={lead.id} className="bg-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                  className="w-full px-4 py-3 text-left hover:bg-card-hover transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-foreground">{lead.id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${estadoBadge.color}`}>
                        {estadoBadge.label}
                      </span>
                    </div>
                    <span className="text-xs text-muted">{expanded === lead.id ? "▲" : "▼"}</span>
                  </div>
                  <p className="text-xs text-muted">{lead.cliente}{lead.cliente_final ? ` → ${lead.cliente_final}` : ""}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                    <span>{lead.tipo_carrocaria}{lead.tipo_taipais ? ` + ${lead.tipo_taipais}` : ""}</span>
                    <span>{lead.veiculo_marca} {lead.veiculo_modelo}</span>
                    <span className="ml-auto font-mono text-accent">{lead.quantidade}x</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${totalProgresso}%`, background: "linear-gradient(90deg, #e8930b, #f0a832)" }}
                    />
                  </div>
                  <p className="text-right text-[10px] text-muted mt-0.5">{totalProgresso}% · {obras.length} obras</p>
                </button>

                {/* Expanded: obras list */}
                {expanded === lead.id && (
                  <div className="px-4 pb-3 space-y-2">
                    {lead.dimensoes && (
                      <p className="text-xs text-muted">Dimensões: <span className="text-foreground font-mono">{lead.dimensoes}</span></p>
                    )}
                    {lead.valor_unitario && (
                      <p className="text-xs text-muted">Valor unit.: <span className="text-foreground font-mono">{lead.valor_unitario}€</span></p>
                    )}
                    {lead.num_homologacao && (
                      <p className="text-xs text-muted">Homologação: <span className="text-foreground font-mono">{lead.num_homologacao}</span></p>
                    )}
                    {lead.notas_encomenda && lead.notas_encomenda.length > 0 && (
                      <p className="text-xs text-muted">NE: <span className="text-foreground font-mono">{lead.notas_encomenda.join(", ")}</span></p>
                    )}

                    <h4 className="text-xs text-muted uppercase tracking-wider mt-2">Obras</h4>
                    {obras.map((obra) => {
                      const fases = obra.fases_obra || []
                      const done = fases.filter((f: FaseObra) => f.estado === "concluido").length
                      const pct = fases.length > 0 ? Math.round((done / fases.length) * 100) : 0
                      return (
                        <div key={obra.id} className="bg-background rounded-lg px-3 py-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-medium text-foreground">{obra.id}</span>
                            <span className="font-mono text-accent">{pct}%</span>
                          </div>
                          <div className="flex gap-3 text-muted mt-0.5">
                            {obra.vin && <span>...{obra.vin.slice(-6)}</span>}
                            {obra.lugar_parque && <span>P{obra.lugar_parque}</span>}
                            <span>{obra.estado}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
