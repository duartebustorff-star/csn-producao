/**
 * CSN Produção — Gerador de PDFs do SGQ ISO 9001:2015
 * Gera documentos PDF a partir dos dados no Supabase.
 * Usado pelo API route /api/sgq/pacote-auditoria
 */

import PDFDocument from "pdfkit"

// ============================================
// CONFIGURAÇÃO
// ============================================

const EMPRESA = "Carlos dos Santos Nascimento, Lda"
const MORADA = "Rua da Industria, n.º7, Casal do Rodo, 2640-216 Encarnação — Mafra"
const CERTIFICACAO = "ISO 9001:2015 — TÜV Rheinland"

const COR_HEADER = "#0c1220"
const COR_ACCENT = "#e8930b"

// ============================================
// TIPOS
// ============================================

export type TipoDocumento =
  | "nao_conformidades"
  | "auditorias"
  | "revisao_gestao"
  | "equipamentos"
  | "fornecedores"
  | "reclamacoes"
  | "formacoes"
  | "politica_qualidade"
  | "ambito_sgq"
  | "objetivos_qualidade"
  | "contexto"

// ============================================
// HELPERS
// ============================================

function addHeader(doc: InstanceType<typeof PDFDocument>) {
  // Header bar
  doc.save()
  doc.rect(0, 0, doc.page.width, 56).fill(COR_HEADER)
  doc.fontSize(10).fillColor("white").font("Helvetica-Bold")
    .text(EMPRESA, 40, 16, { width: 400 })
  doc.fontSize(7).fillColor("#cccccc").font("Helvetica")
    .text(CERTIFICACAO, 40, 32)
  // Accent line
  doc.save()
  doc.moveTo(0, 56).lineTo(doc.page.width, 56)
    .lineWidth(2).strokeColor(COR_ACCENT).stroke()
  doc.restore()
  doc.restore()
  doc.y = 72
}

function addFooter(doc: InstanceType<typeof PDFDocument>, pageNum: number) {
  const now = new Date()
  const dateStr = now.toLocaleDateString("pt-PT") + " " + now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
  doc.save()
  doc.fontSize(7).fillColor("#999999").font("Helvetica")
    .text(`Gerado em ${dateStr} — CSN Produção — SGQ ISO 9001:2015`, 40, doc.page.height - 30, { width: 400 })
    .text(`Página ${pageNum}`, doc.page.width - 80, doc.page.height - 30, { width: 40, align: "right" })
  doc.restore()
}

function addTitle(doc: InstanceType<typeof PDFDocument>, title: string, clausula: string) {
  doc.fontSize(16).fillColor(COR_HEADER).font("Helvetica-Bold")
    .text(title, 40, doc.y, { width: doc.page.width - 80 })
  doc.moveDown(0.3)
  doc.fontSize(9).fillColor("#999999").font("Helvetica")
    .text(clausula)
  doc.moveDown(0.3)
  // HR line
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y)
    .lineWidth(1).strokeColor(COR_ACCENT).stroke()
  doc.moveDown(0.8)
}

function addField(doc: InstanceType<typeof PDFDocument>, label: string, value: string) {
  const x = 40
  const maxW = doc.page.width - 80

  // Check if we need a new page
  if (doc.y > doc.page.height - 80) {
    doc.addPage()
    addHeader(doc)
  }

  doc.fontSize(8).fillColor("#999999").font("Helvetica")
    .text(label, x, doc.y, { width: maxW })
  doc.fontSize(10).fillColor("#333333").font("Helvetica")
    .text(value || "—", x, doc.y, { width: maxW })
  doc.moveDown(0.5)
}

function addSectionTitle(doc: InstanceType<typeof PDFDocument>, title: string) {
  if (doc.y > doc.page.height - 100) {
    doc.addPage()
    addHeader(doc)
  }
  doc.moveDown(0.3)
  doc.fontSize(12).fillColor(COR_HEADER).font("Helvetica-Bold")
    .text(title, 40, doc.y, { width: doc.page.width - 80 })
  doc.moveDown(0.3)
}

function addSeparator(doc: InstanceType<typeof PDFDocument>) {
  doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y)
    .lineWidth(0.5).strokeColor("#dddddd").stroke()
  doc.moveDown(0.5)
}

function addNote(doc: InstanceType<typeof PDFDocument>, text: string) {
  doc.fontSize(9).fillColor("#666666").font("Helvetica")
    .text(text, 40, doc.y, { width: doc.page.width - 80 })
  doc.moveDown(0.5)
}

