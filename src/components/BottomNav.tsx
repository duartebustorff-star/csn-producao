"use client"

import { t, type Lang } from "@/lib/translations"
import type { WorkerMode } from "@/app/page"

export type View = "chat" | "obras" | "leads" | "documentos" | "rh" | "dashboard"

interface BottomNavProps {
  active: View
  onChange: (view: View) => void
  lang: Lang
  isAdmin: boolean
  workerMode?: WorkerMode | null
}

const ICONS: Record<View, string> = {
  chat: "­ƒÆ¼",
  obras: "­ƒÅù´©Å",
  leads: "­ƒôï",
  documentos: "­ƒôé",
  rh: "­ƒæñ",
  dashboard: "­ƒôè",
}

export default function BottomNav({ active, onChange, lang, isAdmin, workerMode }: BottomNavProps) {
  let views: View[]

  if (isAdmin) {
    views = ["chat", "obras", "leads", "documentos", "rh", "dashboard"]
  } else if (workerMode === "pessoal") {
    views = ["rh", "chat"]
  } else {
    // producao
    views = ["chat", "obras", "dashboard", "documentos"]
  }

  return (
    <nav className="border-t border-border bg-background/80 backdrop-blur-sm sticky bottom-0 z-40 md:hidden">
      <div className="flex">
        {views.map((view) => (
          <button
            key={view}
            onClick={() => onChange(view)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              active === view ? "text-accent" : "text-muted hover:text-foreground"
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

