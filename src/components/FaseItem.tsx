"use client"

import type { FaseObra } from "@/lib/types"

const ESTADO_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  concluido: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  em_curso: { bg: "bg-accent/10", text: "text-accent", dot: "bg-accent pulse-dot" },
  pendente: { bg: "bg-card", text: "text-muted", dot: "bg-muted/40" },
}

export default function FaseItem({ fase }: { fase: FaseObra }) {
  const style = ESTADO_STYLES[fase.estado] || ESTADO_STYLES.pendente

  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${style.bg}`}>
      {/* Dot + número */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
        <span className="text-muted text-xs font-mono w-4">{fase.fase_numero}</span>
      </div>

      {/* Nome da fase */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${style.text}`}>{fase.nome}</p>
        {fase.notas && (
          <p className="text-xs text-muted mt-0.5 truncate">{fase.notas}</p>
        )}
      </div>

      {/* Responsável */}
      <span className="text-xs text-muted flex-shrink-0">
        {fase.responsavel || "—"}
      </span>

      {/* Horas */}
      <span className="text-xs font-mono text-muted flex-shrink-0 w-12 text-right">
        {fase.horas_reais > 0 ? `${fase.horas_reais}h` : "—"}
      </span>
    </div>
  )
}