function addSimpleTable(
  doc: InstanceType<typeof PDFDocument>,
  headers: string[],
  rows: string[][],
  colWidths: number[]
) {
  const startX = 40
  const rowHeight = 20
  const maxW = doc.page.width - 80

  if (doc.y > doc.page.height - 100) {
    doc.addPage()
    addHeader(doc)
  }

  // Header row
  let x = startX
  doc.save()
  doc.rect(startX, doc.y, maxW, rowHeight).fill(COR_HEADER)
  headers.forEach((h, i) => {
    doc.fontSize(7).fillColor("white").font("Helvetica-Bold")
      .text(h, x + 3, doc.y + 5, { width: colWidths[i] - 6 })
    x += colWidths[i]
  })
  doc.restore()
  doc.y += rowHeight

  // Data rows
  rows.forEach((row, rowIdx) => {
    if (doc.y > doc.page.height - 60) {
      doc.addPage()
      addHeader(doc)
    }

    const bg = rowIdx % 2 === 0 ? "#ffffff" : "#f5f5f5"
    doc.save()
    doc.rect(startX, doc.y, maxW, rowHeight).fill(bg)
    x = startX
    row.forEach((cell, i) => {
      doc.fontSize(7).fillColor("#333333").font("Helvetica")
        .text(cell || "—", x + 3, doc.y + 5, { width: colWidths[i] - 6 })
      x += colWidths[i]
    })
    doc.restore()
    doc.y += rowHeight
  })

  doc.moveDown(0.5)
}

function createDoc(): InstanceType<typeof PDFDocument> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 60, bottom: 40, left: 40, right: 40 },
    bufferPages: true,
  })
  addHeader(doc)
  return doc
}

function finishDoc(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    // Add footers to all pages
    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      addFooter(doc, i + 1)
    }

    doc.end()
  })
}

// ============================================
// GERADORES
// ============================================

export async function gerarNaoConformidades(dados: any[]): Promise<Buffer> {
  const doc = createDoc()
  addTitle(doc, "Registo de Não-Conformidades", "ISO 9001:2015 — Cláusula 10.2")

  if (!dados || dados.length === 0) {
    addNote(doc, "Sem não-conformidades registadas.")
    doc.moveDown(0.5)
    addNote(doc, "Nota: Este registo confirma que o sistema de gestão de não-conformidades está implementado e operacional. As NCs são registadas no sistema CSN Produção e exportadas para este documento quando solicitado.")
  } else {
    for (const nc of dados) {
      addSectionTitle(doc, `NC: ${nc.codigo || "N/A"}`)
      addField(doc, "Data de Deteção", nc.data_detecao)
      addField(doc, "Origem", nc.origem)
      addField(doc, "Descrição", nc.descricao)
      addField(doc, "Ação Imediata", nc.acao_imediata)
      addField(doc, "Causa Raiz", nc.causa_raiz)
      addField(doc, "Ação Corretiva", nc.acao_corretiva)
      addField(doc, "Responsável", nc.responsavel)
      addField(doc, "Prazo", nc.prazo)
      addField(doc, "Eficaz?", nc.eficaz === true ? "Sim" : nc.eficaz === false ? "Não" : "Pendente")
      addField(doc, "Estado", nc.estado)
      addSeparator(doc)
    }
  }

  return finishDoc(doc)
}

export async function gerarAuditorias(dados: any[]): Promise<Buffer> {
  const doc = createDoc()
  addTitle(doc, "Auditorias Internas", "ISO 9001:2015 — Cláusula 9.2")

  if (!dados || dados.length === 0) {
    addNote(doc, "Sem auditorias internas registadas.")
    doc.moveDown(0.5)
    addNote(doc, "Nota: O programa de auditorias internas está implementado no sistema CSN Produção. As auditorias são planeadas anualmente cobrindo todos os processos do SGQ.")
  } else {
    for (const a of dados) {
      addSectionTitle(doc, `Auditoria: ${a.codigo || "N/A"}`)
      addField(doc, "Data", a.data_auditoria)
      addField(doc, "Auditor", a.auditor)
      addField(doc, "Processos Auditados", Array.isArray(a.processos_auditados) ? a.processos_auditados.join(", ") : a.processos_auditados)
      addField(doc, "Conformidades", a.conformidades)
      addField(doc, "Não-Conformidades", a.nao_conformidades_encontradas)
      addField(doc, "Observações", a.observacoes)
      addField(doc, "Conclusão", a.conclusao)
      addSeparator(doc)
    }
  }

  return finishDoc(doc)
}

