"use client"

import { useState, useEffect, useCallback } from "react"

interface Session {
  colaborador_rh_id: number
  colaborador_id: string
  nome: string
  categoria: string
}

interface Timer {
  id: string
  obra_id: string
  fase_obra_id: string
  inicio: string
  fases_obra: { nome: string; obra_id: string; fase_numero: number }
}

interface Fase {
  id: string
  nome: string
  estado: string
  fase_numero: number
  horas_reais: number
}

interface Obra {
  id: string
  numero_obra: string
  estado: string
  vin: string
  fases_obra: Fase[]
  leads: { cliente: string; tipo_carrocaria: string; veiculo_marca: string; veiculo_modelo: string } | null
}

interface Recibo {
  ano: number
  mes: number
  liquido: number
  numero_recibo: string
}

const MESES = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

type Screen = "doors" | "fernando" | "carolina"
type FernandoTab = "ponto" | "obras"
type CarolinaTab = "recibos" | "baixas" | "dados"

export default function PortalTrabalhador() {
  const [session, setSession] = useState<Session | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [screen, setScreen] = useState<Screen>("doors")
  const [fernandoTab, setFernandoTab] = useState<FernandoTab>("ponto")
  const [carolinaTab, setCarolinaTab] = useState<CarolinaTab>("recibos")

  const [timer, setTimer] = useState<Timer | null>(null)
  const [obras, setObras] = useState<Obra[]>([])
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null)
  const [elapsed, setElapsed] = useState(0)

  // CIT form
  const [citInicio, setCitInicio] = useState("")
  const [citFim, setCitFim] = useState("")
  const [citTipo, setCitTipo] = useState("inicial")
  const [citFile, setCitFile] = useState<File | null>(null)
  const [citMsg, setCitMsg] = useState("")
  const [citLoading, setCitLoading] = useState(false)
  const [baixas, setBaixas] = useState<{id: number; data_inicio: string; data_fim: string; numero_dias: number; tipo_cit: string; created_at: string}[]>([])

  const handleLogin = async () => {
    if (pin.length !== 4) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erro"); return }
      setSession(data)
    } catch { setError("Erro de ligacao") }
    finally { setLoading(false) }
  }

  const loadTimer = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch(`/api/timer?colaborador_id=${session.colaborador_id}`)
      const data = await res.json()
      setTimer(data.timer || null)
    } catch { /* */ }
  }, [session])

  const loadObras = useCallback(async () => {
    try {
      const res = await fetch("/api/obras")
      const data = await res.json()
      setObras(data.obras || [])
    } catch { /* */ }
  }, [])

  const loadRecibos = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch(`/api/rh/recibos-lista?colaborador_rh_id=${session.colaborador_rh_id}`)
      const data = await res.json()
      setRecibos(data.recibos || [])
    } catch { /* */ }
  }, [session])

  const loadBaixas = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch(`/api/cits/lista?colaborador_id=${session.colaborador_id}`)
      const data = await res.json()
      setBaixas(data.cits || [])
    } catch { /* */ }
  }, [session])

  const submitCit = async () => {
    if (!session || !citInicio || !citFim) return
    setCitLoading(true)
    setCitMsg("")
    try {
      const form = new FormData()
      if (citFile) form.append("file", citFile)
      form.append("colaborador_id", session.colaborador_id)
      form.append("colaborador_rh_id", String(session.colaborador_rh_id))
      form.append("nome", session.nome)
      form.append("data_inicio", citInicio)
      form.append("data_fim", citFim)
      form.append("tipo_cit", citTipo)
      const res = await fetch("/api/cits/upload", { method: "POST", body: form })
      const data = await res.json()
      if (res.ok) {
        setCitMsg(data.mensagem || "Baixa registada")
        setCitInicio(""); setCitFim(""); setCitFile(null); setCitTipo("inicial")
        loadBaixas()
      } else {
        setCitMsg(data.error || "Erro ao submeter")
      }
    } catch { setCitMsg("Erro de ligacao") }
    setCitLoading(false)
  }

  useEffect(() => {
    if (session) { loadTimer(); loadObras() }
  }, [session, loadTimer, loadObras])

  useEffect(() => {
    if (!timer) { setElapsed(0); return }
    const calc = () => setElapsed(Math.floor((Date.now() - new Date(timer.inicio).getTime()) / 1000))
    calc()
    const i = setInterval(calc, 1000)
    return () => clearInterval(i)
  }, [timer])

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const startTimer = async (obraId: string, faseId: string) => {
    if (!session) return
    setLoading(true)
    try {
      await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colaborador_id: session.colaborador_id, action: "start", obra_id: obraId, fase_id: faseId }),
      })
      await loadTimer()
      setSelectedObra(null)
      setFernandoTab("ponto")
    } catch { /* */ }
    setLoading(false)
  }

  const stopTimer = async () => {
    if (!session) return
    setLoading(true)
    try {
      await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colaborador_id: session.colaborador_id, action: "stop" }),
      })
      setTimer(null)
      await loadObras()
    } catch { /* */ }
    setLoading(false)
  }

  const addDigit = (d: string) => { if (pin.length < 4) setPin(pin + d) }
  const clearPin = () => { setPin(""); setError("") }
  const logout = () => { setSession(null); setPin(""); setTimer(null); setScreen("doors") }
  const goBack = () => { setScreen("doors"); setSelectedObra(null) }

  // ========== LOGIN ==========
  if (!session) {
    return (
      <div className="portal-root portal-center">
        <style>{globalCSS}</style>
        <div className="login-card">
          <div className="logo">CSN</div>
          <div className="login-sub">PORTAL TRABALHADOR</div>
          <div className="pin-dots">
            {[0,1,2,3].map(i => <div key={i} className={`pin-dot ${pin.length > i ? "active" : ""}`} />)}
          </div>
          {error && <div className="error">{error}</div>}
          <div className="numpad">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} className="num-btn" onClick={() => addDigit(String(n))}>{n}</button>
            ))}
            <button className="num-btn" onClick={clearPin}>C</button>
            <button className="num-btn" onClick={() => addDigit("0")}>0</button>
            <button className={`num-btn ${pin.length === 4 ? "num-ok" : ""}`} onClick={handleLogin} disabled={pin.length !== 4 || loading}>
              {loading ? "..." : "OK"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========== DOORS ==========
  if (screen === "doors") {
    return (
      <div className="portal-root">
        <style>{globalCSS}</style>
        <div className="header">
          <div className="header-info">
            <span className="header-name">{session.nome.split(" ")[0]}</span>
            <span className="header-cat">{session.categoria || "Serralheiro"}</span>
          </div>
          <button className="btn-outline" onClick={logout}>Sair</button>
        </div>
        {timer && (
          <div className="timer-banner">
            <div><div className="timer-label">EM TRABALHO</div><div className="timer-fase">{timer.fases_obra?.nome}</div></div>
            <div className="timer-right">
              <span className="timer-clock">{fmt(elapsed)}</span>
              <button className="btn-stop" onClick={stopTimer} disabled={loading}>SAIDA</button>
            </div>
          </div>
        )}
        <div className="doors">
          <button className="door door-fernando" onClick={() => { setScreen("fernando"); setFernandoTab("ponto") }}>
            <div className="door-icon">P</div>
            <div className="door-name">Producao</div>
            <div className="door-desc">Ponto · Obras · Fases</div>
            <div className="door-items">L3-PRD</div>
          </button>
          <button className="door door-carolina" onClick={() => { setScreen("carolina"); setCarolinaTab("recibos"); loadRecibos() }}>
            <div className="door-icon">RH</div>
            <div className="door-name">RH</div>
            <div className="door-desc">Recibos · Baixas · Dados</div>
            <div className="door-items">L3-RH</div>
          </button>
        </div>
      </div>
    )
  }

  // ========== FERNANDO ==========
  if (screen === "fernando") {
    const obrasProducao = obras.filter(o => o.estado === "producao")
    return (
      <div className="portal-root">
        <style>{globalCSS}</style>
        <div className="header">
          <button className="btn-back" onClick={goBack}>&#8592;</button>
          <div className="header-info">
            <span className="header-name">Producao</span>
            <span className="header-cat">L3-PRD</span>
          </div>
          <button className="btn-outline" onClick={logout}>Sair</button>
        </div>
        {timer && (
          <div className="timer-banner">
            <div><div className="timer-label">EM TRABALHO</div><div className="timer-fase">{timer.fases_obra?.nome}</div></div>
            <div className="timer-right">
              <span className="timer-clock">{fmt(elapsed)}</span>
              <button className="btn-stop" onClick={stopTimer} disabled={loading}>SAIDA</button>
            </div>
          </div>
        )}
        <div className="tabs">
          <button className={`tab ${fernandoTab === "ponto" ? "tab-active" : ""}`} onClick={() => setFernandoTab("ponto")}>Ponto</button>
          <button className={`tab ${fernandoTab === "obras" ? "tab-active" : ""}`} onClick={() => setFernandoTab("obras")}>Obras</button>
        </div>
        <div className="content">
          {fernandoTab === "ponto" && !timer && (
            <div>
              <div className="section-title">Iniciar trabalho</div>
              <div className="section-sub">Selecciona obra e fase</div>
              {obrasProducao.length === 0 ? <div className="empty">Sem obras em producao</div> : (
                obrasProducao.map(obra => (
                  <div key={obra.id} className="card" onClick={() => setSelectedObra(selectedObra?.id === obra.id ? null : obra)}>
                    <div className="card-row"><span className="card-num">{obra.numero_obra}</span><span className="card-sub">{obra.leads?.cliente}</span></div>
                    <div className="card-detail">{obra.leads?.veiculo_marca} {obra.leads?.veiculo_modelo} — {obra.leads?.tipo_carrocaria}</div>
                    {selectedObra?.id === obra.id && (
                      <div className="fase-list">
                        {obra.fases_obra.filter(f => f.estado === "pendente" || f.estado === "em_curso").sort((a,b) => a.fase_numero - b.fase_numero).map(fase => (
                          <button key={fase.id} className="fase-btn" onClick={e => { e.stopPropagation(); startTimer(obra.id, fase.id) }} disabled={loading}>
                            <span>F{fase.fase_numero} — {fase.nome}</span><span className="fase-h">{(fase.horas_reais||0).toFixed(1)}h</span>
                          </button>
                        ))}
                        {obra.fases_obra.filter(f => f.estado === "pendente" || f.estado === "em_curso").length === 0 && <div className="empty">Sem fases disponiveis</div>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          {fernandoTab === "ponto" && timer && (
            <div className="timer-big-section">
              <div className="timer-big">{fmt(elapsed)}</div>
              <div className="timer-big-detail">
                Fase: {timer.fases_obra?.nome}<br/>
                Inicio: {new Date(timer.inicio).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          )}
          {fernandoTab === "obras" && (
            <div>
              <div className="section-title">Todas as obras</div>
              {obras.map(obra => {
                const total = obra.fases_obra.length
                const done = obra.fases_obra.filter(f => f.estado === "concluido").length
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <div key={obra.id} className="card">
                    <div className="card-row"><span className="card-num">{obra.numero_obra}</span><span className="card-pct">{pct}%</span></div>
                    <div className="card-detail">{obra.leads?.cliente} — {obra.leads?.tipo_carrocaria} — {obra.estado}</div>
                    <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ========== CAROLINA ==========
  return (
    <div className="portal-root">
      <style>{globalCSS}</style>
      <div className="header">
        <button className="btn-back" onClick={goBack}>&#8592;</button>
        <div className="header-info">
          <span className="header-name">Recursos Humanos</span>
          <span className="header-cat">L3-RH</span>
        </div>
        <button className="btn-outline" onClick={logout}>Sair</button>
      </div>
      <div className="tabs">
        <button className={`tab ${carolinaTab === "recibos" ? "tab-active" : ""}`} onClick={() => { setCarolinaTab("recibos"); loadRecibos() }}>Recibos</button>
        <button className={`tab ${carolinaTab === "baixas" ? "tab-active" : ""}`} onClick={() => { setCarolinaTab("baixas"); loadBaixas() }}>Baixas</button>
        <button className={`tab ${carolinaTab === "dados" ? "tab-active" : ""}`} onClick={() => setCarolinaTab("dados")}>Dados</button>
      </div>
      <div className="content">
        {carolinaTab === "recibos" && (
          <div>
            <div className="section-title">Os meus recibos</div>
            {recibos.length === 0 ? <div className="empty">A carregar...</div> : (
              <div className="recibos-grid">
                {recibos.map((r, i) => (
                  <a key={i} href={`/api/rh/recibo?colaborador_rh_id=${session.colaborador_rh_id}&ano=${r.ano}&mes=${r.mes}`} target="_blank" rel="noreferrer" className="recibo-card">
                    <div className="recibo-left"><span className="recibo-mes">{MESES[r.mes]}</span><span className="recibo-ano">{r.ano}</span></div>
                    <div className="recibo-right"><span className="recibo-val">{Number(r.liquido).toFixed(2)}€</span><span className="recibo-num">#{r.numero_recibo}</span></div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
        {carolinaTab === "baixas" && (
          <div>
            <div className="section-title">Registar baixa</div>
            <div className="section-sub">Fotografa ou carrega o CIT</div>
            <div className="card">
              <div className="form-row">
                <label className="form-label">Tipo</label>
                <select className="form-input" value={citTipo} onChange={e => setCitTipo(e.target.value)}>
                  <option value="inicial">Inicial</option>
                  <option value="prorrogacao">Prorrogacao</option>
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Data inicio</label>
                <input className="form-input" type="date" value={citInicio} onChange={e => setCitInicio(e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Data fim</label>
                <input className="form-input" type="date" value={citFim} onChange={e => setCitFim(e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Foto / PDF</label>
                <input className="form-file" type="file" accept="image/*,application/pdf" capture="environment" onChange={e => setCitFile(e.target.files?.[0] || null)} />
              </div>
              <button className="btn-submit" onClick={submitCit} disabled={citLoading || !citInicio || !citFim}>
                {citLoading ? "A enviar..." : "Submeter baixa"}
              </button>
              {citMsg && <div className={`cit-msg ${citMsg.includes("Erro") ? "cit-err" : "cit-ok"}`}>{citMsg}</div>}
            </div>
            {baixas.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="section-title">Historico</div>
                {baixas.map(b => (
                  <div key={b.id} className="card">
                    <div className="card-row">
                      <span className="card-num">{b.tipo_cit === "prorrogacao" ? "Prorrogacao" : "Inicial"}</span>
                      <span className="card-sub">{b.numero_dias} dias</span>
                    </div>
                    <div className="card-detail">{b.data_inicio} → {b.data_fim}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {carolinaTab === "dados" && (
          <div>
            <div className="section-title">Os meus dados</div>
            <div className="card">
              <div className="data-row"><span className="data-label">Nome</span><span className="data-val">{session.nome}</span></div>
              <div className="data-row"><span className="data-label">Categoria</span><span className="data-val">{session.categoria || "Serralheiro civil"}</span></div>
              <div className="data-row"><span className="data-label">PIN Portal</span><span className="data-val">****</span></div>
            </div>
            <div className="empty" style={{ marginTop: 16 }}>Para alterar dados contactar administracao</div>
          </div>
        )}
      </div>
    </div>
  )
}

const globalCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .portal-root {
    min-height: 100vh; min-height: 100dvh;
    background: #0a0a0a; color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 900px; margin: 0 auto;
  }
  .portal-center { display: flex; align-items: center; justify-content: center; }

  /* LOGIN */
  .login-card { width: 100%; max-width: 320px; padding: 32px; text-align: center; }
  .logo { font-size: 52px; font-weight: 900; color: #F49311; letter-spacing: -3px; }
  .login-sub { font-size: 11px; color: #555; letter-spacing: 4px; margin-bottom: 32px; }
  .pin-dots { display: flex; justify-content: center; gap: 16px; margin-bottom: 24px; }
  .pin-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #333; transition: all 0.2s; }
  .pin-dot.active { background: #F49311; border-color: #F49311; }
  .error { color: #e74c3c; font-size: 13px; margin-bottom: 12px; }
  .numpad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .num-btn { height: 54px; border: none; border-radius: 12px; background: #1a1a1a; color: #fff; font-size: 22px; font-weight: 600; cursor: pointer; }
  .num-btn:active { background: #333; }
  .num-ok { background: #F49311 !important; color: #000 !important; }

  /* HEADER */
  .header { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid #1a1a1a; gap: 12px; }
  .header-info { display: flex; flex-direction: column; flex: 1; }
  .header-name { font-size: 17px; font-weight: 700; }
  .header-cat { font-size: 11px; color: #666; }
  .btn-outline { padding: 7px 14px; border: 1px solid #333; border-radius: 8px; background: none; color: #999; font-size: 13px; cursor: pointer; }
  .btn-back { width: 36px; height: 36px; border: 1px solid #333; border-radius: 8px; background: none; color: #fff; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

  /* TIMER BANNER */
  .timer-banner { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #1a1a0a; border-bottom: 2px solid #F49311; }
  .timer-label { font-size: 10px; color: #F49311; letter-spacing: 2px; margin-bottom: 2px; }
  .timer-fase { font-size: 14px; font-weight: 600; }
  .timer-right { display: flex; align-items: center; gap: 10px; }
  .timer-clock { font-size: 22px; font-weight: 700; font-family: monospace; color: #F49311; }
  .btn-stop { padding: 8px 16px; border: none; border-radius: 8px; background: #e74c3c; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 1px; }

  /* DOORS */
  .doors { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 24px 16px; flex: 1; align-content: center; min-height: calc(100vh - 60px); min-height: calc(100dvh - 60px); }
  .door { border: 2px solid #222; border-radius: 16px; padding: 32px 20px; background: #111; cursor: pointer; text-align: center; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .door:active { transform: scale(0.97); }
  .door-fernando { border-color: rgba(244,147,17,0.3); }
  .door-fernando:hover { border-color: #F49311; background: #1a1500; }
  .door-carolina { border-color: rgba(59,130,246,0.3); }
  .door-carolina:hover { border-color: #3b82f6; background: #0a1020; }
  .door-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; }
  .door-fernando .door-icon { background: rgba(244,147,17,0.15); color: #F49311; }
  .door-carolina .door-icon { background: rgba(59,130,246,0.15); color: #3b82f6; }
  .door-name { font-size: 18px; font-weight: 700; }
  .door-desc { font-size: 12px; color: #888; }
  .door-items { font-size: 11px; color: #555; letter-spacing: 1px; }

  /* TABS */
  .tabs { display: flex; border-bottom: 1px solid #1a1a1a; }
  .tab { flex: 1; padding: 13px 0; border: none; background: none; color: #666; font-size: 13px; font-weight: 600; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; border-bottom: 3px solid transparent; }
  .tab-active { color: #F49311; border-bottom-color: #F49311; }
  .carolina .tab-active { color: #3b82f6; border-bottom-color: #3b82f6; }

  /* CONTENT */
  .content { padding: 16px; }
  .section-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .section-sub { font-size: 12px; color: #555; margin-bottom: 16px; }
  .empty { text-align: center; color: #444; padding: 32px; font-size: 13px; }

  /* CARDS */
  .card { padding: 14px; background: #111; border-radius: 12px; margin-bottom: 10px; cursor: pointer; border: 1px solid #1a1a1a; }
  .card-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
  .card-num { font-size: 14px; font-weight: 700; color: #F49311; }
  .card-sub { font-size: 12px; color: #888; }
  .card-pct { font-size: 13px; font-weight: 700; color: #F49311; }
  .card-detail { font-size: 11px; color: #555; }
  .progress { height: 4px; background: #222; border-radius: 2px; margin-top: 8px; overflow: hidden; }
  .progress-fill { height: 100%; background: #F49311; border-radius: 2px; transition: width 0.3s; }

  /* FASES */
  .fase-list { margin-top: 10px; border-top: 1px solid #222; padding-top: 10px; }
  .fase-btn { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 11px 14px; border: 1px solid #222; border-radius: 8px; background: #0a0a0a; color: #fff; font-size: 13px; cursor: pointer; margin-bottom: 6px; }
  .fase-btn:active { background: #1a1a1a; }
  .fase-h { color: #666; font-size: 11px; }

  /* TIMER BIG */
  .timer-big-section { text-align: center; padding: 32px 0; }
  .timer-big { font-size: 52px; font-weight: 700; font-family: monospace; color: #F49311; }
  .timer-big-detail { color: #666; font-size: 13px; line-height: 1.6; margin-top: 12px; }

  /* RECIBOS */
  .recibos-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
  .recibo-card { display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #111; border-radius: 12px; text-decoration: none; color: #fff; border: 1px solid #1a1a1a; }
  .recibo-card:active { background: #1a1a1a; }
  .recibo-left { display: flex; flex-direction: column; }
  .recibo-mes { font-size: 14px; font-weight: 700; }
  .recibo-ano { font-size: 11px; color: #666; }
  .recibo-right { display: flex; flex-direction: column; align-items: flex-end; }
  .recibo-val { font-size: 15px; font-weight: 700; color: #3b82f6; }
  .recibo-num { font-size: 10px; color: #555; }

  /* DADOS */
  .data-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1a1a1a; }
  .data-row:last-child { border-bottom: none; }
  .data-label { font-size: 12px; color: #666; }
  .data-val { font-size: 13px; font-weight: 600; }

  /* FORM (CIT) */
  .form-row { margin-bottom: 12px; }
  .form-label { display: block; font-size: 11px; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .form-input { width: 100%; padding: 10px 12px; border: 1px solid #333; border-radius: 8px; background: #0a0a0a; color: #fff; font-size: 14px; }
  .form-input:focus { outline: none; border-color: #3b82f6; }
  .form-file { width: 100%; padding: 10px 0; color: #999; font-size: 13px; }
  .form-file::file-selector-button { padding: 8px 16px; border: 1px solid #333; border-radius: 8px; background: #1a1a1a; color: #fff; font-size: 13px; cursor: pointer; margin-right: 12px; }
  .btn-submit { width: 100%; padding: 14px; border: none; border-radius: 10px; background: #3b82f6; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 8px; }
  .btn-submit:disabled { background: #222; color: #555; cursor: default; }
  .btn-submit:active:not(:disabled) { background: #2563eb; }
  .cit-msg { margin-top: 12px; padding: 10px; border-radius: 8px; font-size: 13px; }
  .cit-ok { background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
  .cit-err { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

  /* LANDSCAPE */
  @media (orientation: landscape) and (max-height: 500px) {
    .doors { min-height: calc(100vh - 56px); min-height: calc(100dvh - 56px); padding: 12px 16px; gap: 12px; align-content: center; }
    .door { padding: 20px 16px; }
    .door-icon { width: 40px; height: 40px; font-size: 18px; }
    .door-name { font-size: 15px; }
    .login-card { padding: 16px; }
    .logo { font-size: 36px; }
    .numpad { gap: 6px; }
    .num-btn { height: 42px; font-size: 18px; }
    .content { padding: 12px; }
    .timer-big { font-size: 40px; }
    .timer-big-section { padding: 16px 0; }
    .recibos-grid { grid-template-columns: 1fr 1fr; }
  }

  @media (min-width: 600px) {
    .recibos-grid { grid-template-columns: 1fr 1fr; }
  }

  @media (min-width: 768px) {
    .recibos-grid { grid-template-columns: 1fr 1fr 1fr; }
  }
`
