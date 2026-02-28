"use client"

import { t, type Lang } from "@/lib/translations"

export type View = "chat" | "obras" | "leads" | "rh" | "dashboard"

interface BottomNavProps {
  active: View
  onChange: (view: View) => void
  lang: Lang
  isAdmin: boolean
}

const ICONS: Record<View, string> = {
  chat: "💬",
  obras: "🏗️",
  leads: "📋",
  rh: "📁",
  dashboard: "📊",
}

export default function BottomNav({ active, onChange, lang, isAdmin }: BottomNavProps) {
  const views: View[] = isAdmin
    ? ["chat", "obras", "leads", "rh", "dashboard"]
    : ["chat", "obras", "rh"]

  return (
    <nav className="border-t border-border bg-background/80 backdrop-blur-sm sticky bottom-0 z-40 md:hidden">
      <div className="flex">
        {views.map((view) => (
          <button
            key={view}
            onClick={() => onChange(view)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              active === view
                ? "text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span className="text-lg">{ICONS[view]}</span>
            <span className="text-xs font-medium">{t(lang, view)}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
