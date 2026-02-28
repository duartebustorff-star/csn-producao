"use client"

import type { Obra, FaseObra } from "@/lib/types"
import FaseItem from "./FaseItem"

interface ObraWithDocs extends Obra {
  has_dav?: boolean
  has_fam?: boolean
}

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  espera_documentacao: { label: "Espera documentação", color: "text-yellow-400" },
  espera_projeto: { label: "Espera projeto", color: "text-blue-400" },
  espera_veiculo: { label: "Espera veículo", color: "text-purple-400" },
  veiculo_recebido: { label: "Veículo recebido", color: "text-cyan-400" },
  producao: { label: "Em produção", color: "text-accent" },
  concluida: { label: "Concluída", color: "text-success" },
  entregue: { label: "Entregue", color: "text-success" },
}

export default function ObraDetail({ obra, onClose }: { obra: ObraWithDocs; onClose: () => void }) {
  const fases = (obra.fases_obra || []).sort((a: FaseObra, b: FaseObra) => a.fase_numero - b.fase_numero)
  const concluidas = fases.filter((f: FaseObra) => f.estado === "concluido").length
  const total = fases.length
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0
  const totalHoras = fases.reduce((sum: number, f: FaseObra) => sum + (f.horas_reais || 0), 0)
  const estado = ESTADO_LABELS[obra.estado] || ESTADO_LABELS.espera_documentacao
  const lead = obra.leads

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onClose} className="text-muted hover:text-foreground transition-colors text-sm">←</button>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground font-mono text-sm">{obra.id}</h2>
          {lead && <p className="text-xs text-muted">{lead.cliente} · {lead.tipo_carrocaria}</p>}
        </div>
        <span className={`text-xs font-medium ${estado.color}`}>{estado.label}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Info card */}
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

          {/* Doc status */}
          <div className="flex gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${obra.has_dav ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}>
              {obra.has_dav ? "✅ DAV" : "❌ Falta DAV"}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${obra.has_fam ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}>
              {obra.has_fam ? "✅ FAM" : "❌ Falta FAM"}
            </span>
          </div>

          {/* Progress */}
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progresso}%`, background: "linear-gradient(90deg, #e8930b, #f0a832)" }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>{concluidas}/{total} fases</span>
            <span className="font-mono text-accent">{progresso}%</span>
          </div>
        </div>

        {/* Notas */}
        {obra.notas && (
          <div className="bg-accent/5 border border-accent/10 rounded-xl p-3">
            <p className="text-xs text-muted mb-1">Notas</p>
            <p className="text-sm text-foreground">{obra.notas}</p>
          </div>
        )}

        {/* Fases */}
        <div>
          <h3 className="text-xs text-muted uppercase tracking-wider mb-2 px-1">Fases</h3>
          <div className="space-y-1.5">
            {fases.map((fase: FaseObra) => (
              <FaseItem key={fase.id} fase={fase} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
