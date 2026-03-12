"use client"

import { useState, useEffect } from "react"
import type { Obra, FaseObra } from "@/lib/types"
import FaseItem from "./FaseItem"

interface ObraWithDocs extends Obra {
  has_dav?: boolean
  has_fam?: boolean
}

interface DossierDoc {
  tipo: string
  estado: string
  ficheiro_url: string | null
  concluido_em: string | null
}

const ESTADO_FALLBACK = { label: "Desconhecido", color: "text-muted" }

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  espera_documentacao: { label: "Espera documentação", color: "text-yellow-400" },
  espera_projeto: { label: "Espera projeto", color: "text-blue-400" },
  espera_veiculo: { label: "Espera veículo", color: "text-purple-400" },
  veiculo_recebido: { label: "Veículo recebido", color: "text-cyan-400" },
  producao: { label: "Em produção", color: "text-accent" },
  concluida: { label: "Concluída", color: "text-success" },
  entregue: { label: "Entregue", color: "text-success" },
}

const DOC_LABELS: Record<string, { label: string; icon: string }> = {
  dav: { label: "DAV", icon: "📋" },
  fam: { label: "FAM", icon: "📄" },
  inspecao: { label: "Inspeção", icon: "🔍" },
  termo_responsabilidade: { label: "Termo", icon: "📝" },
  checklist_entrega: { label: "Checklist", icon: "✅" },
  coc: { label: "COC", icon: "🏷️" },
}

const DOSSIER_ORDER = ["dav", "fam", "inspecao", "termo_responsabilidade", "checklist_entrega", "coc"]

