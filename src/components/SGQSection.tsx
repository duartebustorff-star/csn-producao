"use client"

import { useState, useEffect } from "react"

// ============================================
// TIPOS
// ============================================

interface SGQDocumento {
  id: number
  tipo: string
  titulo: string
  conteudo: string
  versao: number
  aprovado_por: string
  data_aprovacao: string
  ativo: boolean
}

interface SGQObjetivo {
  id: number
  processo: string
  indicador: string
  meta: string
  acao: string
  responsavel: string
  periodicidade: string
  ano: number
}

type SGQTab = "documentos" | "objetivos" | "registos" | "auditoria"

// Tipos de PDF disponíveis para download individual
const PDF_TYPES = [
  { key: "politica_qualidade", label: "Política da Qualidade", icon: "📜", clausula: "5.2" },
  { key: "ambito_sgq", label: "Âmbito + Exclusões", icon: "🎯", clausula: "4.3" },
  { key: "contexto", label: "Contexto + Partes Interessadas", icon: "🏢", clausula: "4.1/4.2" },
  { key: "objetivos_qualidade", label: "Objetivos da Qualidade", icon: "📊", clausula: "6.2" },
  { key: "nao_conformidades", label: "Não-Conformidades", icon: "⚠️", clausula: "10.2" },
  { key: "auditorias", label: "Auditorias Internas", icon: "🔍", clausula: "9.2" },
  { key: "revisao_gestao", label: "Revisão pela Gestão", icon: "📋", clausula: "9.3" },
  { key: "equipamentos", label: "Equipamentos e Calibração", icon: "🔧", clausula: "7.1.5" },
  { key: "fornecedores", label: "Fornecedores Aprovados", icon: "🤝", clausula: "8.4" },
  { key: "reclamacoes", label: "Reclamações de Clientes", icon: "📩", clausula: "9.1.2" },
  { key: "formacoes", label: "Registos de Formação", icon: "🎓", clausula: "7.2" },
] as const

// Labels para tipos de documento SGQ
const DOC_TYPE_LABELS: Record<string, string> = {
  politica_qualidade: "Política da Qualidade",
  ambito_sgq: "Âmbito do SGQ",
  objetivos_qualidade: "Objetivos da Qualidade",
  contexto_organizacao: "Contexto da Organização",
  partes_interessadas: "Partes Interessadas",
  exclusoes: "Não Aplicabilidades",
}

