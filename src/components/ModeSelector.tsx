"use client"

import { useState } from "react"
import type { Colaborador } from "@/lib/types"

interface ModeSelectorProps {
  user: Colaborador
  onSelectProducao: () => void
  onSelectPessoal: () => void
  onLogout: () => void
}

export default function ModeSelector({
  user,
  onSelectProducao,
  onSelectPessoal,
  onLogout,
}: ModeSelectorProps) {
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handlePinDigit = (digit: string) => {
    if (pin.length >= 4) return
    const newPin = pin + digit
    setPin(newPin)
    setError(false)
    if (newPin.length === 4) verifyPin(newPin)
  }

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1))
    setError(false)
  }

  const verifyPin = async (pinCode: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinCode }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.colaborador.id === user.id) {
          onSelectPessoal()
        } else {
          setError(true)
          setPin("")
        }
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

  // ── Ecrã re-auth PIN para Área Pessoal ──
  if (showPin) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-background px-4">
        <button
          onClick={() => { setShowPin(false); setPin(""); setError(false) }}
          className="absolute top-4 left-4 text-muted hover:text-foreground text-sm"
        >
          ← Voltar
        </button>

        <div className="mb-8 text-center">
          <div className="text-3xl mb-2">🔒</div>
          <h2 className="text-xl font-semibold text-foreground">Área Pessoal</h2>
          <p className="text-muted text-sm mt-1">Confirma o teu PIN</p>
        </div>

        <div className={`flex gap-3 mb-8 ${error ? "shake" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                i < pin.length
                  ? error ? "bg-danger" : "bg-accent"
                  : "bg-card border border-border"
              }`}
            />
          ))}
        </div>

        {error && <p className="text-danger text-sm mb-4">PIN errado</p>}

        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
          {["1","2","3","4","5","6","7","8","9","","0","←"].map((key) => {
            if (key === "") return <div key="empty" />
            if (key === "←") {
              return (
                <button key="back" onClick={handleBackspace} disabled={loading}
                  className="flex h-16 items-center justify-center rounded-xl bg-card text-xl text-muted hover:bg-card-hover active:scale-95 transition-all"
                >←</button>
              )
            }
            return (
              <button key={key} onClick={() => handlePinDigit(key)}
                disabled={loading || pin.length >= 4}
                className="flex h-16 items-center justify-center rounded-xl bg-card text-2xl font-medium text-foreground hover:bg-card-hover active:scale-95 transition-all"
              >{key}</button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Ecrã selector: Produção vs Pessoal ──
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-background px-4">
      <button onClick={onLogout}
        className="absolute top-4 right-4 text-muted hover:text-foreground text-sm"
      >
        Sair
      </button>

      <div className="mb-12 text-center">
        <span className="text-5xl">{user.avatar}</span>
        <h2 className="mt-3 text-xl font-semibold text-foreground">{user.nome}</h2>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {/* Produção — botão grande, directo */}
        <button onClick={onSelectProducao}
          className="flex flex-col items-center gap-3 rounded-2xl bg-accent/10 border-2 border-accent p-8 transition-all hover:bg-accent/20 active:scale-[0.98]"
        >
          <span className="text-5xl">🏗️</span>
          <span className="text-xl font-bold text-accent">Produção</span>
          <span className="text-muted text-xs">Obras · Fases · Timer</span>
        </button>

        {/* Pessoal — botão pequeno, pede PIN */}
        <button onClick={() => setShowPin(true)}
          className="flex items-center gap-3 rounded-2xl bg-card p-4 transition-all hover:bg-card-hover active:scale-[0.98]"
        >
          <span className="text-2xl">🔒</span>
          <div className="text-left">
            <span className="text-sm font-medium text-foreground">Área Pessoal</span>
            <p className="text-muted text-xs">Recibos · Férias · Dados</p>
          </div>
        </button>
      </div>
    </div>
  )
}
