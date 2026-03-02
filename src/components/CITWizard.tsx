"use client"

import { useState } from "react"

export type CITWizardStep =
  | "tipo"
  | "tipo_corrigir"
  | "data_inicio"
  | "data_inicio_corrigir"
  | "data_fim"
  | "data_fim_corrigir"
  | "resumo"

export interface CITWizardData {
  step: CITWizardStep
  dados: Record<string, unknown>
  fileUrl: string
  filePath: string
  numeroCit: string | null
  colaboradorMatch: { id: string; nome: string } | null
  tipoCit: string
  dataInicio: string
  dataFim: string
}

interface CITWizardProps {
  data: CITWizardData
  onUpdate: (data: CITWizardData) => void
  onConfirm: (data: CITWizardData) => void
  onCancel: () => void
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-")
    return `${d}/${m}/${y}`
  } catch {
    return dateStr
  }
}

export default function CITWizard({ data, onUpdate, onConfirm, onCancel }: CITWizardProps) {
  const [dateInput, setDateInput] = useState("")

  const goTo = (step: CITWizardStep, updates?: Partial<CITWizardData>) => {
    onUpdate({ ...data, ...updates, step })
  }

  const tipoCitLabel = (tipo: string) => tipo === "prorrogacao" ? "Prorrogação" : "Inicial"

  return (
    <div className="flex gap-2 mb-2">
      <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-sm flex-shrink-0">
        🤖
      </div>
      <div className="bg-card rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%] space-y-3">
        {/* Step: tipo */}
        {data.step === "tipo" && (
          <>
            <p className="text-sm text-foreground">
              <strong>Tipo de CIT detectado:</strong> {tipoCitLabel(data.tipoCit)}
            </p>
            <p className="text-xs text-muted">Está correto?</p>
            <div className="flex gap-2">
              <button
                onClick={() => goTo("data_inicio")}
                className="px-3 py-1.5 text-xs rounded-full bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 transition-colors"
              >
                Correto
              </button>
              <button
                onClick={() => goTo("tipo_corrigir")}
                className="px-3 py-1.5 text-xs rounded-full bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors"
              >
                Errado
              </button>
            </div>
          </>
        )}

        {/* Step: tipo_corrigir */}
        {data.step === "tipo_corrigir" && (
          <>
            <p className="text-sm text-foreground">
              <strong>Seleciona o tipo correto:</strong>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => goTo("data_inicio", { tipoCit: "inicial" })}
                className="px-3 py-1.5 text-xs rounded-full bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors"
              >
                Inicial
              </button>
              <button
                onClick={() => goTo("data_inicio", { tipoCit: "prorrogacao" })}
                className="px-3 py-1.5 text-xs rounded-full bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors"
              >
                Prorrogação
              </button>
            </div>
          </>
        )}

        {/* Step: data_inicio */}
        {data.step === "data_inicio" && (
          <>
            <p className="text-sm text-foreground">
              <strong>Data de início detectada:</strong> {data.dataInicio ? formatDate(data.dataInicio) : "Não detectada"}
            </p>
            <p className="text-xs text-muted">Está correta?</p>
            <div className="flex gap-2">
              <button
                onClick={() => goTo("data_fim")}
                className="px-3 py-1.5 text-xs rounded-full bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 transition-colors"
                disabled={!data.dataInicio}
              >
                Correta
              </button>
              <button
                onClick={() => { setDateInput(data.dataInicio || ""); goTo("data_inicio_corrigir") }}
                className="px-3 py-1.5 text-xs rounded-full bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors"
              >
                {data.dataInicio ? "Errada" : "Introduzir"}
              </button>
            </div>
          </>
        )}

        {/* Step: data_inicio_corrigir */}
        {data.step === "data_inicio_corrigir" && (
          <>
            <p className="text-sm text-foreground">
              <strong>Introduz a data de início correta:</strong>
            </p>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-accent"
              />
              <button
                onClick={() => { goTo("data_fim", { dataInicio: dateInput }); setDateInput("") }}
                disabled={!dateInput}
                className="px-3 py-1.5 text-xs rounded-full bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors disabled:opacity-40"
              >
                Confirmar
              </button>
            </div>
          </>
        )}

        {/* Step: data_fim */}
        {data.step === "data_fim" && (
          <>
            <p className="text-sm text-foreground">
              <strong>Data de fim detectada:</strong> {data.dataFim ? formatDate(data.dataFim) : "Não detectada"}
            </p>
            <p className="text-xs text-muted">Está correta?</p>
            <div className="flex gap-2">
              <button
                onClick={() => goTo("resumo")}
                className="px-3 py-1.5 text-xs rounded-full bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 transition-colors"
                disabled={!data.dataFim}
              >
                Correta
              </button>
              <button
                onClick={() => { setDateInput(data.dataFim || ""); goTo("data_fim_corrigir") }}
                className="px-3 py-1.5 text-xs rounded-full bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors"
              >
                {data.dataFim ? "Errada" : "Introduzir"}
              </button>
            </div>
          </>
        )}

        {/* Step: data_fim_corrigir */}
        {data.step === "data_fim_corrigir" && (
          <>
            <p className="text-sm text-foreground">
              <strong>Introduz a data de fim correta:</strong>
            </p>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-accent"
              />
              <button
                onClick={() => { goTo("resumo", { dataFim: dateInput }); setDateInput("") }}
                disabled={!dateInput}
                className="px-3 py-1.5 text-xs rounded-full bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors disabled:opacity-40"
              >
                Confirmar
              </button>
            </div>
          </>
        )}

        {/* Step: resumo */}
        {data.step === "resumo" && (
          <>
            <p className="text-sm text-foreground font-semibold mb-2">Resumo do CIT:</p>
            <div className="text-xs text-foreground space-y-1">
              <p><strong>Tipo:</strong> {tipoCitLabel(data.tipoCit)}</p>
              <p><strong>Data início:</strong> {formatDate(data.dataInicio)}</p>
              <p><strong>Data fim:</strong> {formatDate(data.dataFim)}</p>
              {data.numeroCit && <p><strong>Nº CIT:</strong> {data.numeroCit}</p>}
              {data.colaboradorMatch && (
                <p><strong>Colaborador:</strong> {data.colaboradorMatch.nome}</p>
              )}
              {typeof data.dados.nome_utente === "string" && (
                <p><strong>Utente:</strong> {data.dados.nome_utente}</p>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onConfirm(data)}
                className="px-4 py-1.5 text-xs rounded-full bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 transition-colors font-medium"
              >
                Confirmar
              </button>
              <button
                onClick={() => goTo("tipo", {
                  tipoCit: (data.dados.tipo_cit as string) || "inicial",
                  dataInicio: (data.dados.data_inicio as string) || "",
                  dataFim: (data.dados.data_fim as string) || "",
                })}
                className="px-4 py-1.5 text-xs rounded-full bg-card text-muted border border-border hover:bg-border/30 transition-colors"
              >
                Recomeçar
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-1.5 text-xs rounded-full bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
