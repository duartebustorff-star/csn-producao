/**
 * CSN Produção — API Route: Pacote de Auditoria ISO 9001:2015
 *
 * GET /api/sgq/pacote-auditoria
 *   → Retorna ZIP com todos os PDFs do SGQ
 *
 * GET /api/sgq/pacote-auditoria?tipo=nao_conformidades
 *   → Retorna PDF individual
 *
 * Tipos disponíveis:
 *   nao_conformidades, auditorias, revisao_gestao, equipamentos,
 *   fornecedores, reclamacoes, formacoes, politica_qualidade,
 *   ambito_sgq, objetivos_qualidade, contexto, pacote (todos em ZIP)
 */

import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import {
  gerarNaoConformidades,
  gerarAuditorias,
  gerarRevisaoGestao,
  gerarEquipamentos,
  gerarFornecedores,
  gerarReclamacoes,
  gerarFormacoes,
  gerarPoliticaQualidade,
  gerarAmbitoSGQ,
  gerarContexto,
  gerarObjetivos,
} from "@/lib/sgq-pdf"

// ============================================
// FETCH DATA FROM SUPABASE
// ============================================

async function fetchSGQData() {
  const sb = getServiceSupabase()

  const [
    ncResult,
    audResult,
    revResult,
    eqResult,
    fornResult,
    recResult,
    formResult,
    docsResult,
    objResult,
    objRegResult,
  ] = await Promise.all([
    sb.from("nao_conformidades").select("*").order("data_detecao", { ascending: false }),
    sb.from("auditorias_internas").select("*").order("data_auditoria", { ascending: false }),
    sb.from("revisoes_gestao").select("*").order("data_revisao", { ascending: false }),
    sb.from("equipamentos").select("*").eq("ativo", true).order("codigo"),
    sb.from("fornecedores").select("*").order("nome"),
    sb.from("reclamacoes_clientes").select("*").order("data_recepcao", { ascending: false }),
    sb.from("formacoes").select("*, colaboradores(nome)").order("data_formacao", { ascending: false }),
    sb.from("sgq_documentos").select("*").eq("ativo", true),
    sb.from("sgq_objetivos").select("*").eq("ativo", true).order("processo"),
    sb.from("sgq_objetivos_registos").select("*").order("periodo", { ascending: false }),
  ])

  // Process formacoes to add colaborador_nome
  const formacoes = (formResult.data || []).map((f: any) => ({
    ...f,
    colaborador_nome: f.colaboradores?.nome || f.colaborador_id,
  }))

  // Organize sgq_documentos by type
  const docs: Record<string, any> = {}
  for (const d of (docsResult.data || [])) {
    docs[d.tipo] = d
  }

  return {
    nao_conformidades: ncResult.data || [],
    auditorias: audResult.data || [],
    revisoes_gestao: revResult.data || [],
    equipamentos: eqResult.data || [],
    fornecedores: fornResult.data || [],
    reclamacoes: recResult.data || [],
    formacoes,
    documentos: docs,
    objetivos: objResult.data || [],
    objetivos_registos: objRegResult.data || [],
  }
}

// ============================================
// SIMPLE ZIP BUILDER (no dependency needed)
// ============================================

function createZip(files: { name: string; data: Buffer }[]): Buffer {
  // Minimal ZIP file format implementation
  const localHeaders: Buffer[] = []
  const centralHeaders: Buffer[] = []
  let offset = 0

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, "utf-8")
    const crc = crc32(file.data)
    const size = file.data.length

    // Local file header (30 bytes + name + data)
    const local = Buffer.alloc(30 + nameBuffer.length)
    local.writeUInt32LE(0x04034b50, 0)  // signature
    local.writeUInt16LE(20, 4)           // version needed
    local.writeUInt16LE(0, 6)            // flags
    local.writeUInt16LE(0, 8)            // compression (store)
    local.writeUInt16LE(0, 10)           // mod time
    local.writeUInt16LE(0, 12)           // mod date
    local.writeUInt32LE(crc, 14)         // crc32
    local.writeUInt32LE(size, 18)        // compressed size
    local.writeUInt32LE(size, 22)        // uncompressed size
    local.writeUInt16LE(nameBuffer.length, 26) // name length
    local.writeUInt16LE(0, 28)           // extra length
    nameBuffer.copy(local, 30)

    localHeaders.push(local)
    localHeaders.push(file.data)

    // Central directory header (46 bytes + name)
    const central = Buffer.alloc(46 + nameBuffer.length)
    central.writeUInt32LE(0x02014b50, 0) // signature
    central.writeUInt16LE(20, 4)          // version made by
    central.writeUInt16LE(20, 6)          // version needed
    central.writeUInt16LE(0, 8)           // flags
    central.writeUInt16LE(0, 10)          // compression
    central.writeUInt16LE(0, 12)          // mod time
    central.writeUInt16LE(0, 14)          // mod date
    central.writeUInt32LE(crc, 16)        // crc32
    central.writeUInt32LE(size, 20)       // compressed size
    central.writeUInt32LE(size, 24)       // uncompressed size
    central.writeUInt16LE(nameBuffer.length, 28) // name length
    central.writeUInt16LE(0, 30)          // extra length
    central.writeUInt16LE(0, 32)          // comment length
    central.writeUInt16LE(0, 34)          // disk start
    central.writeUInt16LE(0, 36)          // internal attrs
    central.writeUInt32LE(0, 38)          // external attrs
    central.writeUInt32LE(offset, 42)     // local header offset
    nameBuffer.copy(central, 46)

    centralHeaders.push(central)
    offset += 30 + nameBuffer.length + size
  }

  const centralDirSize = centralHeaders.reduce((s, b) => s + b.length, 0)
  const centralDirOffset = offset

  // End of central directory (22 bytes)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)          // signature
  eocd.writeUInt16LE(0, 4)                    // disk number
  eocd.writeUInt16LE(0, 6)                    // disk with central dir
  eocd.writeUInt16LE(files.length, 8)         // entries on disk
  eocd.writeUInt16LE(files.length, 10)        // total entries
  eocd.writeUInt32LE(centralDirSize, 12)      // central dir size
  eocd.writeUInt32LE(centralDirOffset, 16)    // central dir offset
  eocd.writeUInt16LE(0, 20)                   // comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd])
}

