"use client"

import { useState, useEffect, useCallback, useRef } from "react"

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

interface ChatMsg {
  role: "user" | "assistant"
  content: string
}

export default function PortalTrabalhador() {
  const [session, setSession] = useState<Session | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [timer, setTimer] = useState<Timer | null>(null)
  const [obras, setObras] = useState<Obra[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatImages, setChatImages] = useState<string[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatFileRef = useRef<HTMLInputElement>(null)

  // Clock
  const [now, setNow] = useState(new Date())

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

  useEffect(() => {
    if (session) { loadTimer(); loadObras() }
  }, [session, loadTimer, loadObras])

  // Elapsed timer tick
  useEffect(() => {
    if (!timer) { setElapsed(0); return }
    const calc = () => setElapsed(Math.floor((Date.now() - new Date(timer.inicio).getTime()) / 1000))
    calc()
    const i = setInterval(calc, 1000)
    return () => clearInterval(i)
  }, [timer])

  // Clock tick
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(i)
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const fmtHM = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    return `${h}h${m.toString().padStart(2, "0")}`
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

  // Chat
  const sendChat = async () => {
    if (!session || (!chatInput.trim() && chatImages.length === 0)) return
    const msg = chatInput.trim()
    setChatInput("")
    const imgs = [...chatImages]
    setChatImages([])

    const newMessages: ChatMsg[] = [...chatMessages, { role: "user", content: msg || "(foto)" }]
    setChatMessages(newMessages)
    setChatLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaborador_id: session.colaborador_id,
          message: msg || "Foto enviada",
          history: newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          images: imgs.length > 0 ? imgs : undefined,
        }),
      })
      const data = await res.json()
      setChatMessages([...newMessages, { role: "assistant", content: data.response || data.error || "Sem resposta" }])
    } catch {
      setChatMessages([...newMessages, { role: "assistant", content: "Erro de ligacao" }])
    }
    setChatLoading(false)
  }

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]
      if (base64) setChatImages(prev => [...prev, base64])
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const addDigit = (d: string) => { if (pin.length < 4) setPin(pin + d) }
  const clearPin = () => { setPin(""); setError("") }
  const logout = () => { setSession(null); setPin(""); setTimer(null); setChatMessages([]) }

  // Derived data
  const obrasProducao = obras.filter(o => o.estado === "producao")
  const activeObra = timer ? obras.find(o => o.id === timer.obra_id) : null
  const todayHours = elapsed // simplification — today = current timer elapsed
  const weekHours = 0 // would need API; placeholder
  const obraPct = activeObra
    ? Math.round((activeObra.fases_obra.filter(f => f.estado === "concluido").length / Math.max(activeObra.fases_obra.length, 1)) * 100)
    : 0

  const initials = session ? session.nome.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : ""

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

  // ========== DASHBOARD ==========
  return (
    <div className="portal-root portal-dashboard">
      <style>{globalCSS}</style>

      {/* HEADER */}
      <div className="header">
        <div className="avatar">{initials}</div>
        <div className="header-info">
          <span className="header-name">{session.nome}</span>
          <span className="header-cat">{session.categoria || "Serralheiro"}</span>
        </div>
        <div className="header-right">
          <div className="header-datetime">
            <span className="header-date">{now.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })}</span>
            <span className="header-time">{now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <button className="btn-sair" onClick={logout}>Sair</button>
        </div>
      </div>

      {/* GREEN ACCENT LINE */}
      <div className="green-line" />

      {/* KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-today">
          <span className="kpi-label">HOJE</span>
          <span className="kpi-value kpi-value-green">{fmtHM(todayHours)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">SEMANA</span>
          <span className="kpi-value">{weekHours > 0 ? fmtHM(weekHours) : "--"}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">OBRA</span>
          <span className="kpi-value">{activeObra ? `${obraPct}%` : "--"}</span>
        </div>
      </div>

      {/* SEPARATOR */}
      <div className="sep-subtle" />

      {/* OBRA ACTIVA / SELECTION */}
      {timer && activeObra ? (
        <div className="obra-card obra-active">
          <div className="obra-header">
            <div className="obra-status-row">
              <span className="dot-pulse" />
              <span className="obra-status-label">EM TRABALHO</span>
            </div>
            <span className="obra-timer">{fmt(elapsed)}</span>
          </div>
          <div className="obra-info-row">
            <span className="obra-num">{activeObra.numero_obra}</span>
            <span className="obra-fase-label">F{timer.fases_obra?.fase_numero} {timer.fases_obra?.nome}</span>
          </div>
          <div className="obra-detail">{activeObra.leads?.veiculo_marca} {activeObra.leads?.veiculo_modelo} — {activeObra.leads?.tipo_carrocaria}</div>
          <div className="obra-detail">{activeObra.leads?.cliente}</div>
          {/* Phase progress bars */}
          <div className="fases-row">
            {activeObra.fases_obra.sort((a,b) => a.fase_numero - b.fase_numero).map(f => {
              const isDone = f.estado === "concluido"
              const isActive = timer.fases_obra?.fase_numero === f.fase_numero
              return (
                <div key={f.id} className="fase-pip-wrap">
                  <div className={`fase-pip ${isDone ? "fase-done" : isActive ? "fase-active" : "fase-pending"}`} />
                  <span className={`fase-pip-label ${isActive ? "fase-pip-active" : ""}`}>F{f.fase_numero}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="obra-card obra-select">
          <div className="obra-select-title">Seleccionar obra e fase</div>
          {obrasProducao.length === 0 ? (
            <div className="empty">Sem obras em producao</div>
          ) : (
            obrasProducao.map(obra => (
              <div key={obra.id} className="obra-select-item" onClick={() => setSelectedObra(selectedObra?.id === obra.id ? null : obra)}>
                <div className="obra-select-row">
                  <span className="obra-select-num">{obra.numero_obra}</span>
                  <span className="obra-select-client">{obra.leads?.cliente}</span>
                </div>
                <div className="obra-detail">{obra.leads?.veiculo_marca} {obra.leads?.veiculo_modelo} — {obra.leads?.tipo_carrocaria}</div>
                {selectedObra?.id === obra.id && (
                  <div className="fase-list">
                    {obra.fases_obra
                      .filter(f => f.estado === "pendente" || f.estado === "em_curso")
                      .sort((a,b) => a.fase_numero - b.fase_numero)
                      .map(fase => (
                        <button key={fase.id} className="fase-btn" onClick={e => { e.stopPropagation(); startTimer(obra.id, fase.id) }} disabled={loading}>
                          <span>F{fase.fase_numero} — {fase.nome}</span>
                          <span className="fase-h">{(fase.horas_reais||0).toFixed(1)}h</span>
                        </button>
                      ))}
                    {obra.fases_obra.filter(f => f.estado === "pendente" || f.estado === "em_curso").length === 0 && (
                      <div className="empty">Sem fases disponiveis</div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* SEPARATOR */}
      <div className="sep-subtle" />

      {/* ENTRADA / SAIDA BUTTONS */}
      <div className="action-btns">
        <button
          className={`action-btn action-saida ${timer ? "action-active" : "action-inactive"}`}
          onClick={timer ? stopTimer : undefined}
          disabled={!timer || loading}
        >
          <span className="action-watermark">| |</span>
          <span className="action-text">SAIDA</span>
        </button>
        <button
          className={`action-btn action-entrada ${!timer ? "action-active" : "action-inactive"}`}
          onClick={!timer && obrasProducao.length > 0 ? () => {
            const first = obrasProducao[0]
            setSelectedObra(selectedObra?.id === first.id ? null : first)
          } : undefined}
          disabled={!!timer}
        >
          <span className="action-watermark">&#9654;</span>
          <span className="action-text">ENTRADA</span>
        </button>
      </div>

      {/* GREEN SEPARATOR BEFORE CHAT */}
      <div className="green-sep-chat" />

      {/* CHAT FERNANDO */}
      <div className="chat-section">
        <div className="chat-header-bar">
          <div className="chat-avatar">F</div>
          <span className="chat-title">Fernando — Assistente</span>
        </div>
        <div className="chat-messages">
          {chatMessages.length === 0 && (
            <div className="chat-empty">Pergunte algo ao Fernando...</div>
          )}
          {chatMessages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role === "user" ? "chat-user" : "chat-bot"}`}>
              {m.content}
            </div>
          ))}
          {chatLoading && <div className="chat-msg chat-bot chat-thinking">A pensar...</div>}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input-bar">
          <input
            ref={chatFileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleImageCapture}
          />
          <button className="chat-cam-btn" onClick={() => chatFileRef.current?.click()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          </button>
          {chatImages.length > 0 && <span className="chat-img-badge">{chatImages.length} foto{chatImages.length > 1 ? "s" : ""}</span>}
          <input
            className="chat-text-input"
            placeholder="Perguntar ao Fernando..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat() } }}
          />
          <button className={`chat-send-btn ${chatInput.trim() || chatImages.length > 0 ? "chat-send-active" : ""}`} onClick={sendChat} disabled={chatLoading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

const globalCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  .portal-root {
    min-height: 100vh; min-height: 100dvh;
    background: #0A0A0A; color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
    max-width: 900px; margin: 0 auto;
  }
  .portal-center { display: flex; align-items: center; justify-content: center; }
  .portal-dashboard { display: flex; flex-direction: column; height: 100vh; height: 100dvh; overflow: hidden; }

  /* ===== LOGIN ===== */
  .login-card { width: 100%; max-width: 320px; padding: 32px; text-align: center; }
  .logo { font-size: 52px; font-weight: 900; color: #F49311; letter-spacing: -3px; }
  .login-sub { font-size: 11px; color: #555; letter-spacing: 4px; margin-bottom: 32px; }
  .pin-dots { display: flex; justify-content: center; gap: 16px; margin-bottom: 24px; }
  .pin-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #333; transition: all 0.2s; }
  .pin-dot.active { background: #F49311; border-color: #F49311; }
  .error { color: #E74C3C; font-size: 13px; margin-bottom: 12px; }
  .numpad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .num-btn { height: 54px; border: none; border-radius: 12px; background: #1A1A1A; color: #fff; font-size: 22px; font-weight: 600; cursor: pointer; }
  .num-btn:active { background: #333; }
  .num-ok { background: #F49311 !important; color: #000 !important; }

  /* ===== HEADER ===== */
  .header { display: flex; align-items: center; padding: 12px 16px; gap: 10px; flex-shrink: 0; }
  .avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(52, 199, 89, 0.12); color: #34C759;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; flex-shrink: 0;
  }
  .header-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .header-name { font-size: 16px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .header-cat { font-size: 11px; color: #888; }
  .header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .header-datetime { display: flex; flex-direction: column; align-items: flex-end; }
  .header-date { font-size: 11px; color: #888; }
  .header-time { font-size: 13px; font-weight: 600; font-family: monospace; font-variant-numeric: tabular-nums; }
  .btn-sair { padding: 7px 14px; border: 1px solid #333; border-radius: 8px; background: none; color: #888; font-size: 12px; cursor: pointer; }

  /* ===== GREEN ACCENT LINE ===== */
  .green-line { height: 2px; background: linear-gradient(90deg, #34C759 0%, #34C759 40%, transparent 100%); flex-shrink: 0; }

  /* ===== KPI CARDS ===== */
  .kpi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 12px 16px; flex-shrink: 0; }
  .kpi-card {
    background: #111; border: 1px solid #1A1A1A; border-radius: 10px;
    padding: 10px 12px; display: flex; flex-direction: column; align-items: center; gap: 2px;
  }
  .kpi-today { background: rgba(52, 199, 89, 0.04); }
  .kpi-label { font-size: 10px; color: #555; letter-spacing: 3px; text-transform: uppercase; }
  .kpi-value { font-size: 24px; font-weight: 700; font-family: monospace; font-variant-numeric: tabular-nums; }
  .kpi-value-green { color: #34C759; }

  /* ===== SEPARATORS ===== */
  .sep-subtle {
    height: 1px; margin: 0 16px; flex-shrink: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent 100%);
  }
  .green-sep-chat {
    height: 1px; flex-shrink: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(52,199,89,0.3) 50%, transparent 100%);
  }

  /* ===== OBRA CARD ===== */
  .obra-card { margin: 10px 16px; border-radius: 12px; padding: 12px 14px; flex-shrink: 0; }
  .obra-active {
    border-left: 3px solid #34C759; border: 1px solid rgba(52, 199, 89, 0.30);
    border-left-width: 3px; background: rgba(52, 199, 89, 0.04);
  }
  .obra-select { border: 1px solid #1A1A1A; background: #111; }
  .obra-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .obra-status-row { display: flex; align-items: center; gap: 6px; }
  .obra-status-label { font-size: 10px; color: #34C759; letter-spacing: 2px; text-transform: uppercase; }
  .obra-timer { font-size: 28px; font-weight: 700; font-family: monospace; font-variant-numeric: tabular-nums; color: #34C759; }
  .obra-info-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
  .obra-num { font-size: 14px; font-weight: 700; }
  .obra-fase-label { font-size: 12px; color: #34C759; font-weight: 600; }
  .obra-detail { font-size: 11px; color: #555; margin-bottom: 2px; }

  /* Dot pulsante */
  .dot-pulse {
    width: 8px; height: 8px; border-radius: 50%; background: #34C759;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* Phase pips */
  .fases-row { display: flex; gap: 4px; margin-top: 8px; }
  .fase-pip-wrap { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; }
  .fase-pip { height: 6px; border-radius: 3px; width: 100%; }
  .fase-done { background: #34C759; }
  .fase-active { background: rgba(52, 199, 89, 0.35); box-shadow: 0 0 6px rgba(52, 199, 89, 0.4); }
  .fase-pending { background: #2A2A2A; }
  .fase-pip-label { font-size: 9px; color: #555; }
  .fase-pip-active { color: #34C759; font-weight: 600; }

  /* Obra selection */
  .obra-select-title { font-size: 13px; color: #888; margin-bottom: 10px; }
  .obra-select-item { padding: 10px; border: 1px solid #1A1A1A; border-radius: 10px; margin-bottom: 6px; cursor: pointer; background: #0A0A0A; }
  .obra-select-item:active { background: #1A1A1A; }
  .obra-select-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
  .obra-select-num { font-size: 14px; font-weight: 700; color: #34C759; }
  .obra-select-client { font-size: 12px; color: #888; }
  .empty { text-align: center; color: #444; padding: 16px; font-size: 13px; }

  /* Fase list inside obra selection */
  .fase-list { margin-top: 8px; border-top: 1px solid #222; padding-top: 8px; }
  .fase-btn {
    width: 100%; display: flex; justify-content: space-between; align-items: center;
    padding: 11px 14px; border: 1px solid #222; border-radius: 8px;
    background: #111; color: #fff; font-size: 13px; cursor: pointer; margin-bottom: 6px;
    min-height: 44px;
  }
  .fase-btn:active { background: #1A1A1A; }
  .fase-h { color: #666; font-size: 11px; font-family: monospace; }

  /* ===== ACTION BUTTONS ===== */
  .action-btns { display: flex; gap: 10px; padding: 10px 16px; flex-shrink: 0; }
  .action-btn {
    flex: 1; height: 56px; border: none; border-radius: 12px;
    font-size: 18px; font-weight: 800; letter-spacing: 2px;
    cursor: pointer; position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .action-btn:active:not(:disabled) { transform: scale(0.97); }
  .action-watermark {
    position: absolute; font-size: 56px; opacity: 0.08;
    pointer-events: none; font-weight: 900;
  }
  .action-text { position: relative; z-index: 1; }
  .action-saida.action-active { background: #E74C3C; color: #fff; }
  .action-entrada.action-active { background: #34C759; color: #000; }
  .action-inactive { background: #1A1A1A; color: #555; opacity: 0.35; cursor: default; }

  /* ===== CHAT ===== */
  .chat-section {
    flex: 1; display: flex; flex-direction: column; min-height: 0;
    margin: 0 0 0 0;
  }
  .chat-header-bar {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px; flex-shrink: 0;
  }
  .chat-avatar {
    width: 22px; height: 22px; border-radius: 50%;
    background: rgba(52, 199, 89, 0.12); color: #34C759;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
  }
  .chat-title { font-size: 11px; color: #555; }
  .chat-messages {
    flex: 1; overflow-y: auto; padding: 0 16px 8px 16px;
    display: flex; flex-direction: column; gap: 6px;
    -webkit-overflow-scrolling: touch;
  }
  .chat-empty { color: #333; font-size: 12px; text-align: center; padding: 20px 0; }
  .chat-msg {
    max-width: 85%; padding: 8px 12px; font-size: 13px; line-height: 1.4;
    animation: fadeIn 0.2s ease-out; word-break: break-word;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .chat-user {
    align-self: flex-end; background: #34C759; color: #000;
    border-radius: 12px 12px 4px 12px;
  }
  .chat-bot {
    align-self: flex-start; background: #1A1A1A; color: #eee;
    border-radius: 12px 12px 12px 4px;
  }
  .chat-thinking { color: #555; font-style: italic; }

  .chat-input-bar {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-top: 1px solid #1A1A1A; flex-shrink: 0;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
  }
  .chat-cam-btn {
    width: 34px; height: 34px; border: 1px solid #333; border-radius: 8px;
    background: none; color: #888; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .chat-img-badge { font-size: 10px; color: #34C759; flex-shrink: 0; }
  .chat-text-input {
    flex: 1; height: 34px; padding: 0 12px;
    background: #111; border: 1px solid #333; border-radius: 8px;
    color: #fff; font-size: 14px; outline: none; min-width: 0;
  }
  .chat-text-input:focus { border-color: rgba(52, 199, 89, 0.5); }
  .chat-text-input::placeholder { color: #444; }
  .chat-send-btn {
    width: 34px; height: 34px; border: none; border-radius: 8px;
    background: #222; color: #555; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .chat-send-active { background: #34C759; color: #000; }

  /* ===== RESPONSIVE ===== */
  @media (orientation: landscape) and (max-height: 500px) {
    .kpi-grid { padding: 8px 16px; gap: 6px; }
    .kpi-value { font-size: 20px; }
    .obra-card { margin: 6px 16px; padding: 8px 12px; }
    .obra-timer { font-size: 22px; }
    .action-btns { padding: 6px 16px; }
    .action-btn { height: 48px; font-size: 16px; }
    .chat-messages { max-height: 150px; }
    .login-card { padding: 16px; }
    .logo { font-size: 36px; }
    .numpad { gap: 6px; }
    .num-btn { height: 42px; font-size: 18px; }
  }

  @media (min-width: 768px) {
    .portal-root { max-width: 900px; }
    .kpi-value { font-size: 28px; }
    .obra-timer { font-size: 32px; }
    .action-btn { height: 64px; }
    .chat-messages { max-height: 280px; }
  }

  @media (min-width: 1024px) {
    .portal-root { max-width: 1200px; }
  }
`
