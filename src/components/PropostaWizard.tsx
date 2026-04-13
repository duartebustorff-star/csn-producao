"use client"

import { useState, useRef, useCallback } from "react"

// ── Types ──────────────────────────────────────────────────
interface VehicleData {
  matricula: string
  vin: string
  marca: string
  modelo: string
  pbt: number | null
  tara: number | null
  distancia_eixos: number | null
  combustivel: string
  data_matricula: string
  cor: string
}

interface PhotoSlot {
  id: string
  label: string
  file: File | null
  preview: string | null
}

interface Medidas {
  comprimento: string
  largura: string
  altura_chassi_piso: string
}

interface PropostaData {
  tipo_veiculo: "usado" | "novo" | null
  veiculo: VehicleData | null
  matricula_input: string
  fotos: PhotoSlot[]
  medidas: Medidas
  tipo_carrocaria: string | null
  nome_cliente: string
  telefone_cliente: string
  notas: string
}

type Step = "tipo" | "matricula" | "fotos" | "medidas" | "carrocaria" | "cliente" | "resumo"

interface Props {
  colaboradorId: string
  colaboradorNome: string
  onClose: () => void
  onSubmit: (data: PropostaData) => void
}

// ── Constants ──────────────────────────────────────────────
const TIPOS_CARROCARIA = [
  { id: "caixa_aberta", label: "Caixa Aberta", emoji: "📦" },
  { id: "caixa_fechada", label: "Caixa Fechada", emoji: "🔒" },
  { id: "basculante", label: "Basculante", emoji: "⬆️" },
  { id: "tri_basculante", label: "Tri-Basculante", emoji: "🔄" },
  { id: "plataforma", label: "Plataforma", emoji: "➡️" },
  { id: "estrado", label: "Estrado", emoji: "📏" },
  { id: "isotermico", label: "Isotérmico", emoji: "❄️" },
  { id: "frigorifico", label: "Frigorífico", emoji: "🧊" },
  { id: "grua", label: "Grua", emoji: "🏗️" },
  { id: "outro", label: "Outro", emoji: "🔧" },
]

const DEFAULT_PHOTOS: () => PhotoSlot[] = () => [
  { id: "frente", label: "Frente", file: null, preview: null },
  { id: "tras", label: "Trás", file: null, preview: null },
  { id: "lateral", label: "Lateral", file: null, preview: null },
  { id: "caixa", label: "Caixa/Interior", file: null, preview: null },
]

