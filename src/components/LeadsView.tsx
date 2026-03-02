"use client"

import { useState, useEffect, useCallback } from "react"
import type { Lead, Obra, FaseObra } from "@/lib/types"

const ESTADO_LEAD_FALLBACK = { label: "Desconhecido", color: "bg-border text-muted" }

const ESTADO_LEAD: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo", color: "bg-blue-500/20 text-blue-400" },
  em_orcamentacao: { label: "Em orçamentação", color: "bg-yellow-500/20 text-yellow-400" },
  proposta_enviada: { label: "Proposta enviada", color: "bg-orange-500/20 text-orange-400" },
  fechado: { label: "Fechado", color: "bg-success/20 text-success" },
  perdido: { label: "Perdido", color: "bg-danger/20 text-danger" },
  em_preparacao: { label: "Em preparação", color: "bg-purple-500/20 text-purple-400" },
  em_obra: { label: "Em obra", color: "bg-emerald-700/20 text-emerald-500" },
  // Legacy states
  proposta: { label: "Proposta", color: "bg-blue-500/20 text-blue-400" },
  ganha: { label: "Ganha", color: "bg-success/20 text-success" },
  perdida: { label: "Perdida", color: "bg-danger/20 text-danger" },
  cancelada: { label: "Cancelada", color: "bg-border text-muted" },
}

const ESTADOS_COM_DADOS_TECNICOS = ["em_preparacao", "em_obra"]

export default function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads")
      const data = await res.json()
      setLeads(data.leads || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

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
            const estadoBadge = ESTADO_LEAD[lead.estado] || ESTADO_LEAD_FALLBACK
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

                {/* Expanded */}
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

                    {/* Dados técnicos (só em_preparacao ou em_obra) */}
                    {ESTADOS_COM_DADOS_TECNICOS.includes(lead.estado) && (
                      <DadosTecnicos lead={lead} onUpdate={fetchLeads} />
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

function DadosTecnicos({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
  const [saving, setSaving] = useState(false)
  const [plataforma, setPlataforma] = useState(lead.plataforma_elevatoria ?? false)
  const [grua, setGrua] = useState(lead.grua_coluna ?? false)
  const [distEixos, setDistEixos] = useState(lead.distancia_entre_eixos)
  const [distFrontalFrente, setDistFrontalFrente] = useState(lead.dist_eixo_frontal_frente)
  const [distTraseiroRet, setDistTraseiroRet] = useState(lead.dist_eixo_traseiro_retaguarda)
  const [distFrontalCabine, setDistFrontalCabine] = useState(lead.dist_eixo_frontal_traseira_cabine)
  const [larguraCab, setLarguraCab] = useState(lead.largura_cabine)
  const [distTopoChassi, setDistTopoChassi] = useState(lead.dist_topo_chassi_topo_cabine)

  const hasChanges =
    plataforma !== (lead.plataforma_elevatoria ?? false) ||
    grua !== (lead.grua_coluna ?? false) ||
    distEixos !== lead.distancia_entre_eixos ||
    distFrontalFrente !== lead.dist_eixo_frontal_frente ||
    distTraseiroRet !== lead.dist_eixo_traseiro_retaguarda ||
    distFrontalCabine !== lead.dist_eixo_frontal_traseira_cabine ||
    larguraCab !== lead.largura_cabine ||
    distTopoChassi !== lead.dist_topo_chassi_topo_cabine

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plataforma_elevatoria: plataforma,
          grua_coluna: grua,
          distancia_entre_eixos: distEixos,
          dist_eixo_frontal_frente: distFrontalFrente,
          dist_eixo_traseiro_retaguarda: distTraseiroRet,
          dist_eixo_frontal_traseira_cabine: distFrontalCabine,
          largura_cabine: larguraCab,
          dist_topo_chassi_topo_cabine: distTopoChassi,
        }),
      })
      onUpdate()
    } catch { /* ignore */ }
    setSaving(false)
  }

  const numInput = (
    label: string,
    value: number | null,
    onChange: (v: number | null) => void
  ) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="w-20 bg-background border border-border rounded px-2 py-1 text-xs font-mono text-foreground text-right"
          placeholder="—"
        />
        <span className="text-[10px] text-muted">mm</span>
      </div>
    </div>
  )

  return (
    <div className="mt-2 space-y-2">
      <h4 className="text-xs text-muted uppercase tracking-wider">Dados técnicos</h4>

      {/* Tipo de trabalho */}
      <div className="bg-background rounded-lg p-3 space-y-2">
        <p className="text-[10px] text-muted uppercase tracking-wider">Tipo de trabalho</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Carroçaria</span>
          <span className="text-xs font-mono text-foreground">{lead.tipo_carrocaria}</span>
        </div>
        <Toggle label="Plataforma elevatória" value={plataforma} onChange={setPlataforma} />
        <Toggle label="Grua coluna" value={grua} onChange={setGrua} />
      </div>

      {/* Eixo X */}
      <div className="bg-background rounded-lg p-3 space-y-2">
        <p className="text-[10px] text-muted uppercase tracking-wider">Eixo X (comprimento)</p>
        {numInput("Dist. entre eixos", distEixos, setDistEixos)}
        {numInput("Eixo frontal → frente", distFrontalFrente, setDistFrontalFrente)}
        {numInput("Eixo traseiro → retaguarda", distTraseiroRet, setDistTraseiroRet)}
        {numInput("Eixo frontal → traseira cabine", distFrontalCabine, setDistFrontalCabine)}
      </div>

      {/* Eixo Y */}
      <div className="bg-background rounded-lg p-3 space-y-2">
        <p className="text-[10px] text-muted uppercase tracking-wider">Eixo Y (largura)</p>
        {numInput("Largura cabine", larguraCab, setLarguraCab)}
      </div>

      {/* Eixo Z */}
      <div className="bg-background rounded-lg p-3 space-y-2">
        <p className="text-[10px] text-muted uppercase tracking-wider">Eixo Z (altura)</p>
        {numInput("Topo chassi → topo cabine", distTopoChassi, setDistTopoChassi)}
      </div>

      {/* Save button */}
      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {saving ? "A guardar..." : "Guardar dados técnicos"}
        </button>
      )}
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-colors relative ${value ? "bg-accent" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? "left-4" : "left-0.5"}`} />
      </button>
    </div>
  )
}
