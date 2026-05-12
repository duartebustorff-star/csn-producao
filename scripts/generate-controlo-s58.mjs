// CSN-Controlo-OPUS-S58.pdf — gerador
// Mesmo template visual de scripts/generate-controlo-pdf.mjs (v8 S35).
// Conteúdo: fecho da sessão S58 conforme ESTADO.OPUS.S58.md.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { writeFileSync } from "fs"

const orange = rgb(0.976, 0.576, 0.043)
const white = rgb(1, 1, 1)
const gray = rgb(0.5, 0.5, 0.5)
const darkGray = rgb(0.3, 0.3, 0.3)
const lightGray = rgb(0.85, 0.85, 0.85)
const green = rgb(0.133, 0.773, 0.369)
const red = rgb(0.937, 0.267, 0.267)
const yellow = rgb(0.961, 0.620, 0.043)
const black = rgb(0, 0, 0)

// Sanitização WinAnsi (mesma de generate-controlo-pdf.mjs)
function s(text) {
  return text
    .replace(/—/g, "--")
    .replace(/–/g, "-")
    .replace(/·/g, ".")
    .replace(/’/g, "'")
    .replace(/“|”/g, '"')
    .replace(/…/g, "...")
    .replace(/‘/g, "'")
}

async function generatePDF() {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const mono = await doc.embedFont(StandardFonts.Courier)
  const monoBold = await doc.embedFont(StandardFonts.CourierBold)

  const W = 595
  const H = 842
  const margin = 50

  // ============ PAGE 1: COVER + RESUMO ============
  let page = doc.addPage([W, H])
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: orange })
  let y = H - 60

  page.drawText(s("CSN TECHNIC"), { x: margin, y, size: 10, font: monoBold, color: orange })
  y -= 30
  page.drawText(s("Controlo de Sistema"), { x: margin, y, size: 28, font: fontBold, color: black })
  y -= 22
  page.drawText(s("OPUS S58 -- 11 Maio 2026"), { x: margin, y, size: 14, font, color: gray })
  y -= 40

  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: lightGray })
  y -= 25

  // ----- Info bloco
  page.drawText(s("SESSÃO S58"), { x: margin, y, size: 9, font: monoBold, color: orange })
  y -= 18
  const info = [
    ["Repo", "duartebustorff-star/csn-producao"],
    ["Branch produção", "main (PRs #1 + #2 merged + deployed)"],
    ["Stack", "Next.js 16 + Supabase + Claude Sonnet 4.5 + Vercel"],
    ["Tema dominante", "Fechar dívida gerador de termos + formalizar certificações"],
    ["Entregáveis BD", "4 termos L2026-001 conformes regenerados"],
    ["Entregáveis código", "8 bugs A--H fechados em 2 PRs"],
    ["Documentos canónicos S58", "7 (inclui CERT-ROADMAP novo)"],
    ["Tema S59 (urgente)", "Gestão Documental Facturação 2025"],
  ]
  for (const [label, value] of info) {
    page.drawText(s(label), { x: margin, y, size: 9, font: monoBold, color: darkGray })
    page.drawText(s(value), { x: 220, y, size: 9, font, color: black })
    y -= 16
  }

  y -= 20
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: lightGray })
  y -= 25

  // ----- Resumo executivo
  page.drawText(s("RESUMO EXECUTIVO"), { x: margin, y, size: 11, font: fontBold, color: orange })
  y -= 18
  const resumo = [
    "S58 foi dedicada a fechar a dívida técnica do endpoint /api/documentos/",
    "gerar-termo (acumulada desde S39 -- clone twilio órfão produzia PDFs",
    "lixo há 19 sessões). 8 bugs A--H corrigidos em 2 PRs merged e",
    "deployed em produção; reconciliação completa dos 6 termos L2026-001",
    "(JAP Mouriz): 4 regenerados e conformes, 2 com issue regulamentar",
    "(refletores 4.8.2.10). 7º documento canónico criado: CSN-CERT-",
    "ROADMAP-S58.html consolida 97 KPIs mapeados, 34 ISO 22400-2 e 12",
    "activos hoje. Decisões estratégicas: separar L3-MOM em ENM",
    "(mecânica) + WLD (soldadura) em S59; Duarte tira IWS + consultor",
    "mentor + Eng. Validador Mecânico. Layout cosmético BZ-93-LE em",
    "route.ts diferido para sessão futura (branch local archive/...).",
  ]
  for (const linha of resumo) {
    page.drawText(s(linha), { x: margin, y, size: 9.5, font, color: black })
    y -= 13
  }

  // ----- Empresa
  y -= 18
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: lightGray })
  y -= 22
  page.drawText(s("EMPRESA"), { x: margin, y, size: 9, font: monoBold, color: orange })
  y -= 18
  const empresa = [
    ["Nome legal", "Carlos dos Santos Nascimento, Lda"],
    ["NIF", "500 861 790"],
    ["Morada", "Rua da Indústria 8, Casal do Rôdo, 2640-216 Encarnação"],
    ["CEO / Gerente", "Duarte da Cunha Martins Bustorff-Silva"],
    ["Certidão Permanente", "3172-1374-8252"],
  ]
  for (const [label, value] of empresa) {
    page.drawText(s(label), { x: margin, y, size: 9, font: monoBold, color: darkGray })
    page.drawText(s(value), { x: 220, y, size: 9, font, color: black })
    y -= 16
  }

  page.drawText(s("CSN Opus -- Every build. Documented. Certified. Traceable."), { x: margin, y: 40, size: 8, font, color: gray })
  page.drawText(s("Página 1/4"), { x: W - margin - 60, y: 40, size: 8, font, color: gray })

  // ============ PAGE 2: BUGS + MIGRATIONS ============
  page = doc.addPage([W, H])
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: orange })
  y = H - 50

  page.drawText(s("GERADOR DE TERMOS -- 8 BUGS A--H FECHADOS"), { x: margin, y, size: 12, font: fontBold, color: orange })
  y -= 20

  // Header
  page.drawRectangle({ x: margin, y: y - 2, width: W - 2 * margin, height: 14, color: rgb(0.95, 0.95, 0.95) })
  page.drawText(s("Bug"), { x: margin + 4, y, size: 8, font: fontBold, color: darkGray })
  page.drawText(s("Descrição"), { x: margin + 40, y, size: 8, font: fontBold, color: darkGray })
  page.drawText(s("PR"), { x: 460, y, size: 8, font: fontBold, color: darkGray })
  page.drawText(s("Estado"), { x: 500, y, size: 8, font: fontBold, color: darkGray })
  y -= 16

  const bugs = [
    ["A", "obra_id undefined -> 500 em vez de 400", "#1", "OK"],
    ["B", "dossie_obra.ficheiro_url ficava NULL após upload", "#1", "OK"],
    ["C", "modelo legal lia dav.modelo em vez de VIN 4-6", "#1", "OK"],
    ["D", "slug caixa_aberta_madeira raw em vez de nome IMT", "#1", "OK"],
    ["E", "tara vinha de dav.tara (chassis) em vez da inspecção", "#1", "OK"],
    ["F", "(consolidado em A)", "#1", "OK"],
    ["G", "lookup DAV falhava com matricula NULL -- fallback VIN", "#1", "OK"],
    ["H", "skip peso_estatico_total IS NULL na query inspecoes", "#2", "OK"],
  ]
  for (const [b, desc, pr, est] of bugs) {
    page.drawText(s(b), { x: margin + 4, y, size: 8, font: monoBold, color: black })
    page.drawText(s(desc), { x: margin + 40, y, size: 8, font, color: black })
    page.drawText(s(pr), { x: 460, y, size: 8, font: mono, color: darkGray })
    page.drawText(s(est), { x: 500, y, size: 8, font: monoBold, color: green })
    y -= 13
  }

  y -= 20
  page.drawText(s("TERMOS L2026-001 (JAP MOURIZ) -- RECONCILIAÇÃO COMPLETA"), { x: margin, y, size: 11, font: fontBold, color: orange })
  y -= 18

  page.drawRectangle({ x: margin, y: y - 2, width: W - 2 * margin, height: 14, color: rgb(0.95, 0.95, 0.95) })
  page.drawText(s("Obra"), { x: margin + 4, y, size: 8, font: fontBold, color: darkGray })
  page.drawText(s("Matrícula"), { x: 130, y, size: 8, font: fontBold, color: darkGray })
  page.drawText(s("Status"), { x: 240, y, size: 8, font: fontBold, color: darkGray })
  y -= 16
  const termos = [
    ["L2026-001-01", "CB-83-LB", "Conforme -- regenerado", green],
    ["L2026-001-02", "CB-89-LB", "Conforme -- regenerado", green],
    ["L2026-001-03", "CB-78-LB", "Issue refletores 4.8.2.10 (insp. id=42)", yellow],
    ["L2026-001-04", "CB-34-LG", "Issue refletores 4.8.2.10 (insp. id=41)", yellow],
    ["L2026-001-05", "CB-23-LC", "Conforme -- regenerado", green],
    ["L2026-001-06", "CB-28-LD", "Conforme -- regenerado", green],
  ]
  for (const [obra, mat, st, cor] of termos) {
    page.drawText(s(obra), { x: margin + 4, y, size: 8, font: mono, color: black })
    page.drawText(s(mat), { x: 130, y, size: 8, font: monoBold, color: black })
    page.drawText(s(st), { x: 240, y, size: 8, font, color: cor })
    y -= 13
  }

  y -= 20
  page.drawText(s("MIGRATIONS -- 054 PENDENTE, 055--056 A CRIAR S59"), { x: margin, y, size: 11, font: fontBold, color: orange })
  y -= 18

  page.drawRectangle({ x: margin, y: y - 2, width: W - 2 * margin, height: 14, color: rgb(0.95, 0.95, 0.95) })
  page.drawText(s("Migration"), { x: margin + 4, y, size: 8, font: fontBold, color: darkGray })
  page.drawText(s("Tabelas / Função"), { x: 140, y, size: 8, font: fontBold, color: darkGray })
  page.drawText(s("Estado"), { x: 470, y, size: 8, font: fontBold, color: darkGray })
  y -= 16
  const migs = [
    ["054", "skills_csn + skills_csn_historico (gerada S57)", "Não aplicada", yellow],
    ["055", "agentes_perfil (regras Boris JSONB)", "A criar S59", yellow],
    ["056", "kpis_csn (97 KPIs com fórmula + fonte + status)", "A criar S59", yellow],
    ["057+", "fornecedores (núcleos de fornecedor SSoT)", "A criar S60", yellow],
  ]
  for (const [num, tab, est, cor] of migs) {
    page.drawText(s(num), { x: margin + 4, y, size: 8, font: monoBold, color: black })
    page.drawText(s(tab), { x: 140, y, size: 8, font, color: black })
    page.drawText(s(est), { x: 470, y, size: 8, font: fontBold, color: cor })
    y -= 14
  }

  page.drawText(s("CSN Opus -- Controlo de Sistema OPUS S58"), { x: margin, y: 40, size: 8, font, color: gray })
  page.drawText(s("Página 2/4"), { x: W - margin - 60, y: 40, size: 8, font, color: gray })

  // ============ PAGE 3: TOOLS + LIMPEZA + DECISÕES ============
  page = doc.addPage([W, H])
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: orange })
  y = H - 50

  page.drawText(s("ENDPOINTS E TOOLS -- VERSÕES S58"), { x: margin, y, size: 12, font: fontBold, color: orange })
  y -= 20

  page.drawRectangle({ x: margin, y: y - 2, width: W - 2 * margin, height: 14, color: rgb(0.95, 0.95, 0.95) })
  page.drawText(s("Endpoint / Tool"), { x: margin + 4, y, size: 8, font: fontBold, color: darkGray })
  page.drawText(s("Versão"), { x: 320, y, size: 8, font: fontBold, color: darkGray })
  page.drawText(s("Estado"), { x: 430, y, size: 8, font: fontBold, color: darkGray })
  y -= 16
  const tools = [
    ["/api/documentos/gerar-termo", "V2 (PRs #1+#2)", "Em produção", green],
    ["/api/documentos/gerar-checklist", "V1", "Em produção", green],
    ["/api/documentos/upload", "V1", "Em produção", green],
    ["/api/router/classificar", "v9/v10", "Em produção", green],
    ["/api/rh/recibo + conta-corrente + resumo-anual", "V1", "Em produção", green],
    ["/api/faturacao/emitir + listar", "V1", "Em produção", green],
    ["/api/rag/inventor/search", "V1", "Em produção", green],
    ["/api/twilio/whatsapp-send", "--", "REMOVIDO S58", red],
    ["public/assets/carimbo_csn.svg", "0cb1d1a", "Criado S58", green],
  ]
  for (const [name, ver, est, cor] of tools) {
    page.drawText(s(name), { x: margin + 4, y, size: 8, font: mono, color: black })
    page.drawText(s(ver), { x: 320, y, size: 8, font, color: darkGray })
    page.drawText(s(est), { x: 430, y, size: 8, font: monoBold, color: cor })
    y -= 13
  }

  y -= 18
  page.drawText(s("LIMPEZA BD E STORAGE S58"), { x: margin, y, size: 11, font: fontBold, color: orange })
  y -= 18
  const limpeza = [
    "inspecoes -- 4 registos NULL/duplicados removidos (stubs duplicate ingestion)",
    "Storage/documentos/termos/ -- 7 PDFs lixo apagados (resíduos clone twilio)",
    "Endpoint twilio órfão removido (root cause: undefined em obra_id, criado S39)",
    "+2 inspecções importadas: CB-78-LB (id=42), CB-34-LG (id=41)",
  ]
  for (const linha of limpeza) {
    page.drawRectangle({ x: margin, y: y - 3, width: 6, height: 6, color: green })
    page.drawText(s(linha), { x: margin + 14, y, size: 9, font, color: black })
    y -= 14
  }

  y -= 16
  page.drawText(s("DECISÕES ESTRATÉGICAS S58"), { x: margin, y, size: 11, font: fontBold, color: orange })
  y -= 18
  const decisoes = [
    ["1", "Separar CSN-L3-MOM em ENM (mecânica) + WLD (soldadura)", "Desenho S59"],
    ["2", "Formação Duarte: IWS + consultor mentor + Eng. Validador Mecânico", "A iniciar"],
    ["3", "7º doc canónico CERT-ROADMAP-SXX.html em cada fecho sessão", "Aplicado"],
    ["4", "Migration 056 kpis_csn para registar os 97 KPIs", "Marcada para S59"],
  ]
  page.drawRectangle({ x: margin, y: y - 2, width: W - 2 * margin, height: 14, color: rgb(0.95, 0.95, 0.95) })
  page.drawText(s("#"), { x: margin + 4, y, size: 8, font: fontBold, color: darkGray })
  page.drawText(s("Decisão"), { x: margin + 24, y, size: 8, font: fontBold, color: darkGray })
  page.drawText(s("Status"), { x: 430, y, size: 8, font: fontBold, color: darkGray })
  y -= 16
  for (const [n, dec, st] of decisoes) {
    page.drawText(s(n), { x: margin + 4, y, size: 8, font: monoBold, color: black })
    page.drawText(s(dec), { x: margin + 24, y, size: 8, font, color: black })
    page.drawText(s(st), { x: 430, y, size: 8, font: monoBold, color: darkGray })
    y -= 14
  }

  y -= 18
  page.drawText(s("MÉTRICAS S58"), { x: margin, y, size: 11, font: fontBold, color: orange })
  y -= 18
  const metricas = [
    ["Bugs gerador termos fechados", "8 / 8"],
    ["PRs entregues", "2 (merged + deployed)"],
    ["Termos L2026-001 conformes", "4 / 6 (2 issue regulamentar)"],
    ["Inspecções importadas", "2 (CB-78-LB, CB-34-LG)"],
    ["Registos BD limpos", "4 NULL/dup"],
    ["PDFs lixo apagados", "7"],
    ["Endpoints órfãos removidos", "1 (twilio)"],
    ["Documentos canónicos criados", "1 (CERT-ROADMAP) + 5 desta sessão"],
    ["KPIs activos novos", "+0 (sessão de estrutura)"],
  ]
  for (const [k, v] of metricas) {
    page.drawText(s(k), { x: margin, y, size: 9, font: monoBold, color: darkGray })
    page.drawText(s(v), { x: 300, y, size: 9, font, color: black })
    y -= 14
  }

  page.drawText(s("CSN Opus -- Controlo de Sistema OPUS S58"), { x: margin, y: 40, size: 8, font, color: gray })
  page.drawText(s("Página 3/4"), { x: W - margin - 60, y: 40, size: 8, font, color: gray })

  // ============ PAGE 4: AUDITORIA + BACKLOG TOP 15 ============
  page = doc.addPage([W, H])
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: orange })
  y = H - 50

  page.drawText(s("PRONTIDÃO PARA AUDITORIA"), { x: margin, y, size: 12, font: fontBold, color: orange })
  y -= 20

  const audits = [
    ["ISO 9001:2015 -- Sistema de Gestão da Qualidade", "62%", green],
    ["Marcação CE -- Reg. (UE) 2018/858", "70%", green],
    ["EN 1090 -- Execução de Estruturas em Aço", "25%", yellow],
    ["EN ISO 3834 -- Qualidade de Soldadura", "0%", red],
    ["EN 12642 L/XL -- Resistência Estrutural", "0%", red],
    ["ISO 14001 -- Gestão Ambiental (Trio PRR)", "0%", red],
    ["ISO 45001 -- SST (Trio PRR)", "0%", red],
    ["ISO 22400 -- KPIs Manufacturing", "35%", yellow],
  ]
  for (const [norm, pct, cor] of audits) {
    page.drawText(s(norm), { x: margin + 4, y, size: 9, font: fontBold, color: black })
    page.drawText(s(pct), { x: 420, y, size: 12, font: fontBold, color: cor })
    y -= 16
  }
  y -= 6
  page.drawText(s("Consistente com CSN-CERT-ROADMAP-S58 rev.2:"), { x: margin, y, size: 8, font: monoBold, color: darkGray })
  y -= 12
  page.drawText(s("97 KPIs mapeados · 34 definidos ISO 22400-2 · 12 activos hoje"), { x: margin, y, size: 8, font, color: darkGray })

  y -= 24
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: lightGray })
  y -= 18

  page.drawText(s("BACKLOG TOP 15 -- PROXIMAS SESSÕES"), { x: margin, y, size: 12, font: fontBold, color: orange })
  y -= 18

  const backlog = [
    ["P1", "Facturação 2025 -- conciliar 4.409 e-Fatura + núcleos fornecedor (URGENTE contabilidade)", red],
    ["P2", "Aplicar migration 054 skills_csn em produção", yellow],
    ["P3", "Migration 055 agentes_perfil (regras Boris JSONB)", yellow],
    ["P4", "Migration 056 kpis_csn (97 KPIs)", yellow],
    ["P5", "Desenhar CSN-L3-MOM-ENM + skill distancia-eixo-carrocaria", yellow],
    ["P6", "Desenhar CSN-L3-MOM-WLD + skill gerar-wps", yellow],
    ["P7", "Skill vin-decoder-csn (CSN-L4-ENG-SKL-003-2026)", yellow],
    ["P8", "Separar davs.modelo em modelo_comercial + modelo_codigo", yellow],
    ["P9", "Tabela empresa_dados SSoT (morada/NIF/certidão)", yellow],
    ["P10", "Resolver issue refletores 4.8.2.10 (L2026-001-03 + -04)", yellow],
    ["P11", "Layout BZ-93-LE route.ts -- branch archive/termo-layout-bz93le-canonico", gray],
    ["P12", "2 KPIs L3-DOC: % termos sem bug + cobertura inspecoes pré-entrega", gray],
    ["P13", "COC eletrónico (deadline Jul 2026)", red],
    ["P14", "Recibos Abril 2026 -- decidir manual ou cron mensal", gray],
    ["P15", "LFAM 3D printing -- registar research_finding quando tabela existir", gray],
  ]
  for (const [p, t, cor] of backlog) {
    page.drawText(s(p), { x: margin + 4, y, size: 8, font: monoBold, color: cor })
    page.drawText(s(t), { x: margin + 30, y, size: 8, font, color: black })
    y -= 13
  }

  y -= 16
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: lightGray })
  y -= 16
  page.drawText(s("7 DOCUMENTOS CANÓNICOS S58"), { x: margin, y, size: 11, font: fontBold, color: orange })
  y -= 16
  const canonicos = [
    "1. ESTADO.OPUS.S58.md (raiz + docs/)",
    "2. CSN-Controlo-OPUS-S58.pdf (este documento)",
    "3. csn-architecture-OPUS-S58.html",
    "4. csn-kpis-isa95-S58.html",
    "5. csn-skills-tools-registry-S58.html",
    "6. CSN-CERT-ROADMAP-S58.html (NOVO 7º canónico)",
    "7. CSN-PRODUCAO-BRIEFING.md (briefing técnico permanente)",
  ]
  for (const linha of canonicos) {
    page.drawText(s(linha), { x: margin + 4, y, size: 8.5, font: mono, color: darkGray })
    y -= 12
  }

  page.drawText(s("CSN Opus -- Controlo de Sistema OPUS S58"), { x: margin, y: 40, size: 8, font, color: gray })
  page.drawText(s("Página 4/4"), { x: W - margin - 60, y: 40, size: 8, font, color: gray })

  const pdfBytes = await doc.save()
  writeFileSync("docs/CSN-Controlo-OPUS-S58.pdf", pdfBytes)
  console.log("OK: docs/CSN-Controlo-OPUS-S58.pdf (", pdfBytes.length, "bytes)")
}

generatePDF().catch((err) => {
  console.error(err)
  process.exit(1)
})
