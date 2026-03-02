"use client"

import { useState, useEffect, useCallback } from "react"
import type { Colaborador } from "@/lib/types"

type DocSection = "veiculos" | "rh" | "geral"
type DocSubType = "davs" | "fams" | "inspecoes" | "cits" | "outros"

interface Counts {
  davs: number
  fams: number
  inspecoes: number
  cits: number
  outros: number
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("pt-PT")
  } catch {
    return dateStr
  }
}

export default function DocumentosView({ user }: { user: Colaborador }) {
  const [section, setSection] = useState<DocSection>("veiculos")
  const [activeType, setActiveType] = useState<DocSubType>("davs")
  const [counts, setCounts] = useState<Counts>({ davs: 0, fams: 0, inspecoes: 0, cits: 0, outros: 0 })
  const [documentos, setDocumentos] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(false)

  // Fetch counts on mount (pass user context for CITs filtering)
  useEffect(() => {
    fetch(`/api/documentos/list?user_id=${user.id}&role=${user.role}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.counts) setCounts(data.counts)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user.id, user.role])

  const fetchDocs = useCallback(async (tipo: DocSubType) => {
    setLoadingDocs(true)
    try {
      const res = await fetch(`/api/documentos/list?tipo=${tipo}&user_id=${user.id}&role=${user.role}`)
      const data = await res.json()
      setDocumentos(data.documentos || [])
    } catch {
      setDocumentos([])
    }
    setLoadingDocs(false)
  }, [user.id, user.role])

  // Fetch docs when active type changes
  useEffect(() => {
    fetchDocs(activeType)
  }, [activeType, fetchDocs])

  // When section changes, set default active type
  const handleSection = (s: DocSection) => {
    setSection(s)
    if (s === "veiculos") setActiveType("davs")
    else if (s === "rh") setActiveType("cits")
    else setActiveType("outros")
  }

  const SECTIONS: { key: DocSection; label: string; icon: string }[] = [
    { key: "veiculos", label: "Veículos", icon: "🚛" },
    { key: "rh", label: "RH", icon: "👤" },
    { key: "geral", label: "Geral", icon: "📄" },
  ]

  const SUBTYPES: Record<DocSection, { key: DocSubType; label: string; countKey: keyof Counts }[]> = {
    veiculos: [
      { key: "davs", label: "DAVs", countKey: "davs" },
      { key: "fams", label: "FAMs", countKey: "fams" },
      { key: "inspecoes", label: "Inspeções", countKey: "inspecoes" },
    ],
    rh: [
      { key: "cits", label: "CITs", countKey: "cits" },
    ],
    geral: [
      { key: "outros", label: "Outros", countKey: "outros" },
    ],
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted text-sm">A carregar...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Section tabs */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => handleSection(s.key)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                section === s.key
                  ? "bg-accent text-white"
                  : "bg-card text-muted hover:text-foreground"
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-type tabs with badges */}
      <div className="px-4 py-2 border-b border-border">
        <div className="flex gap-2">
          {SUBTYPES[section].map((st) => (
            <button
              key={st.key}
              onClick={() => setActiveType(st.key)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                activeType === st.key
                  ? "bg-accent/20 text-accent"
                  : "bg-card text-muted hover:text-foreground"
              }`}
            >
              <span>{st.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeType === st.key ? "bg-accent/30" : "bg-border"
              }`}>
                {counts[st.countKey]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loadingDocs ? (
          <p className="text-center text-muted text-sm py-8">A carregar...</p>
        ) : documentos.length === 0 ? (
          <p className="text-center text-muted text-sm py-8">Sem documentos</p>
        ) : (
          documentos.map((doc) => (
            <DocCard key={doc.id as number} doc={doc} tipo={activeType} />
          ))
        )}
      </div>
    </div>
  )
}

function DocCard({ doc, tipo }: { doc: Record<string, unknown>; tipo: DocSubType }) {
  const [expanded, setExpanded] = useState(false)

  const fileUrl = (doc.url_ficheiro || doc.url) as string | null

  return (
    <div className="bg-card rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-card-hover transition-colors"
      >
        <span className="text-lg">
          {tipo === "davs" ? "📋" : tipo === "fams" ? "📐" : tipo === "inspecoes" ? "🔍" : tipo === "cits" ? "🏥" : "📄"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            <DocTitle doc={doc} tipo={tipo} />
          </p>
          <div className="flex gap-2 text-xs text-muted flex-wrap">
            <DocSubtitle doc={doc} tipo={tipo} />
            <span>·</span>
            <span>{formatDate(doc.created_at as string)}</span>
            {typeof doc.uploaded_by === "string" && (
              <>
                <span>·</span>
                <span>{doc.uploaded_by}</span>
              </>
            )}
          </div>
        </div>
        {tipo === "inspecoes" && typeof doc.resultado === "string" && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            doc.resultado.toLowerCase().includes("aprov")
              ? "bg-success/20 text-success"
              : "bg-danger/20 text-danger"
          }`}>
            {doc.resultado.toUpperCase()}
          </span>
        )}
        <span className="text-muted text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          <DocDetails doc={doc} tipo={tipo} />
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-accent hover:underline"
            >
              Ver ficheiro ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function DocTitle({ doc, tipo }: { doc: Record<string, unknown>; tipo: DocSubType }) {
  switch (tipo) {
    case "davs": {
      const marca = [doc.marca, doc.modelo].filter(Boolean).join(" ")
      return <>{doc.vin as string}{marca ? ` — ${marca}` : ""}</>
    }
    case "fams":
      return <>Homol. {doc.numero_homologacao_nacional as string} ext. {doc.extensao as string}</>
    case "inspecoes":
      return <>{doc.matricula as string}</>
    case "cits":
      return <>{(doc.nome_utente || "Sem nome") as string}</>
    case "outros":
      return <>{doc.nome_ficheiro as string}</>
  }
}

