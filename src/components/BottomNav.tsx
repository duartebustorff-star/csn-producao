"use client"

import type { Lang } from "@/lib/translations"
import type { WorkerMode } from "@/app/page"

export type View =
  | "chat"
  | "obras"
  | "leads"
  | "documentos"
  | "rh"
  | "dashboard"
  | "roteador"
  | "fernando"
  | "camera"

interface BottomNavProps {
  active: View
  onChange: (view: View) => void
  lang: Lang
  isAdmin: boolean
  workerMode?: WorkerMode | null
}

const ICONS: Record<View, string> = {
  chat: "💬",
  obras: "🏗️",
  leads: "📋",
  documentos: "📂",
  rh: "👤",
  dashboard: "📊",
  roteador: "🧭",
  fernando: "🤖",
  camera: "📷",
}

const LABELS: Record<View, string> = {
  chat: "Chat",
  obras: "Obras",
  leads: "Leads",
  documentos: "Documentos",
  rh: "RH",
  dashboard: "Dashboard",
  roteador: "Roteador",
  fernando: "Fernando",
  camera: "Câmara",
}

export default function BottomNav({ active, onChange, lang, isAdmin, workerMode }: BottomNavProps) {
  let views: View[]

  if (isAdmin) {
    views = ["chat", "obras", "leads", "documentos", "rh", "dashboard", "roteador"]
  } else if (workerMode === "pessoal") {
    views = ["rh", "chat"]
  } else {
    // producao
    views = ["obras", "fernando", "camera"]
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
            <span className="text-xs font-medium">{LABELS[view]}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

