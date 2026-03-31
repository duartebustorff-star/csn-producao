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

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const colaboradorRhId = Number(params.get("colaborador_rh_id"))
  const ano = Number(params.get("ano"))

  if (!colaboradorRhId || !ano) {
    return NextResponse.json({ error: "colaborador_rh_id e ano obrigatorios" }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  const { data: colab, error: colabError } = await supabase
    .from("colaboradores_rh")
    .select("id, nome_completo, nif")
    .eq("id", colaboradorRhId)
    .maybeSingle()

  if (colabError || !colab) {
    return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 })
  }

  const { data: recibos, error: recibosError } = await supabase
    .from("recibos_vencimento")
    .select("mes, liquido")
    .eq("colaborador_rh_id", colaboradorRhId)
    .eq("ano", ano)
    .order("mes")

  if (recibosError) {
    return NextResponse.json({ error: "Erro ao carregar recibos" }, { status: 500 })
  }

  if (!recibos || recibos.length === 0) {
    return NextResponse.json({ error: `Sem recibos para ${ano}` }, { status: 404 })
  }

  const liquidoPorMes = new Map<number, number>()
  for (const r of recibos) {
    const mes = Number(r.mes)
    const liquido = Number(r.liquido || 0)
    liquidoPorMes.set(mes, (liquidoPorMes.get(mes) || 0) + liquido)
  }

  const mesesEmFalta: number[] = []
  for (let mes = 1; mes <= 12; mes++) {
    if (!liquidoPorMes.has(mes)) mesesEmFalta.push(mes)
  }
  if (mesesEmFalta.length > 0) {
    return NextResponse.json({
      error: `Ano ${ano} incompleto. Meses em falta: ${mesesEmFalta.join(", ")}`,
    }, { status: 400 })
  }

  const totalAnual = Array.from(liquidoPorMes.values()).reduce((s, v) => s + v, 0)

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const mono = await pdfDoc.embedFont(StandardFonts.Courier)

  const BLACK = rgb(0, 0, 0)
  const GRAY = rgb(0.4, 0.4, 0.4)
  const LIGHT = rgb(0.95, 0.95, 0.95)
  const LINE = rgb(0.8, 0.8, 0.8)
  const ORANGE = rgb(0.976, 0.576, 0.043)
  const m = 46
  const w = 595 - 2 * m
  let y = 790

  page.drawRectangle({ x: 0, y: 836, width: 595, height: 6, color: ORANGE })
  page.drawText(s("RESUMO ANUAL DE PAGAMENTOS"), { x: m, y, size: 16, font: bold, color: BLACK })
  y -= 18
  page.drawText(s(`Ano: ${ano}`), { x: m, y, size: 10, font: bold, color: ORANGE })
  y -= 14
  page.drawText(s(`Colaborador: ${colab.nome_completo}`), { x: m, y, size: 9, font, color: BLACK })
  y -= 12
  page.drawText(s(`NIF: ${colab.nif}`), { x: m, y, size: 9, font, color: GRAY })

  y -= 16
  page.drawLine({ start: { x: m, y }, end: { x: m + w, y }, thickness: 1, color: LINE })
  y -= 18

  page.drawRectangle({ x: m, y: y - 4, width: w, height: 16, color: LIGHT })
  page.drawText("Mes", { x: m + 10, y, size: 8, font: bold, color: BLACK })
  page.drawText("Total pago (liquido)", { x: m + w - 180, y, size: 8, font: bold, color: BLACK })

  y -= 18
  for (let mes = 1; mes <= 12; mes++) {
    const valor = liquidoPorMes.get(mes) || 0
    page.drawText(s(MESES[mes]), { x: m + 10, y, size: 9, font, color: BLACK })
    page.drawText(`${valor.toFixed(2)} EUR`, { x: m + w - 120, y, size: 9, font: mono, color: BLACK })
    y -= 16
  }

  y -= 4
  page.drawLine({ start: { x: m, y }, end: { x: m + w, y }, thickness: 1, color: BLACK })
  y -= 20
  page.drawRectangle({ x: m, y: y - 5, width: w, height: 22, color: BLACK })
  page.drawText("TOTAL ANUAL PAGO", { x: m + 10, y, size: 10, font: bold, color: rgb(1, 1, 1) })
  page.drawText(`${totalAnual.toFixed(2)} EUR`, { x: m + w - 140, y, size: 11, font: bold, color: ORANGE })

  page.drawText(
    s("Documento gerado automaticamente pelo CSN Opus a partir dos recibos de vencimento."),
    { x: m, y: 42, size: 7, font, color: GRAY }
  )
  page.drawText(
    s("Carlos dos Santos Nascimento, Lda | NIF 500 861 790"),
    { x: m, y: 30, size: 7, font, color: LINE }
  )

  const bytes = await pdfDoc.save()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=\"resumo_pagamentos_${colab.nif}_${ano}.pdf\"`,
    },
  })
}