// CRC32 implementation
function crc32(data: Buffer): number {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// ============================================
// API HANDLER
// ============================================

export async function GET(request: NextRequest) {
  try {
    const tipo = request.nextUrl.searchParams.get("tipo") || "pacote"
    const data = await fetchSGQData()

    // Generate individual PDF
    if (tipo !== "pacote") {
      let pdfBuffer: Buffer
      let filename: string

      switch (tipo) {
        case "nao_conformidades":
          pdfBuffer = await gerarNaoConformidades(data.nao_conformidades)
          filename = "NC_Nao_Conformidades.pdf"
          break
        case "auditorias":
          pdfBuffer = await gerarAuditorias(data.auditorias)
          filename = "AI_Auditorias_Internas.pdf"
          break
        case "revisao_gestao":
          pdfBuffer = await gerarRevisaoGestao(data.revisoes_gestao)
          filename = "RG_Revisao_Gestao.pdf"
          break
        case "equipamentos":
          pdfBuffer = await gerarEquipamentos(data.equipamentos)
          filename = "EQ_Equipamentos_Calibracao.pdf"
          break
        case "fornecedores":
          pdfBuffer = await gerarFornecedores(data.fornecedores)
          filename = "FN_Fornecedores_Aprovados.pdf"
          break
        case "reclamacoes":
          pdfBuffer = await gerarReclamacoes(data.reclamacoes)
          filename = "RC_Reclamacoes_Clientes.pdf"
          break
        case "formacoes":
          pdfBuffer = await gerarFormacoes(data.formacoes)
          filename = "FM_Formacoes.pdf"
          break
        case "politica_qualidade":
          pdfBuffer = await gerarPoliticaQualidade(data.documentos.politica_qualidade)
          filename = "PQ_Politica_Qualidade.pdf"
          break
        case "ambito_sgq":
          pdfBuffer = await gerarAmbitoSGQ(data.documentos.ambito_sgq, data.documentos.exclusoes)
          filename = "AS_Ambito_SGQ.pdf"
          break
        case "objetivos_qualidade":
          pdfBuffer = await gerarObjetivos(data.objetivos, data.objetivos_registos)
          filename = "OQ_Objetivos_Qualidade.pdf"
          break
        case "contexto":
          pdfBuffer = await gerarContexto(data.documentos.contexto_organizacao, data.documentos.partes_interessadas)
          filename = "CO_Contexto_Organizacao.pdf"
          break
        default:
          return NextResponse.json({ error: `Tipo '${tipo}' não reconhecido` }, { status: 400 })
      }

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(pdfBuffer.length),
        },
      })
    }

    // Generate full audit package (ZIP)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")

    const pdfs = await Promise.all([
      gerarNaoConformidades(data.nao_conformidades).then(d => ({ name: "01_NC_Nao_Conformidades.pdf", data: d })),
      gerarAuditorias(data.auditorias).then(d => ({ name: "02_AI_Auditorias_Internas.pdf", data: d })),
      gerarRevisaoGestao(data.revisoes_gestao).then(d => ({ name: "03_RG_Revisao_Gestao.pdf", data: d })),
      gerarEquipamentos(data.equipamentos).then(d => ({ name: "04_EQ_Equipamentos_Calibracao.pdf", data: d })),
      gerarFornecedores(data.fornecedores).then(d => ({ name: "05_FN_Fornecedores_Aprovados.pdf", data: d })),
      gerarReclamacoes(data.reclamacoes).then(d => ({ name: "06_RC_Reclamacoes_Clientes.pdf", data: d })),
      gerarFormacoes(data.formacoes).then(d => ({ name: "07_FM_Formacoes.pdf", data: d })),
      gerarPoliticaQualidade(data.documentos.politica_qualidade).then(d => ({ name: "08_PQ_Politica_Qualidade.pdf", data: d })),
      gerarAmbitoSGQ(data.documentos.ambito_sgq, data.documentos.exclusoes).then(d => ({ name: "09_AS_Ambito_SGQ.pdf", data: d })),
      gerarContexto(data.documentos.contexto_organizacao, data.documentos.partes_interessadas).then(d => ({ name: "10_CO_Contexto_Organizacao.pdf", data: d })),
      gerarObjetivos(data.objetivos, data.objetivos_registos).then(d => ({ name: "11_OQ_Objetivos_Qualidade.pdf", data: d })),
    ])

    const zipBuffer = createZip(pdfs)
    const zipFilename = `Pacote_Auditoria_ISO9001_${dateStr}.zip`

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Content-Length": String(zipBuffer.length),
      },
    })
  } catch (error: any) {
    console.error("Erro ao gerar pacote de auditoria:", error)
    return NextResponse.json(
      { error: "Erro ao gerar documentos", details: error.message },
      { status: 500 }
    )
  }
}
