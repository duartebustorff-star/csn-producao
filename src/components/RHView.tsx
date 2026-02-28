"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Colaborador, DocumentoRH, DadosCIT } from "@/lib/types"
import { t, type Lang } from "@/lib/translations"

const TIPO_LABELS: Record<string, string> = {
  baixa_medica: "Baixa médica",
  atestado: "Atestado",
  contrato: "Contrato",
  recibo: "Recibo",
  certificado: "Certificado",
  outro: "Outro",
}

const COLABORADORES_LIST = [
  { id: "duarte", nome: "Duarte" },
  { id: "bohdan", nome: "Bohdan" },
  { id: "joao", nome: "João António" },
  { id: "jose", nome: "José Julio" },
]

export default function RHView({ user }: { user: Colaborador }) {
  const [documentos, setDocumentos] = useState<DocumentoRH[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filterTipo, setFilterTipo] = useState<string>("")
  const [filterColab, setFilterColab] = useState<string>(user.role === "admin" ? "" : user.id)
  const [uploadTipo, setUploadTipo] = useState("outro")
  const [dragOver, setDragOver] = useState(false)
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lang = user.lang as Lang
  const isAdmin = user.role === "admin"

  const fetchDocuments = useCallback(async () => {
    const params = new URLSearchParams({
      colaborador_id: user.id,
      role: user.role,
    })
    if (filterTipo) params.set("tipo", filterTipo)
    if (isAdmin && filterColab) params.set("filter_colaborador", filterColab)

    try {
      const res = await fetch(`/api/rh/documents?${params}`)
      const data = await res.json()
      setDocumentos(data.documentos || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [user.id, user.role, filterTipo, filterColab, isAdmin])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleUpload = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("colaborador_id", isAdmin && filterColab ? filterColab : user.id)
    formData.append("uploaded_by", user.id)
    formData.append("tipo", uploadTipo)

    try {
      await fetch("/api/rh/upload", { method: "POST", body: formData })
      await fetchDocuments()
    } catch { /* ignore */ }
    setUploading(false)
  }

  const handleDelete = async (docId: number) => {
    if (!confirm("Apagar documento?")) return
    try {
      await fetch(`/api/rh/documents/${docId}?role=${user.role}`, { method: "DELETE" })
      await fetchDocuments()
    } catch { /* ignore */ }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    e.target.value = ""
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with filters */}
      <div className="px-4 py-3 border-b border-border space-y-3">
        {/* Admin: collaborator tabs */}
        {isAdmin && (
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilterColab("")}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
                !filterColab ? "bg-accent text-white" : "bg-card text-muted"
              }`}
            >
              Todos
            </button>
            {COLABORADORES_LIST.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterColab(c.id)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
                  filterColab === c.id ? "bg-accent text-white" : "bg-card text-muted"
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        )}

        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterTipo("")}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
              !filterTipo ? "bg-accent/20 text-accent" : "bg-card text-muted"
            }`}
          >
            Todos
          </button>
          {Object.entries(TIPO_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterTipo(key)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${
                filterTipo === key ? "bg-accent/20 text-accent" : "bg-card text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      <div className="px-4 py-3">
        <div className="flex gap-2 mb-2">
          <select
            value={uploadTipo}
            onChange={(e) => setUploadTipo(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
          >
            {Object.entries(TIPO_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-accent bg-accent/10"
              : "border-border hover:border-accent/50 hover:bg-card"
          }`}
        >
          {uploading ? (
            <p className="text-sm text-accent">{t(lang, "a_pensar")}</p>
          ) : (
            <>
              <span className="text-2xl">📎</span>
              <p className="text-xs text-muted mt-2">{t(lang, "arrastar_ficheiro")}</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {loading ? (
          <p className="text-center text-muted text-sm py-8">{t(lang, "a_pensar")}</p>
        ) : documentos.length === 0 ? (
          <p className="text-center text-muted text-sm py-8">Sem documentos</p>
        ) : (
          documentos.map((doc) => (
            <div key={doc.id} className="bg-card rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-card-hover transition-colors"
              >
                <span className="text-lg">
                  {doc.tipo === "baixa_medica" ? "🏥" : doc.tipo === "contrato" ? "📝" : "📄"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.nome_ficheiro}</p>
                  <div className="flex gap-2 text-xs text-muted">
                    <span>{TIPO_LABELS[doc.tipo] || doc.tipo}</span>
                    <span>·</span>
                    <span>{new Date(doc.created_at).toLocaleDateString("pt-PT")}</span>
                    {isAdmin && (
                      <>
                        <span>·</span>
                        <span>{doc.colaborador_id}</span>
                      </>
                    )}
                  </div>
                </div>
                {doc.dados_extraidos && (
                  <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">CIT</span>
                )}
                <span className="text-muted text-xs">{expandedDoc === doc.id ? "▲" : "▼"}</span>
              </button>

              {/* Expanded: CIT data preview */}
              {expandedDoc === doc.id && (
                <div className="px-4 pb-3 space-y-2">
                  {doc.dados_extraidos && (
                    <CITPreview dados={doc.dados_extraidos} lang={lang} />
                  )}
                  <div className="flex gap-2">
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        Ver ficheiro ↗
                      </a>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-xs text-danger hover:underline"
                      >
                        Apagar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function CITPreview({ dados, lang }: { dados: DadosCIT; lang: Lang }) {
  const fields = [
    { label: "Nome", value: dados.colaborador_nome },
    { label: "NISS", value: dados.niss },
    { label: lang === "ua" ? "Початок" : "Início", value: dados.data_inicio },
    { label: lang === "ua" ? "Кінець" : "Fim", value: dados.data_fim },
    { label: lang === "ua" ? "Днів" : "Dias", value: dados.numero_dias },
    { label: lang === "ua" ? "Тип" : "Classificação", value: dados.classificacao },
    { label: lang === "ua" ? "Лікар" : "Médico", value: dados.medico_nome },
    { label: lang === "ua" ? "Установа" : "Instituição", value: dados.instituicao },
  ]

  return (
    <div className="bg-accent/5 border border-accent/10 rounded-lg p-3">
      <p className="text-xs font-medium text-accent mb-2">{t(lang, "dados_extraidos")}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {fields.map((f) => (
          f.value != null && (
            <div key={f.label} className="text-xs">
              <span className="text-muted">{f.label}: </span>
              <span className="text-foreground font-mono">{String(f.value)}</span>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
