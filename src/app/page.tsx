"use client"

import { useState, useEffect, useRef } from "react"
import LoginScreen from "@/components/LoginScreen"
import Header from "@/components/Header"
import ModeSelector from "@/components/ModeSelector"
import BottomNav, { type View } from "@/components/BottomNav"
import ChatView from "@/components/ChatView"
import ObrasView from "@/components/ObrasView"
import DashboardView from "@/components/DashboardView"
import RHView from "@/components/RHView"
import WorkerRHView from "@/components/WorkerRHView"
import DocumentosView from "@/components/DocumentosView"
import LeadsView from "@/components/LeadsView"
import RoteadorView from "@/components/RoteadorView"
import WorkerDashboard from "@/components/WorkerDashboard"
import type { Colaborador } from "@/lib/types"
import type { Lang } from "@/lib/translations"

export type WorkerMode = "producao" | "pessoal"

export default function Home() {
  const [user, setUser] = useState<Colaborador | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<View>("chat")
  const [workerMode, setWorkerMode] = useState<WorkerMode | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [cameraFeedback, setCameraFeedback] = useState<string | null>(null)
  const [lastPhasePhotoUrl, setLastPhasePhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("csn_session")
      if (saved) {
        setUser(JSON.parse(saved))
      }
    } catch {
      sessionStorage.removeItem("csn_session")
    }
    setLoading(false)
  }, [])

  const handleLogin = (colaborador: Colaborador) => {
    setUser(colaborador)
    setWorkerMode(null)
    sessionStorage.setItem("csn_session", JSON.stringify(colaborador))
  }

  const handleLogout = () => {
    setUser(null)
    setActiveView("chat")
    setWorkerMode(null)
    sessionStorage.removeItem("csn_session")
  }

  const handleBackToModeSelector = () => {
    setWorkerMode(null)
    setActiveView("chat")
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="text-accent text-2xl font-bold">CSN</div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  const lang = user.lang as Lang
  const isAdmin = user.role === "admin"
  const isWorkerProducao = !isAdmin && workerMode === "producao"

  const uploadPhasePhoto = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("colaborador_id", user.id)
    try {
      const res = await fetch("/api/timer/foto-fase", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        setCameraFeedback(data.error || "Erro ao associar foto")
        return
      }
      setCameraFeedback("Foto associada à fase ativa com sucesso.")
      setLastPhasePhotoUrl(data.foto_url || null)
    } catch {
      setCameraFeedback("Erro de ligação ao enviar foto.")
    }
  }

  // Workers: show ModeSelector before entering the app
  if (!isAdmin && !workerMode) {
    return (
      <ModeSelector
        user={user}
        onSelectProducao={() => { setWorkerMode("producao"); setActiveView("fernando") }}
        onSelectPessoal={() => { setWorkerMode("pessoal"); setActiveView("rh") }}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <div className="flex h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-16 lg:w-56 border-r border-border bg-background flex-shrink-0">
        <div className="flex items-center justify-center px-4 py-4 border-b border-border">
          <img src="/horizontal_black_assinatura.png" alt="CSN" className="hidden lg:block h-16 brightness-0 invert" />
          <span className="lg:hidden text-accent font-bold text-lg">CSN</span>
        </div>
        <nav className="flex-1 py-2">
          {(isAdmin || workerMode === "producao") && (
            <SidebarButton active={activeView === "chat" || activeView === "fernando"} onClick={() => setActiveView("fernando")} icon="💬" label="Fernando" />
          )}
          {(isAdmin || workerMode === "producao") && (
            <SidebarButton active={activeView === "obras"} onClick={() => setActiveView("obras")} icon="🏗️" label="Obras" />
          )}
          {isAdmin && (
            <SidebarButton active={activeView === "leads"} onClick={() => setActiveView("leads")} icon="📋" label="Leads" />
          )}
          {(isAdmin || workerMode === "producao") && (
            <SidebarButton active={activeView === "documentos"} onClick={() => setActiveView("documentos")} icon="📂" label="Documentos" />
          )}
          {(isAdmin || workerMode === "pessoal") && (
            <SidebarButton active={activeView === "rh"} onClick={() => setActiveView("rh")} icon="👤" label="RH" />
          )}
          {workerMode === "pessoal" && (
            <SidebarButton active={activeView === "chat"} onClick={() => setActiveView("chat")} icon="💬" label="Chat" />
          )}
          {isAdmin && (
            <SidebarButton active={activeView === "dashboard"} onClick={() => setActiveView("dashboard")} icon="📊" label="Dashboard" />
          )}
          {isAdmin && (
            <SidebarButton active={activeView === "roteador"} onClick={() => setActiveView("roteador")} icon="🧭" label="Roteador" />
          )}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 lg:gap-3">
            <span className="text-xl">{user.avatar}</span>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.nome}</p>
              <p className="text-xs text-muted">{user.funcao}</p>
            </div>
          </div>
          {!isAdmin && (
            <button onClick={handleBackToModeSelector}
              className="w-full mt-2 text-xs text-muted hover:text-foreground transition-colors hidden lg:block text-left"
            >
              ← Mudar modo
            </button>
          )}
          <button onClick={handleLogout}
            className="w-full mt-1 text-xs text-muted hover:text-foreground transition-colors hidden lg:block text-left"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onLogout={handleLogout} />

        {/* Mode badge for workers (mobile) */}
        {!isAdmin && workerMode && (
          <button onClick={handleBackToModeSelector}
            className="md:hidden flex items-center gap-2 px-4 py-1.5 border-b border-border bg-background text-xs text-muted"
          >
            <span>{workerMode === "producao" ? "🏗️ Produção" : "🔒 Pessoal"}</span>
            <span className="text-[10px]">← mudar</span>
          </button>
        )}

        <main className="flex-1 min-h-0 relative">
          {isWorkerProducao && activeView !== "documentos" ? (
            <>
              <div className="hidden md:grid md:grid-cols-2 h-full">
                <div className="border-r border-border min-h-0">
                  <ObrasView lang={lang} colaboradorId={user.id} />
                </div>
                <div className="min-h-0">
                  <ChatView user={user} />
                </div>
              </div>

              <div className="md:hidden h-full">
                {(activeView === "fernando" || activeView === "chat") && <ChatView user={user} />}
                {activeView === "obras" && <ObrasView lang={lang} colaboradorId={user.id} />}
                {activeView === "camera" && (
                  <div className="h-full overflow-y-auto p-4 space-y-4">
                    <section className="bg-card rounded-xl p-4 space-y-3">
                      <h2 className="text-sm font-medium text-foreground">Câmara</h2>
                      <p className="text-xs text-muted">
                        Tira foto e associa automaticamente à fase ativa.
                      </p>
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors px-4 py-3 text-sm font-medium"
                      >
                        Abrir câmara
                      </button>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) uploadPhasePhoto(f)
                          e.currentTarget.value = ""
                        }}
                      />
                      {cameraFeedback && <p className="text-xs text-muted">{cameraFeedback}</p>}
                      {lastPhasePhotoUrl && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted">Última foto capturada</p>
                          <img
                            src={lastPhasePhotoUrl}
                            alt="Última foto da fase ativa"
                            className="w-full max-h-64 object-cover rounded-lg border border-border"
                          />
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={`absolute inset-0 ${activeView === "chat" ? "" : "hidden"}`}>
                <ChatView user={user} />
              </div>
              {activeView === "obras" && <ObrasView lang={lang} colaboradorId={user.id} />}
              {activeView === "leads" && isAdmin && <LeadsView user={user} />}
              {activeView === "documentos" && <DocumentosView user={user} />}
              {activeView === "rh" && (isAdmin ? <RHView user={user} /> : <WorkerRHView user={user} />)}
              {activeView === "dashboard" && isAdmin && <DashboardView />}
              {activeView === "dashboard" && !isAdmin && workerMode === "producao" && <WorkerDashboard user={user} />}
              {activeView === "roteador" && isAdmin && <RoteadorView user={user} />}
            </>
          )}
        </main>

        <BottomNav
          active={activeView}
          onChange={setActiveView}
          lang={lang}
          isAdmin={isAdmin}
          workerMode={workerMode}
        />
      </div>
    </div>
  )
}

function SidebarButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: string; label: string
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
        active ? "text-accent bg-accent/10 border-r-2 border-accent" : "text-muted hover:text-foreground hover:bg-card"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="hidden lg:inline">{label}</span>
    </button>
  )
}
