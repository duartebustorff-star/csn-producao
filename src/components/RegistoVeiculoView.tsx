"use client"

import { useState, useRef, useEffect } from "react"
import type { Colaborador } from "@/lib/types"
import PropostaWizard from "./PropostaWizard"

type Opcao = null | "nova" | "reparacao" | "movimento"

interface Props {
  user: Colaborador
}

export default function RegistoVeiculoView({ user }: Props) {
  const [opcao, setOpcao] = useState<Opcao>(null)

  if (opcao === "nova") {
    return (
      <PropostaWizard
        colaboradorId={user.id}
        colaboradorNome={user.nome}
        onClose={() => setOpcao(null)}
        onSubmit={() => setOpcao(null)}
      />
    )
  }

  if (opcao === "reparacao") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background px-4">
        <button
          onClick={() => setOpcao(null)}
          className="absolute top-4 left-4 text-muted hover:text-foreground text-sm"
        >
          ← Voltar
        </button>
        <span className="text-6xl mb-4">🔧</span>
        <h2 className="text-xl font-semibold text-foreground">Reparação</h2>
        <p className="text-muted text-sm mt-2">Em desenvolvimento</p>
      </div>
    )
  }

  if (opcao === "movimento") {
    return <MovimentoForm user={user} onBack={() => setOpcao(null)} />
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <span className="text-5xl">🚛</span>
        <h2 className="mt-3 text-xl font-semibold text-foreground">Registo de Veículo</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
        <button
          onClick={() => setOpcao("nova")}
          className="flex items-center gap-3 rounded-2xl bg-accent/10 border-2 border-accent p-5 transition-all hover:bg-accent/20 active:scale-[0.98]"
        >
          <span className="text-3xl">🏗️</span>
          <div className="text-left flex-1">
            <span className="text-sm font-bold text-accent block">Carroçaria nova</span>
            <span className="text-muted text-xs">Proposta de obra</span>
          </div>
        </button>

        <button
          onClick={() => setOpcao("reparacao")}
          className="flex items-center gap-3 rounded-2xl bg-card border-2 border-border p-5 transition-all hover:bg-card-hover active:scale-[0.98]"
        >
          <span className="text-3xl">🔧</span>
          <div className="text-left flex-1">
            <span className="text-sm font-bold text-foreground block">Reparação</span>
            <span className="text-muted text-xs">Recuperar carroçaria</span>
          </div>
        </button>

        <button
          onClick={() => setOpcao("movimento")}
          className="flex items-center gap-3 rounded-2xl bg-green-500/10 border-2 border-green-500 p-5 transition-all hover:bg-green-500/20 active:scale-[0.98]"
        >
          <span className="text-3xl">🅿️</span>
          <div className="text-left flex-1">
            <span className="text-sm font-bold text-green-500 block">Entrada / Saída viatura</span>
            <span className="text-muted text-xs">Movimento no parque</span>
          </div>
        </button>
      </div>
    </div>
  )
}

// ─── Movimento (Entrada/Saída) ────────────────────────────────

interface MovimentoProps {
  user: Colaborador
  onBack: () => void
}

