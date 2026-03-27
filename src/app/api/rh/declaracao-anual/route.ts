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

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams
  const colaborador_rh_id = Number(url.get("colaborador_rh_id"))
  const ano = Number(url.get("ano"))

  if (!colaborador_rh_id || !ano) {
    return NextResponse.json({ error: "colaborador_rh_id e ano obrigatorios" }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  const { data: colab, error: errColab } = await supabase
    .from("colaboradores_rh")
    .select("*")
    .eq("id", colaborador_rh_id)
    .single()

  if (errColab || !colab) {
    return NextResponse.json({ error: "Colaborador nao encontrado" }, { status: 404 })
  }

  const { data: recibos, error: errRecibos } = await supabase
    .from("recibos_vencimento")
    .select("*")
    .eq("colaborador_rh_id", colaborador_rh_id)
    .eq("ano", ano)
    .order("mes")

  if (errRecibos || !recibos || recibos.length === 0) {
    return NextResponse.json({ error: `Sem recibos para ${ano}` }, { status: 404 })
  }

  // Aggregate annual values
  let totalBruto = 0
  let totalSubAlim = 0
  let totalKm = 0
  let totalSS = 0
  let totalIRS = 0
  let totalLiquido = 0

  for (const r of recibos) {
    totalBruto += Number(r.bruto)
    totalSubAlim += Number(r.subsidio_alimentacao)
    totalKm += Number(r.km_viatura || 0)
    totalSS += Number(r.desconto_ss)
    totalIRS += Number(r.retencao_irs || 0)
    totalLiquido += Number(r.liquido)
  }

  const rendSujeitos = totalBruto
  const rendNaoSujeitos = totalSubAlim + totalKm

  // PDF A4 Portrait
  const W = 595
  const H = 842
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
  const m = 50

  // Header bar
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: ORANGE })

  let y = H - 50
  page.drawText(s("DECLARACAO ANUAL DE RENDIMENTOS"), { x: m, y, size: 16, font: fontBold, color: BLACK })
  y -= 18
  page.drawText(s("Art. 119 do Codigo do IRS (CIRS)"), { x: m, y, size: 10, font, color: GRAY })
  y -= 14
  page.drawText(s(`Ano fiscal: ${ano}`), { x: m, y, size: 10, font: fontBold, color: ORANGE })

  // Separator
  y -= 16
  page.drawLine({ start: { x: m, y }, end: { x: W - m, y }, thickness: 1, color: LINE })

  // ENTIDADE PATRONAL
  y -= 24
  page.drawText(s("ENTIDADE PATRONAL"), { x: m, y, size: 10, font: fontBold, color: ORANGE })
  y -= 18

  const empresa = [
    ["Designacao", "Carlos dos Santos Nascimento, Lda"],
    ["NIF", "500 861 790"],
    ["Sede", "Rua da Industria n 8, Casal do Rodo, 2640-216 Encarnacao"],
  ]

  for (const [label, value] of empresa) {
    page.drawText(s(label), { x: m, y, size: 9, font: fontBold, color: DARK })
    page.drawText(s(value), { x: m + 100, y, size: 9, font, color: BLACK })
    y -= 14
  }

  // TRABALHADOR
  y -= 16
  page.drawLine({ start: { x: m, y: y + 8 }, end: { x: W - m, y: y + 8 }, thickness: 0.5, color: LINE })
  page.drawText(s("TRABALHADOR"), { x: m, y, size: 10, font: fontBold, color: ORANGE })
  y -= 18

  const trabalhador = [
    ["Nome", colab.nome_completo],
    ["NIF", colab.nif],
    ["NISS", colab.niss],
    ["Categoria", colab.categoria_profissional || "Serralheiro civil"],
    ["Regime SS", colab.regime === "reformado" ? "Reformado (pensionista)" : "Normal"],
  ]

  for (const [label, value] of trabalhador) {
    page.drawText(s(label), { x: m, y, size: 9, font: fontBold, color: DARK })
    page.drawText(s(String(value)), { x: m + 100, y, size: 9, font, color: BLACK })
    y -= 14
  }

  // RENDIMENTOS TABLE
  y -= 16
  page.drawLine({ start: { x: m, y: y + 8 }, end: { x: W - m, y: y + 8 }, thickness: 0.5, color: LINE })
  page.drawText(s(`RENDIMENTOS DO ANO ${ano}`), { x: m, y, size: 10, font: fontBold, color: ORANGE })
  y -= 10

  // Meses processados
  const mesesStr = recibos.map((r: { mes: number }) => String(r.mes).padStart(2, "0")).join(", ")
  page.drawText(s(`Meses processados: ${mesesStr} (${recibos.length} recibos)`), { x: m, y, size: 8, font, color: GRAY })

  y -= 20

  // Table header
  page.drawRectangle({ x: m, y: y - 4, width: W - 2 * m, height: 16, color: LIGHT })
  page.drawText(s("Descricao"), { x: m + 8, y, size: 8, font: fontBold, color: DARK })
  page.drawText(s("Valor Anual"), { x: W - m - 90, y, size: 8, font: fontBold, color: DARK })
  y -= 18

  const rows: [string, number | null, boolean][] = [
    ["RENDIMENTOS SUJEITOS A IMPOSTO", rendSujeitos, true],
    ["  Remuneracoes base + duodecimos", rendSujeitos, false],
    ["", null, false],
    ["RENDIMENTOS NAO SUJEITOS", rendNaoSujeitos, true],
    ["  Subsidio de alimentacao", totalSubAlim, false],
    ["  Subsidio de transporte / KM viatura", totalKm, false],
    ["", null, false],
    ["CONTRIBUICOES SEGURANCA SOCIAL (TSU)", totalSS, true],
    [`  Taxa trabalhador: ${Number(colab.taxa_ss_trabalhador).toFixed(1)}%`, totalSS, false],
    ["", null, false],
    ["RETENCAO IRS", totalIRS, true],
    [colab.isento_irs ? "  Isento de retencao na fonte" : `  Taxa: ${Number(colab.taxa_irs).toFixed(1)}%`, totalIRS, false],
  ]

  for (const [desc, val, isBold] of rows) {
    if (desc === "" && val === null) {
      y -= 6
      continue
    }
    const f = isBold ? fontBold : font
    const c = isBold ? BLACK : DARK
    page.drawText(s(desc), { x: m + 8, y, size: 8, font: f, color: c })
    if (val !== null) {
      page.drawText(s(`${val.toFixed(2)} EUR`), { x: W - m - 90, y, size: 8, font: mono, color: c })
    }
    y -= 14
  }

  // TOTAL LIQUIDO
  y -= 10
  page.drawRectangle({ x: m, y: y - 6, width: W - 2 * m, height: 22, color: BLACK })
  page.drawText(s("TOTAL LIQUIDO ANUAL PAGO"), { x: m + 8, y, size: 10, font: fontBold, color: rgb(1, 1, 1) })
  page.drawText(s(`${totalLiquido.toFixed(2)} EUR`), { x: W - m - 110, y, size: 11, font: fontBold, color: ORANGE })

  // Signature block
  y -= 50
  page.drawText(s("O presente documento e emitido nos termos do artigo 119 do CIRS,"), { x: m, y, size: 8, font, color: GRAY })
  y -= 12
  page.drawText(s("para efeitos de declaracao de rendimentos do trabalhador."), { x: m, y, size: 8, font, color: GRAY })

  y -= 40
  page.drawText(s("Mafra, _____ de _______________ de ______"), { x: m, y, size: 9, font, color: BLACK })

  y -= 50
  page.drawLine({ start: { x: m, y }, end: { x: m + 200, y }, thickness: 0.5, color: BLACK })
  y -= 14
  page.drawText(s("A Entidade Patronal"), { x: m, y, size: 8, font, color: GRAY })

  page.drawLine({ start: { x: W - m - 200, y: y + 14 }, end: { x: W - m, y: y + 14 }, thickness: 0.5, color: BLACK })
  page.drawText(s("O Trabalhador"), { x: W - m - 200, y, size: 8, font, color: GRAY })

  // Footer
  page.drawText(s("CSN Opus | Carlos dos Santos Nascimento, Lda | NIF 500 861 790"), { x: m, y: 30, size: 7, font, color: LINE })

  const bytes = await pdfDoc.save()

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="declaracao_${colab.nif}_${ano}.pdf"`,
    },
  })
}
