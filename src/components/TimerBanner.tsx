"use client"

import { useState, useEffect, useCallback } from "react"
import { t, type Lang } from "@/lib/translations"

interface TimerData {
  id: number
  inicio: string
  fases_obra?: { nome: string; obra_id: string; fase_numero: number }
}

export default function TimerBanner({
  colaboradorId,
  lang,
}: {
  colaboradorId: string
  lang: Lang
}) {
  const [timer, setTimer] = useState<TimerData | null>(null)
  const [elapsed, setElapsed] = useState("")

  const fetchTimer = useCallback(async () => {
    try {
      const res = await fetch(`/api/timer?colaborador_id=${colaboradorId}`)
      const data = await res.json()
      setTimer(data.timer || null)
    } catch {
      /* ignore */
    }
  }, [colaboradorId])

  useEffect(() => {
    fetchTimer()
    const interval = setInterval(fetchTimer, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [fetchTimer])

  // Update elapsed time display
  useEffect(() => {
    if (!timer) {
      setElapsed("")
      return
    }

    const update = () => {
      const start = new Date(timer.inicio).getTime()
      const now = Date.now()
      const diff = Math.floor((now - start) / 1000)
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
  }, [timer])

  const handleStop = async () => {
    try {
      await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colaborador_id: colaboradorId, action: "stop" }),
      })
      setTimer(null)
    } catch {
      /* ignore */
    }
  }

  if (!timer) return null

  const fase = timer.fases_obra

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-accent/10 border-b border-accent/20">
      <div className="flex items-center gap-2 text-sm">
        <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
        <span className="text-accent font-medium font-mono">{elapsed}</span>
        {fase && (
          <span className="text-muted text-xs">
            {fase.obra_id} · {fase.nome}
          </span>
        )}
      </div>
      <button
        onClick={handleStop}
        className="text-xs bg-danger/20 text-danger hover:bg-danger/30 px-3 py-1 rounded-full transition-colors"
      >
        {t(lang, "parar")}
      </button>
    </div>
  )
}
