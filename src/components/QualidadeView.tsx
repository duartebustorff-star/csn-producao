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
}

interface SGQObjetivo {
  id: number
  processo: string
  indicador: string
  meta: string
  acao: string
  periodicidade: string
  ano: number
}

interface NCRecord {
  id: number
  codigo: string
  data_detecao: string
  origem: string
  descricao: string
  estado: string
  acao_corretiva: string
  causa_raiz: string
}

interface AuditoriaRecord {
  id: number
  codigo: string
  data_auditoria: string
  auditor: string
  conclusao: string
  processos_auditados: string[]
}

type Tab = "resumo" | "ncs" | "auditorias" | "documentos" | "objetivos" | "auditoria_pkg"

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function QualidadeView() {
  const [tab, setTab] = useState<Tab>("resumo")
  const [documentos, setDocumentos] = useState<SGQDocumento[]>([])
  const [objetivos, setObjetivos] = useState<SGQObjetivo[]>([])
  const [ncs, setNCs] = useState<NCRecord[]>([])
  const [auditorias, setAuditorias] = useState<AuditoriaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/sgq/dados?tipo=documentos").then(r => r.ok ? r.json() : { data: [] }),
      fetch("/api/sgq/dados?tipo=objetivos").then(r => r.ok ? r.json() : { data: [] }),
      fetch("/api/sgq/dados?tipo=ncs").then(r => r.ok ? r.json() : { data: [] }),
      fetch("/api/sgq/dados?tipo=auditorias").then(r => r.ok ? r.json() : { data: [] }),
    ])
      .then(([docs, objs, ncData, audData]) => {
        setDocumentos(docs.data || [])
        setObjetivos(objs.data || [])
        setNCs(ncData.data || [])
        setAuditorias(audData.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const downloadPDF = async (tipo: string) => {
    setDownloading(tipo)
    try {
      const res = await fetch(`/api/sgq/pacote-auditoria?tipo=${tipo}`)
      if (!res.ok) throw new Error("Erro")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || `${tipo}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { /* */ }
    setDownloading(null)
  }

  const downloadPacote = async () => {
    setDownloading("pacote")
    try {
      const res = await fetch("/api/sgq/pacote-auditoria")
      if (!res.ok) throw new Error("Erro")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "Pacote_Auditoria.zip"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { /* */ }
    setDownloading(null)
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "resumo", label: "Resumo", icon: "📊" },
    { key: "ncs", label: "NCs", icon: "⚠️" },
    { key: "auditorias", label: "Auditorias", icon: "🔍" },
    { key: "objetivos", label: "Objetivos", icon: "🎯" },
    { key: "documentos", label: "Docs SGQ", icon: "📜" },
    { key: "auditoria_pkg", label: "PDFs", icon: "📦" },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="px-4 py-2 border-b border-border overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "bg-accent/20 text-accent"
                  : "bg-card text-muted hover:text-foreground"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <p className="text-center text-muted text-sm py-8">A carregar...</p>
        ) : tab === "resumo" ? (
          <ResumoTab ncs={ncs} auditorias={auditorias} objetivos={objetivos} documentos={documentos} />
        ) : tab === "ncs" ? (
          <NCsTab ncs={ncs} />
        ) : tab === "auditorias" ? (
          <AuditoriasTab auditorias={auditorias} />
        ) : tab === "objetivos" ? (
          <ObjetivosTab objetivos={objetivos} />
        ) : tab === "documentos" ? (
          <DocumentosSGQTab documentos={documentos} />
        ) : (
          <PacoteTab downloading={downloading} onDownloadPDF={downloadPDF} onDownloadPacote={downloadPacote} />
        )}
      </div>
    </div>
  )
}

// ============================================
// TAB: RESUMO (Dashboard da Qualidade)
// ============================================

function ResumoTab({
  ncs, auditorias, objetivos, documentos
}: {
  ncs: NCRecord[]
  auditorias: AuditoriaRecord[]
  objetivos: SGQObjetivo[]
  documentos: SGQDocumento[]
}) {
  const ncsAbertas = ncs.filter(nc => nc.estado !== "fechada").length
  const totalNCs = ncs.length
  const ultimaAuditoria = auditorias[0]

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4">
          <p className="text-xs text-muted">NCs Abertas</p>
          <p className={`text-2xl font-bold mt-1 ${ncsAbertas > 0 ? "text-red-400" : "text-green-400"}`}>
            {ncsAbertas}
          </p>
          <p className="text-xs text-muted mt-1">{totalNCs} total</p>
        </div>

        <div className="bg-card rounded-xl p-4">
          <p className="text-xs text-muted">Auditorias</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{auditorias.length}</p>
          <p className="text-xs text-muted mt-1">
            {ultimaAuditoria ? `Última: ${new Date(ultimaAuditoria.data_auditoria).toLocaleDateString("pt-PT")}` : "Nenhuma"}
          </p>
        </div>

        <div className="bg-card rounded-xl p-4">
          <p className="text-xs text-muted">Objetivos</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{objetivos.length}</p>
          <p className="text-xs text-muted mt-1">Ano {objetivos[0]?.ano || new Date().getFullYear()}</p>
        </div>

        <div className="bg-card rounded-xl p-4">
          <p className="text-xs text-muted">Docs SGQ</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{documentos.length}</p>
          <p className="text-xs text-muted mt-1">Política, Âmbito, etc.</p>
        </div>
      </div>

      {/* NCs abertas list */}
      {ncsAbertas > 0 && (
        <>
          <p className="text-xs text-muted font-medium mt-2">NCs abertas:</p>
          {ncs.filter(nc => nc.estado !== "fechada").map(nc => (
            <div key={nc.id} className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{nc.codigo}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 uppercase">{nc.estado}</span>
              </div>
              <p className="text-xs text-muted mt-1">{nc.descricao}</p>
            </div>
          ))}
        </>
      )}

      {/* Empty state */}
      {totalNCs === 0 && auditorias.length === 0 && (
        <div className="bg-accent/5 border border-accent/10 rounded-xl p-4 text-center">
          <p className="text-sm text-foreground">SGQ configurado e pronto</p>
          <p className="text-xs text-muted mt-1">Os registos aparecerão aqui à medida que forem criados no sistema.</p>
        </div>
      )}
    </>
  )
}

// ============================================
// TAB: NÃO-CONFORMIDADES
// ============================================

function NCsTab({ ncs }: { ncs: NCRecord[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (ncs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted text-sm">Sem não-conformidades registadas.</p>
        <p className="text-xs text-muted mt-2">Usa o chat para registar: "Registar NC na obra X"</p>
      </div>
    )
  }

  const estadoCor: Record<string, string> = {
    aberta: "bg-red-500/20 text-red-400",
    em_tratamento: "bg-yellow-500/20 text-yellow-400",
    fechada: "bg-green-500/20 text-green-400",
  }

  return (
    <>
      {ncs.map(nc => (
        <div key={nc.id} className="bg-card rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === nc.id ? null : nc.id)}
            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-card-hover transition-colors"
          >
            <span className="text-lg">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{nc.codigo}</p>
              <p className="text-xs text-muted truncate">{nc.descricao}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${estadoCor[nc.estado] || ""}`}>
              {nc.estado}
            </span>
          </button>
          {expanded === nc.id && (
            <div className="px-4 pb-3 space-y-1.5">
              <Field label="Data" value={nc.data_detecao} />
              <Field label="Origem" value={nc.origem} />
              <Field label="Causa Raiz" value={nc.causa_raiz} />
              <Field label="Ação Corretiva" value={nc.acao_corretiva} />
            </div>
          )}
        </div>
      ))}
    </>
  )
}

