"use client"

import { useState, useEffect, useCallback } from "react"
import type { Colaborador } from "@/lib/types"

interface Recibo {
  ano: number
  mes: number
  numero_recibo: string
  liquido: number
}

interface ContaCorrenteMes {
  ano: number
  mes: number
  devido: number
  pago: number
  saldo_mes: number
  saldo_acumulado: number
}

interface ContaCorrenteData {
  saldo_atual: number
  total_devido: number
  total_pago: number
  historico: ContaCorrenteMes[]
}

const MESES = ["", "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

export default function WorkerRHView({ user }: { user: Colaborador }) {
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [contaCorrente, setContaCorrente] = useState<ContaCorrenteData | null>(null)
  const [loadingConta, setLoadingConta] = useState(true)
  const [loading, setLoading] = useState(true)
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({})

  const formatEur = (v: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(v)

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

  useEffect(() => {
    const loadContaCorrente = async () => {
      if (!user.colaborador_rh_id) {
        setLoadingConta(false)
        return
      }
      try {
        const res = await fetch(`/api/rh/conta-corrente?colaborador_rh_id=${user.colaborador_rh_id}`)
        const data = await res.json()
        if (res.ok) {
          setContaCorrente(data)
        }
      } catch {
        // ignore
      } finally {
        setLoadingConta(false)
      }
    }

    loadContaCorrente()
  }, [user.colaborador_rh_id])

  const openRecibo = (r: Recibo) => {
    window.open(`/api/rh/recibo?colaborador_rh_id=${user.colaborador_rh_id}&ano=${r.ano}&mes=${r.mes}`, "_blank")
  }

  const openResumoAnual = (ano: number) => {
    window.open(`/api/rh/resumo-anual?colaborador_rh_id=${user.colaborador_rh_id}&ano=${ano}`, "_blank")
  }

  const recibosByYear = recibos.reduce<Record<number, Recibo[]>>((acc, r) => {
    if (!acc[r.ano]) acc[r.ano] = []
    acc[r.ano].push(r)
    return acc
  }, {})

  const anos = Object.keys(recibosByYear).map(Number).sort((a, b) => b - a)
  const isAnoCompleto = (ano: number) => {
    const meses = new Set(recibosByYear[ano]?.map((r) => r.mes) || [])
    return meses.size === 12
  }

  const totalAno = (ano: number) =>
    (recibosByYear[ano] || []).reduce((s, r) => s + Number(r.liquido || 0), 0)

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
          <div className="space-y-2">
            {anos.map((ano) => {
              const expanded = expandedYears[ano] ?? false
              const rows = (recibosByYear[ano] || []).slice().sort((a, b) => b.mes - a.mes)
              const anoCompleto = isAnoCompleto(ano)
              return (
                <div key={ano} className="rounded-xl bg-card p-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedYears((prev) => ({ ...prev, [ano]: !expanded }))}
                      className="flex-1 flex items-center justify-between px-2 py-2 rounded-lg hover:bg-card-hover transition-colors"
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">{ano}</p>
                        <p className="text-[11px] text-muted">
                          {rows.length} recibos · total {formatEur(totalAno(ano))}
                        </p>
                      </div>
                      <span className="text-xs text-muted">{expanded ? "▲" : "▼"}</span>
                    </button>
                    <button
                      onClick={() => openResumoAnual(ano)}
                      disabled={!anoCompleto}
                      className={`text-xs px-2.5 py-2 rounded-lg transition-colors ${
                        anoCompleto
                          ? "bg-accent/15 text-accent hover:bg-accent/25"
                          : "bg-background text-muted cursor-not-allowed"
                      }`}
                      title={anoCompleto ? "Gerar resumo anual PDF" : "Ano incompleto (faltam meses)"}
                    >
                      Resumo PDF
                    </button>
                  </div>

                  {expanded && (
                    <div className="mt-1 space-y-1">
                      {rows.map((r) => (
                        <button
                          key={`${r.ano}-${r.mes}`}
                          onClick={() => openRecibo(r)}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-background hover:bg-card-hover transition-colors"
                        >
                          <p className="text-sm text-foreground">{MESES[r.mes]}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-foreground">{formatEur(Number(r.liquido || 0))}</span>
                            <span className="text-muted text-xs">Abrir PDF</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <div className="border-t border-border" />

        {/* ===== CONTA CORRENTE ===== */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-1">Conta corrente</h2>
          <p className="text-xs text-muted mb-3">Recibos líquidos vs pagamentos por transferência</p>

          {loadingConta && <p className="text-muted text-sm">A carregar...</p>}

          {!loadingConta && !contaCorrente && (
            <div className="rounded-xl bg-card p-4 text-center">
              <p className="text-muted text-sm">Sem dados de conta corrente</p>
            </div>
          )}

          {!loadingConta && contaCorrente && (
            <div className="space-y-3">
              <div className="rounded-xl bg-card p-4">
                <p className="text-xs text-muted mb-1">Saldo actual</p>
                <p className={`text-xl font-semibold ${
                  contaCorrente.saldo_atual > 0 ? "text-amber-400" : contaCorrente.saldo_atual < 0 ? "text-emerald-400" : "text-foreground"
                }`}>
                  {formatEur(contaCorrente.saldo_atual)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-background p-2">
                    <p className="text-muted">Total devido</p>
                    <p className="text-foreground font-medium">{formatEur(contaCorrente.total_devido)}</p>
                  </div>
                  <div className="rounded-lg bg-background p-2">
                    <p className="text-muted">Total pago</p>
                    <p className="text-foreground font-medium">{formatEur(contaCorrente.total_pago)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-card p-2">
                <p className="px-2 pt-2 pb-1 text-xs text-muted">Histórico mensal</p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {contaCorrente.historico.map((m) => (
                    <div key={`${m.ano}-${m.mes}`} className="rounded-lg bg-background p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground">{MESES[m.mes]} {m.ano}</p>
                        <p className={`text-xs font-medium ${m.saldo_mes > 0 ? "text-amber-400" : m.saldo_mes < 0 ? "text-emerald-400" : "text-muted"}`}>
                          {formatEur(m.saldo_mes)}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <p className="text-muted">Devido</p>
                          <p className="text-foreground">{formatEur(m.devido)}</p>
                        </div>
                        <div>
                          <p className="text-muted">Pago</p>
                          <p className="text-foreground">{formatEur(m.pago)}</p>
                        </div>
                        <div>
                          <p className="text-muted">Acumulado</p>
                          <p className="text-foreground">{formatEur(m.saldo_acumulado)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {contaCorrente.historico.length === 0 && (
                    <p className="text-center text-xs text-muted py-4">Sem movimentos cruzados</p>
                  )}
                </div>
              </div>
            </div>
          )}
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