export default function ObraDetail({ obra, onClose }: { obra: ObraWithDocs; onClose: () => void }) {
  const [dossier, setDossier] = useState<DossierDoc[]>([])
  const [loadingDossier, setLoadingDossier] = useState(true)
  const [activeTab, setActiveTab] = useState<"fases" | "dossier">("fases")

  const fases = (obra.fases_obra || []).sort((a: FaseObra, b: FaseObra) => a.fase_numero - b.fase_numero)
  const concluidas = fases.filter((f: FaseObra) => f.estado === "concluido").length
  const total = fases.length
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0
  const totalHoras = fases.reduce((sum: number, f: FaseObra) => sum + (f.horas_reais || 0), 0)
  const estado = ESTADO_LABELS[obra.estado] || ESTADO_FALLBACK
  const lead = obra.leads

  useEffect(() => {
    async function fetchDossier() {
      try {
        const res = await fetch(`/api/documentos/list?obra_id=${obra.id}`)
        const data = await res.json()
        setDossier(data.documentos || [])
      } catch {
        setDossier([])
      }
      setLoadingDossier(false)
    }
    fetchDossier()
  }, [obra.id])

  // Calcular progresso do dossier
  const docsOk = dossier.filter(d => d.estado === "ok").length
  const docsTotal = dossier.length
  const termoDoc = dossier.find(d => d.tipo === "termo_responsabilidade")

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onClose} className="text-muted hover:text-foreground transition-colors text-sm">←</button>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground font-mono text-sm">{obra.id}</h2>
          {lead && <p className="text-xs text-muted">{lead.cliente} · {lead.tipo_carrocaria}</p>}
        </div>
        <span className={`text-xs font-medium ${estado.color}`}>{estado.label}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Info card */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-card rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {obra.vin && (
                <div>
                  <span className="text-muted">VIN: </span>
                  <span className="font-mono text-foreground">{obra.vin}</span>
                </div>
              )}
              {obra.matricula && (
                <div>
                  <span className="text-muted">Matrícula: </span>
                  <span className="font-mono text-foreground">{obra.matricula}</span>
                </div>
              )}
              {obra.lugar_parque && (
                <div>
                  <span className="text-muted">Parque: </span>
                  <span className="font-mono text-foreground">Lugar {obra.lugar_parque}</span>
                </div>
              )}
              <div>
                <span className="text-muted">Horas: </span>
                <span className="font-mono text-foreground">{totalHoras}h</span>
              </div>
            </div>

            {/* Progress bar produção */}
            <div>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>Produção</span>
                <span className="font-mono text-accent">{concluidas}/{total} fases · {progresso}%</span>
              </div>
              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progresso}%`, background: "linear-gradient(90deg, #e8930b, #f0a832)" }}
                />
              </div>
            </div>

            {/* Progress bar dossier */}
            {!loadingDossier && docsTotal > 0 && (
              <div>
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>Dossier</span>
                  <span className="font-mono text-accent">{docsOk}/{docsTotal} docs</span>
                </div>
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((docsOk / docsTotal) * 100)}%`, background: "linear-gradient(90deg, #22c55e, #4ade80)" }}
                  />
                </div>
              </div>
            )}

            {/* Termo disponível — destaque */}
            {termoDoc?.estado === "ok" && termoDoc.ficheiro_url && (
              <a
                href={termoDoc.ficheiro_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-lg px-3 py-2 text-xs text-success hover:bg-success/20 transition-colors"
              >
                <span>📝</span>
                <span className="flex-1 font-medium">Termo de Responsabilidade</span>
                <span>↗ Download</span>
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-2">
          <button
            onClick={() => setActiveTab("fases")}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === "fases"
                ? "bg-accent text-background"
                : "bg-card text-muted hover:text-foreground"
            }`}
          >
            Fases de Produção
          </button>
          <button
            onClick={() => setActiveTab("dossier")}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === "dossier"
                ? "bg-accent text-background"
                : "bg-card text-muted hover:text-foreground"
            }`}
          >
            Dossier {docsOk > 0 && `(${docsOk}/${docsTotal})`}
          </button>
        </div>

        {/* Tab: Fases */}
        {activeTab === "fases" && (
          <div className="px-4 pb-4 space-y-4">
            {obra.notas && (
              <div className="bg-accent/5 border border-accent/10 rounded-xl p-3">
                <p className="text-xs text-muted mb-1">Notas</p>
                <p className="text-sm text-foreground">{obra.notas}</p>
              </div>
            )}
            <div className="space-y-1.5">
              {fases.map((fase: FaseObra) => (
                <FaseItem key={fase.id} fase={fase} />
              ))}
            </div>
          </div>
        )}

        {/* Tab: Dossier */}
        {activeTab === "dossier" && (
          <div className="px-4 pb-4 space-y-2">
            {loadingDossier ? (
              <div className="text-xs text-muted text-center py-8">A carregar dossier...</div>
            ) : dossier.length === 0 ? (
              <div className="text-xs text-muted text-center py-8">Sem documentos registados</div>
            ) : (
              DOSSIER_ORDER
                .map(tipo => dossier.find(d => d.tipo === tipo))
                .filter(Boolean)
                .map((doc) => {
                  const d = doc!
                  const info = DOC_LABELS[d.tipo] || { label: d.tipo, icon: "📄" }
                  const isOk = d.estado === "ok"
                  const hasFile = !!d.ficheiro_url

                  return (
                    <div
                      key={d.tipo}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 border ${
                        isOk
                          ? "bg-success/5 border-success/20"
                          : "bg-card border-border"
                      }`}
                    >
                      <span className="text-base">{info.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isOk ? "text-success" : "text-muted"}`}>
                          {info.label}
                        </p>
                        {d.concluido_em && (
                          <p className="text-xs text-muted">
                            {new Date(d.concluido_em).toLocaleDateString("pt-PT")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isOk ? (
                          <span className="text-xs text-success font-medium">✓ OK</span>
                        ) : (
                          <span className="text-xs text-muted">Pendente</span>
                        )}
                        {hasFile && (
                          <a
                            href={d.ficheiro_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-card border border-border rounded-lg px-2 py-1 text-muted hover:text-foreground hover:border-accent transition-colors"
                          >
                            ↗
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