export async function gerarRevisaoGestao(dados: any[]): Promise<Buffer> {
  const doc = createDoc()
  addTitle(doc, "Revisão pela Gestão", "ISO 9001:2015 — Cláusula 9.3")

  if (!dados || dados.length === 0) {
    addNote(doc, "Sem revisões pela gestão registadas.")
  } else {
    for (const r of dados) {
      addSectionTitle(doc, `Revisão: ${r.codigo || "N/A"}`)
      addField(doc, "Data", r.data_revisao)
      addField(doc, "Participantes", Array.isArray(r.participantes) ? r.participantes.join(", ") : r.participantes)
      addField(doc, "Estado Ações Anteriores", r.estado_acoes_anteriores)
      addField(doc, "Alterações de Contexto", r.alteracoes_contexto)
      addField(doc, "Desempenho da Qualidade", r.desempenho_qualidade)
      addField(doc, "Resultados de Auditorias", r.resultados_auditorias)
      addField(doc, "Satisfação de Clientes", r.satisfacao_clientes)
      addField(doc, "Riscos e Oportunidades", r.riscos_oportunidades)
      addField(doc, "Decisões", r.decisoes)
      addField(doc, "Recursos Necessários", r.recursos_necessarios)
      addField(doc, "Ações de Melhoria", r.acoes_melhoria)
      addSeparator(doc)
    }
  }

  return finishDoc(doc)
}

export async function gerarEquipamentos(dados: any[]): Promise<Buffer> {
  const doc = createDoc()
  addTitle(doc, "Equipamentos e Calibração", "ISO 9001:2015 — Cláusula 7.1.5")

  if (!dados || dados.length === 0) {
    addNote(doc, "Sem equipamentos registados.")
  } else {
    const headers = ["Código", "Nome", "Tipo", "Calibração", "Próx. Manutenção"]
    const colWidths = [70, 150, 70, 90, 90]
    const rows = dados.map(eq => [
      eq.codigo || "",
      eq.nome || "",
      eq.tipo || "",
      eq.requer_calibracao ? (eq.proxima_calibracao || "Pendente") : "N/A",
      eq.proxima_manutencao || "—",
    ])
    addSimpleTable(doc, headers, rows, colWidths)
  }

  return finishDoc(doc)
}

export async function gerarFornecedores(dados: any[]): Promise<Buffer> {
  const doc = createDoc()
  addTitle(doc, "Fornecedores Aprovados", "ISO 9001:2015 — Cláusula 8.4")

  if (!dados || dados.length === 0) {
    addNote(doc, "Sem fornecedores registados.")
  } else {
    const headers = ["Nome", "Fornecimento", "Qualidade", "Prazo", "Aprovado", "Últ. Avaliação"]
    const colWidths = [110, 100, 55, 55, 55, 80]
    const rows = dados.map(f => [
      f.nome || "",
      f.tipo_fornecimento || "",
      f.nota_qualidade ? `${f.nota_qualidade}/5` : "—",
      f.nota_prazo ? `${f.nota_prazo}/5` : "—",
      f.aprovado ? "Sim" : "Não",
      f.ultima_avaliacao || "—",
    ])
    addSimpleTable(doc, headers, rows, colWidths)
  }

  return finishDoc(doc)
}

export async function gerarReclamacoes(dados: any[]): Promise<Buffer> {
  const doc = createDoc()
  addTitle(doc, "Reclamações de Clientes", "ISO 9001:2015 — Cláusula 9.1.2")

  if (!dados || dados.length === 0) {
    addNote(doc, "Sem reclamações registadas.")
    doc.moveDown(0.5)
    addNote(doc, "Nota: A ausência de reclamações é monitorizada. O sistema está operacional para registo e tratamento de reclamações quando ocorram.")
  } else {
    for (const rc of dados) {
      addSectionTitle(doc, `Reclamação: ${rc.codigo || "N/A"}`)
      addField(doc, "Data", rc.data_recepcao)
      addField(doc, "Cliente", rc.cliente)
      addField(doc, "Descrição", rc.descricao)
      addField(doc, "Resposta", rc.resposta)
      addField(doc, "Responsável", rc.responsavel)
      addField(doc, "Data Resolução", rc.data_resolucao)
      addField(doc, "Estado", rc.estado)
      addField(doc, "Cliente Satisfeito?", rc.cliente_satisfeito === true ? "Sim" : "Pendente")
      addSeparator(doc)
    }
  }

  return finishDoc(doc)
}

export async function gerarFormacoes(dados: any[]): Promise<Buffer> {
  const doc = createDoc()
  addTitle(doc, "Registos de Formação", "ISO 9001:2015 — Cláusula 7.2")

  if (!dados || dados.length === 0) {
    addNote(doc, "Sem formações registadas.")
  } else {
    const headers = ["Colaborador", "Formação", "Tipo", "Data", "Horas", "Formador"]
    const colWidths = [85, 130, 60, 70, 40, 80]
    const rows = dados.map(f => [
      f.colaborador_nome || f.colaborador_id || "",
      f.descricao || "",
      f.tipo || "",
      f.data_formacao || "",
      f.duracao_horas ? `${f.duracao_horas}h` : "—",
      f.formador || "—",
    ])
    addSimpleTable(doc, headers, rows, colWidths)
  }

  return finishDoc(doc)
}

