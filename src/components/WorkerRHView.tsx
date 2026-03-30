"use client"

import { useState, useEffect, useCallback } from "react"
import type { Colaborador } from "@/lib/types"

interface Recibo {
  ano: number
  mes: number
  numero_recibo: string
  liquido: number
}

const MESES = ["", "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

export default function WorkerRHView({ user }: { user: Colaborador }) {
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [loading, setLoading] = useState(true)

  const loadRecibos = useCallback(async () => {
    if (!user.colaborador_rh_id) { setLoading(false); return }
    try {
      const res = await fetch(`/api/rh/recibos-lista?colaborador_rh_id=${user.colaborador_rh_id}`)
      const data = await res.json()
      setRecibos(data.recibos || [])
    } catch { /* */ }
    setLoading(false)
  }, [user.colaborador_rh_id])

  useEffect(() => {
    loadRecibos()
  }, [loadRecibos])

  const openRecibo = (r: Recibo) => {
    window.open(`/api/rh/recibo?colaborador_rh_id=${user.colaborador_rh_id}&ano=${r.ano}&mes=${r.mes}`, "_blank")
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6 pb-24">

        {/* ===== OS MEUS DOCUMENTOS ===== */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-1">Os meus documentos</h2>
          <p className="text-xs text-muted mb-3">Recibos de vencimento</p>

          {loading && <p className="text-muted text-sm">A carregar...</p>}
          {!loading && recibos.length === 0 && (
            <div className="rounded-xl bg-card p-4 text-center">
              <p className="text-muted text-sm">Sem recibos disponiveis</p>
            </div>
          )}
          <div className="space-y-1">
            {recibos.map((r) => (
              <button
                key={`${r.ano}-${r.mes}`}
                onClick={() => openRecibo(r)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-card hover:bg-card-hover transition-colors"
              >
                <p className="text-sm font-medium text-foreground">{MESES[r.mes]} {r.ano}</p>
                <span className="text-muted text-xs">Abrir PDF</span>
              </button>
            ))}
          </div>
        </section>

        <div className="border-t border-border" />

        {/* ===== DADOS PESSOAIS ===== */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-3">Dados pessoais</h2>
          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border mb-3">
              <span className="text-3xl">{user.avatar}</span>
              <div>
                <p className="font-medium text-foreground">{user.nome}</p>
                <p className="text-xs text-muted">{user.funcao}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-muted text-sm">Lingua</span>
                <span className="text-foreground text-sm font-medium">
                  {user.lang === "pt" ? "Portugues" : user.lang === "ua" ? "Ukrainska" : "English"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted text-sm">Estado</span>
                <span className="text-foreground text-sm font-medium">
                  {user.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
