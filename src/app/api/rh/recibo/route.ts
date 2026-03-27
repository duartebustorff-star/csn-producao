import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { getServiceSupabase } from "@/lib/supabase"

function s(str: string | null | undefined): string {
  if (!str) return "-"
  return str
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\xFF]/g, "?")
}

const MESES = [
  "", "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams
  const colaborador_rh_id = Number(url.get("colaborador_rh_id"))
  const ano = Number(url.get("ano"))
  const mes = Number(url.get("mes"))

  if (!colaborador_rh_id || !ano || !mes) {
    return NextResponse.json({ error: "colaborador_rh_id, ano e mes obrigatorios" }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  const { data: recibo, error: errRecibo } = await supabase
    .from("recibos_vencimento")
    .select("*")
    .eq("colaborador_rh_id", colaborador_rh_id)
    .eq("ano", ano)
    .eq("mes", mes)
    .single()

  if (errRecibo || !recibo) {
    return NextResponse.json({ error: "Recibo nao encontrado" }, { status: 404 })
  }

  const { data: colab, error: errColab } = await supabase
    .from("colaboradores_rh")
    .select("*")
    .eq("id", colaborador_rh_id)
    .single()

  if (errColab || !colab) {
    return NextResponse.json({ error: "Colaborador nao encontrado" }, { status: 404 })
  }

  // PDF A4 Landscape
  const W = 842
  const H = 595
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([W, H])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const mono = await pdfDoc.embedFont(StandardFonts.Courier)

  const BLACK = rgb(0, 0, 0)
  const GRAY = rgb(0.4, 0.4, 0.4)
  const DARK = rgb(0.2, 0.2, 0.2)
  const LIGHT = rgb(0.95, 0.95, 0.95)
  const LINE = rgb(0.75, 0.75, 0.75)
  const ORANGE = rgb(0.976, 0.576, 0.043)

  const periodo = `${MESES[mes]} ${ano}`
  const halfW = W / 2

  for (let copy = 0; copy < 2; copy++) {
    const ox = copy * halfW
    const label = copy === 0 ? "ORIGINAL" : "DUPLICADO"
    const m = 20
    const colW = halfW - m * 2

    // Vertical separator
    if (copy === 1) {
      page.drawLine({ start: { x: halfW, y: H - 10 }, end: { x: halfW, y: 10 }, thickness: 0.5, color: LINE, dashArray: [4, 2] })
    }

    // Header bar
    page.drawRectangle({ x: ox + m, y: H - 40, width: colW, height: 28, color: BLACK })
    page.drawText(s("RECIBO DE VENCIMENTO"), { x: ox + m + 8, y: H - 34, size: 10, font: fontBold, color: rgb(1, 1, 1) })
    page.drawText(s(label), { x: ox + colW - 30, y: H - 34, size: 8, font, color: ORANGE })

    // Empresa
    let y = H - 58
    page.drawText(s("Carlos dos Santos Nascimento, Lda"), { x: ox + m, y, size: 9, font: fontBold, color: BLACK })
    y -= 12
    page.drawText(s("NIF: 500 861 790 | Casal do Rodo, Encarnacao, 2640-216 Mafra"), { x: ox + m, y, size: 7, font, color: GRAY })

    // Separator
    y -= 10
    page.drawLine({ start: { x: ox + m, y }, end: { x: ox + m + colW, y }, thickness: 0.5, color: LINE })

    // Colaborador
    y -= 14
    page.drawText(s("Colaborador"), { x: ox + m, y, size: 7, font, color: GRAY })
    page.drawText(s(colab.nome_completo), { x: ox + m + 70, y, size: 8, font: fontBold, color: BLACK })
    y -= 12
    page.drawText(s("NIF"), { x: ox + m, y, size: 7, font, color: GRAY })
    page.drawText(s(colab.nif), { x: ox + m + 70, y, size: 8, font, color: BLACK })
    page.drawText(s("NISS"), { x: ox + m + 170, y, size: 7, font, color: GRAY })
    page.drawText(s(colab.niss), { x: ox + m + 200, y, size: 8, font, color: BLACK })
    y -= 12
    page.drawText(s("Categoria"), { x: ox + m, y, size: 7, font, color: GRAY })
    page.drawText(s(colab.categoria_profissional || "Serralheiro civil"), { x: ox + m + 70, y, size: 8, font, color: BLACK })
    y -= 12
    page.drawText(s("Seguradora AT"), { x: ox + m, y, size: 7, font, color: GRAY })
    page.drawText(s("Lusitania - Apolice 4006903"), { x: ox + m + 70, y, size: 8, font, color: BLACK })
    y -= 12
    page.drawText(s("Periodo"), { x: ox + m, y, size: 7, font, color: GRAY })
    page.drawText(s(periodo), { x: ox + m + 70, y, size: 8, font: fontBold, color: BLACK })
    page.drawText(s(`${recibo.dias_trabalhados}/${recibo.dias_uteis} dias`), { x: ox + m + 200, y, size: 8, font, color: GRAY })

    // Separator
    y -= 10
    page.drawLine({ start: { x: ox + m, y }, end: { x: ox + m + colW, y }, thickness: 0.5, color: LINE })

    // Table header: ABONOS
    y -= 16
    page.drawRectangle({ x: ox + m, y: y - 3, width: colW, height: 14, color: LIGHT })
    page.drawText(s("Cod."), { x: ox + m + 4, y, size: 7, font: fontBold, color: DARK })
    page.drawText(s("Descricao"), { x: ox + m + 40, y, size: 7, font: fontBold, color: DARK })
    page.drawText(s("Valor"), { x: ox + m + colW - 60, y, size: 7, font: fontBold, color: DARK })

    // Abonos rows
    const abonos: [string, string, number][] = [
      ["A001", "Vencimento Base", recibo.vencimento_base],
      ["A002", "Subsidio de Alimentacao", recibo.subsidio_alimentacao],
      ["A003", "Subsidio de Ferias (1/12)", recibo.duodecimo_ferias],
      ["A004", "Subsidio de Natal (1/12)", recibo.duodecimo_natal],
    ]

    if (Number(recibo.km_viatura) > 0) {
      abonos.push(["A005", "KM Viatura", recibo.km_viatura])
    }

    y -= 14
    for (const [cod, desc, val] of abonos) {
      page.drawText(s(String(cod)), { x: ox + m + 4, y, size: 7, font: mono, color: GRAY })
      page.drawText(s(String(desc)), { x: ox + m + 40, y, size: 7, font, color: BLACK })
      page.drawText(s(`${Number(val).toFixed(2)} EUR`), { x: ox + m + colW - 60, y, size: 7, font: mono, color: BLACK })
      y -= 12
    }

    // Separator
    y -= 4
    page.drawLine({ start: { x: ox + m, y }, end: { x: ox + m + colW, y }, thickness: 0.3, color: LINE })

    // DESCONTOS header
    y -= 14
    page.drawRectangle({ x: ox + m, y: y - 3, width: colW, height: 14, color: LIGHT })
    page.drawText(s("Cod."), { x: ox + m + 4, y, size: 7, font: fontBold, color: DARK })
    page.drawText(s("Descricao"), { x: ox + m + 40, y, size: 7, font: fontBold, color: DARK })
    page.drawText(s("Valor"), { x: ox + m + colW - 60, y, size: 7, font: fontBold, color: DARK })

    y -= 14
    page.drawText(s("D003"), { x: ox + m + 4, y, size: 7, font: mono, color: GRAY })
    page.drawText(s(`Seguranca Social (${Number(recibo.taxa_ss).toFixed(1)}%)`), { x: ox + m + 40, y, size: 7, font, color: BLACK })
    page.drawText(s(`-${Number(recibo.desconto_ss).toFixed(2)} EUR`), { x: ox + m + colW - 60, y, size: 7, font: mono, color: rgb(0.8, 0.1, 0.1) })

    if (Number(recibo.retencao_irs) > 0) {
      y -= 12
      page.drawText(s("D001"), { x: ox + m + 4, y, size: 7, font: mono, color: GRAY })
      page.drawText(s(`IRS (${Number(recibo.taxa_irs).toFixed(1)}%)`), { x: ox + m + 40, y, size: 7, font, color: BLACK })
      page.drawText(s(`-${Number(recibo.retencao_irs).toFixed(2)} EUR`), { x: ox + m + colW - 60, y, size: 7, font: mono, color: rgb(0.8, 0.1, 0.1) })
    }

    // TOTALS
    y -= 20
    page.drawLine({ start: { x: ox + m, y: y + 6 }, end: { x: ox + m + colW, y: y + 6 }, thickness: 1, color: BLACK })

    page.drawText(s("Bruto"), { x: ox + m + 4, y, size: 7, font, color: GRAY })
    page.drawText(s(`${Number(recibo.bruto).toFixed(2)} EUR`), { x: ox + m + 80, y, size: 7, font: mono, color: BLACK })

    page.drawText(s("Descontos"), { x: ox + m + 160, y, size: 7, font, color: GRAY })
    const totalDescontos = Number(recibo.desconto_ss) + Number(recibo.retencao_irs)
    page.drawText(s(`-${totalDescontos.toFixed(2)} EUR`), { x: ox + m + 220, y, size: 7, font: mono, color: rgb(0.8, 0.1, 0.1) })

    y -= 18
    page.drawRectangle({ x: ox + m, y: y - 5, width: colW, height: 18, color: BLACK })
    page.drawText(s("TOTAL PAGO"), { x: ox + m + 8, y, size: 9, font: fontBold, color: rgb(1, 1, 1) })
    page.drawText(s(`${Number(recibo.liquido).toFixed(2)} EUR`), { x: ox + m + colW - 80, y, size: 10, font: fontBold, color: ORANGE })

    // Footer
    page.drawText(s(`Recibo n. ${recibo.numero_recibo}`), { x: ox + m, y: 30, size: 7, font: mono, color: GRAY })
    page.drawText(s("CSN Opus | Carlos dos Santos Nascimento, Lda"), { x: ox + m, y: 18, size: 6, font, color: LINE })
  }

  const bytes = await pdfDoc.save()

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo_${colab.nif}_${ano}_${String(mes).padStart(2, "0")}.pdf"`,
    },
  })
}
