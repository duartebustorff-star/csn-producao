import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      obra_id, marca, modelo, matricula, vin, cod_homologacao,
      tipo_carrocaria, comprimento, largura, altura,
      dist_eixo_frente, dist_eixo_retaguarda,
      tara_total, tara_frontal, tara_traseira, peso_bruto,
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

    page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: BLUE })
    page.drawText("CSN — Engenharia de Veículos Comerciais", {
      x: 30, y: height - 22, size: 14, font: fontBold, color: rgb(1, 1, 1),
    })
    page.drawText("Estrada Nacional 116 · Mafra · Portugal · NIF: 506 073 196", {
      x: 30, y: height - 40, size: 8, font: fontReg, color: rgb(0.85, 0.85, 0.85),
    })

    page.drawText("TERMO DE RESPONSABILIDADE", {
      x: 30, y: height - 90, size: 16, font: fontBold, color: BLUE,
    })
    page.drawText("Transformacao / Carrocamento de Veiculo Comercial", {
      x: 30, y: height - 110, size: 10, font: fontReg, color: GRAY,
    })
    page.drawLine({ start: { x: 30, y: height - 118 }, end: { x: width - 30, y: height - 118 }, thickness: 1, color: BLUE })

    let y = height - 145
    const drawSection = (title: string, yPos: number) => {
      page.drawText(title, { x: 30, y: yPos, size: 10, font: fontBold, color: BLUE })
      page.drawLine({ start: { x: 30, y: yPos - 4 }, end: { x: width - 30, y: yPos - 4 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
    }
    const drawField = (label: string, value: string, x: number, yPos: number) => {
      page.drawText(label + ":", { x, y: yPos, size: 8, font: fontBold, color: GRAY })
      page.drawText(value || "-", { x: x + 110, y: yPos, size: 9, font: fontReg, color: BLACK })
    }

    drawSection("1. IDENTIFICACAO DO VEICULO BASE", y)
    y -= 20
    drawField("Marca", marca || "-", 30, y)
    drawField("Modelo", modelo || "-", 220, y)
    y -= 16
    drawField("Matricula", matricula || "-", 30, y)
    drawField("VIN", vin || "-", 220, y)
    y -= 16
    drawField("Cod. Homologacao", cod_homologacao || "-", 30, y)
    drawField("Peso Bruto Total", peso_bruto ? peso_bruto + " kg" : "-", 220, y)

    y -= 30
    drawSection("2. IDENTIFICACAO DA CARROCARIA", y)
    y -= 20
    drawField("Tipo de Carrocaria", tipo_carrocaria || "-", 30, y)
    y -= 16
    drawField("Comprimento", comprimento ? comprimento + " mm" : "-", 30, y)
    drawField("Largura", largura ? largura + " mm" : "-", 220, y)
    y -= 16
    drawField("Altura", altura ? altura + " mm" : "-", 30, y)
    y -= 16
    drawField("Dist. eixo frente", dist_eixo_frente ? dist_eixo_frente + " mm" : "-", 30, y)
    drawField("Dist. eixo retaguarda", dist_eixo_retaguarda ? dist_eixo_retaguarda + " mm" : "-", 220, y)

    y -= 30
    drawSection("3. PESOS APOS TRANSFORMACAO (Inspecao Controlauto)", y)
    y -= 20
    drawField("Tara Total", tara_total ? tara_total + " kg" : "-", 30, y)
    y -= 16
    drawField("Tara Eixo Frontal", tara_frontal ? tara_frontal + " kg" : "-", 30, y)
    drawField("Tara Eixo Traseiro", tara_traseira ? tara_traseira + " kg" : "-", 220, y)

    y -= 30
    drawSection("4. DECLARACAO DE CONFORMIDADE", y)
    y -= 20
    const linhas = [
      "A Carlos dos Santos Nascimento, Lda (CSN) declara que a transformacao efectuada no veiculo identificado",
      "neste documento foi realizada de acordo com as regras da arte, respeitando os requisitos tecnicos aplicaveis,",
      "nomeadamente o Regulamento (UE) 2018/858, a Directiva 96/53/CE (pesos e dimensoes), e as boas praticas",
      "de construcao de carrocarias para veiculos comerciais.",
      "",
      "A CSN declara ainda que a montagem nao comprometeu nenhum sistema de seguranca activo ou passivo",
      "do veiculo base, incluindo sistemas AEB, cameras de assistencia a conducao e estrutura do chassi.",
    ]
    for (const linha of linhas) {
      page.drawText(linha, { x: 30, y, size: 8, font: fontReg, color: BLACK })
      y -= 13
    }

    y -= 20
    drawSection("5. ASSINATURAS", y)
    y -= 30
    page.drawLine({ start: { x: 30, y }, end: { x: 230, y }, thickness: 0.5, color: BLACK })
    page.drawText("Responsavel CSN", { x: 30, y: y - 12, size: 8, font: fontReg, color: GRAY })
    page.drawText("Data: _____ / _____ / __________", { x: 30, y: y - 24, size: 8, font: fontReg, color: GRAY })
    page.drawLine({ start: { x: 320, y }, end: { x: 560, y }, thickness: 0.5, color: BLACK })
    page.drawText("Cliente / Receptor", { x: 320, y: y - 12, size: 8, font: fontReg, color: GRAY })
    page.drawText("Data: _____ / _____ / __________", { x: 320, y: y - 24, size: 8, font: fontReg, color: GRAY })

    const dataGeracao = new Date().toLocaleDateString("pt-PT")
    page.drawText("Documento gerado em " + dataGeracao + " pelo sistema CSN. Obra: " + obra_id, {
      x: 30, y: 25, size: 7, font: fontReg, color: GRAY,
    })

    const pdfBytes = await pdfDoc.save()

    const dataStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const fileName = "TERM_" + obra_id + "_" + dataStr + ".pdf"
    const storagePath = "termos/" + fileName

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