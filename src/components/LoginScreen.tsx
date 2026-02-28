"use client"

import { useState } from "react"
import type { Colaborador } from "@/lib/types"

const COLABORADORES_PREVIEW = [
  { id: "duarte", nome: "Duarte", funcao: "Gestor", avatar: "📋" },
  { id: "bohdan", nome: "Bohdan", funcao: "Operador", avatar: "⚙️" },
  { id: "joao", nome: "João António", funcao: "Operador", avatar: "🔧" },
  { id: "jose", nome: "José Julio", funcao: "Operador", avatar: "🎨" },
]

export default function LoginScreen({
  onLogin,
}: {
  onLogin: (c: Colaborador) => void
}) {
  const [step, setStep] = useState<"select" | "pin">("select")
  const [selected, setSelected] = useState<(typeof COLABORADORES_PREVIEW)[0] | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSelect = (colab: (typeof COLABORADORES_PREVIEW)[0]) => {
    setSelected(colab)
    setPin("")
    setError(false)
    setStep("pin")
  }

  const handlePinDigit = (digit: string) => {
    if (pin.length >= 4) return
    const newPin = pin + digit
    setPin(newPin)
    setError(false)

    if (newPin.length === 4) {
      submitPin(newPin)
    }
  }

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1))
    setError(false)
  }

  const submitPin = async (pinCode: string) => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colaborador_id: selected.id, pin: pinCode }),
      })
      if (res.ok) {
        const data = await res.json()
        onLogin(data.colaborador)
      } else {
        setError(true)
        setPin("")
      }
    } catch {
      setError(true)
      setPin("")
    }
    setLoading(false)
  }

  // Ecrã de seleção de colaborador
  if (step === "select") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-background px-4">
        <div className="mb-8 text-center">
          <h1 className="text-accent text-3xl font-bold">CSN</h1>
          <p className="text-muted mt-1 text-sm">Produção</p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          {COLABORADORES_PREVIEW.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelect(c)}
              className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 transition-all hover:bg-card-hover active:scale-95"
            >
              <span className="text-4xl">{c.avatar}</span>
              <span className="font-medium text-foreground">{c.nome}</span>
              <span className="text-muted text-xs">{c.funcao}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Ecrã de PIN
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-background px-4">
      <button
        onClick={() => setStep("select")}
        className="absolute top-4 left-4 text-muted hover:text-foreground text-sm"
      >
        ← Voltar
      </button>

      <div className="mb-8 text-center">
        <span className="text-5xl">{selected?.avatar}</span>
        <h2 className="mt-3 text-xl font-semibold text-foreground">
          {selected?.nome}
        </h2>
        <p className="text-muted text-sm mt-1">Introduz o PIN</p>
      </div>

      {/* PIN dots */}
      <div className={`flex gap-3 mb-8 ${error ? "shake" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < pin.length
                ? error
                  ? "bg-danger"
                  : "bg-accent"
                : "bg-card border border-border"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-danger text-sm mb-4">PIN errado</p>
      )}

      {/* Teclado numérico */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"].map(
          (key) => {
            if (key === "") return <div key="empty" />
            if (key === "←") {
              return (
                <button
                  key="back"
                  onClick={handleBackspace}
                  disabled={loading}
                  className="flex h-16 items-center justify-center rounded-xl bg-card text-xl text-muted hover:bg-card-hover active:scale-95 transition-all"
                >
                  ←
                </button>
              )
            }
            return (
              <button
                key={key}
                onClick={() => handlePinDigit(key)}
                disabled={loading || pin.length >= 4}
                className="flex h-16 items-center justify-center rounded-xl bg-card text-2xl font-medium text-foreground hover:bg-card-hover active:scale-95 transition-all"
              >
                {key}
              </button>
            )
          }
        )}
      </div>
    </div>
  )
}
