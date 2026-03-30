"use client"

import { useState } from "react"
import type { Colaborador } from "@/lib/types"

export default function LoginScreen({
  onLogin,
}: {
  onLogin: (c: Colaborador) => void
}) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

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
    setLoading(true)
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinCode }),
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

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="mb-6 flex justify-center">
        <img src="/horizontal_black_assinatura.png" alt="CSN" className="h-24 brightness-0 invert" />
      </div>

      <p className="text-muted text-sm mb-8">Introduz o teu PIN</p>

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
