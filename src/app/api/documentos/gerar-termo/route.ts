import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Bug D: mapa slug/forma curta -> nome legal de homologacao.
// Fonte de verdade ate existir tabela tipos_carrocaria (planeada S59).
const TIPO_CARROCARIA_LEGAL: Record<string, string> = {
  "CAIXA_ABERTA_MADEIRA": "CAIXA ABERTA COM OU SEM COBERTURA",
  "CAIXA_ABERTA": "CAIXA ABERTA COM OU SEM COBERTURA",
  "CAIXA ABERTA": "CAIXA ABERTA COM OU SEM COBERTURA",
  "CAIXA ABERTA MADEIRA": "CAIXA ABERTA COM OU SEM COBERTURA",
  "BASCULANTE": "CAIXA BASCULANTE",
  "CAIXA_BASCULANTE": "CAIXA BASCULANTE",
  "CAIXA BASCULANTE": "CAIXA BASCULANTE",
  "PLATAFORMA": "PLATAFORMA",
  "TAIPAIS": "CAIXA ABERTA COM OU SEM COBERTURA",
}

function tipoCarrocariaLegal(raw: string | null | undefined): string {
  if (!raw) return "-"
  const upper = raw.trim().toUpperCase()
  return TIPO_CARROCARIA_LEGAL[upper] || upper
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { obra_id } = body

    if (
      !obra_id ||
      typeof obra_id !== "string" ||
      obra_id.trim() === "" ||
      obra_id === "undefined" ||
      obra_id === "null"
    ) {
      return NextResponse.json(
        { error: "obra_id obrigatorio", recebido: obra_id ?? null },
        { status: 400 }
      )
    }

    // Buscar obra
    const { data: obra, error: obraError } = await supabase
      .from("obras")
      .select("id, matricula, vin, lead_id")
      .eq("id", obra_id)
      .maybeSingle()

    if (obraError || !obra) {
      return NextResponse.json({ error: "Obra nao encontrada" }, { status: 404 })
    }

    // Buscar lead
    const { data: lead } = await supabase
      .from("leads")
      .select("tipo_carrocaria, comprimento_ext, largura_ext, altura_ext, pbt, tara, dist_eixo_frontal_frente, dist_eixo_traseiro_retaguarda")
      .eq("id", obra.lead_id)
      .maybeSingle()

    // Bug G: lookup DAV por VIN primeiro (DAV pode ter matricula=NULL na BD,
    // pois e gerado antes da matricula final). Fallback para matricula.
    let dav: { marca?: string; modelo?: string; cod_homologacao?: string; peso_bruto?: number; tara?: number } | null = null
    if (obra.vin) {
      const { data } = await supabase
        .from("davs")
        .select("marca, modelo, cod_homologacao, peso_bruto, tara")
        .eq("vin", obra.vin)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      dav = data
    }
    if (!dav && obra.matricula) {
      const { data } = await supabase
        .from("davs")
        .select("marca, modelo, cod_homologacao, peso_bruto, tara")
        .eq("matricula", obra.matricula)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      dav = data
    }

    // Bug E: tara real vem da inspecao Controlauto, nao da tara chassis do DAV
    const { data: insp } = await supabase
      .from("inspecoes")
      .select("peso_estatico_total, peso_estatico_eixo1_total, peso_estatico_eixo2_total")
      .eq("matricula", obra.matricula)
      .order("data_inspecao", { ascending: false })
      .limit(1)
      .maybeSingle()

    const matricula = obra.matricula || "-"
    const vinRaw = obra.vin || ""
    const vin = vinRaw || "-"
    const marca = dav?.marca || "-"
    // Bug C: modelo legal e VIN posicoes 4-6 (model code de homologacao), nao o nome comercial do DAV
    const modeloFromVin = vinRaw.length >= 6 ? vinRaw.slice(3, 6).toUpperCase() : ""
    const modelo = modeloFromVin || dav?.modelo || "-"
    const cod_homologacao = dav?.cod_homologacao || "-"
    const peso_bruto = dav?.peso_bruto ? String(dav.peso_bruto) : "-"
    // Bug E: prioridade body > inspecao.peso_estatico_* > dav.tara (chassis, ultimo recurso)
    const tara_total = body.tara_total != null
      ? String(body.tara_total)
      : (insp?.peso_estatico_total != null ? String(insp.peso_estatico_total) : (dav?.tara ? String(dav.tara) : "-"))
    const tara_frontal = body.tara_frontal != null
      ? String(body.tara_frontal)
      : (insp?.peso_estatico_eixo1_total != null ? String(insp.peso_estatico_eixo1_total) : "-")
    const tara_traseira = body.tara_traseira != null
      ? String(body.tara_traseira)
      : (insp?.peso_estatico_eixo2_total != null ? String(insp.peso_estatico_eixo2_total) : "-")
    const dist_eixo_ret_frente = body.dist_eixo_ret_frente != null
      ? String(body.dist_eixo_ret_frente)
      : (lead?.dist_eixo_frontal_frente != null ? String(lead.dist_eixo_frontal_frente) : "-")
    const dist_eixo_ret_traseira = body.dist_eixo_ret_traseira != null
      ? String(body.dist_eixo_ret_traseira)
      : (lead?.dist_eixo_traseiro_retaguarda != null ? String(lead.dist_eixo_traseiro_retaguarda) : "-")
    // Bug D: slug -> nome legal homologacao. Fonte de verdade hard-coded; tabela tipos_carrocaria fica para S59.
    const tipoRaw = body.tipo_carrocaria || lead?.tipo_carrocaria || ""
    const tipo_carrocaria = tipoCarrocariaLegal(tipoRaw)
    const comprimento = lead?.comprimento_ext ? String(lead.comprimento_ext) : "-"
    const largura = lead?.largura_ext ? String(lead.largura_ext) : "-"
    const altura = lead?.altura_ext ? String(lead.altura_ext) : "-"

    // Gerar PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const BLACK = rgb(0, 0, 0)
    const GRAY  = rgb(0.4, 0.4, 0.4)

    const L = 56
    const R = width - 56
    const W = R - L

    // LOGO
    try {
      const logoPath = path.join(process.cwd(), "public", "logo-horizontal.png")
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath)
        const logoImg = await pdfDoc.embedPng(logoBytes)
        const logoDims = logoImg.scale(0.18)
        page.drawImage(logoImg, {
          x: width / 2 - logoDims.width / 2,
          y: height - 90,
          width: logoDims.width,
          height: logoDims.height,
        })
      }
    } catch {
      page.drawText("CSN", { x: width / 2 - 20, y: height - 70, size: 28, font: fontBold, color: BLACK })
      page.drawText("TRANSFORMACAO DE VEICULOS", { x: width / 2 - 80, y: height - 86, size: 8, font: fontBold, color: BLACK })
    }

    let y = height - 110

    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: BLACK })
    y -= 22

    const title = "TERMO DE RESPONSABILIDADE"
    const titleW = fontBold.widthOfTextAtSize(title, 14)
    page.drawText(title, { x: width / 2 - titleW / 2, y, size: 14, font: fontBold, color: BLACK })
    y -= 6
    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: BLACK })
    y -= 20

    const tipoCarrocaria = tipo_carrocaria.toUpperCase()

    const textoIntro = [
      "Eu, abaixo assinado com poderes para o efeito, na qualidade de gerente da empresa Carlos dos Santos",
      "Nascimento, Lda, com o n.\u00BA de contribuinte 500 861790 e sede em Rua da Industria n.\u00BA 8, Casal do",
      "Rodo, 2640-216 Encarnacao, declara que a carrocaria produzida e do Tipo:",
    ]

    for (const linha of textoIntro) {
      page.drawText(linha, { x: L, y, size: 9, font: fontReg, color: BLACK })
      y -= 13
    }
    y -= 4

    const tipoW = fontBold.widthOfTextAtSize(tipoCarrocaria, 11)
    page.drawText(tipoCarrocaria, { x: width / 2 - tipoW / 2, y, size: 11, font: fontBold, color: BLACK })
    y -= 16

    const textoConf = [
      "esta em conformidade com as disposicoes legais aplicaveis, cumpre com as caracteristicas definidas na",
      "folha de aprovacao de modelo e obedece as caracteristicas estabelecidas na Norma Portuguesa em",
      "vigor.",
    ]

    for (const linha of textoConf) {
      page.drawText(linha, { x: L, y, size: 9, font: fontReg, color: BLACK })
      y -= 13
    }
    y -= 16

    // TABELA VEICULO
    const tableTop = y
    const rowH = 18
    const col1W = 120
    const tableW = W

    page.drawRectangle({ x: L, y: tableTop - rowH, width: tableW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
    page.drawText("Veiculo:", { x: L + 4, y: tableTop - rowH + 5, size: 9, font: fontBold, color: BLACK })
    y = tableTop - rowH

    const veiculoRows = [
      ["Marca:", marca],
      ["Modelo:", modelo],
      ["Matricula:", matricula],
      ["VIN:", vin],
      ["Cod. Homologacao", cod_homologacao],
    ]

    for (const [label, value] of veiculoRows) {
      page.drawRectangle({ x: L, y: y - rowH, width: tableW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
      page.drawText(label, { x: L + 4, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })
      page.drawText(value, { x: L + col1W, y: y - rowH + 5, size: 9, font: fontReg, color: BLACK })
      y -= rowH
    }

    y -= 16

    // TABELA DIMENSOES / PESOS
    const halfW = W / 2
    const col2Start = L + halfW

    page.drawRectangle({ x: L, y: y - rowH, width: halfW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
    const hdr1W = fontBold.widthOfTextAtSize("Carrocaria", 9)
    page.drawText("Carrocaria", { x: L + halfW / 2 - hdr1W / 2, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })

    page.drawRectangle({ x: col2Start, y: y - rowH, width: halfW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
    const hdr2W = fontBold.widthOfTextAtSize("Conjunto", 9)
    page.drawText("Conjunto", { x: col2Start + halfW / 2 - hdr2W / 2, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })
    y -= rowH

    page.drawRectangle({ x: L, y: y - rowH, width: halfW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
    const hdr3W = fontBold.widthOfTextAtSize("Dimensoes exteriores (mm)", 9)
    page.drawText("Dimensoes exteriores (mm)", { x: L + halfW / 2 - hdr3W / 2, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })

    page.drawRectangle({ x: col2Start, y: y - rowH, width: halfW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
    const hdr4W = fontBold.widthOfTextAtSize("Pesos (Kg)", 9)
    page.drawText("Pesos (Kg)", { x: col2Start + halfW / 2 - hdr4W / 2, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })
    y -= rowH

    const dimCol = 100
    const pesoCol = 110

    const dimRows = [
      ["Comprimento", comprimento],
      ["Largura", largura],
      ["Altura", altura],
      ["Dist. eixo ret. a frente", dist_eixo_ret_frente],
      ["Dist. eixo ret. a retaguarda", dist_eixo_ret_traseira],
    ]

    const pesoRows = [
      ["Peso bruto:", peso_bruto],
      ["Peso tara total:", tara_total],
      ["Peso tara frontal:", tara_frontal],
      ["Peso tara traseira:", tara_traseira],
      ["", ""],
    ]

    const maxRows = Math.max(dimRows.length, pesoRows.length)
    for (let i = 0; i < maxRows; i++) {
      const [dLabel, dVal] = dimRows[i] || ["", ""]
      const [pLabel, pVal] = pesoRows[i] || ["", ""]

      page.drawRectangle({ x: L, y: y - rowH, width: halfW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
      if (dLabel) page.drawText(dLabel, { x: L + 4, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })
      if (dVal) page.drawText(dVal, { x: L + dimCol, y: y - rowH + 5, size: 9, font: fontReg, color: BLACK })

      page.drawRectangle({ x: col2Start, y: y - rowH, width: halfW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
      if (pLabel) page.drawText(pLabel, { x: col2Start + 4, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })
      if (pVal) page.drawText(pVal, { x: col2Start + pesoCol, y: y - rowH + 5, size: 9, font: fontReg, color: BLACK })

      y -= rowH
    }

    y -= 30

    // LOCAL E DATA
    const dataGeracao = new Date()
    const meses = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    const dataStr = `Encarnacao, ${String(dataGeracao.getDate()).padStart(2,"0")} de ${meses[dataGeracao.getMonth()]} de ${dataGeracao.getFullYear()}`
    page.drawText(dataStr, { x: L, y, size: 9, font: fontReg, color: BLACK })

    y -= 60

    // ASSINATURA
    const sigW = 200
    const sigX = width / 2 - sigW / 2
    page.drawLine({ start: { x: sigX, y: y + 10 }, end: { x: sigX + sigW, y: y + 10 }, thickness: 0.5, color: BLACK })

    const nome = "Duarte da Cunha Martins Bustorff-Silva"
    const nomeW = fontBold.widthOfTextAtSize(nome, 10)
    page.drawText(nome, { x: width / 2 - nomeW / 2, y, size: 10, font: fontBold, color: BLACK })
    y -= 14

    const certidao = "Certidao Permanente Codigo de acesso: 3172-1374-8252"
    const certW = fontReg.widthOfTextAtSize(certidao, 8)
    page.drawText(certidao, { x: width / 2 - certW / 2, y, size: 8, font: fontReg, color: GRAY })

    // CARIMBO INSTITUCIONAL — fonte canonica: public/assets/carimbo_csn.svg (S58)
    y -= 38
    const cW = 280
    const cH = 110
    const cX = width / 2 - cW / 2
    const cY = y - cH
    const cCenterX = cX + cW / 2

    page.drawRectangle({ x: cX, y: cY, width: cW, height: cH, borderColor: BLACK, borderWidth: 2 })

    const fontSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const fontSerifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

    let cy = cY + cH - 16
    const drawCentered = (txt: string, font: typeof fontSerif, size: number) => {
      const w = font.widthOfTextAtSize(txt, size)
      page.drawText(txt, { x: cCenterX - w / 2, y: cy, size, font, color: BLACK })
    }

    drawCentered("A Gerencia", fontSerifItalic, 9)
    cy -= 18
    drawCentered("CARLOS DOS SANTOS NASCIMENTO, LDA.", fontSerifBold, 11)
    cy -= 6
    page.drawLine({ start: { x: cX + 24, y: cy }, end: { x: cX + cW - 24, y: cy }, thickness: 0.5, color: BLACK })
    cy -= 14
    drawCentered("NIF 500 861 790", fontSerif, 10)
    cy -= 14
    drawCentered("Rua da Industria, Casal do Rodo, 8 - 2640-216 Encarnacao, Mafra", fontSerif, 7.5)
    cy -= 12
    drawCentered("geral@carrocariascsn.pt | www.carrocariascsn.pt", fontSerif, 8)

    // GUARDAR NO SUPABASE
    const pdfBytes = await pdfDoc.save()
    const dataStr2 = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const fileName = `TERM_${obra_id}_${dataStr2}.pdf`
    const storagePath = `termos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true })

    if (uploadError) {
      console.error("Erro upload:", uploadError)
      return NextResponse.json({ error: "Erro ao guardar PDF" }, { status: 500 })
    }

    const { data: signedUrl } = await supabase.storage
      .from("documentos")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7)

    return NextResponse.json({
      sucesso: true,
      storage_path: storagePath,
      download_url: signedUrl?.signedUrl ?? null,
      file_name: fileName,
    })

  } catch (err) {
    console.error("Erro gerar-termo:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
