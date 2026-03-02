"use client"

import { useState, useEffect } from "react"
import LoginScreen from "@/components/LoginScreen"
import Header from "@/components/Header"
import BottomNav, { type View } from "@/components/BottomNav"
import ChatView from "@/components/ChatView"
import ObrasView from "@/components/ObrasView"
import DashboardView from "@/components/DashboardView"
import RHView from "@/components/RHView"
import DocumentosView from "@/components/DocumentosView"
import LeadsView from "@/components/LeadsView"
import type { Colaborador } from "@/lib/types"
import type { Lang } from "@/lib/translations"

export default function Home() {
  const [user, setUser] = useState<Colaborador | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<View>("chat")

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
    sessionStorage.setItem("csn_session", JSON.stringify(colaborador))
  }

  const handleLogout = () => {
    setUser(null)
    setActiveView("chat")
    sessionStorage.removeItem("csn_session")
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

  return (
    <div className="flex h-dvh bg-background">
      {/* Desktop sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-16 lg:w-56 border-r border-border bg-background flex-shrink-0">
        <div className="flex items-center justify-center px-4 py-4 border-b border-border">
          <img src="/horizontal_black_assinatura.png" alt="CSN" className="hidden lg:block h-8 brightness-0 invert" />
          <span className="lg:hidden text-accent font-bold text-lg">CSN</span>
        </div>
        <nav className="flex-1 py-2">
          <SidebarButton
            active={activeView === "chat"}
            onClick={() => setActiveView("chat")}
            icon="💬"
            label="Chat"
          />
          <SidebarButton
            active={activeView === "obras"}
            onClick={() => setActiveView("obras")}
            icon="🏗️"
            label="Obras"
          />
          {isAdmin && (
            <SidebarButton
              active={activeView === "leads"}
              onClick={() => setActiveView("leads")}
              icon="📋"
              label="Leads"
            />
          )}
          <SidebarButton
            active={activeView === "documentos"}
            onClick={() => setActiveView("documentos")}
            icon="📂"
            label="Documentos"
          />
          {isAdmin && (
            <>
              <SidebarButton
                active={activeView === "rh"}
                onClick={() => setActiveView("rh")}
                icon="👤"
                label="RH"
              />
              <SidebarButton
                active={activeView === "dashboard"}
                onClick={() => setActiveView("dashboard")}
                icon="📊"
                label="Dashboard"
              />
            </>
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
          <button
            onClick={handleLogout}
            className="w-full mt-2 text-xs text-muted hover:text-foreground transition-colors hidden lg:block text-left"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden">
          <Header user={user} onLogout={handleLogout} />
        </div>

        {/* Desktop header with timer */}
        <div className="hidden md:block">
          <Header user={user} onLogout={handleLogout} />
        </div>

        {/* View content */}
        <main className="flex-1 min-h-0">
          {activeView === "chat" && <ChatView user={user} />}
          {activeView === "obras" && <ObrasView lang={lang} />}
          {activeView === "leads" && isAdmin && <LeadsView />}
          {activeView === "documentos" && <DocumentosView user={user} />}
          {activeView === "rh" && isAdmin && <RHView user={user} />}
          {activeView === "dashboard" && isAdmin && <DashboardView />}
        </main>

        {/* Mobile bottom nav */}
        <BottomNav
          active={activeView}
          onChange={setActiveView}
          lang={lang}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}

function SidebarButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
        active
          ? "text-accent bg-accent/10 border-r-2 border-accent"
          : "text-muted hover:text-foreground hover:bg-card"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="hidden lg:inline">{label}</span>
    </button>
  )
}
