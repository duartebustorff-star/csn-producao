import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { getServiceSupabase } from "@/lib/supabase"
import { readFileSync } from "fs"
import { join } from "path"

function s(str: string | null | undefined): string {
  if (!str) return "-"
  return str
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\xFF]/g, "?")
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const body = await req.json()
    const {
      obra_id, marca, modelo, matricula, vin,
      tipo_carrocaria, cliente, data_entrega,
      fotos, legendas,
    } = body

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const BLACK = rgb(0, 0, 0)
    const GRAY = rgb(0.4, 0.4, 0.4)
    const BLUE = rgb(0.05, 0.3, 0.6)
    const LIGHT = rgb(0.95, 0.95, 0.95)

    const headerH = 80
    page.drawRectangle({ x: 0, y: height - headerH, width, height: headerH, color: rgb(0, 0, 0) })

    try {
      const logoPath = join(process.cwd(), "public", "csn_logo.png")
      const logoBytes = readFileSync(logoPath)
      const logoImg = await pdfDoc.embedPng(logoBytes)
      const logoNativa = logoImg.size()
      const maxW = 220
      const maxH = 60
      const scale = Math.min(maxW / logoNativa.width, maxH / logoNativa.height)
      const lw = logoNativa.width * scale
      const lh = logoNativa.height * scale
      page.drawImage(logoImg, {
        x: (width - lw) / 2,
        y: height - headerH + (headerH - lh) / 2,
        width: lw,
        height: lh,
      })
    } catch {
      page.drawText("CSN", {
        x: 250, y: height - 45, size: 20, font: fontBold, color: rgb(1, 1, 1),
      })
    }

    page.drawText("CHECKLIST DE ENTREGA", {
      x: 30, y: height - headerH - 28, size: 16, font: fontBold, color: BLUE,
    })
    page.drawLine({
      start: { x: 30, y: height - headerH - 35 },
      end: { x: width - 30, y: height - headerH - 35 },
      thickness: 1, color: BLUE,
    })

    let y = height - headerH - 58
    page.drawRectangle({ x: 30, y: y - 10, width: width - 60, height: 56, color: LIGHT })

    const drawKV = (label: string, value: string, x: number, yPos: number) => {
      page.drawText(s(label) + ":", { x, y: yPos, size: 8, font: fontBold, color: GRAY })
      page.drawText(s(value), { x: x + 80, y: yPos, size: 9, font: fontReg, color: BLACK })
    }

    drawKV("Cliente", cliente, 40, y + 30)
    drawKV("Data entrega", data_entrega, 310, y + 30)
    drawKV("Marca/Modelo", (marca || "-") + " " + (modelo || ""), 40, y + 15)
    drawKV("Tipo carrocaria", tipo_carrocaria, 310, y + 15)
    drawKV("Matricula", matricula, 40, y)
    drawKV("VIN", vin, 310, y)

    y -= 25
    page.drawText("VERIFICACOES ANTES DA ENTREGA", {
      x: 30, y, size: 10, font: fontBold, color: BLACK,
    })
    y -= 18

    const checks = [
      "Inspecao visual da carrocaria - sem danos, riscos ou amolgadelas",
      "Iluminacao traseira funcional (stop, posicao, matricula, retro)",
      "Proteccoes laterais anti-encaixe instaladas e fixas",
      "Para-choques traseiro instalado conforme UNECE R58",
      "Sensores e cameras do chassi intactos e funcionais",
      "Pontos de amarracao de carga instalados e marcados",
      "Pintura uniforme - sem empolas, escorridos ou zonas descobertas",
      "Documentacao entregue ao cliente: Termo de Responsabilidade",
    ]
    for (const item of checks) {
      page.drawRectangle({ x: 32, y: y - 2, width: 10, height: 10, borderColor: GRAY, borderWidth: 0.8 })
      page.drawText(s(item), { x: 48, y, size: 8, font: fontReg, color: BLACK })
      y -= 16
    }

    y -= 10
    page.drawText("REGISTO FOTOGRAFICO", {
      x: 30, y, size: 10, font: fontBold, color: BLACK,
    })
    page.drawLine({
      start: { x: 30, y: y - 4 }, end: { x: width - 30, y: y - 4 },
      thickness: 0.5, color: rgb(0.8, 0.8, 0.8),
    })
    y -= 20

    const fotoW = 245
    const fotoH = 155
    const positions = [
      { x: 30, y: y - fotoH },
      { x: 320, y: y - fotoH },
      { x: 30, y: y - fotoH * 2 - 20 },
      { x: 320, y: y - fotoH * 2 - 20 },
    ]

    for (let i = 0; i < 4; i++) {
      const pos = positions[i]
      const legenda = s(legendas && legendas[i] ? legendas[i] : "Foto " + (i + 1))

      page.drawRectangle({
        x: pos.x, y: pos.y, width: fotoW, height: fotoH,
        color: LIGHT, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5,
      })

      if (fotos && fotos[i]) {
        try {
          const fotoBase64 = fotos[i] as string
          const isJpeg = fotoBase64.startsWith("/9j") || fotoBase64.includes("image/jpeg")
          const cleanBase64 = fotoBase64.replace(/^data:image\/[a-z]+;base64,/, "")
          const fotoBytes = Buffer.from(cleanBase64, "base64")
          const fotoEmbed = isJpeg
            ? await pdfDoc.embedJpg(fotoBytes)
            : await pdfDoc.embedPng(fotoBytes)
          const fotoNativa = fotoEmbed.size()
          const scale = Math.min(fotoW / fotoNativa.width, fotoH / fotoNativa.height)
          const fw = fotoNativa.width * scale
          const fh = fotoNativa.height * scale
          page.drawImage(fotoEmbed, {
            x: pos.x + (fotoW - fw) / 2,
            y: pos.y + (fotoH - fh) / 2,
            width: fw, height: fh,
          })
        } catch {
          page.drawText("Foto nao disponivel", {
            x: pos.x + 70, y: pos.y + fotoH / 2,
            size: 9, font: fontReg, color: GRAY,
          })
        }
      } else {
        page.drawText("[ Sem foto ]", {
          x: pos.x + 85, y: pos.y + fotoH / 2,
          size: 9, font: fontReg, color: GRAY,
        })
      }

      page.drawRectangle({ x: pos.x, y: pos.y, width: fotoW, height: 16, color: rgb(0, 0, 0) })
      page.drawText(legenda, {
        x: pos.x + 8, y: pos.y + 4,
        size: 8, font: fontBold, color: rgb(1, 1, 1),
      })
    }

    const yAssin = positions[2].y - 35
    page.drawLine({ start: { x: 30, y: yAssin }, end: { x: 230, y: yAssin }, thickness: 0.5, color: BLACK })
    page.drawText("Responsavel CSN", { x: 30, y: yAssin - 12, size: 8, font: fontReg, color: GRAY })
    page.drawLine({ start: { x: 320, y: yAssin }, end: { x: 560, y: yAssin }, thickness: 0.5, color: BLACK })
    page.drawText("Cliente / Receptor", { x: 320, y: yAssin - 12, size: 8, font: fontReg, color: GRAY })

    page.drawText(
      "Documento gerado em " + s(data_entrega || new Date().toLocaleDateString("pt-PT")) + " - Obra: " + s(obra_id),
      { x: 30, y: 20, size: 7, font: fontReg, color: GRAY }
    )

    const pdfBytes = await pdfDoc.save()

    const dataStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const fileName = "CHKL_" + obra_id + "_" + dataStr + ".pdf"
    const storagePath = "checklists/" + fileName

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
    console.error("Erro gerar-checklist:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}