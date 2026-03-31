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
  const params = req.nextUrl.searchParams
  const colaboradorRhId = Number(params.get("colaborador_rh_id"))
  const ano = Number(params.get("ano"))

  if (!colaboradorRhId || !ano) {
    return NextResponse.json({ error: "colaborador_rh_id e ano obrigatorios" }, { status: 400 })
  }

  const sb = getServiceSupabase()

  const { data: trabalhador, error: errTrab } = await sb
    .from("colaboradores_rh")
    .select("id, nome_completo, nif, niss")
    .eq("id", colaboradorRhId)
    .maybeSingle()

  if (errTrab || !trabalhador) {
    return NextResponse.json({ error: "Trabalhador não encontrado" }, { status: 404 })
  }

  const { data: recibos, error: errRecibos } = await sb
    .from("recibos_vencimento")
    .select("bruto, subsidio_alimentacao, desconto_ss, retencao_irs")
    .eq("colaborador_rh_id", colaboradorRhId)
    .eq("ano", ano)

  if (errRecibos) {
    return NextResponse.json({ error: "Erro ao carregar recibos" }, { status: 500 })
  }

  const totalBruto = (recibos || []).reduce((soma, r) => soma + Number(r.bruto || 0), 0)
  const totalNaoSujeitos = (recibos || []).reduce((soma, r) => soma + Number(r.subsidio_alimentacao || 0), 0)
  const totalSS = (recibos || []).reduce((soma, r) => soma + Number(r.desconto_ss || 0), 0)
  const totalIRS = (recibos || []).reduce((soma, r) => soma + Number(r.retencao_irs || 0), 0)

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const BLACK = rgb(0, 0, 0)
  const GRAY = rgb(0.4, 0.4, 0.4)
  const LIGHT = rgb(0.95, 0.95, 0.95)
  const LINE = rgb(0.82, 0.82, 0.82)
  const ORANGE = rgb(0.976, 0.576, 0.043)

  const m = 42
  const W = 595 - 2 * m
  let y = 798
  const money = (v: number) => `${v.toFixed(2)} EUR`

  const drawSection = (numero: string, titulo: string, height: number) => {
    page.drawRectangle({ x: m, y: y - height, width: W, height, borderWidth: 1, borderColor: LINE })
    page.drawRectangle({ x: m, y: y - 18, width: W, height: 18, color: LIGHT })
    page.drawText(numero, { x: m + 8, y: y - 13, size: 8, font: bold, color: BLACK })
    page.drawText(s(titulo), { x: m + 32, y: y - 13, size: 8, font: bold, color: BLACK })
  }

  page.drawRectangle({ x: 0, y: 836, width: 595, height: 6, color: ORANGE })
  page.drawText(s("DECLARACAO ANUAL DE RENDIMENTOS"), { x: m, y, size: 15, font: bold, color: BLACK })
  y -= 16
  page.drawText(s(`Ano de referencia: ${ano}`), { x: m, y, size: 10, font: bold, color: ORANGE })
  y -= 12
  page.drawText(s("Artigo 119. do CIRS"), { x: m, y, size: 8, font, color: GRAY })

  y -= 18
  drawSection("01", "IDENTIFICACAO DA ENTIDADE DEVEDORA", 70)
  page.drawText(s("Designacao: Carlos dos Santos Nascimento Lda"), { x: m + 10, y: y - 32, size: 9, font, color: BLACK })
  page.drawText(s("NIF: 500 861 790"), { x: m + 10, y: y - 46, size: 9, font, color: BLACK })
  page.drawText(s("Morada: Casal do Rodo-Encarnação, Mafra"), { x: m + 10, y: y - 60, size: 9, font, color: BLACK })
  y -= 84

  drawSection("02", "IDENTIFICACAO DO TITULAR DOS RENDIMENTOS", 70)
  page.drawText(s(`Nome: ${trabalhador.nome_completo}`), { x: m + 10, y: y - 32, size: 9, font, color: BLACK })
  page.drawText(s(`NIF: ${trabalhador.nif || "-"}`), { x: m + 10, y: y - 46, size: 9, font, color: BLACK })
  page.drawText(s(`NISS: ${trabalhador.niss || "-"}`), { x: m + 10, y: y - 60, size: 9, font, color: BLACK })
  y -= 84

  drawSection("03", "RENDIMENTOS E RETENCOES - ANO DE REFERENCIA", 126)

  const item = (codigo: string, label: string, value: number, row: number) => {
    const rowY = y - 32 - row * 22
    page.drawRectangle({ x: m + 10, y: rowY - 12, width: 28, height: 14, borderWidth: 1, borderColor: LINE })
    page.drawText(codigo, { x: m + 17, y: rowY - 8, size: 8, font: bold, color: BLACK })
    page.drawText(s(label), { x: m + 46, y: rowY - 8, size: 9, font, color: BLACK })
    page.drawText(money(value), { x: m + W - 130, y: rowY - 8, size: 9, font: bold, color: BLACK })
  }

  item("A01", "Rendimentos do Trabalho Dependente - Categoria A", totalBruto, 0)
  item("A02", "Rendimentos nao sujeitos (subsidio de alimentacao)", totalNaoSujeitos, 1)
  item("A03", "Contribuicoes para a Seguranca Social (trabalhador)", totalSS, 2)
  item("A04", "Total de Retencoes na Fonte (IRS)", totalIRS, 3)
  y -= 140

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