// ============================================
// TAB: AUDITORIAS
// ============================================

function AuditoriasTab({ auditorias }: { auditorias: AuditoriaRecord[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (auditorias.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted text-sm">Sem auditorias internas registadas.</p>
        <p className="text-xs text-muted mt-2">Usa o chat para registar: "Registar auditoria interna"</p>
      </div>
    )
  }

  const conclusaoCor: Record<string, string> = {
    conforme: "bg-green-500/20 text-green-400",
    conforme_com_observacoes: "bg-yellow-500/20 text-yellow-400",
    nao_conforme: "bg-red-500/20 text-red-400",
  }

  return (
    <>
      {auditorias.map(a => (
        <div key={a.id} className="bg-card rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === a.id ? null : a.id)}
            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-card-hover transition-colors"
          >
            <span className="text-lg">🔍</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{a.codigo}</p>
              <p className="text-xs text-muted">{new Date(a.data_auditoria).toLocaleDateString("pt-PT")} · {a.auditor}</p>
            </div>
            {a.conclusao && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${conclusaoCor[a.conclusao] || ""}`}>
                {a.conclusao.replace(/_/g, " ")}
              </span>
            )}
          </button>
          {expanded === a.id && (
            <div className="px-4 pb-3 space-y-1.5">
              <Field label="Processos" value={Array.isArray(a.processos_auditados) ? a.processos_auditados.join(", ") : ""} />
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

const PROCESSO_COLORS: Record<string, string> = {
  qualidade: "bg-blue-500/20 text-blue-400",
  producao: "bg-orange-500/20 text-orange-400",
  rh: "bg-purple-500/20 text-purple-400",
  logistica: "bg-green-500/20 text-green-400",
  infraestruturas: "bg-yellow-500/20 text-yellow-400",
  comercial: "bg-pink-500/20 text-pink-400",
}

function ObjetivosTab({ objetivos }: { objetivos: SGQObjetivo[] }) {
  if (objetivos.length === 0) {
    return <p className="text-center text-muted text-sm py-8">Sem objetivos definidos.</p>
  }

  const grouped = objetivos.reduce<Record<string, SGQObjetivo[]>>((acc, obj) => {
    if (!acc[obj.processo]) acc[obj.processo] = []
    acc[obj.processo].push(obj)
    return acc
  }, {})

  return (
    <>
      <p className="text-xs text-muted">{objetivos.length} objetivos · Ano {objetivos[0]?.ano}</p>
      {Object.entries(grouped).map(([processo, objs]) => (
        <div key={processo} className="space-y-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
            PROCESSO_COLORS[processo] || "bg-gray-500/20 text-gray-400"
          }`}>
            {processo}
          </span>
          {objs.map(obj => (
            <div key={obj.id} className="bg-card rounded-xl px-4 py-3">
              <p className="text-sm text-foreground">{obj.indicador}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                <span className="text-xs text-muted">Meta: <span className="text-foreground font-medium">{obj.meta}</span></span>
                <span className="text-xs text-muted">{obj.periodicidade}</span>
              </div>
              {obj.acao && <p className="text-xs text-muted mt-1">{obj.acao}</p>}
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

// ============================================
// TAB: DOCUMENTOS SGQ
// ============================================

const DOC_ICONS: Record<string, string> = {
  politica_qualidade: "📜",
  ambito_sgq: "🎯",
  exclusoes: "🚫",
  contexto_organizacao: "🏢",
  partes_interessadas: "👥",
}

function DocumentosSGQTab({ documentos }: { documentos: SGQDocumento[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (documentos.length === 0) {
    return <p className="text-center text-muted text-sm py-8">Sem documentos SGQ. Execute a migração primeiro.</p>
  }

  return (
    <>
      {documentos.map(doc => (
        <div key={doc.id} className="bg-card rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-card-hover transition-colors"
          >
            <span className="text-lg">{DOC_ICONS[doc.tipo] || "📄"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{doc.titulo}</p>
              <p className="text-xs text-muted">
                v{doc.versao}
                {doc.data_aprovacao && ` · ${new Date(doc.data_aprovacao).toLocaleDateString("pt-PT")}`}
              </p>
            </div>
            <span className="text-muted text-xs">{expanded === doc.id ? "▲" : "▼"}</span>
          </button>
          {expanded === doc.id && (
            <div className="px-4 pb-3">
              <div className="bg-accent/5 border border-accent/10 rounded-lg p-3">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{doc.conteudo}</pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  )
}

// ============================================
// TAB: PACOTE AUDITORIA
// ============================================

const PDF_TYPES = [
  { key: "politica_qualidade", label: "Política da Qualidade", icon: "📜", cl: "5.2" },
  { key: "ambito_sgq", label: "Âmbito + Exclusões", icon: "🎯", cl: "4.3" },
  { key: "contexto", label: "Contexto + Partes Interessadas", icon: "🏢", cl: "4.1/4.2" },
  { key: "objetivos_qualidade", label: "Objetivos da Qualidade", icon: "📊", cl: "6.2" },
  { key: "nao_conformidades", label: "Não-Conformidades", icon: "⚠️", cl: "10.2" },
  { key: "auditorias", label: "Auditorias Internas", icon: "🔍", cl: "9.2" },
  { key: "revisao_gestao", label: "Revisão pela Gestão", icon: "📋", cl: "9.3" },
  { key: "equipamentos", label: "Equipamentos e Calibração", icon: "🔧", cl: "7.1.5" },
  { key: "fornecedores", label: "Fornecedores Aprovados", icon: "🤝", cl: "8.4" },
  { key: "reclamacoes", label: "Reclamações de Clientes", icon: "📩", cl: "9.1.2" },
  { key: "formacoes", label: "Registos de Formação", icon: "🎓", cl: "7.2" },
]

function PacoteTab({
  downloading, onDownloadPDF, onDownloadPacote,
}: {
  downloading: string | null
  onDownloadPDF: (tipo: string) => void
  onDownloadPacote: () => void
}) {
  return (
    <>
      <button
        onClick={onDownloadPacote}
        disabled={downloading !== null}
        className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-xl px-4 py-4 flex items-center gap-3 transition-colors"
      >
        <span className="text-2xl">{downloading === "pacote" ? "⏳" : "📦"}</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold">{downloading === "pacote" ? "A gerar pacote..." : "Descarregar Pacote de Auditoria"}</p>
          <p className="text-xs opacity-80">ZIP com 11 PDFs — Todos os documentos ISO 9001:2015</p>
        </div>
        <span className="text-lg">⬇️</span>
      </button>

      <p className="text-xs text-muted mt-4 mb-2">Ou individualmente:</p>
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
            <p className="text-xs text-muted">Cláusula {pdf.cl}</p>
          </div>
          <span className="text-xs text-muted">PDF</span>
        </button>
      ))}
    </>
  )
}

// ============================================
// HELPERS
// ============================================

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="text-xs">
      <span className="text-muted">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