// ── Component ──────────────────────────────────────────────
export default function PropostaWizard({ colaboradorId, colaboradorNome, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<Step>("tipo")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState<PropostaData>({
    tipo_veiculo: null,
    veiculo: null,
    matricula_input: "",
    fotos: DEFAULT_PHOTOS(),
    medidas: { comprimento: "", largura: "", altura_chassi_piso: "" },
    tipo_carrocaria: null,
    nome_cliente: "",
    telefone_cliente: "",
    notas: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSlotRef = useRef<string | null>(null)

  // ── Matrícula lookup ──
  const lookupMatricula = useCallback(async (matricula: string) => {
    if (matricula.length < 6) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/matricula?plate=${encodeURIComponent(matricula)}`)
      const result = await res.json()
      if (result.error) {
        setError(result.error)
      } else {
        setData(prev => ({ ...prev, veiculo: result }))
      }
    } catch {
      setError("Erro ao consultar matrícula")
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Photo handling ──
  const handlePhotoClick = (slotId: string) => {
    activeSlotRef.current = slotId
    fileInputRef.current?.click()
  }

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeSlotRef.current) return

    const preview = URL.createObjectURL(file)
    setData(prev => ({
      ...prev,
      fotos: prev.fotos.map(s =>
        s.id === activeSlotRef.current ? { ...s, file, preview } : s
      ),
    }))
    e.target.value = ""
  }

  const addExtraPhoto = () => {
    const id = `extra_${Date.now()}`
    setData(prev => ({
      ...prev,
      fotos: [...prev.fotos, { id, label: `Foto ${prev.fotos.length + 1}`, file: null, preview: null }],
    }))
  }

  // ── Navigation ──
  const STEPS_USADO: Step[] = ["tipo", "matricula", "fotos", "medidas", "carrocaria", "cliente", "resumo"]
  const STEPS_NOVO: Step[] = ["tipo", "fotos", "medidas", "carrocaria", "cliente", "resumo"]

  const steps = data.tipo_veiculo === "novo" ? STEPS_NOVO : STEPS_USADO
  const currentIndex = steps.indexOf(step)
  const progress = ((currentIndex + 1) / steps.length) * 100

  const next = () => {
    const nextStep = steps[currentIndex + 1]
    if (nextStep) setStep(nextStep)
  }

  const back = () => {
    const prevStep = steps[currentIndex - 1]
    if (prevStep) setStep(prevStep)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Upload photos to Supabase Storage
      const fotoUrls: string[] = []
      for (const foto of data.fotos) {
        if (foto.file) {
          const formData = new FormData()
          formData.append("file", foto.file)
          formData.append("type", "proposta")
          formData.append("colaborador_id", colaboradorId)
          const res = await fetch("/api/upload", { method: "POST", body: formData })
          const result = await res.json()
          if (result.url) fotoUrls.push(result.url)
        }
      }

      // Create lead via API
      const payload = {
        colaborador_id: colaboradorId,
        colaborador_nome: colaboradorNome,
        tipo_veiculo: data.tipo_veiculo,
        matricula: data.veiculo?.matricula || data.matricula_input,
        vin: data.veiculo?.vin || "",
        marca: data.veiculo?.marca || "",
        modelo: data.veiculo?.modelo || "",
        pbt: data.veiculo?.pbt || null,
        tara: data.veiculo?.tara || null,
        tipo_carrocaria: data.tipo_carrocaria,
        comprimento_mm: data.medidas.comprimento ? parseInt(data.medidas.comprimento) : null,
        largura_mm: data.medidas.largura ? parseInt(data.medidas.largura) : null,
        altura_chassi_piso_mm: data.medidas.altura_chassi_piso ? parseInt(data.medidas.altura_chassi_piso) : null,
        nome_cliente: data.nome_cliente,
        telefone_cliente: data.telefone_cliente,
        notas: data.notas,
        fotos: fotoUrls,
      }

      const res = await fetch("/api/proposta", { method: "POST", body: JSON.stringify(payload) })
      if (res.ok) {
        onSubmit(data)
      } else {
        setError("Erro ao enviar proposta")
      }
    } catch {
      setError("Erro ao enviar proposta")
    } finally {
      setLoading(false)
    }
  }

  // ── Render Steps ──
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <button onClick={step === "tipo" ? onClose : back} className="text-zinc-400 text-sm">
          {step === "tipo" ? "✕ Fechar" : "← Voltar"}
        </button>
        <span className="text-white font-semibold text-sm">Pedido de Proposta</span>
        <span className="text-zinc-500 text-xs">{currentIndex + 1}/{steps.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800">
        <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
            <button onClick={() => setError("")} className="ml-2 text-red-400">✕</button>
          </div>
        )}

        {/* STEP: Tipo veículo */}
        {step === "tipo" && (
          <div className="space-y-6">
            <h2 className="text-white text-xl font-bold text-center">O veículo é novo ou usado?</h2>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <button
                onClick={() => { setData(prev => ({ ...prev, tipo_veiculo: "usado" })); setStep("matricula") }}
                className="aspect-square rounded-2xl bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 hover:border-amber-500 flex flex-col items-center justify-center gap-3 transition-all"
              >
                <span className="text-4xl">🚗</span>
                <span className="text-white font-semibold text-lg">Usado</span>
              </button>
              <button
                onClick={() => { setData(prev => ({ ...prev, tipo_veiculo: "novo" })); setStep("fotos") }}
                className="aspect-square rounded-2xl bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 hover:border-amber-500 flex flex-col items-center justify-center gap-3 transition-all"
              >
                <span className="text-4xl">✨</span>
                <span className="text-white font-semibold text-lg">Novo</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP: Matrícula */}
        {step === "matricula" && (
          <div className="space-y-6">
            <h2 className="text-white text-xl font-bold text-center">Matrícula</h2>
            <div className="max-w-sm mx-auto space-y-4">
              <input
                type="text"
                placeholder="XX-XX-XX"
                value={data.matricula_input}
                onChange={e => {
                  const v = e.target.value.toUpperCase()
                  setData(prev => ({ ...prev, matricula_input: v }))
                }}
                className="w-full text-center text-3xl font-mono font-bold tracking-wider bg-zinc-800 border-2 border-zinc-600 focus:border-amber-500 rounded-xl px-4 py-4 text-white outline-none"
                maxLength={11}
                autoFocus
              />
              <button
                onClick={() => lookupMatricula(data.matricula_input)}
                disabled={data.matricula_input.length < 6 || loading}
                className="w-full py-3 rounded-xl font-semibold text-black bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
              >
                {loading ? "A consultar..." : "🔍 Consultar Matrícula"}
              </button>

              {/* Vehicle data card */}
              {data.veiculo && (
                <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚛</span>
                    <div>
                      <div className="text-white font-bold text-lg">{data.veiculo.marca} {data.veiculo.modelo}</div>
                      <div className="text-zinc-400 text-sm">{data.veiculo.matricula}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {data.veiculo.pbt && (
                      <div className="bg-zinc-900 rounded-lg px-3 py-2">
                        <div className="text-zinc-500 text-xs">PBT</div>
                        <div className="text-white font-semibold">{data.veiculo.pbt} kg</div>
                      </div>
                    )}
                    {data.veiculo.tara && (
                      <div className="bg-zinc-900 rounded-lg px-3 py-2">
                        <div className="text-zinc-500 text-xs">Tara</div>
                        <div className="text-white font-semibold">{data.veiculo.tara} kg</div>
                      </div>
                    )}
                    {data.veiculo.distancia_eixos && (
                      <div className="bg-zinc-900 rounded-lg px-3 py-2">
                        <div className="text-zinc-500 text-xs">Entre-eixos</div>
                        <div className="text-white font-semibold">{data.veiculo.distancia_eixos} mm</div>
                      </div>
                    )}
                    {data.veiculo.combustivel && (
                      <div className="bg-zinc-900 rounded-lg px-3 py-2">
                        <div className="text-zinc-500 text-xs">Combustível</div>
                        <div className="text-white font-semibold">{data.veiculo.combustivel}</div>
                      </div>
                    )}
                  </div>
                  <div className="text-zinc-500 text-xs font-mono">VIN: {data.veiculo.vin}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP: Fotos */}
        {step === "fotos" && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold text-center">Fotos do Veículo</h2>
            <p className="text-zinc-400 text-sm text-center">Tira fotos ao veículo. Não é obrigatório preencher todas.</p>
            <div className="grid grid-cols-2 gap-3">
              {data.fotos.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => handlePhotoClick(slot.id)}
                  className="aspect-[4/3] rounded-xl border-2 border-dashed border-zinc-700 hover:border-amber-500 bg-zinc-800/50 flex flex-col items-center justify-center gap-2 overflow-hidden transition-all relative"
                >
                  {slot.preview ? (
                    <>
                      <img src={slot.preview} alt={slot.label} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 py-1 text-center">
                        <span className="text-white text-xs font-medium">✅ {slot.label}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl text-zinc-600">📷</span>
                      <span className="text-zinc-500 text-xs">{slot.label}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={addExtraPhoto}
              className="w-full py-2 rounded-lg border border-dashed border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            >
              + Adicionar mais foto
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
            />
          </div>
        )}

        {/* STEP: Medidas */}
        {step === "medidas" && (
          <div className="space-y-6">
            <h2 className="text-white text-xl font-bold text-center">Medidas da Caixa</h2>
            <p className="text-zinc-400 text-sm text-center">Mede com a fita métrica e introduz os valores em milímetros.</p>
            <div className="max-w-sm mx-auto space-y-4">
              {[
                { key: "comprimento" as const, label: "Comprimento", icon: "↔️", placeholder: "ex: 3200" },
                { key: "largura" as const, label: "Largura", icon: "↕️", placeholder: "ex: 2080" },
                { key: "altura_chassi_piso" as const, label: "Chassi ao piso (opcional)", icon: "📐", placeholder: "ex: 950" },
              ].map(field => (
                <div key={field.key} className="space-y-1">
                  <label className="text-zinc-400 text-sm flex items-center gap-2">
                    <span>{field.icon}</span> {field.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={field.placeholder}
                      value={data.medidas[field.key]}
                      onChange={e => setData(prev => ({
                        ...prev,
                        medidas: { ...prev.medidas, [field.key]: e.target.value }
                      }))}
                      className="flex-1 text-2xl font-mono font-bold bg-zinc-800 border-2 border-zinc-600 focus:border-amber-500 rounded-xl px-4 py-3 text-white outline-none"
                    />
                    <span className="text-zinc-500 text-sm font-medium">mm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Tipo carroçaria */}
        {step === "carrocaria" && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold text-center">Tipo de Carroçaria</h2>
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {TIPOS_CARROCARIA.map(tipo => (
                <button
                  key={tipo.id}
                  onClick={() => setData(prev => ({ ...prev, tipo_carrocaria: tipo.id }))}
                  className={`rounded-xl px-4 py-4 flex flex-col items-center gap-2 transition-all border-2 ${
                    data.tipo_carrocaria === tipo.id
                      ? "bg-amber-500/20 border-amber-500 text-white"
                      : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  <span className="text-2xl">{tipo.emoji}</span>
                  <span className="text-sm font-medium">{tipo.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Cliente */}
        {step === "cliente" && (
          <div className="space-y-6">
            <h2 className="text-white text-xl font-bold text-center">Dados do Cliente</h2>
            <div className="max-w-sm mx-auto space-y-4">
              <div className="space-y-1">
                <label className="text-zinc-400 text-sm">Nome do cliente</label>
                <input
                  type="text"
                  placeholder="Nome ou empresa"
                  value={data.nome_cliente}
                  onChange={e => setData(prev => ({ ...prev, nome_cliente: e.target.value }))}
                  className="w-full bg-zinc-800 border-2 border-zinc-600 focus:border-amber-500 rounded-xl px-4 py-3 text-white outline-none text-lg"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-400 text-sm">Telefone</label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="9XX XXX XXX"
                  value={data.telefone_cliente}
                  onChange={e => setData(prev => ({ ...prev, telefone_cliente: e.target.value }))}
                  className="w-full bg-zinc-800 border-2 border-zinc-600 focus:border-amber-500 rounded-xl px-4 py-3 text-white outline-none text-lg font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-400 text-sm">Notas (opcional)</label>
                <textarea
                  placeholder="Detalhes adicionais..."
                  value={data.notas}
                  onChange={e => setData(prev => ({ ...prev, notas: e.target.value }))}
                  rows={3}
                  className="w-full bg-zinc-800 border-2 border-zinc-600 focus:border-amber-500 rounded-xl px-4 py-3 text-white outline-none resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP: Resumo */}
        {step === "resumo" && (
          <div className="space-y-4">
            <h2 className="text-white text-xl font-bold text-center">Resumo</h2>
            <div className="max-w-sm mx-auto bg-zinc-800/80 border border-zinc-700 rounded-xl p-4 space-y-3">
              {/* Vehicle */}
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-700">
                <span className="text-2xl">🚛</span>
                <div>
                  <div className="text-white font-bold">
                    {data.veiculo ? `${data.veiculo.marca} ${data.veiculo.modelo}` : "Veículo novo"}
                  </div>
                  {data.veiculo?.matricula && <div className="text-amber-500 text-sm font-mono">{data.veiculo.matricula}</div>}
                  {data.veiculo?.pbt && <div className="text-zinc-400 text-xs">PBT: {data.veiculo.pbt} kg</div>}
                </div>
              </div>

              {/* Bodywork */}
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-700">
                <span className="text-2xl">{TIPOS_CARROCARIA.find(t => t.id === data.tipo_carrocaria)?.emoji || "🔧"}</span>
                <div>
                  <div className="text-white font-medium">
                    {TIPOS_CARROCARIA.find(t => t.id === data.tipo_carrocaria)?.label || data.tipo_carrocaria}
                  </div>
                  <div className="text-zinc-400 text-sm">
                    {data.medidas.comprimento && data.medidas.largura
                      ? `${data.medidas.comprimento} × ${data.medidas.largura} mm`
                      : "Medidas não preenchidas"}
                    {data.medidas.altura_chassi_piso && ` (h: ${data.medidas.altura_chassi_piso}mm)`}
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-700">
                <span className="text-2xl">📷</span>
                <div className="text-zinc-300 text-sm">
                  {data.fotos.filter(f => f.file).length} fotos anexadas
                </div>
              </div>

              {/* Client */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <div className="text-white font-medium">{data.nome_cliente || "Sem nome"}</div>
                  <div className="text-zinc-400 text-sm">{data.telefone_cliente || "Sem telefone"}</div>
                </div>
              </div>

              {data.notas && (
                <div className="pt-2 border-t border-zinc-700">
                  <div className="text-zinc-400 text-xs">📝 {data.notas}</div>
                </div>
              )}
            </div>

            {/* Photo thumbnails */}
            {data.fotos.filter(f => f.preview).length > 0 && (
              <div className="flex gap-2 overflow-x-auto px-1">
                {data.fotos.filter(f => f.preview).map(f => (
                  <img key={f.id} src={f.preview!} alt={f.label} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action button */}
      {step !== "tipo" && (
        <div className="px-4 py-4 border-t border-zinc-800 safe-bottom">
          {step === "resumo" ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg text-black bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
            >
              {loading ? "A enviar..." : "✅ Enviar Pedido de Proposta"}
            </button>
          ) : (
            <button
              onClick={next}
              className="w-full py-4 rounded-xl font-bold text-lg text-black bg-amber-500 hover:bg-amber-400 transition-colors"
            >
              Seguinte →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