const PROCESSO_COLORS: Record<string, string> = {
  qualidade: "bg-blue-500/20 text-blue-400",
  producao: "bg-orange-500/20 text-orange-400",
  rh: "bg-purple-500/20 text-purple-400",
  logistica: "bg-green-500/20 text-green-400",
  infraestruturas: "bg-yellow-500/20 text-yellow-400",
  comercial: "bg-pink-500/20 text-pink-400",
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function SGQSection() {
  const [activeTab, setActiveTab] = useState<SGQTab>("documentos")
  const [documentos, setDocumentos] = useState<SGQDocumento[]>([])
  const [objetivos, setObjetivos] = useState<SGQObjetivo[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  // Fetch SGQ data
  useEffect(() => {
    Promise.all([
      fetch("/api/sgq/dados?tipo=documentos").then(r => r.ok ? r.json() : []),
      fetch("/api/sgq/dados?tipo=objetivos").then(r => r.ok ? r.json() : []),
    ])
      .then(([docs, objs]) => {
        setDocumentos(Array.isArray(docs) ? docs : docs.data || [])
        setObjetivos(Array.isArray(objs) ? objs : objs.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Download PDF
  const downloadPDF = async (tipo: string) => {
    setDownloading(tipo)
    try {
      const res = await fetch(`/api/sgq/pacote-auditoria?tipo=${tipo}`)
      if (!res.ok) throw new Error("Erro ao gerar PDF")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || `${tipo}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Erro download:", err)
    }
    setDownloading(null)
  }

  // Download full audit package
  const downloadPacote = async () => {
    setDownloading("pacote")
    try {
      const res = await fetch("/api/sgq/pacote-auditoria")
      if (!res.ok) throw new Error("Erro ao gerar pacote")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "Pacote_Auditoria.zip"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Erro download pacote:", err)
    }
    setDownloading(null)
  }

  const TABS: { key: SGQTab; label: string; icon: string }[] = [
    { key: "documentos", label: "Documentos", icon: "📜" },
    { key: "objetivos", label: "Objetivos", icon: "🎯" },
    { key: "auditoria", label: "Pacote Auditoria", icon: "📦" },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="px-4 py-2 border-b border-border">
        <div className="flex gap-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                activeTab === tab.key
                  ? "bg-accent/20 text-accent"
                  : "bg-card text-muted hover:text-foreground"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <p className="text-center text-muted text-sm py-8">A carregar...</p>
        ) : activeTab === "documentos" ? (
          <DocumentosTab documentos={documentos} />
        ) : activeTab === "objetivos" ? (
          <ObjetivosTab objetivos={objetivos} />
        ) : (
          <AuditoriaTab
            downloading={downloading}
            onDownloadPDF={downloadPDF}
            onDownloadPacote={downloadPacote}
          />
        )}
      </div>
    </div>
  )
}

// ============================================
// TAB: DOCUMENTOS SGQ
// ============================================

function DocumentosTab({ documentos }: { documentos: SGQDocumento[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (documentos.length === 0) {
    return <p className="text-center text-muted text-sm py-8">Sem documentos SGQ. Execute a migração 010 primeiro.</p>
  }

  return (
    <>
      {documentos.map(doc => (
        <div key={doc.id} className="bg-card rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-card-hover transition-colors"
          >
            <span className="text-lg">
              {doc.tipo === "politica_qualidade" ? "📜" :
               doc.tipo === "ambito_sgq" ? "🎯" :
               doc.tipo === "exclusoes" ? "🚫" :
               doc.tipo === "contexto_organizacao" ? "🏢" :
               doc.tipo === "partes_interessadas" ? "👥" : "📄"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{doc.titulo}</p>
              <div className="flex gap-2 text-xs text-muted">
                <span>{DOC_TYPE_LABELS[doc.tipo] || doc.tipo}</span>
                <span>·</span>
                <span>v{doc.versao}</span>
                {doc.data_aprovacao && (
                  <>
                    <span>·</span>
                    <span>{new Date(doc.data_aprovacao).toLocaleDateString("pt-PT")}</span>
                  </>
                )}
              </div>
            </div>
            <span className="text-muted text-xs">{expanded === doc.id ? "▲" : "▼"}</span>
          </button>

          {expanded === doc.id && (
            <div className="px-4 pb-3">
              <div className="bg-accent/5 border border-accent/10 rounded-lg p-3">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {doc.conteudo}
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  )
}

// ============================================
// TAB: OBJETIVOS
// ============================================

function ObjetivosTab({ objetivos }: { objetivos: SGQObjetivo[] }) {
  if (objetivos.length === 0) {
    return <p className="text-center text-muted text-sm py-8">Sem objetivos definidos.</p>
  }

  // Group by processo
  const grouped = objetivos.reduce<Record<string, SGQObjetivo[]>>((acc, obj) => {
    if (!acc[obj.processo]) acc[obj.processo] = []
    acc[obj.processo].push(obj)
    return acc
  }, {})

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted">
          {objetivos.length} objetivo{objetivos.length !== 1 ? "s" : ""} · Ano {objetivos[0]?.ano || new Date().getFullYear()}
        </p>
      </div>

      {Object.entries(grouped).map(([processo, objs]) => (
        <div key={processo} className="space-y-2">
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${
              PROCESSO_COLORS[processo] || "bg-gray-500/20 text-gray-400"
            }`}>
              {processo}
            </span>
          </div>

          {objs.map(obj => (
            <div key={obj.id} className="bg-card rounded-xl px-4 py-3">
              <p className="text-sm text-foreground">{obj.indicador}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                <span className="text-xs text-muted">
                  Meta: <span className="text-foreground font-medium">{obj.meta}</span>
                </span>
                <span className="text-xs text-muted">
                  {obj.periodicidade}
                </span>
              </div>
              {obj.acao && (
                <p className="text-xs text-muted mt-1">{obj.acao}</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

// ============================================
// TAB: PACOTE DE AUDITORIA
// ============================================

function AuditoriaTab({
  downloading,
  onDownloadPDF,
  onDownloadPacote,
}: {
  downloading: string | null
  onDownloadPDF: (tipo: string) => void
  onDownloadPacote: () => void
}) {
  return (
    <>
      {/* Big download button */}
      <button
        onClick={onDownloadPacote}
        disabled={downloading !== null}
        className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-xl px-4 py-4 flex items-center gap-3 transition-colors"
      >
        <span className="text-2xl">{downloading === "pacote" ? "⏳" : "📦"}</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold">
            {downloading === "pacote" ? "A gerar pacote..." : "Descarregar Pacote de Auditoria"}
          </p>
          <p className="text-xs opacity-80">ZIP com 11 PDFs — Todos os documentos ISO 9001:2015</p>
        </div>
        <span className="text-lg">⬇️</span>
      </button>

      {/* Individual PDFs */}
      <p className="text-xs text-muted mt-4 mb-2">Ou descarregar individualmente:</p>

      {PDF_TYPES.map(pdf => (
        <button
          key={pdf.key}
          onClick={() => onDownloadPDF(pdf.key)}
          disabled={downloading !== null}
          className="w-full bg-card hover:bg-card-hover disabled:opacity-50 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors text-left"
        >
          <span className="text-lg">{downloading === pdf.key ? "⏳" : pdf.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">{pdf.label}</p>
            <p className="text-xs text-muted">Cláusula {pdf.clausula}</p>
          </div>
          <span className="text-xs text-muted">PDF</span>
        </button>
      ))}
    </>
  )
}
