"use client"

import { useState } from "react"
import type { Colaborador } from "@/lib/types"

type Origem = "manual" | "email" | "whatsapp"

interface RoteadorSuccess {
  ok: true
  documento_id?: number
  classificacao?: {
    tipo?: string
    estado?: string
    fornecedor?: { id: number; nome: string | null } | null
    urgencia?: string
    entidade?: { tipo?: string | null; nif?: string | null; nome?: string | null }
    data_entrada?: string
    notas?: string | null
    confianca?: number | null
  }
  [key: string]: unknown
}

export default function RoteadorView({ user }: { user: Colaborador }) {
  const [file, setFile] = useState<File | null>(null)
  const [origem, setOrigem] = useState<Origem>("manual")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<unknown>(null)

  const submit = async () => {
    if (!file) {
      setError("Escolha um ficheiro (PDF ou imagem).")
      return
    }
    setLoading(true)
    setError(null)
    setPayload(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("origem", origem)
      fd.append("tipo_entrada", "upload_dashboard")
      fd.append("colaborador_id", user.id)
      const res = await fetch("/api/roteador", { method: "POST", body: fd })
      const data = await res.json()
      setPayload(data)
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : typeof data.detalhe === "string"
              ? data.detalhe
              : "Pedido falhou."
        )
      }
    } catch {
      setError("Erro de rede ao contactar o servidor.")
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }

  const ok = payload && typeof payload === "object" && (payload as { ok?: boolean }).ok === true
  const data = ok ? (payload as RoteadorSuccess) : null
  const c = data?.classificacao

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Agente Roteador (L3-DOC)</h1>
        <p className="text-sm text-muted mt-1">
          Envio de teste: classificação automática com Claude e registo em documentos.
        </p>
      </div>

      <section className="bg-card rounded-xl p-4 space-y-4 border border-border">
        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Ficheiro</label>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/gif,image/webp"
            className="block w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/25"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setError(null)
              setPayload(null)
            }}
          />
          {file && (
            <p className="text-xs text-muted mt-2">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Origem</label>
          <select
            value={origem}
            onChange={(e) => setOrigem(e.target.value as Origem)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
          >
            <option value="manual">Manual (upload na app)</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={loading || !file}
          className="w-full rounded-lg bg-accent text-background font-medium py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 transition-opacity"
        >
          {loading ? "A classificar…" : "Submeter"}
        </button>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </section>

      {data && c && (
        <section className="bg-card rounded-xl p-4 space-y-3 border border-border">
          <h2 className="text-sm font-medium text-foreground">Classificação</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Tipo de documento</dt>
              <dd className="font-mono text-accent mt-0.5">{c.tipo ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Urgência</dt>
              <dd className="font-mono mt-0.5">{c.urgencia ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Estado</dt>
              <dd className="font-mono mt-0.5">{c.estado ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted">Fornecedor identificado</dt>
              <dd className="mt-0.5">
                {c.fornecedor ? (
                  <span className="font-mono text-foreground">
                    {c.fornecedor.nome} <span className="text-muted">(id {c.fornecedor.id})</span>
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {payload != null && (
        <section className="bg-card rounded-xl p-4 border border-border">
          <h2 className="text-sm font-medium text-foreground mb-2">Resposta JSON</h2>
          <pre className="text-xs font-mono text-muted overflow-x-auto whitespace-pre-wrap break-words max-h-[min(480px,50vh)] overflow-y-auto p-3 rounded-lg bg-background border border-border">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </section>
      )}
    </div>
  )
}
