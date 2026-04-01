import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { getServiceSupabase } from "@/lib/supabase"

type MesLinha = {
  ano: number
  mes: number
  base: number
  horasExtraQtd: number
  horasExtraValor: number
  subsidioAlimentacao: number
  duodecimos: number
  descontoSS: number
  descontoIRS: number
  liquidoDevido: number
  transferenciaData: string
  pagoMes: number
  saldoAcumulado: number
}

function s(str: string | null | undefined): string {
  if (!str) return "-"
  return str
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\xFF]/g, "?")
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

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function normalizeIban(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, "").toUpperCase()
}

function toMonthKey(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`
}

function euro(value: number): string {
  return `${value.toFixed(2)} EUR`
}

function datePt(value: Date | null): string {
  if (!value) return "-"
  const dd = String(value.getDate()).padStart(2, "0")
  const mm = String(value.getMonth() + 1).padStart(2, "0")
  const yyyy = value.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

const MESES = [
  "",
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

export async function GET(req: NextRequest) {
  const colaboradorRhId = Number(req.nextUrl.searchParams.get("colaborador_rh_id"))
  const ano = Number(req.nextUrl.searchParams.get("ano"))
  if (!colaboradorRhId || !ano) {
    return NextResponse.json({ error: "colaborador_rh_id e ano obrigatorios" }, { status: 400 })
  }

  const sb = getServiceSupabase()
  const { data: trabalhador, error: errTrab } = await sb
    .from("colaboradores_rh")
    .select("id, nome_completo, nif, niss, iban")
    .eq("id", colaboradorRhId)
    .maybeSingle()

  if (errTrab || !trabalhador) {
    return NextResponse.json({ error: "Trabalhador não encontrado" }, { status: 404 })
  }

  const { data: recibos, error: errRecibos } = await sb
    .from("recibos_vencimento")
    .select("*")
    .eq("colaborador_rh_id", colaboradorRhId)
    .eq("ano", ano)
    .order("mes", { ascending: true })

  if (errRecibos) {
    return NextResponse.json({ error: "Erro ao carregar recibos" }, { status: 500 })
  }

  const { data: movimentos, error: errMov } = await sb
    .from("movimentos_bancarios")
    .select("*")

  if (errMov) {
    return NextResponse.json({ error: "Erro ao carregar movimentos bancarios" }, { status: 500 })
  }

  const iban = normalizeIban(trabalhador.iban)
  const pagamentosPorMes = new Map<string, { total: number; datas: Date[] }>()

  for (const mov of (movimentos || []) as Record<string, unknown>[]) {
    if (!iban) continue
    const descricao = normalizeIban(
      (typeof mov.descricao === "string" && mov.descricao) ||
      (typeof mov.description === "string" && mov.description) ||
      (typeof mov.movimento === "string" && mov.movimento) ||
      ""
    )
    if (!descricao.includes(iban)) continue

    const dt = parseDate(mov.data_movimento) || parseDate(mov.data) || parseDate(mov.created_at)
    if (!dt || dt.getFullYear() !== ano) continue

    const valor = Math.abs(parseNumber("valor" in mov ? mov.valor : mov.amount))
    if (!valor) continue

    const key = toMonthKey(dt.getFullYear(), dt.getMonth() + 1)
    const atual = pagamentosPorMes.get(key) || { total: 0, datas: [] }
    atual.total += valor
    atual.datas.push(dt)
    pagamentosPorMes.set(key, atual)
  }

  const porMes = new Map<number, MesLinha>()
  for (let mes = 1; mes <= 12; mes++) {
    const key = toMonthKey(ano, mes)
    const pg = pagamentosPorMes.get(key)
    const dataTransferencia = pg?.datas.length
      ? new Date(Math.max(...pg.datas.map((d) => d.getTime())))
      : null

    porMes.set(mes, {
      ano,
      mes,
      base: 0,
      horasExtraQtd: 0,
      horasExtraValor: 0,
      subsidioAlimentacao: 0,
      duodecimos: 0,
      descontoSS: 0,
      descontoIRS: 0,
      liquidoDevido: 0,
      transferenciaData: datePt(dataTransferencia),
      pagoMes: pg ? pg.total : 0,
      saldoAcumulado: 0,
    })
  }

  for (const r of (recibos || []) as Record<string, unknown>[]) {
    const mes = Number(r.mes)
    if (!mes || mes < 1 || mes > 12) continue
    const l = porMes.get(mes)!
    l.base += parseNumber(r.vencimento_base ?? r.base ?? r.remuneracao_base ?? r.bruto)
    l.horasExtraQtd += parseNumber(r.horas_extra_quantidade ?? r.horas_extra_horas ?? r.horas_extra_qtd)
    l.horasExtraValor += parseNumber(r.horas_extra_valor ?? r.valor_horas_extra)
    l.subsidioAlimentacao += parseNumber(r.subsidio_alimentacao)
    l.duodecimos += parseNumber(r.duodecimos ?? r.duodecimo_ferias ?? r.duodecimo_natal)
    l.descontoSS += parseNumber(r.desconto_ss)
    l.descontoIRS += parseNumber(r.retencao_irs)
    l.liquidoDevido += parseNumber(r.liquido)
  }

  const linhas = Array.from(porMes.values()).sort((a, b) => a.mes - b.mes)
  let saldo = 0
  for (const l of linhas) {
    saldo += l.liquidoDevido - l.pagoMes
    l.saldoAcumulado = Math.round(saldo * 100) / 100
    l.pagoMes = Math.round(l.pagoMes * 100) / 100
  }

  const totalDevido = linhas.reduce((n, l) => n + l.liquidoDevido, 0)
  const totalPago = linhas.reduce((n, l) => n + l.pagoMes, 0)
  const saldoFinal = Math.round((totalDevido - totalPago) * 100) / 100

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([842, 595]) // A4 landscape
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const mono = await pdf.embedFont(StandardFonts.Courier)
  const BLACK = rgb(0, 0, 0)
  const GRAY = rgb(0.45, 0.45, 0.45)
  const LIGHT = rgb(0.93, 0.93, 0.93)
  const LINE = rgb(0.8, 0.8, 0.8)

  const m = 24
  const W = 842 - 2 * m
  let y = 565

  page.drawText(s("EXTRACTO ANUAL DE PAGAMENTOS"), { x: m, y, size: 14, font: bold, color: BLACK })
  y -= 16
  page.drawText(s(`Ano: ${ano}`), { x: m, y, size: 10, font: bold, color: BLACK })
  y -= 14
  page.drawText(s(`Trabalhador: ${trabalhador.nome_completo} | NIF: ${trabalhador.nif || "-"} | NISS: ${trabalhador.niss || "-"}`), {
    x: m, y, size: 8, font, color: BLACK,
  })
  y -= 12
  page.drawText(s(`IBAN: ${trabalhador.iban || "-"}`), { x: m, y, size: 8, font, color: GRAY })
  y -= 14

  page.drawRectangle({ x: m, y: y - 2, width: W, height: 16, color: LIGHT })
  const cols = {
    mes: m + 4,
    base: m + 82,
    hextra: m + 150,
    abonos: m + 248,
    descontos: m + 352,
    liquido: m + 446,
    transfer: m + 526,
    pago: m + 618,
    saldo: m + 706,
  }
  page.drawText("Mes", { x: cols.mes, y, size: 7, font: bold, color: BLACK })
  page.drawText("Base", { x: cols.base, y, size: 7, font: bold, color: BLACK })
  page.drawText("Horas extra (qtd/valor)", { x: cols.hextra, y, size: 7, font: bold, color: BLACK })
  page.drawText("Abonos (alim + duod.)", { x: cols.abonos, y, size: 7, font: bold, color: BLACK })
  page.drawText("Descontos (SS+IRS)", { x: cols.descontos, y, size: 7, font: bold, color: BLACK })
  page.drawText("Liquido devido", { x: cols.liquido, y, size: 7, font: bold, color: BLACK })
  page.drawText("Data transferencia", { x: cols.transfer, y, size: 7, font: bold, color: BLACK })
  page.drawText("Pago", { x: cols.pago, y, size: 7, font: bold, color: BLACK })
  page.drawText("Saldo acum.", { x: cols.saldo, y, size: 7, font: bold, color: BLACK })

  y -= 14
  for (const l of linhas) {
    const abonos = l.subsidioAlimentacao + l.duodecimos
    const descontos = l.descontoSS + l.descontoIRS
    page.drawLine({ start: { x: m, y: y - 2 }, end: { x: m + W, y: y - 2 }, thickness: 0.5, color: LINE })
    page.drawText(s(`${MESES[l.mes]} ${l.ano}`), { x: cols.mes, y, size: 7, font, color: BLACK })
    page.drawText(euro(l.base).replace(" EUR", ""), { x: cols.base, y, size: 7, font: mono, color: BLACK })
    page.drawText(s(`${l.horasExtraQtd.toFixed(1)}h / ${euro(l.horasExtraValor).replace(" EUR", "")}`), { x: cols.hextra, y, size: 7, font: mono, color: BLACK })
    page.drawText(s(`${euro(l.subsidioAlimentacao).replace(" EUR", "")} + ${euro(l.duodecimos).replace(" EUR", "")}`), { x: cols.abonos, y, size: 7, font: mono, color: BLACK })
    page.drawText(euro(descontos).replace(" EUR", ""), { x: cols.descontos, y, size: 7, font: mono, color: BLACK })
    page.drawText(euro(l.liquidoDevido).replace(" EUR", ""), { x: cols.liquido, y, size: 7, font: mono, color: BLACK })
    page.drawText(s(l.transferenciaData), { x: cols.transfer, y, size: 7, font, color: BLACK })
    page.drawText(euro(l.pagoMes).replace(" EUR", ""), { x: cols.pago, y, size: 7, font: mono, color: BLACK })
    page.drawText(euro(l.saldoAcumulado).replace(" EUR", ""), { x: cols.saldo, y, size: 7, font: mono, color: BLACK })
    y -= 18
  }

  y -= 4
  page.drawLine({ start: { x: m, y }, end: { x: m + W, y }, thickness: 1, color: BLACK })
  y -= 14
  page.drawText(s(`Totais do ano | Devido: ${euro(totalDevido)} | Pago: ${euro(totalPago)} | Saldo final: ${euro(saldoFinal)}`), {
    x: m, y, size: 8, font: bold, color: BLACK,
  })

  page.drawText(
    s("Fonte de dados: recibos_vencimento + movimentos_bancarios (match por IBAN em descricao do movimento)."),
    { x: m, y: 18, size: 7, font, color: GRAY }
  )

  const bytes = await pdf.save()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=\"extracto_pagamentos_${colaboradorRhId}_${ano}.pdf\"`,
    },
  })
}

