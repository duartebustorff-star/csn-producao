import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

type MesKey = `${number}-${string}`

interface HistoricoMensal {
  ano: number
  mes: number
  devido: number
  pago: number
  saldo_mes: number
  saldo_acumulado: number
}

function toMonthKey(ano: number, mes: number): MesKey {
  return `${ano}-${String(mes).padStart(2, "0")}`
}

function normalizeIban(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, "").toUpperCase()
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

function getMovimentoDate(mov: Record<string, unknown>): Date | null {
  return (
    parseDateCandidate(mov.data_movimento) ||
    parseDateCandidate(mov.data) ||
    parseDateCandidate(mov.created_at) ||
    null
  )
}

function getMovimentoDescricao(mov: Record<string, unknown>): string {
  const candidates = [mov.descricao, mov.description, mov.movimento]
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c
  }
  return ""
}

function getMovimentoValor(mov: Record<string, unknown>): number {
  if ("valor" in mov) return parseNumber(mov.valor)
  if ("amount" in mov) return parseNumber(mov.amount)
  return 0
}

export async function GET(req: NextRequest) {
  const supabase = getServiceSupabase()
  const colaboradorRhId = req.nextUrl.searchParams.get("colaborador_rh_id")

  if (!colaboradorRhId) {
    return NextResponse.json({ error: "Falta colaborador_rh_id" }, { status: 400 })
  }

  const { data: colaborador, error: colabError } = await supabase
    .from("colaboradores_rh")
    .select("id, nome_completo, iban")
    .eq("id", colaboradorRhId)
    .maybeSingle()

  if (colabError || !colaborador) {
    return NextResponse.json({ error: "Colaborador RH não encontrado" }, { status: 404 })
  }

  const iban = normalizeIban(colaborador.iban)
  if (!iban) {
    return NextResponse.json({
      colaborador_rh_id: Number(colaboradorRhId),
      nome: colaborador.nome_completo,
      iban: null,
      saldo_atual: 0,
      total_devido: 0,
      total_pago: 0,
      historico: [] as HistoricoMensal[],
      aviso: "Colaborador sem IBAN configurado",
    })
  }

  const { data: recibos, error: recibosError } = await supabase
    .from("recibos_vencimento")
    .select("ano, mes, liquido")
    .eq("colaborador_rh_id", colaboradorRhId)

  if (recibosError) {
    return NextResponse.json({ error: "Erro ao carregar recibos" }, { status: 500 })
  }

  const { data: movimentos, error: movimentosError } = await supabase
    .from("movimentos_bancarios")
    .select("*")

  if (movimentosError) {
    return NextResponse.json({ error: "Erro ao carregar movimentos bancários" }, { status: 500 })
  }

  const devidoPorMes = new Map<MesKey, number>()
  for (const r of recibos || []) {
    const key = toMonthKey(Number(r.ano), Number(r.mes))
    const liquido = parseNumber(r.liquido)
    devidoPorMes.set(key, (devidoPorMes.get(key) || 0) + liquido)
  }

  const pagoPorMes = new Map<MesKey, number>()
  for (const raw of (movimentos || []) as Record<string, unknown>[]) {
    const descricao = normalizeIban(getMovimentoDescricao(raw))
    if (!descricao.includes(iban)) continue

    const dt = getMovimentoDate(raw)
    if (!dt) continue

    const key = toMonthKey(dt.getFullYear(), dt.getMonth() + 1)
    const valor = Math.abs(getMovimentoValor(raw))
    if (!valor) continue

    pagoPorMes.set(key, (pagoPorMes.get(key) || 0) + valor)
  }

  const allKeys = new Set<MesKey>([...devidoPorMes.keys(), ...pagoPorMes.keys()])
  const orderedKeys = [...allKeys].sort()

  let saldoAcumulado = 0
  const historicoAsc: HistoricoMensal[] = orderedKeys.map((key) => {
    const [anoStr, mesStr] = key.split("-")
    const devido = Math.round((devidoPorMes.get(key) || 0) * 100) / 100
    const pago = Math.round((pagoPorMes.get(key) || 0) * 100) / 100
    const saldoMes = Math.round((devido - pago) * 100) / 100
    saldoAcumulado = Math.round((saldoAcumulado + saldoMes) * 100) / 100

    return {
      ano: Number(anoStr),
      mes: Number(mesStr),
      devido,
      pago,
      saldo_mes: saldoMes,
      saldo_acumulado: saldoAcumulado,
    }
  })

  const totalDevido = Math.round(historicoAsc.reduce((s, m) => s + m.devido, 0) * 100) / 100
  const totalPago = Math.round(historicoAsc.reduce((s, m) => s + m.pago, 0) * 100) / 100
  const saldoAtual = Math.round((totalDevido - totalPago) * 100) / 100

  return NextResponse.json({
    colaborador_rh_id: Number(colaboradorRhId),
    nome: colaborador.nome_completo,
    iban: colaborador.iban,
    saldo_atual: saldoAtual,
    total_devido: totalDevido,
    total_pago: totalPago,
    historico: historicoAsc.reverse(),
  })
}
