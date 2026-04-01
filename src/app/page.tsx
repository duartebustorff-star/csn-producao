"use client"

import { useState, useEffect } from "react"
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
import WorkerDashboard from "@/components/WorkerDashboard"
import type { Colaborador } from "@/lib/types"
import type { Lang } from "@/lib/translations"

export type WorkerMode = "producao" | "pessoal"

export default function Home() {
  const [user, setUser] = useState<Colaborador | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<View>("chat")
  const [workerMode, setWorkerMode] = useState<WorkerMode | null>(null)

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

  // Workers: show ModeSelector before entering the app
  if (!isAdmin && !workerMode) {
    return (
      <ModeSelector
        user={user}
        onSelectProducao={() => { setWorkerMode("producao"); setActiveView("chat") }}
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
            <SidebarButton active={activeView === "chat"} onClick={() => setActiveView("chat")} icon="💬" label="Chat" />
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
          <div className={`absolute inset-0 ${activeView === "chat" ? "" : "hidden"}`}>
            <ChatView user={user} />
          </div>
          {activeView === "obras" && <ObrasView lang={lang} colaboradorId={user.id} />}
          {activeView === "leads" && isAdmin && <LeadsView user={user} />}
          {activeView === "documentos" && <DocumentosView user={user} />}
          {activeView === "rh" && (isAdmin ? <RHView user={user} /> : <WorkerRHView user={user} />)}
          {activeView === "dashboard" && isAdmin && <DashboardView />}
          {activeView === "dashboard" && !isAdmin && workerMode === "producao" && <WorkerDashboard user={user} />}
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
