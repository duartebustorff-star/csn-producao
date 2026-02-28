"use client"

import { useRef } from "react"
import { t, type Lang } from "@/lib/translations"

export interface ChatContext {
  timerAtivo: boolean
  lastBotMessage: string
  hasTarefas: boolean
}

interface QuickActionsProps {
  onSend: (message: string) => void
  onFileUpload: (file: File, type: "foto" | "documento") => void
  lang: Lang
  context: ChatContext
}

type TKey = Parameters<typeof t>[1]

export default function QuickActions({ onSend, onFileUpload, lang, context }: QuickActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTypeRef = useRef<"foto" | "documento">("foto")

  // Main actions — change based on timer state
  const mainActions: { key: TKey; emoji: string }[] = [
    { key: "que_fazer", emoji: "📋" },
    context.timerAtivo
      ? { key: "parar", emoji: "⏹️" }
      : { key: "iniciar", emoji: "▶️" },
    { key: "acabei", emoji: "✅" },
  ]

  // Context actions — second scrollable row
  const contextActions: { key: TKey; emoji: string }[] = [
    { key: "estou_doente", emoji: "🤒" },
    { key: "preciso_material", emoji: "📦" },
    { key: "problema_obra", emoji: "⚠️" },
    { key: "enviar_foto", emoji: "📸" },
    { key: "enviar_documento", emoji: "📄" },
  ]

  // Follow-up buttons based on last bot message
  const followUpActions = getFollowUpActions(context.lastBotMessage, lang)

  const handleFileClick = (type: "foto" | "documento") => {
    uploadTypeRef.current = type
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === "foto" ? "image/*" : "image/*,application/pdf"
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file, uploadTypeRef.current)
      e.target.value = ""
    }
  }

  const handleAction = (key: TKey) => {
    if (key === "enviar_foto") {
      handleFileClick("foto")
    } else if (key === "enviar_documento") {
      handleFileClick("documento")
    } else {
      onSend(t(lang, key))
    }
  }

  return (
    <div className="space-y-1.5">
      {/* Follow-up buttons (inline after bot response) */}
      {followUpActions.length > 0 && (
        <div className="flex gap-2 px-4 py-1 overflow-x-auto">
          {followUpActions.map((action) => (
            <button
              key={action.key}
              onClick={() => {
                if (action.key === "sim_enviar_baixa") {
                  handleFileClick("documento")
                } else {
                  onSend(t(lang, action.key))
                }
              }}
              className="flex-shrink-0 text-xs bg-accent/15 text-accent hover:bg-accent/25 px-3 py-1.5 rounded-full transition-colors"
            >
              {t(lang, action.key)}
            </button>
          ))}
        </div>
      )}

      {/* Main action row */}
      <div className="flex gap-2 px-4 py-1 overflow-x-auto">
        {mainActions.map((action) => (
          <button
            key={action.key}
            onClick={() => handleAction(action.key)}
            className="flex-shrink-0 flex items-center gap-1.5 bg-card hover:bg-card-hover text-sm text-foreground px-3 py-1.5 rounded-full transition-colors"
          >
            <span>{action.emoji}</span>
            <span>{t(lang, action.key)}</span>
          </button>
        ))}
      </div>

      {/* Context actions row */}
      <div className="flex gap-2 px-4 py-1 overflow-x-auto">
        {contextActions.map((action) => (
          <button
            key={action.key}
            onClick={() => handleAction(action.key)}
            className="flex-shrink-0 flex items-center gap-1.5 bg-card/50 hover:bg-card text-xs text-muted hover:text-foreground px-2.5 py-1 rounded-full transition-colors"
          >
            <span>{action.emoji}</span>
            <span>{t(lang, action.key)}</span>
          </button>
        ))}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

function getFollowUpActions(lastBotMessage: string, lang: Lang): { key: Parameters<typeof t>[1] }[] {
  if (!lastBotMessage) return []

  const msg = lastBotMessage.toLowerCase()

  // After sickness-related response — ask about CIT
  if (
    msg.includes("doente") || msg.includes("sick") || msg.includes("хвор") ||
    msg.includes("baixa") || msg.includes("ausência") || msg.includes("absence")
  ) {
    return [
      { key: "sim_enviar_baixa" },
      { key: "ainda_nao_tenho" },
    ]
  }

  // After "still don't have CIT"
  if (msg.includes("ainda não") || msg.includes("don't have") || msg.includes("ще не")) {
    return [
      { key: "volto_amanha" },
      { key: "nao_sei_quando" },
    ]
  }

  // After problem report
  if (msg.includes("problema") || msg.includes("problem") || msg.includes("проблем")) {
    return [
      { key: "falta_material" },
      { key: "defeito" },
      { key: "maquina_avariada" },
      { key: "outro" },
    ]
  }

  // After material request
  if (msg.includes("material") || msg.includes("матеріал")) {
    // No specific follow-ups for now — the bot will ask details
    return []
  }

  // Suppress unused variable warning
  void lang

  return []
}
