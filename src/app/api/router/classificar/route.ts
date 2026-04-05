import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      obra_id,
      tipo_carrocaria,
      marca, modelo, matricula, vin, cod_homologacao,
      comprimento, largura, altura,
      dist_eixo_frente, dist_eixo_retaguarda,
      peso_bruto, tara_total, tara_frontal, tara_traseira,
    } = body

    const pdfDoc = await PDFDocument.create()

    // A4 portrait: 595 x 842 pt
    const page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const BLACK = rgb(0, 0, 0)
    const GRAY  = rgb(0.4, 0.4, 0.4)

    const L = 56   // left margin
    const R = width - 56  // right margin
    const W = R - L       // content width

    // ── LOGO ──────────────────────────────────────────────
    // Tenta carregar o logo do disco (Next.js server)
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
      // Se logo não disponível, desenha placeholder texto
      page.drawText("CSN", {
        x: width / 2 - 20, y: height - 70,
        size: 28, font: fontBold, color: BLACK,
      })
      page.drawText("TRANSFORMACAO DE VEICULOS", {
        x: width / 2 - 80, y: height - 86,
        size: 8, font: fontBold, color: BLACK,
      })
    }

    let y = height - 110

    // ── LINHA SEPARADORA ──────────────────────────────────
    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: BLACK })
    y -= 22

    // ── TÍTULO ────────────────────────────────────────────
    const title = "TERMO DE RESPONSABILIDADE"
    const titleW = fontBold.widthOfTextAtSize(title, 14)
    page.drawText(title, {
      x: width / 2 - titleW / 2, y,
      size: 14, font: fontBold, color: BLACK,
    })
    y -= 6
    page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.5, color: BLACK })
    y -= 20

    // ── TEXTO JURÍDICO ────────────────────────────────────
    const tipoCarrocaria = (tipo_carrocaria || "").toUpperCase()

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

    // Tipo de carroçaria em bold centrado
    const tipoW = fontBold.widthOfTextAtSize(tipoCarrocaria, 11)
    page.drawText(tipoCarrocaria, {
      x: width / 2 - tipoW / 2, y,
      size: 11, font: fontBold, color: BLACK,
    })
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

    // ── TABELA VEÍCULO ────────────────────────────────────
    const tableTop = y
    const rowH = 18
    const col1W = 120
    const tableW = W

    // Header "Veículo:"
    page.drawRectangle({ x: L, y: tableTop - rowH, width: tableW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
    page.drawText("Veiculo:", { x: L + 4, y: tableTop - rowH + 5, size: 9, font: fontBold, color: BLACK })
    y = tableTop - rowH

    // Linhas da tabela veículo
    const veiculoRows = [
      ["Marca:", marca || "-"],
      ["Modelo:", modelo || "-"],
      ["Matricula:", matricula || "-"],
      ["VIN:", vin || "-"],
      ["Cod. Homologacao", cod_homologacao || "-"],
    ]

    for (const [label, value] of veiculoRows) {
      page.drawRectangle({ x: L, y: y - rowH, width: tableW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
      page.drawText(label, { x: L + 4, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })
      page.drawText(value, { x: L + col1W, y: y - rowH + 5, size: 9, font: fontReg, color: BLACK })
      y -= rowH
    }

    y -= 16

    // ── TABELA DIMENSÕES / PESOS (lado a lado) ───────────
    const halfW = W / 2
    const col2Start = L + halfW

    // Header linha 1: "Carroçaria" e "Conjunto"
    page.drawRectangle({ x: L, y: y - rowH, width: halfW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
    const hdr1W = fontBold.widthOfTextAtSize("Carrocaria", 9)
    page.drawText("Carrocaria", { x: L + halfW / 2 - hdr1W / 2, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })

    page.drawRectangle({ x: col2Start, y: y - rowH, width: halfW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
    const hdr2W = fontBold.widthOfTextAtSize("Conjunto", 9)
    page.drawText("Conjunto", { x: col2Start + halfW / 2 - hdr2W / 2, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })
    y -= rowH

    // Header linha 2: "Dimensões exteriores (mm)" e "Pesos (Kg)"
    page.drawRectangle({ x: L, y: y - rowH, width: halfW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
    const hdr3W = fontBold.widthOfTextAtSize("Dimensoes exteriores (mm)", 9)
    page.drawText("Dimensoes exteriores (mm)", { x: L + halfW / 2 - hdr3W / 2, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })

    page.drawRectangle({ x: col2Start, y: y - rowH, width: halfW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
    const hdr4W = fontBold.widthOfTextAtSize("Pesos (Kg)", 9)
    page.drawText("Pesos (Kg)", { x: col2Start + halfW / 2 - hdr4W / 2, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })
    y -= rowH

    // Linhas dimensões + pesos lado a lado
    const dimCol = 100  // largura coluna label esquerda
    const pesoCol = 110 // largura coluna label direita

    const dimRows = [
      ["Comprimento", comprimento ? String(comprimento) : "-"],
      ["Largura", largura ? String(largura) : "-"],
      ["Altura", altura ? String(altura) : "-"],
      ["Dist. eixo ret. a frente", dist_eixo_frente ? String(dist_eixo_frente) : "-"],
      ["Dist. eixo ret. a retaguarda", dist_eixo_retaguarda ? String(dist_eixo_retaguarda) : "-"],
    ]

    const pesoRows = [
      ["Peso bruto:", peso_bruto ? String(peso_bruto) : "-"],
      ["Peso tara total:", tara_total ? String(tara_total) : "-"],
      ["Peso tara frontal:", tara_frontal ? String(tara_frontal) : "-"],
      ["Peso tara traseira:", tara_traseira ? String(tara_traseira) : "-"],
      ["", ""],
    ]

    const maxRows = Math.max(dimRows.length, pesoRows.length)
    for (let i = 0; i < maxRows; i++) {
      const [dLabel, dVal] = dimRows[i] || ["", ""]
      const [pLabel, pVal] = pesoRows[i] || ["", ""]

      // Lado esquerdo — dimensões
      page.drawRectangle({ x: L, y: y - rowH, width: halfW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
      if (dLabel) page.drawText(dLabel, { x: L + 4, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })
      if (dVal) page.drawText(dVal, { x: L + dimCol, y: y - rowH + 5, size: 9, font: fontReg, color: BLACK })

      // Lado direito — pesos
      page.drawRectangle({ x: col2Start, y: y - rowH, width: halfW, height: rowH, borderColor: BLACK, borderWidth: 0.5 })
      if (pLabel) page.drawText(pLabel, { x: col2Start + 4, y: y - rowH + 5, size: 9, font: fontBold, color: BLACK })
      if (pVal) page.drawText(pVal, { x: col2Start + pesoCol, y: y - rowH + 5, size: 9, font: fontReg, color: BLACK })

      y -= rowH
    }

    y -= 30

    // ── LOCAL E DATA ──────────────────────────────────────
    const dataGeracao = new Date()
    const meses = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    const dataStr = `Encarnacao, ${String(dataGeracao.getDate()).padStart(2,"0")} de ${meses[dataGeracao.getMonth()]} de ${dataGeracao.getFullYear()}`
    page.drawText(dataStr, { x: L, y, size: 9, font: fontReg, color: BLACK })

    y -= 60

    // ── ASSINATURA ────────────────────────────────────────
    const sigW = 200
    const sigX = width / 2 - sigW / 2
    page.drawLine({ start: { x: sigX, y: y + 10 }, end: { x: sigX + sigW, y: y + 10 }, thickness: 0.5, color: BLACK })

    const nome = "Duarte da Cunha Martins Bustorff-Silva"
    const nomeW = fontBold.widthOfTextAtSize(nome, 10)
    page.drawText(nome, {
      x: width / 2 - nomeW / 2, y,
      size: 10, font: fontBold, color: BLACK,
    })
    y -= 14

    const certidao = "Certidao Permanente Codigo de acesso: 3172-1374-8252"
    const certW = fontReg.widthOfTextAtSize(certidao, 8)
    page.drawText(certidao, {
      x: width / 2 - certW / 2, y,
      size: 8, font: fontReg, color: GRAY,
    })

    // ── GUARDAR NO SUPABASE ───────────────────────────────
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