function DocSubtitle({ doc, tipo }: { doc: Record<string, unknown>; tipo: DocSubType }) {
  switch (tipo) {
    case "davs":
      return <>{doc.matricula ? <span>Mat: {doc.matricula as string}</span> : <span>Sem matrícula</span>}</>
    case "fams": {
      const marca = [doc.campo_0_1_marca, doc.campo_0_2_modelo].filter(Boolean).join(" ")
      return <>{marca || "—"}</>
    }
    case "inspecoes":
      return <>
        {doc.data_inspecao ? formatDateShort(doc.data_inspecao as string) : "—"}
        {doc.peso_estatico_total && <>, {doc.peso_estatico_total as number}kg</>}
      </>
    case "cits":
      return <>
        {doc.data_inicio && doc.data_fim
          ? `${formatDateShort(doc.data_inicio as string)} → ${formatDateShort(doc.data_fim as string)}`
          : "—"}
        {doc.numero_dias && <>, {doc.numero_dias as number} dias</>}
      </>
    case "outros":
      return <>{doc.uploaded_by || "—"}</>
  }
}

function DocDetails({ doc, tipo }: { doc: Record<string, unknown>; tipo: DocSubType }) {
  const fields: { label: string; value: unknown }[] = []

  switch (tipo) {
    case "davs":
      fields.push(
        { label: "VIN", value: doc.vin },
        { label: "Matrícula", value: doc.matricula },
        { label: "Marca/Modelo", value: [doc.marca, doc.modelo].filter(Boolean).join(" ") || null },
        { label: "Homologação", value: doc.cod_homologacao },
      )
      break
    case "fams":
      fields.push(
        { label: "Homologação", value: doc.numero_homologacao_nacional },
        { label: "Extensão", value: doc.extensao },
        { label: "Marca/Modelo", value: [doc.campo_0_1_marca, doc.campo_0_2_modelo].filter(Boolean).join(" ") || null },
      )
      break
    case "inspecoes":
      fields.push(
        { label: "Matrícula", value: doc.matricula },
        { label: "Data", value: doc.data_inspecao ? formatDateShort(doc.data_inspecao as string) : null },
        { label: "Peso estático", value: doc.peso_estatico_total ? `${doc.peso_estatico_total}kg` : null },
        { label: "Resultado", value: doc.resultado },
      )
      break
    case "cits":
      fields.push(
        { label: "Nome", value: doc.nome_utente },
        { label: "Colaborador", value: doc.colaborador_id },
        { label: "Período", value: doc.data_inicio && doc.data_fim ? `${formatDateShort(doc.data_inicio as string)} → ${formatDateShort(doc.data_fim as string)}` : null },
        { label: "Dias", value: doc.numero_dias },
      )
      break
    case "outros":
      fields.push(
        { label: "Ficheiro", value: doc.nome_ficheiro },
      )
      break
  }

  const validFields = fields.filter((f) => f.value != null && f.value !== "")

  if (validFields.length === 0) return null

  return (
    <div className="bg-accent/5 border border-accent/10 rounded-lg p-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {validFields.map((f) => (
          <div key={f.label} className="text-xs">
            <span className="text-muted">{f.label}: </span>
            <span className="text-foreground font-mono">{String(f.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
