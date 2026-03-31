import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { getServiceSupabase } from "@/lib/supabase"

const MESES = [
  "", "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function s(str: string | null | undefined): string {
  if (!str) return "-"
  return str
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\xFF]/g, "?")
}

type LinhaMes = {
  mes: number
  bruto: number
  ss: number
  irs: number
  liquido: number
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const colaboradorRhId = Number(params.get("colaborador_rh_id"))
  const ano = Number(params.get("ano"))

  if (!colaboradorRhId || !ano) {
    return NextResponse.json({ error: "colaborador_rh_id e ano obrigatorios" }, { status: 400 })
  }

  const sb = getServiceSupabase()

  const { data: trabalhador, error: errTrab } = await sb
    .from("colaboradores_rh")
    .select("id, nome_completo, nif")
    .eq("id", colaboradorRhId)
    .maybeSingle()

  if (errTrab || !trabalhador) {
    return NextResponse.json({ error: "Trabalhador não encontrado" }, { status: 404 })
  }

  const { data: recibos, error: errRecibos } = await sb
    .from("recibos_vencimento")
    .select("mes, bruto, desconto_ss, retencao_irs, liquido")
    .eq("colaborador_rh_id", colaboradorRhId)
    .eq("ano", ano)
    .order("mes")

  if (errRecibos) {
    return NextResponse.json({ error: "Erro ao carregar recibos" }, { status: 500 })
  }

  const porMes = new Map<number, LinhaMes>()
  for (const r of recibos || []) {
    const mes = Number(r.mes)
    const atual = porMes.get(mes) || { mes, bruto: 0, ss: 0, irs: 0, liquido: 0 }
    atual.bruto += Number(r.bruto || 0)
    atual.ss += Number(r.desconto_ss || 0)
    atual.irs += Number(r.retencao_irs || 0)
    atual.liquido += Number(r.liquido || 0)
    porMes.set(mes, atual)
  }

  const linhas: LinhaMes[] = []
  for (let mes = 1; mes <= 12; mes++) {
    linhas.push(porMes.get(mes) || { mes, bruto: 0, ss: 0, irs: 0, liquido: 0 })
  }

  const totalBruto = linhas.reduce((soma, l) => soma + l.bruto, 0)
  const totalSS = linhas.reduce((soma, l) => soma + l.ss, 0)
  const totalIRS = linhas.reduce((soma, l) => soma + l.irs, 0)
  const totalLiquido = linhas.reduce((soma, l) => soma + l.liquido, 0)

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const mono = await pdfDoc.embedFont(StandardFonts.Courier)

  const BLACK = rgb(0, 0, 0)
  const GRAY = rgb(0.4, 0.4, 0.4)
  const LIGHT = rgb(0.95, 0.95, 0.95)
  const LINE = rgb(0.82, 0.82, 0.82)
  const ORANGE = rgb(0.976, 0.576, 0.043)

  const m = 42
  const W = 595 - 2 * m
  let y = 798

  page.drawRectangle({ x: 0, y: 836, width: 595, height: 6, color: ORANGE })
  page.drawText(s("DECLARACAO ANUAL DE REMUNERACOES"), { x: m, y, size: 15, font: bold, color: BLACK })
  y -= 16
  page.drawText(s(`Ano de referencia: ${ano}`), { x: m, y, size: 10, font: bold, color: ORANGE })

  y -= 20
  page.drawText(s("Entidade patronal"), { x: m, y, size: 9, font: bold, color: BLACK })
  y -= 12
  page.drawText(s("Carlos dos Santos Nascimento, Lda"), { x: m + 12, y, size: 9, font, color: BLACK })
  y -= 11
  page.drawText(s("NIF: 500 861 790"), { x: m + 12, y, size: 9, font, color: BLACK })

  y -= 16
  page.drawText(s("Trabalhador"), { x: m, y, size: 9, font: bold, color: BLACK })
  y -= 12
  page.drawText(s(`Nome: ${trabalhador.nome_completo}`), { x: m + 12, y, size: 9, font, color: BLACK })
  y -= 11
  page.drawText(s(`NIF: ${trabalhador.nif || "-"}`), { x: m + 12, y, size: 9, font, color: BLACK })

  y -= 18
  page.drawLine({ start: { x: m, y }, end: { x: m + W, y }, thickness: 1, color: LINE })
  y -= 14

  const col = {
    mes: m + 8,
    bruto: m + 160,
    ss: m + 265,
    irs: m + 365,
    liquido: m + 465,
  }

  page.drawRectangle({ x: m, y: y - 4, width: W, height: 16, color: LIGHT })
  page.drawText("Mes", { x: col.mes, y, size: 8, font: bold, color: BLACK })
  page.drawText("Bruto", { x: col.bruto, y, size: 8, font: bold, color: BLACK })
  page.drawText("Desc. SS", { x: col.ss, y, size: 8, font: bold, color: BLACK })
  page.drawText("Desc. IRS", { x: col.irs, y, size: 8, font: bold, color: BLACK })
  page.drawText("Liquido", { x: col.liquido, y, size: 8, font: bold, color: BLACK })

  y -= 18
  for (const l of linhas) {
    page.drawText(s(MESES[l.mes]), { x: col.mes, y, size: 8, font, color: BLACK })
    page.drawText(`${l.bruto.toFixed(2)}`, { x: col.bruto, y, size: 8, font: mono, color: BLACK })
    page.drawText(`${l.ss.toFixed(2)}`, { x: col.ss, y, size: 8, font: mono, color: BLACK })
    page.drawText(`${l.irs.toFixed(2)}`, { x: col.irs, y, size: 8, font: mono, color: BLACK })
    page.drawText(`${l.liquido.toFixed(2)}`, { x: col.liquido, y, size: 8, font: mono, color: BLACK })
    y -= 14
  }

  y -= 4
  page.drawLine({ start: { x: m, y }, end: { x: m + W, y }, thickness: 1, color: BLACK })
  y -= 18

  page.drawText("Totais anuais", { x: m, y, size: 9, font: bold, color: BLACK })
  y -= 12
  page.drawText(`Bruto: ${totalBruto.toFixed(2)} EUR`, { x: m + 12, y, size: 8, font: mono, color: BLACK })
  y -= 11
  page.drawText(`Desconto SS: ${totalSS.toFixed(2)} EUR`, { x: m + 12, y, size: 8, font: mono, color: BLACK })
  y -= 11
  page.drawText(`Desconto IRS: ${totalIRS.toFixed(2)} EUR`, { x: m + 12, y, size: 8, font: mono, color: BLACK })
  y -= 11
  page.drawText(`Liquido: ${totalLiquido.toFixed(2)} EUR`, { x: m + 12, y, size: 8, font: mono, color: BLACK })

  page.drawText(
    s("Nota: esta declaracao deve ser emitida ate 31 de Janeiro do ano seguinte."),
    { x: m, y: 74, size: 8, font, color: GRAY }
  )
  page.drawText(
    s("CSN Opus | Carlos dos Santos Nascimento, Lda | NIF 500 861 790"),
    { x: m, y: 32, size: 7, font, color: LINE }
  )

  const bytes = await pdfDoc.save()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=\"declaracao_rendimentos_${(trabalhador.nif || "semnif")}_${ano}.pdf\"`,
    },
  })
}
