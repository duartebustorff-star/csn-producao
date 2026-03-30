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

export default function PortalTrabalhador() {
  const [session, setSession] = useState<Session | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"ponto" | "obras" | "recibos">("ponto")
  const [timer, setTimer] = useState<Timer | null>(null)
  const [obras, setObras] = useState<Obra[]>([])
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null)
  const [elapsed, setElapsed] = useState(0)

  // Login
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
      if (!res.ok) {
        setError(data.error || "Erro")
        return
      }
      setSession(data)
    } catch {
      setError("Erro de ligacao")
    } finally {
      setLoading(false)
    }
  }

  // Load timer
  const loadTimer = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch(`/api/timer?colaborador_id=${session.colaborador_id}`)
      const data = await res.json()
      setTimer(data.timer || null)
    } catch { /* ignore */ }
  }, [session])

  // Load obras
  const loadObras = useCallback(async () => {
    try {
      const res = await fetch("/api/obras")
      const data = await res.json()
      setObras((data.obras || []).filter((o: Obra) => o.estado === "producao"))
    } catch { /* ignore */ }
  }, [])

  // Load recibos
  const loadRecibos = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch(`/api/rh/recibos-lista?colaborador_rh_id=${session.colaborador_rh_id}`)
      const data = await res.json()
      setRecibos(data.recibos || [])
    } catch { /* ignore */ }
  }, [session])

  useEffect(() => {
    if (session) {
      loadTimer()
      loadObras()
    }
  }, [session, loadTimer, loadObras])

  // Elapsed time counter
  useEffect(() => {
    if (!timer) { setElapsed(0); return }
    const calc = () => {
      const start = new Date(timer.inicio).getTime()
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [timer])

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  // Start timer
  const startTimer = async (obraId: string, faseId: string) => {
    if (!session) return
    setLoading(true)
    try {
      await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaborador_id: session.colaborador_id,
          action: "start",
          obra_id: obraId,
          fase_id: faseId,
        }),
      })
      await loadTimer()
      setSelectedObra(null)
      setTab("ponto")
    } catch { /* ignore */ }
    setLoading(false)
  }

  // Stop timer
  const stopTimer = async () => {
    if (!session) return
    setLoading(true)
    try {
      await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaborador_id: session.colaborador_id,
          action: "stop",
        }),
      })
      setTimer(null)
      await loadObras()
    } catch { /* ignore */ }
    setLoading(false)
  }

  // PIN pad
  const addDigit = (d: string) => {
    if (pin.length < 4) setPin(pin + d)
  }
  const clearPin = () => { setPin(""); setError("") }

  // ========== LOGIN SCREEN ==========
  if (!session) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.logo}>CSN</div>
          <div style={styles.loginTitle}>Portal Trabalhador</div>
          <div style={styles.pinDisplay}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                ...styles.pinDot,
                backgroundColor: pin.length > i ? "#F49311" : "#333",
              }} />
            ))}
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.numpad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} style={styles.numBtn} onClick={() => addDigit(String(n))}>
                {n}
              </button>
            ))}
            <button style={styles.numBtn} onClick={clearPin}>C</button>
            <button style={styles.numBtn} onClick={() => addDigit("0")}>0</button>
            <button style={{
              ...styles.numBtn,
              backgroundColor: pin.length === 4 ? "#F49311" : "#222",
              color: pin.length === 4 ? "#000" : "#666",
            }} onClick={handleLogin} disabled={pin.length !== 4 || loading}>
              {loading ? "..." : "OK"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ========== MAIN PORTAL ==========
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerName}>{session.nome.split(" ")[0]}</span>
          <span style={styles.headerCat}>{session.categoria || "Serralheiro"}</span>
        </div>
        <button style={styles.logoutBtn} onClick={() => { setSession(null); setPin(""); setTimer(null) }}>
          Sair
        </button>
      </div>

      {/* Timer Banner */}
      {timer && (
        <div style={styles.timerBanner}>
          <div style={styles.timerInfo}>
            <div style={styles.timerLabel}>Em trabalho</div>
            <div style={styles.timerFase}>{timer.fases_obra?.nome || "Fase"}</div>
          </div>
          <div style={styles.timerRight}>
            <div style={styles.timerClock}>{formatTime(elapsed)}</div>
            <button style={styles.stopBtn} onClick={stopTimer} disabled={loading}>
              SAIDA
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {(["ponto", "obras", "recibos"] as const).map(t => (
          <button key={t} style={{
            ...styles.tab,
            borderBottom: tab === t ? "3px solid #F49311" : "3px solid transparent",
            color: tab === t ? "#F49311" : "#999",
          }} onClick={() => {
            setTab(t)
            if (t === "recibos") loadRecibos()
            if (t === "obras") loadObras()
          }}>
            {t === "ponto" ? "Ponto" : t === "obras" ? "Obras" : "Recibos"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* PONTO TAB */}
        {tab === "ponto" && !timer && (
          <div style={styles.entradaSection}>
            <div style={styles.sectionTitle}>Iniciar trabalho</div>
            <div style={styles.sectionSub}>Selecciona a obra e a fase</div>
            {obras.length === 0 ? (
              <div style={styles.empty}>Sem obras em producao</div>
            ) : (
              obras.map(obra => (
                <div key={obra.id} style={styles.obraCard} onClick={() => setSelectedObra(selectedObra?.id === obra.id ? null : obra)}>
                  <div style={styles.obraHeader}>
                    <span style={styles.obraNum}>{obra.numero_obra}</span>
                    <span style={styles.obraCliente}>{obra.leads?.cliente || ""}</span>
                  </div>
                  <div style={styles.obraSub}>
                    {obra.leads?.veiculo_marca} {obra.leads?.veiculo_modelo} — {obra.leads?.tipo_carrocaria}
                  </div>
                  {selectedObra?.id === obra.id && (
                    <div style={styles.faseList}>
                      {obra.fases_obra
                        .filter(f => f.estado === "pendente" || f.estado === "em_curso")
                        .sort((a, b) => a.fase_numero - b.fase_numero)
                        .map(fase => (
                          <button key={fase.id} style={styles.faseBtn} onClick={(e) => {
                            e.stopPropagation()
                            startTimer(obra.id, fase.id)
                          }} disabled={loading}>
                            <span>F{fase.fase_numero} — {fase.nome}</span>
                            <span style={styles.faseHoras}>{(fase.horas_reais || 0).toFixed(1)}h</span>
                          </button>
                        ))}
                      {obra.fases_obra.filter(f => f.estado === "pendente" || f.estado === "em_curso").length === 0 && (
                        <div style={styles.empty}>Sem fases disponiveis</div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "ponto" && timer && (
          <div style={styles.entradaSection}>
            <div style={styles.sectionTitle}>Timer activo</div>
            <div style={styles.bigTimer}>{formatTime(elapsed)}</div>
            <div style={styles.timerDetail}>
              Fase: {timer.fases_obra?.nome}<br />
              Inicio: {new Date(timer.inicio).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        )}

        {/* OBRAS TAB */}
        {tab === "obras" && (
          <div>
            <div style={styles.sectionTitle}>Todas as obras</div>
            {obras.map(obra => {
              const total = obra.fases_obra.length
              const done = obra.fases_obra.filter(f => f.estado === "concluido").length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <div key={obra.id} style={styles.obraCard}>
                  <div style={styles.obraHeader}>
                    <span style={styles.obraNum}>{obra.numero_obra}</span>
                    <span style={styles.obraPct}>{pct}%</span>
                  </div>
                  <div style={styles.obraSub}>
                    {obra.leads?.cliente} — {obra.leads?.tipo_carrocaria}
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* RECIBOS TAB */}
        {tab === "recibos" && (
          <div>
            <div style={styles.sectionTitle}>Os meus recibos</div>
            {recibos.length === 0 ? (
              <div style={styles.empty}>A carregar...</div>
            ) : (
              recibos.map((r, i) => (
                <a
                  key={i}
                  href={`/api/rh/recibo?colaborador_rh_id=${session.colaborador_rh_id}&ano=${r.ano}&mes=${r.mes}`}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.reciboCard}
                >
                  <div style={styles.reciboLeft}>
                    <span style={styles.reciboMes}>{MESES[r.mes]}</span>
                    <span style={styles.reciboAno}>{r.ano}</span>
                  </div>
                  <div style={styles.reciboRight}>
                    <span style={styles.reciboValor}>{Number(r.liquido).toFixed(2)}€</span>
                    <span style={styles.reciboNum}>#{r.numero_recibo}</span>
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ========== STYLES ==========
const styles: Record<string, React.CSSProperties> = {
  // Login
  loginContainer: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0a", fontFamily: "'SF Pro Display', -apple-system, sans-serif" },
  loginCard: { width: "100%", maxWidth: 340, padding: 32, textAlign: "center" },
  logo: { fontSize: 48, fontWeight: 900, color: "#F49311", letterSpacing: -2, marginBottom: 4 },
  loginTitle: { fontSize: 14, color: "#666", marginBottom: 32, textTransform: "uppercase" as const, letterSpacing: 3 },
  pinDisplay: { display: "flex", justifyContent: "center", gap: 16, marginBottom: 24 },
  pinDot: { width: 16, height: 16, borderRadius: "50%", border: "2px solid #333", transition: "all 0.2s" },
  error: { color: "#e74c3c", fontSize: 13, marginBottom: 16 },
  numpad: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  numBtn: { width: "100%", height: 56, border: "none", borderRadius: 12, backgroundColor: "#1a1a1a", color: "#fff", fontSize: 22, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" },

  // Main
  container: { minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#fff", fontFamily: "'SF Pro Display', -apple-system, sans-serif", maxWidth: 480, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #1a1a1a" },
  headerLeft: { display: "flex", flexDirection: "column" as const },
  headerName: { fontSize: 18, fontWeight: 700 },
  headerCat: { fontSize: 12, color: "#666" },
  logoutBtn: { padding: "8px 16px", border: "1px solid #333", borderRadius: 8, backgroundColor: "transparent", color: "#999", fontSize: 13, cursor: "pointer" },

  // Timer banner
  timerBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", backgroundColor: "#1a1a0a", borderBottom: "2px solid #F49311" },
  timerInfo: { flex: 1 },
  timerLabel: { fontSize: 11, color: "#F49311", textTransform: "uppercase" as const, letterSpacing: 2, marginBottom: 4 },
  timerFase: { fontSize: 15, fontWeight: 600 },
  timerRight: { display: "flex", alignItems: "center", gap: 12 },
  timerClock: { fontSize: 24, fontWeight: 700, fontFamily: "monospace", color: "#F49311" },
  stopBtn: { padding: "10px 20px", border: "none", borderRadius: 8, backgroundColor: "#e74c3c", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 1 },

  // Tabs
  tabs: { display: "flex", borderBottom: "1px solid #1a1a1a" },
  tab: { flex: 1, padding: "14px 0", border: "none", backgroundColor: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer", textTransform: "uppercase" as const, letterSpacing: 1 },

  // Content
  content: { padding: "20px" },
  sectionTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: "#666", marginBottom: 20 },
  empty: { textAlign: "center" as const, color: "#444", padding: 40, fontSize: 14 },

  // Entrada
  entradaSection: {},
  bigTimer: { fontSize: 56, fontWeight: 700, fontFamily: "monospace", color: "#F49311", textAlign: "center" as const, padding: "40px 0 16px" },
  timerDetail: { textAlign: "center" as const, color: "#666", fontSize: 14, lineHeight: 1.6 },

  // Obra cards
  obraCard: { padding: "16px", backgroundColor: "#111", borderRadius: 12, marginBottom: 12, cursor: "pointer", border: "1px solid #1a1a1a" },
  obraHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  obraNum: { fontSize: 15, fontWeight: 700, color: "#F49311" },
  obraCliente: { fontSize: 13, color: "#999" },
  obraPct: { fontSize: 14, fontWeight: 700, color: "#F49311" },
  obraSub: { fontSize: 12, color: "#555" },
  progressBar: { height: 4, backgroundColor: "#222", borderRadius: 2, marginTop: 10, overflow: "hidden" as const },
  progressFill: { height: "100%", backgroundColor: "#F49311", borderRadius: 2, transition: "width 0.3s" },

  // Fase buttons
  faseList: { marginTop: 12, borderTop: "1px solid #222", paddingTop: 12 },
  faseBtn: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: "1px solid #222", borderRadius: 8, backgroundColor: "#0a0a0a", color: "#fff", fontSize: 13, cursor: "pointer", marginBottom: 8, transition: "all 0.15s" },
  faseHoras: { color: "#666", fontSize: 12 },

  // Recibos
  reciboCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: "#111", borderRadius: 12, marginBottom: 8, textDecoration: "none", color: "#fff", border: "1px solid #1a1a1a" },
  reciboLeft: { display: "flex", flexDirection: "column" as const },
  reciboMes: { fontSize: 15, fontWeight: 700 },
  reciboAno: { fontSize: 12, color: "#666" },
  reciboRight: { display: "flex", flexDirection: "column" as const, alignItems: "flex-end" as const },
  reciboValor: { fontSize: 16, fontWeight: 700, color: "#F49311" },
  reciboNum: { fontSize: 11, color: "#555" },
}
