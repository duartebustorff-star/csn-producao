"use client"

import type { Colaborador } from "@/lib/types"
import { t, type Lang } from "@/lib/translations"
import TimerBanner from "./TimerBanner"

interface HeaderProps {
  user: Colaborador
  onLogout: () => void
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-lg tracking-tight">CSN</span>
          <span className="text-muted text-xs hidden sm:inline">Produção</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm">
            {user.avatar} <span className="hidden sm:inline">{user.nome}</span>
          </span>
          <button
            onClick={onLogout}
            className="text-muted hover:text-foreground text-xs transition-colors"
          >
            {t(user.lang as Lang, "logout")}
          </button>
        </div>
      </div>
      <TimerBanner colaboradorId={user.id} lang={user.lang as Lang} />
    </header>
  )
}
