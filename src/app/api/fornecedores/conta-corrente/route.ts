import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

type MesKey = `${number}-${string}`

interface HistoricoMensal {
  ano: number
  mes: number
  faturado: number
  pago: number
  saldo_mes: number
}

function toMonthKey(ano: number, mes: number): MesKey {
  return `${ano}-${String(mes).padStart(2, "0")}`
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const normalized = value.replace(/\./g, "").replace(",", ".")
    const n = Number(normalized)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function parseDateCandidate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getEfaturaTotal(row: Record<string, unknown>): number {
  return Math.abs(
    parseNumber(row.total ?? row.valor_total ?? row.total_documento ?? row.total_iva_base)
  )
}

function getEfaturaDate(row: Record<string, unknown>): Date | null {
  return (
    parseDateCandidate(row.data_emissao) ||
    parseDateCandidate(row.data_documento) ||
    parseDateCandidate(row.data) ||
    parseDateCandidate(row.created_at) ||
    null
  )
}

function getMovimentoValor(mov: Record<string, unknown>): number {
  if ("valor" in mov) return parseNumber(mov.valor)
  if ("amount" in mov) return parseNumber(mov.amount)
  return 0
}

function getMovimentoDescricao(mov: Record<string, unknown>): string {
  const candidates = [mov.descricao, mov.description, mov.movimento]
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c
  }
  return ""
}

/** Saída de caixa (pagamento a fornecedor): débito / valor negativo / tipo explícito. */
function isMovimentoSaida(mov: Record<string, unknown>): boolean {
  if (mov.dc === "D" || mov.dc === "d") return true
  if (mov.debito === true) return true
  const tipo = String(mov.tipo_movimento ?? mov.tipo ?? mov.sentido ?? mov.natureza ?? "").toLowerCase()
  if (tipo.includes("saida") || tipo.includes("saída") || tipo.includes("debit")) {
    return true
  }
  if (tipo.includes("entrada") || tipo === "c" || tipo.includes("credit")) return false
  const v = getMovimentoValor(mov)
  return v < 0
}

function descricaoContemNif(descricao: string, nifDigits: string): boolean {
  if (!nifDigits || nifDigits.length !== 9) return false
  const norm = descricao.replace(/\s+/g, "")
  if (norm.includes(nifDigits)) return true
  if (norm.toUpperCase().includes(`PT${nifDigits}`)) return true
  return new RegExp(nifDigits.split("").join("\\s*")).test(descricao)
}

export async function GET(req: NextRequest) {
  const supabase = getServiceSupabase()
  const fornecedorIdRaw = req.nextUrl.searchParams.get("fornecedor_id")
  const fornecedorId = Number(fornecedorIdRaw)
  if (!fornecedorIdRaw || !Number.isFinite(fornecedorId) || fornecedorId < 1) {
    return NextResponse.json({ error: "Parâmetro fornecedor_id é obrigatório (número positivo)." }, { status: 400 })
  }

  const { data: fornecedor, error: fornErr } = await supabase
    .from("fornecedores")
    .select("id, nome, nif")
    .eq("id", fornecedorId)
    .maybeSingle()

  if (fornErr || !fornecedor) {
    return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 })
  }

  const nifDigits = String(fornecedor.nif ?? "").replace(/\D/g, "").slice(0, 9)
  if (nifDigits.length !== 9) {
    return NextResponse.json({
      fornecedor_id: fornecedorId,
      nome: fornecedor.nome,
      nif: fornecedor.nif,
      total_faturado: 0,
      total_pago: 0,
      saldo_divda: 0,
      historico_mensal: [] as HistoricoMensal[],
      aviso: "Fornecedor sem NIF válido (9 dígitos); não é possível cruzar com movimentos bancários.",
    })
  }

  const { data: faturas, error: fatErr } = await supabase
    .from("efatura")
    .select("*")
    .eq("fornecedor_id", fornecedorId)

  if (fatErr) {
    console.error("conta-corrente fornecedor efatura:", fatErr)
    return NextResponse.json(
      { error: "Erro ao carregar e-faturas.", detalhe: fatErr.message },
      { status: 500 }
    )
  }

  const { data: movimentos, error: movErr } = await supabase.from("movimentos_bancarios").select("*")

  if (movErr) {
    console.error("conta-corrente fornecedor movimentos:", movErr)
    return NextResponse.json(
      { error: "Erro ao carregar movimentos bancários.", detalhe: movErr.message },
      { status: 500 }
    )
  }

  const faturadoPorMes = new Map<MesKey, number>()
  for (const raw of (faturas || []) as Record<string, unknown>[]) {
    const dt = getEfaturaDate(raw)
    if (!dt) continue
    const key = toMonthKey(dt.getFullYear(), dt.getMonth() + 1)
    const val = getEfaturaTotal(raw)
    faturadoPorMes.set(key, (faturadoPorMes.get(key) || 0) + val)
  }

  const pagoPorMes = new Map<MesKey, number>()
  for (const raw of (movimentos || []) as Record<string, unknown>[]) {
    if (!isMovimentoSaida(raw)) continue
    const desc = getMovimentoDescricao(raw)
    if (!descricaoContemNif(desc, nifDigits)) continue

    const dt =
      parseDateCandidate(raw.data_movimento) ||
      parseDateCandidate(raw.data) ||
      parseDateCandidate(raw.created_at) ||
      null
    if (!dt) continue

    const key = toMonthKey(dt.getFullYear(), dt.getMonth() + 1)
    const valor = Math.abs(getMovimentoValor(raw))
    if (!valor) continue

    pagoPorMes.set(key, (pagoPorMes.get(key) || 0) + valor)
  }

  const allKeys = new Set<MesKey>([...faturadoPorMes.keys(), ...pagoPorMes.keys()])
  const orderedKeys = [...allKeys].sort()

  const historicoAsc: HistoricoMensal[] = orderedKeys.map((key) => {
    const [anoStr, mesStr] = key.split("-")
    const faturado = Math.round((faturadoPorMes.get(key) || 0) * 100) / 100
    const pago = Math.round((pagoPorMes.get(key) || 0) * 100) / 100
    const saldoMes = Math.round((faturado - pago) * 100) / 100
    return {
      ano: Number(anoStr),
      mes: Number(mesStr),
      faturado,
      pago,
      saldo_mes: saldoMes,
    }
  })

  const totalFaturado = Math.round(historicoAsc.reduce((s, m) => s + m.faturado, 0) * 100) / 100
  const totalPago = Math.round(historicoAsc.reduce((s, m) => s + m.pago, 0) * 100) / 100
  const saldoDivda = Math.round((totalFaturado - totalPago) * 100) / 100

  return NextResponse.json({
    fornecedor_id: fornecedorId,
    nome: fornecedor.nome,
    nif: nifDigits,
    total_faturado: totalFaturado,
    total_pago: totalPago,
    saldo_divda: saldoDivda,
    historico_mensal: historicoAsc.reverse(),
  })
}
