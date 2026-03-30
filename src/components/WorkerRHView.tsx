"use client"

import { useState, useEffect, useCallback } from "react"
import type { Colaborador } from "@/lib/types"

interface Recibo {
  ano: number
  mes: number
  numero_recibo: string
  liquido: number
}

interface Baixa {
  id: number
  data_inicio: string
  data_fim: string
  numero_dias: number
  tipo_cit: string
  created_at: string
}

const MESES = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export default function WorkerRHView({ user }: { user: Colaborador }) {
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [baixas, setBaixas] = useState<Baixa[]>([])
  const [loadingRecibos, setLoadingRecibos] = useState(true)
  const [loadingBaixas, setLoadingBaixas] = useState(true)

  const [showRecibos, setShowRecibos] = useState(true)
  const [showBaixas, setShowBaixas] = useState(false)
  const [showDados, setShowDados] = useState(false)

  const [citInicio, setCitInicio] = useState("")
  const [citFim, setCitFim] = useState("")
  const [citTipo, setCitTipo] = useState("inicial")
  const [citFile, setCitFile] = useState<File | null>(null)
  const [citMsg, setCitMsg] = useState("")
  const [citLoading, setCitLoading] = useState(false)

  const loadRecibos = useCallback(async () => {
    if (!user.colaborador_rh_id) { setLoadingRecibos(false); return }
    try {
      const res = await fetch(`/api/rh/recibos-lista?colaborador_rh_id=${user.colaborador_rh_id}`)
      const data = await res.json()
      setRecibos(data.recibos || [])
    } catch { /* */ }
    setLoadingRecibos(false)
  }, [user.colaborador_rh_id])

  const loadBaixas = useCallback(async () => {
    try {
      const res = await fetch(`/api/cits/lista?colaborador_id=${user.id}`)
      const data = await res.json()
      setBaixas(data.cits || [])
    } catch { /* */ }
    setLoadingBaixas(false)
  }, [user.id])

  useEffect(() => {
    loadRecibos()
    loadBaixas()
  }, [loadRecibos, loadBaixas])

  const submitCit = async () => {
    if (!citInicio || !citFim) return
    setCitLoading(true)
    setCitMsg("")
    try {
      const form = new FormData()
      if (citFile) form.append("file", citFile)
      form.append("colaborador_id", user.id)
      form.append("colaborador_rh_id", String(user.colaborador_rh_id || ""))
      form.append("nome", user.nome)
      form.append("data_inicio", citInicio)
      form.append("data_fim", citFim)
      form.append("tipo_cit", citTipo)
      const res = await fetch("/api/cits/upload", { method: "POST", body: form })
      const data = await res.json()
      if (res.ok) {
        setCitMsg(data.mensagem || "Baixa registada com sucesso")
        setCitInicio(""); setCitFim(""); setCitFile(null); setCitTipo("inicial")
        loadBaixas()
      } else {
        setCitMsg(data.error || "Erro ao submeter")
      }
    } catch { setCitMsg("Erro de ligacao") }
    setCitLoading(false)
  }

  const openRecibo = (r: Recibo) => {
    window.open(`/api/rh/recibo?colaborador_rh_id=${user.colaborador_rh_id}&ano=${r.ano}&mes=${r.mes}`, "_blank")
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-3">

        {/* ═══ OS MEUS DOCUMENTOS (Empresa → Colaborador) ═══ */}
        <button
          onClick={() => setShowRecibos(!showRecibos)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-card hover:bg-card-hover transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">&#8595;</span>
            <div className="text-left">
              <p className="font-medium text-foreground">Os meus documentos</p>
              <p className="text-xs text-muted">Recibos, declaracoes — consulta e download</p>
            </div>
          </div>
          <span className="text-muted text-sm">{showRecibos ? "\u25B2" : "\u25BC"}</span>
        </button>

        {showRecibos && (
          <div className="space-y-2 pl-2">
            <p className="text-xs text-muted uppercase tracking-wider px-2 pt-2">Recibos de vencimento</p>
            {loadingRecibos && <p className="text-muted text-sm px-2">A carregar...</p>}
            {!loadingRecibos && recibos.length === 0 && (
              <p className="text-muted text-sm px-2">Sem recibos disponiveis</p>
            )}
            {recibos.map((r) => (
              <button
                key={`${r.ano}-${r.mes}`}
                onClick={() => openRecibo(r)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-background hover:bg-card transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{MESES[r.mes]} {r.ano}</p>
                  <p className="text-muted text-xs">{r.numero_recibo}</p>
                </div>
                <span className="text-accent font-bold text-sm">{Number(r.liquido).toFixed(2)}&euro;</span>
              </button>
            ))}
            <p className="text-xs text-muted uppercase tracking-wider px-2 pt-4">Declaracao anual IRS</p>
            <div className="p-3 rounded-lg bg-background">
              <p className="text-muted text-sm">Brevemente disponivel</p>
            </div>
          </div>
        )}

        {/* ═══ ENTREGAR DOCUMENTOS (Colaborador → Empresa) ═══ */}
        <button
          onClick={() => setShowBaixas(!showBaixas)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-card hover:bg-card-hover transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning text-sm font-bold">&#8593;</span>
            <div className="text-left">
              <p className="font-medium text-foreground">Entregar documentos</p>
              <p className="text-xs text-muted">Baixas, atestados — fotografar e submeter</p>
            </div>
          </div>
          <span className="text-muted text-sm">{showBaixas ? "\u25B2" : "\u25BC"}</span>
        </button>

        {showBaixas && (
          <div className="space-y-3 pl-2">
            <p className="text-xs text-muted uppercase tracking-wider px-2 pt-2">Registar baixa (CIT)</p>
            <div className="bg-background rounded-lg p-3 space-y-3">
              <select
                value={citTipo}
                onChange={(e) => setCitTipo(e.target.value)}
                className="w-full p-3 rounded-lg bg-card border border-border text-foreground text-sm"
              >
                <option value="inicial">Inicial</option>
                <option value="prorrogacao">Prorrogacao</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted">Inicio</label>
                  <input type="date" value={citInicio} onChange={(e) => setCitInicio(e.target.value)}
                    className="w-full p-3 rounded-lg bg-card border border-border text-foreground text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted">Fim</label>
                  <input type="date" value={citFim} onChange={(e) => setCitFim(e.target.value)}
                    className="w-full p-3 rounded-lg bg-card border border-border text-foreground text-sm" />
                </div>
              </div>
              <input type="file" accept="image/*,application/pdf" capture="environment"
                onChange={(e) => setCitFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-border file:bg-card file:text-foreground file:text-sm" />
              <button onClick={submitCit} disabled={citLoading || !citInicio || !citFim}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
                  citLoading || !citInicio || !citFim
                    ? "bg-card text-muted" : "bg-accent text-white hover:bg-accent/80 active:scale-[0.98]"
                }`}>
                {citLoading ? "A enviar..." : "Submeter baixa"}
              </button>
              {citMsg && (
                <p className={`text-sm ${citMsg.includes("Erro") ? "text-danger" : "text-success"}`}>{citMsg}</p>
              )}
            </div>

            {!loadingBaixas && baixas.length > 0 && (
              <>
                <p className="text-xs text-muted uppercase tracking-wider px-2 pt-2">Historico de baixas</p>
                {baixas.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-background">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {b.tipo_cit === "prorrogacao" ? "Prorrogacao" : "Inicial"}
                      </p>
                      <p className="text-muted text-xs">{b.data_inicio} &rarr; {b.data_fim}</p>
                    </div>
                    <span className="text-sm text-muted">{b.numero_dias} dias</span>
                  </div>
                ))}
              </>
            )}

            <p className="text-xs text-muted uppercase tracking-wider px-2 pt-4">Atestados e certificados</p>
            <div className="p-3 rounded-lg bg-background">
              <p className="text-muted text-sm">Brevemente disponivel</p>
            </div>
          </div>
        )}

        {/* ═══ DADOS PESSOAIS ═══ */}
        <button
          onClick={() => setShowDados(!showDados)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-card hover:bg-card-hover transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-card-hover flex items-center justify-center text-muted text-sm font-bold">&#9881;</span>
            <div className="text-left">
              <p className="font-medium text-foreground">Dados pessoais</p>
              <p className="text-xs text-muted">Nome, categoria, estado</p>
            </div>
          </div>
          <span className="text-muted text-sm">{showDados ? "\u25B2" : "\u25BC"}</span>
        </button>

        {showDados && (
          <div className="bg-background rounded-lg p-4 space-y-3 ml-2">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <span className="text-3xl">{user.avatar}</span>
              <div>
                <p className="font-medium text-foreground">{user.nome}</p>
                <p className="text-muted text-xs">{user.funcao}</p>
              </div>
            </div>
            <DataRow label="Lingua" value={user.lang === "pt" ? "Portugues" : user.lang === "ua" ? "Ukrainska" : "English"} />
            <DataRow label="Estado" value={user.ativo ? "Ativo" : "Inativo"} />
          </div>
        )}

      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-muted text-sm">{label}</span>
      <span className="text-foreground text-sm font-medium">{value}</span>
    </div>
  )
}