export async function gerarPoliticaQualidade(doc_data: any): Promise<Buffer> {
  const doc = createDoc()
  addTitle(doc, "Política da Qualidade", "ISO 9001:2015 — Cláusula 5.2")

  if (!doc_data) {
    addNote(doc, "Política da qualidade não definida.")
  } else {
    // Write the policy text preserving line breaks
    const lines = (doc_data.conteudo || "").split("\n")
    for (const line of lines) {
      if (line.trim()) {
        doc.fontSize(10).fillColor("#333333").font("Helvetica")
          .text(line.trim(), 40, doc.y, { width: doc.page.width - 80 })
        doc.moveDown(0.3)
      } else {
        doc.moveDown(0.5)
      }
    }
    doc.moveDown(1)
    addField(doc, "Aprovado por", doc_data.aprovado_por || "Gerência")
    addField(doc, "Data de Aprovação", doc_data.data_aprovacao || "—")
    addField(doc, "Versão", String(doc_data.versao || 1))
  }

  return finishDoc(doc)
}

export async function gerarAmbitoSGQ(ambito: any, exclusoes: any): Promise<Buffer> {
  const doc = createDoc()
  addTitle(doc, "Âmbito do SGQ e Não Aplicabilidades", "ISO 9001:2015 — Cláusula 4.3")

  if (ambito) {
    addSectionTitle(doc, "Âmbito")
    const lines = (ambito.conteudo || "").split("\n")
    for (const line of lines) {
      if (line.trim()) {
        doc.fontSize(10).fillColor("#333333").font("Helvetica")
          .text(line.trim(), 40, doc.y, { width: doc.page.width - 80 })
        doc.moveDown(0.3)
      } else {
        doc.moveDown(0.5)
      }
    }
  }

  if (exclusoes) {
    doc.moveDown(1)
    addSectionTitle(doc, "Não Aplicabilidades")
    const lines = (exclusoes.conteudo || "").split("\n")
    for (const line of lines) {
      if (line.trim()) {
        doc.fontSize(10).fillColor("#333333").font("Helvetica")
          .text(line.trim(), 40, doc.y, { width: doc.page.width - 80 })
        doc.moveDown(0.3)
      } else {
        doc.moveDown(0.5)
      }
    }
  }

  return finishDoc(doc)
}

export async function gerarContexto(contexto: any, partes: any): Promise<Buffer> {
  const doc = createDoc()
  addTitle(doc, "Contexto da Organização", "ISO 9001:2015 — Cláusulas 4.1 e 4.2")

  if (contexto) {
    addSectionTitle(doc, "Contexto (4.1)")
    const lines = (contexto.conteudo || "").split("\n")
    for (const line of lines) {
      if (line.trim()) {
        doc.fontSize(10).fillColor("#333333").font("Helvetica")
          .text(line.trim(), 40, doc.y, { width: doc.page.width - 80 })
        doc.moveDown(0.3)
      } else {
        doc.moveDown(0.5)
      }
    }
  }

  if (partes) {
    doc.moveDown(1)
    addSectionTitle(doc, "Partes Interessadas (4.2)")
    const lines = (partes.conteudo || "").split("\n")
    for (const line of lines) {
      if (line.trim()) {
        doc.fontSize(10).fillColor("#333333").font("Helvetica")
          .text(line.trim(), 40, doc.y, { width: doc.page.width - 80 })
        doc.moveDown(0.3)
      } else {
        doc.moveDown(0.5)
      }
    }
  }

  return finishDoc(doc)
}

export async function gerarObjetivos(objetivos: any[], registos: any[]): Promise<Buffer> {
  const doc = createDoc()
  addTitle(doc, "Objetivos da Qualidade", "ISO 9001:2015 — Cláusula 6.2")

  if (!objetivos || objetivos.length === 0) {
    addNote(doc, "Sem objetivos definidos.")
  } else {
    const headers = ["Processo", "Indicador", "Meta", "Ação", "Periodicidade"]
    const colWidths = [70, 130, 100, 100, 70]
    const rows = objetivos.map(o => [
      o.processo || "",
      o.indicador || "",
      o.meta || "",
      o.acao || "",
      o.periodicidade || "",
    ])
    addSimpleTable(doc, headers, rows, colWidths)

    // Monitoring records if available
    if (registos && registos.length > 0) {
      doc.moveDown(1)
      addSectionTitle(doc, "Monitorização")
      const mHeaders = ["Objetivo", "Período", "Valor", "Observações"]
      const mWidths = [150, 80, 100, 150]
      const mRows = registos.map(r => {
        const obj = objetivos.find((o: any) => o.id === r.objetivo_id)
        return [
          obj?.indicador || String(r.objetivo_id),
          r.periodo || "",
          r.valor || "",
          r.observacoes || "",
        ]
      })
      addSimpleTable(doc, mHeaders, mRows, mWidths)
    }
  }

  return finishDoc(doc)
}