function MovimentoForm({ user, onBack }: MovimentoProps) {
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada")
  const [matricula, setMatricula] = useState("")
  const [marca, setMarca] = useState("")
  const [modelo, setModelo] = useState("")
  const [lugarLivre, setLugarLivre] = useState<number | null>(null)
  const [lugarEscolhido, setLugarEscolhido] = useState<number | "">("")
  const [fotoVeiculo, setFotoVeiculo] = useState<File | null>(null)
  const [fotoVin, setFotoVin] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const fotoVeiculoRef = useRef<HTMLInputElement>(null)
  const fotoVinRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tipo !== "entrada") return
    fetch("/api/parque/movimento")
      .then((r) => r.json())
      .then((d) => {
        if (d.lugar_livre) {
          setLugarLivre(d.lugar_livre)
          setLugarEscolhido(d.lugar_livre)
        }
      })
      .catch(() => {})
  }, [tipo])

  const submeter = async () => {
    if (!matricula.trim()) {
      setFeedback("Matrícula obrigatória")
      return
    }
    setLoading(true)
    setFeedback(null)
    try {
      const fd = new FormData()
      fd.append("tipo", tipo)
      fd.append("matricula", matricula.toUpperCase())
      fd.append("marca", marca)
      fd.append("modelo", modelo)
      if (lugarEscolhido) fd.append("lugar_numero", String(lugarEscolhido))
      fd.append("colaborador_id", user.id)
      if (fotoVeiculo) fd.append("foto_veiculo", fotoVeiculo)
      if (fotoVin) fd.append("foto_vin", fotoVin)

      const res = await fetch("/api/parque/movimento", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setFeedback(data.error || "Erro ao registar movimento")
      } else {
        setFeedback("Movimento registado com sucesso")
        setTimeout(onBack, 1200)
      }
    } catch {
      setFeedback("Erro de ligação")
    }
    setLoading(false)
  }

  return (
    <div className="h-full overflow-y-auto bg-background px-4 pt-12 pb-6">
      <button onClick={onBack} className="absolute top-4 left-4 text-muted hover:text-foreground text-sm">
        ← Voltar
      </button>

      <div className="max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-foreground text-center">
          {tipo === "entrada" ? "Entrada de viatura" : "Saída de viatura"}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => setTipo("entrada")}
            className={`flex-1 rounded-xl p-3 text-sm font-medium transition-colors ${
              tipo === "entrada" ? "bg-green-500/20 text-green-500 border-2 border-green-500" : "bg-card text-muted border-2 border-border"
            }`}
          >
            Entrada
          </button>
          <button
            onClick={() => setTipo("saida")}
            className={`flex-1 rounded-xl p-3 text-sm font-medium transition-colors ${
              tipo === "saida" ? "bg-accent/20 text-accent border-2 border-accent" : "bg-card text-muted border-2 border-border"
            }`}
          >
            Saída
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted">Foto do veículo</label>
          <button
            onClick={() => fotoVeiculoRef.current?.click()}
            className="w-full rounded-lg bg-card border border-border px-4 py-3 text-sm text-left"
          >
            {fotoVeiculo ? `📸 ${fotoVeiculo.name}` : "📷 Tirar foto"}
          </button>
          <input
            ref={fotoVeiculoRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => setFotoVeiculo(e.target.files?.[0] || null)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted">Foto do VIN</label>
          <button
            onClick={() => fotoVinRef.current?.click()}
            className="w-full rounded-lg bg-card border border-border px-4 py-3 text-sm text-left"
          >
            {fotoVin ? `📸 ${fotoVin.name}` : "📷 Tirar foto"}
          </button>
          <input
            ref={fotoVinRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => setFotoVin(e.target.files?.[0] || null)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted">Matrícula</label>
          <input
            type="text"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            placeholder="XX-00-XX"
            className="w-full rounded-lg bg-card border border-border px-4 py-3 text-sm text-foreground uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-xs text-muted">Marca</label>
            <input
              type="text"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="w-full rounded-lg bg-card border border-border px-4 py-3 text-sm text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted">Modelo</label>
            <input
              type="text"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="w-full rounded-lg bg-card border border-border px-4 py-3 text-sm text-foreground"
            />
          </div>
        </div>

        {tipo === "entrada" && (
          <div className="space-y-2">
            <label className="text-xs text-muted">
              Lugar de parque {lugarLivre && `(sugerido: ${lugarLivre})`}
            </label>
            <input
              type="number"
              value={lugarEscolhido}
              onChange={(e) => setLugarEscolhido(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg bg-card border border-border px-4 py-3 text-sm text-foreground"
            />
          </div>
        )}

        {feedback && (
          <p className="text-sm text-center text-muted">{feedback}</p>
        )}

        <button
          onClick={submeter}
          disabled={loading}
          className="w-full rounded-xl bg-accent text-background py-3 text-sm font-bold disabled:opacity-50"
        >
          {loading ? "A registar..." : "Registar movimento"}
        </button>
      </div>
    </div>
  )
}
