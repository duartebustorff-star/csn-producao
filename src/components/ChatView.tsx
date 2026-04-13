"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { Colaborador } from "@/lib/types"
import { t, type Lang } from "@/lib/translations"
import ChatMessage from "./ChatMessage"
import QuickActions, { type ChatContext } from "./QuickActions"
import CITWizard, { type CITWizardData } from "./CITWizard"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export default function ChatView({ user }: { user: Colaborador }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [timerAtivo, setTimerAtivo] = useState(false)
  const [citWizard, setCitWizard] = useState<CITWizardData | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lang = user.lang as Lang

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  // Load message history from Supabase on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/mensagens?colaborador_id=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.mensagens && data.mensagens.length > 0) {
            const loaded: Message[] = data.mensagens.map(
              (m: { role: string; content: string; created_at: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
                timestamp: new Date(m.created_at).toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })
            )
            setMessages(loaded)
          }
        }
      } catch {
        // Silently fail — start with empty chat
      }
      setLoadingHistory(false)
    }
    loadHistory()
  }, [user.id])

  // Check if timer is active
  const checkTimer = useCallback(async () => {
    try {
      const res = await fetch(`/api/timer?colaborador_id=${user.id}`)
      const data = await res.json()
      setTimerAtivo(!!data.timer)
    } catch { /* ignore */ }
  }, [user.id])

  useEffect(() => {
    checkTimer()
    const interval = setInterval(checkTimer, 15000)
    return () => clearInterval(interval)
  }, [checkTimer])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const now = new Date().toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    })

    const userMessage: Message = { role: "user", content: trimmed, timestamp: now }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaborador_id: user.id,
          message: trimmed,
          history: messages.slice(-20),
        }),
      })

      const data = await res.json()
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || data.error || "Erro ao processar",
        timestamp: new Date().toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }
      setMessages((prev) => [...prev, assistantMessage])
      checkTimer() // Refresh timer state after bot response
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Erro de ligação. Tenta novamente.",
          timestamp: new Date().toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ])
    }

    setLoading(false)
    inputRef.current?.focus()
  }

  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(",")[1]) // strip data:...;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleFileUpload = async (files: File[], type: "foto" | "documento") => {
    const total = files.length
    setLoading(true)

    for (let i = 0; i < total; i++) {
      const file = files[i]
      const now = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
      const label = type === "foto" ? `📸 ${file.name}` : `📄 ${file.name}`
      setMessages((prev) => [...prev, { role: "user", content: label, timestamp: now }])

      if (total > 1) {
        setUploadProgress(`A processar ficheiro ${i + 1} de ${total}...`)
      }

      try {
        // FOTOS → send to chat so Claude sees the image in conversation
        if (type === "foto" && file.type.startsWith("image/")) {
          const base64 = await fileToBase64(file)
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              colaborador_id: user.id,
              message: `[Foto: ${file.name}]`,
              history: messages.slice(-20),
              images: [{ data: base64, media_type: file.type }],
            }),
          })
          const data = await res.json()
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.response || data.error || "Erro ao processar foto.",
              timestamp: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
            },
          ])
          checkTimer()
          continue
        }

        // DOCUMENTOS → send to classifier pipeline
        const formData = new FormData()
        formData.append("file", file)
        formData.append("colaborador_id", user.id)
        formData.append("uploaded_by", user.id)

        const uploadRes = await fetch("/api/documentos/upload", {
          method: "POST",
          body: formData,
        })
        const uploadData = await uploadRes.json()

        // CIT preview → launch wizard instead of showing final message
        if (uploadData.tipo === "CIT_PREVIEW") {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: uploadData.mensagem,
              timestamp: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
            },
          ])
          setCitWizard({
            step: "tipo",
            dados: uploadData.dados,
            fileUrl: uploadData.file_url,
            filePath: uploadData.file_path,
            numeroCit: uploadData.numero_cit,
            colaboradorMatch: uploadData.colaborador_match,
            tipoCit: (uploadData.dados.tipo_cit as string) || "inicial",
            dataInicio: (uploadData.dados.data_inicio as string) || "",
            dataFim: (uploadData.dados.data_fim as string) || "",
          })
          setUploadProgress(null)
          setLoading(false)
          return // Stop processing further files while wizard is active
        }

        const responseContent = uploadData.error || uploadData.mensagem || "Documento processado."

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: responseContent,
            timestamp: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
          },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Erro ao enviar ${file.name}.`,
            timestamp: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
          },
        ])
      }
    }

    setUploadProgress(null)
    setLoading(false)
  }

  const handleCitConfirm = async (wizardData: CITWizardData) => {
    setLoading(true)
    setCitWizard(null)
    try {
      const res = await fetch("/api/cits/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_cit: wizardData.tipoCit,
          data_inicio: wizardData.dataInicio,
          data_fim: wizardData.dataFim,
          numero_cit: wizardData.numeroCit,
          dados_originais: wizardData.dados,
          file_url: wizardData.fileUrl,
          file_path: wizardData.filePath,
          uploaded_by: user.id,
          colaborador_match_id: wizardData.colaboradorMatch?.id || null,
          colaborador_match_nome: wizardData.colaboradorMatch?.nome || null,
        }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.mensagem || data.error || "CIT registado.",
          timestamp: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Erro ao confirmar CIT. Tenta novamente.",
          timestamp: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    }
    setLoading(false)
  }

  const handleCitCancel = () => {
    setCitWizard(null)
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Registo de CIT cancelado.",
        timestamp: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
      },
    ])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  // Build context for QuickActions
  const lastBotMessage = [...messages].reverse().find((m) => m.role === "assistant")?.content || ""
  const chatContext: ChatContext = {
    timerAtivo,
    lastBotMessage,
    hasTarefas: true, // Assume tasks exist; will be refined by bot responses
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loadingHistory && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex gap-1 mb-3">
              <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-muted text-sm">A carregar mensagens...</p>
          </div>
        )}
        {!loadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-4xl mb-3">🏭</span>
            <p className="text-muted text-sm">
              {lang === "ua"
                ? "Привіт! Чим можу допомогти?"
                : lang === "en"
                  ? "Hi! How can I help?"
                  : "Olá! Como posso ajudar?"}
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            avatar={user.avatar}
            timestamp={msg.timestamp}
          />
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-sm">
              🤖
            </div>
            <div className="bg-card rounded-2xl rounded-bl-md px-4 py-3">
              {uploadProgress ? (
                <p className="text-xs text-muted">{uploadProgress}</p>
              ) : (
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>
          </div>
        )}
        {citWizard && !loading && (
          <CITWizard
            data={citWizard}
            onUpdate={setCitWizard}
            onConfirm={handleCitConfirm}
            onCancel={handleCitCancel}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions — hidden during wizard */}
      {!citWizard && (
        <QuickActions
          onSend={sendMessage}
          onFileUpload={handleFileUpload}
          lang={lang}
          context={chatContext}
        />
      )}

      {/* Input — hidden during wizard */}
      {!citWizard && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t(lang, "escreve_mensagem")}
              disabled={loading}
              className="flex-1 bg-card border border-border rounded-full px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-accent hover:bg-accent-dark disabled:opacity-40 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
