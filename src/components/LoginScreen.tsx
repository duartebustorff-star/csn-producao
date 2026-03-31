"use client"

import { useEffect, useState } from "react"
import type { Colaborador } from "@/lib/types"

export default function LoginScreen({
  onLogin,
}: {
  onLogin: (c: Colaborador) => void
}) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null)
  const [loadingColaboradores, setLoadingColaboradores] = useState(true)
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadColaboradores = async () => {
      try {
        const res = await fetch("/api/auth")
        const data = await res.json()
        setColaboradores(data.colaboradores || [])
      } catch {
        setColaboradores([])
      } finally {
        setLoadingColaboradores(false)
      }
    }
    loadColaboradores()
  }, [])

  const handlePinDigit = (digit: string) => {
    if (!selectedColaborador) return
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
    if (!selectedColaborador) return
    setLoading(true)
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinCode }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.colaborador?.id === selectedColaborador.id) {
          onLogin(data.colaborador)
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

  if (loadingColaboradores) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-background px-4">
        <p className="text-muted text-sm">A carregar colaboradores...</p>
      </div>
    )
  }

  if (!selectedColaborador) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-background px-4">
        <div className="mb-6 flex justify-center">
          <img src="/horizontal_black_assinatura.png" alt="CSN" className="h-24 brightness-0 invert" />
        </div>
        <p className="text-muted text-sm mb-6">Seleciona o teu nome</p>

        {colaboradores.length === 0 ? (
          <p className="text-danger text-sm">Sem colaboradores ativos</p>
        ) : (
          <div className="w-full max-w-sm space-y-2">
            {colaboradores.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedColaborador(c)
                  setPin("")
                  setError(false)
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-card-hover transition-colors"
              >
                <span className="text-2xl">{c.avatar || "👤"}</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{c.nome}</p>
                  <p className="text-xs text-muted">{c.funcao}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-background px-4">
      <button
        onClick={() => {
          setSelectedColaborador(null)
          setPin("")
          setError(false)
        }}
        className="absolute top-4 left-4 text-muted hover:text-foreground text-sm"
      >
        ← Voltar
      </button>

      <div className="mb-6 flex justify-center">
        <img src="/horizontal_black_assinatura.png" alt="CSN" className="h-24 brightness-0 invert" />
      </div>

      <div className="mb-4 text-center">
        <p className="text-foreground font-medium">{selectedColaborador.nome}</p>
        <p className="text-muted text-sm">Introduz o teu PIN</p>
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

      {/* Numpad */}
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
                disabled={loading || pin.length >= 4 || !selectedColaborador}
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
