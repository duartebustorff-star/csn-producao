import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync } from 'fs';

const orange = rgb(0.976, 0.576, 0.043);
const white = rgb(1, 1, 1);
const gray = rgb(0.5, 0.5, 0.5);
const darkGray = rgb(0.3, 0.3, 0.3);
const lightGray = rgb(0.85, 0.85, 0.85);
const green = rgb(0.133, 0.773, 0.369);
const red = rgb(0.937, 0.267, 0.267);
const yellow = rgb(0.961, 0.620, 0.043);
const black = rgb(0, 0, 0);

function s(text) {
  // Sanitize for WinAnsi encoding
  return text
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u00B7/g, '.')
    .replace(/\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2018/g, "'")
    .replace(/\u00BA/g, 'o')
    .replace(/[^\x00-\xFF]/g, '');
}

async function generatePDF() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const monoBold = await doc.embedFont(StandardFonts.CourierBold);

  const W = 595; // A4
  const H = 842;
  const margin = 50;

  // ===== PAGE 1: COVER =====
  let page = doc.addPage([W, H]);
  let y = H - 80;

  // Orange header bar
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: orange });

  page.drawText(s('CSN TECHNIC'), { x: margin, y, size: 10, font: monoBold, color: orange });
  y -= 30;
  page.drawText(s('Controlo de Sistema'), { x: margin, y, size: 28, font: fontBold, color: black });
  y -= 22;
  page.drawText(s('v8 -- 27 Marco 2026'), { x: margin, y, size: 14, font, color: gray });
  y -= 40;

  // Separator
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: lightGray });
  y -= 30;

  // System info
  const info = [
    ['Sistema interno', 'CSN Opus'],
    ['Produto comercial', 'CSN Brain'],
    ['Marca corporativa', 'CSN Technic -- Commercial Vehicle Engineering'],
    ['URL', 'https://csn-producao.vercel.app'],
    ['Stack', 'Next.js 16 + Supabase + Claude API + Vercel'],
    ['Tabelas Supabase', '25 existentes'],
    ['ADRs', '24 commitados'],
    ['AI Personas', '6 definidas (1 em codigo: Sr. Manuel)'],
    ['Autonomous Agents', '10 definidos (1 funcional: Research)'],
    ['Chat Tools', '17 operacionais'],
  ];

  for (const [label, value] of info) {
    page.drawText(s(label), { x: margin, y, size: 9, font: monoBold, color: darkGray });
    page.drawText(s(value), { x: 220, y, size: 9, font, color: black });
    y -= 16;
  }

  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: lightGray });
  y -= 25;

  page.drawText(s('EMPRESA'), { x: margin, y, size: 9, font: monoBold, color: orange });
  y -= 18;
  const empresa = [
    ['Nome legal', 'Carlos dos Santos Nascimento, Lda'],
    ['NIF', '500 861 790'],
    ['Morada', 'Rua da Industria n 8, Casal do Rodo, 2640-216 Encarnacao'],
    ['CEO', 'Duarte da Cunha Martins Bustorff-Silva'],
    ['Certidao', '3172-1374-8252'],
  ];
  for (const [label, value] of empresa) {
    page.drawText(s(label), { x: margin, y, size: 9, font: monoBold, color: darkGray });
    page.drawText(s(value), { x: 220, y, size: 9, font, color: black });
    y -= 16;
  }

  // Footer
  page.drawText(s('CSN Opus -- Every build. Documented. Certified. Traceable.'), { x: margin, y: 40, size: 8, font, color: gray });
  page.drawText(s('Pagina 1/4'), { x: W - margin - 50, y: 40, size: 8, font, color: gray });

  // ===== PAGE 2: AI PERSONAS + AGENTS =====
  page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: orange });
  y = H - 50;

  page.drawText(s('AI PERSONAS -- 6'), { x: margin, y, size: 12, font: fontBold, color: orange });
  y -= 20;

  const personas = [
    ['Luisa', 'Assistente CEO', 'Transversal', 'Fase 1'],
    ['Fernando', 'Chefe de Producao', 'Nivel 3 MES', 'Existe como Sr. Manuel'],
    ['Carolina', 'Recursos Humanos', 'Nivel 4 ERP', 'EM PRODUCAO'],
    ['Marta', 'Agente Comercial', 'Nivel 4 ERP', 'Fase 2'],
    ['Leonor', 'Aftersales', 'Nivel 4 ERP', 'Fase 2'],
    ['Irina', 'Fornecedores', 'Nivel 4 ERP', 'Fase 2'],
  ];

  // Table header
  page.drawRectangle({ x: margin, y: y - 2, width: W - 2 * margin, height: 14, color: rgb(0.95, 0.95, 0.95) });
  page.drawText(s('Nome'), { x: margin + 4, y, size: 8, font: fontBold, color: darkGray });
  page.drawText(s('Funcao'), { x: 140, y, size: 8, font: fontBold, color: darkGray });
  page.drawText(s('ISA-95'), { x: 310, y, size: 8, font: fontBold, color: darkGray });
  page.drawText(s('Estado'), { x: 420, y, size: 8, font: fontBold, color: darkGray });
  y -= 16;

  for (const [nome, funcao, isa, estado] of personas) {
    page.drawText(s(nome), { x: margin + 4, y, size: 8, font: fontBold, color: black });
    page.drawText(s(funcao), { x: 140, y, size: 8, font, color: black });
    page.drawText(s(isa), { x: 310, y, size: 8, font: mono, color: darkGray });
    const estadoColor = estado.includes('URGENTE') ? red : estado.includes('Existe') ? yellow : estado.includes('EM PRODUCAO') || estado.includes('DB pronta') ? green : gray;
    page.drawText(s(estado), { x: 420, y, size: 8, font, color: estadoColor });
    y -= 14;
  }

  y -= 20;
  page.drawText(s('AUTONOMOUS AGENTS -- 10'), { x: margin, y, size: 12, font: fontBold, color: orange });
  y -= 20;

  // Table header
  page.drawRectangle({ x: margin, y: y - 2, width: W - 2 * margin, height: 14, color: rgb(0.95, 0.95, 0.95) });
  page.drawText(s('Agente'), { x: margin + 4, y, size: 8, font: fontBold, color: darkGray });
  page.drawText(s('ISA-95'), { x: 250, y, size: 8, font: fontBold, color: darkGray });
  page.drawText(s('ADR'), { x: 370, y, size: 8, font: fontBold, color: darkGray });
  page.drawText(s('Estado'), { x: 430, y, size: 8, font: fontBold, color: darkGray });
  y -= 16;

  const agents = [
    ['Roteador', 'Transversal', '--', 'Por fazer'],
    ['Documental', 'Nivel 3 MES', '--', 'URGENTE'],
    ['QMS', 'Nivel 3 MES', '--', 'Por fazer'],
    ['Stock', 'Nivel 3 MES', 'ADR-007', 'Por fazer'],
    ['Manutencao', 'Nivel 3 MES', '--', 'Por fazer'],
    ['KPIs', 'Transversal', '--', 'Por fazer'],
    ['Compliance', 'Transversal', 'ADR-006', 'Por fazer'],
    ['Inteligencia de Marcas', 'Nivel 4 ERP', 'ADR-016', 'Por fazer'],
    ['Research', 'Transversal', 'ADR-022', 'FUNCIONAL'],
    ['FEA', 'Nivel 3 MES', 'ADR-024', 'Depende RAG'],
  ];

  for (const [nome, isa, adr, estado] of agents) {
    page.drawText(s(nome), { x: margin + 4, y, size: 8, font: fontBold, color: black });
    page.drawText(s(isa), { x: 250, y, size: 8, font: mono, color: darkGray });
    page.drawText(s(adr), { x: 370, y, size: 8, font: mono, color: darkGray });
    const c = estado === 'FUNCIONAL' ? green : estado === 'URGENTE' ? red : gray;
    page.drawText(s(estado), { x: 430, y, size: 8, font, color: c });
    y -= 14;
  }

  y -= 20;
  page.drawText(s('CHAT TOOLS -- 17 OPERACIONAIS'), { x: margin, y, size: 12, font: fontBold, color: orange });
  y -= 18;

  const tools = [
    'consultar_tarefas', 'estado_obra', 'iniciar_timer', 'parar_timer',
    'concluir_fase', 'adicionar_nota', 'listar_obras', 'registar_ausencia',
    'consultar_ausencias', 'verificar_documentacao', 'receber_veiculo', 'ver_parque',
    'criar_lead', 'gerar_termo_responsabilidade', 'gerar_checklist_entrega',
    'criar_tarefa_research', 'listar_tarefas_research',
  ];

  let tx = margin;
  for (const tool of tools) {
    const tw = mono.widthOfTextAtSize(tool, 7) + 10;
    if (tx + tw > W - margin) { tx = margin; y -= 14; }
    page.drawRectangle({ x: tx, y: y - 3, width: tw, height: 12, color: rgb(0.92, 0.98, 0.92), borderColor: rgb(0.5, 0.8, 0.5), borderWidth: 0.5 });
    page.drawText(s(tool), { x: tx + 5, y: y - 1, size: 7, font: mono, color: rgb(0.1, 0.5, 0.2) });
    tx += tw + 4;
  }

  page.drawText(s('CSN Opus -- Controlo de Sistema v8'), { x: margin, y: 40, size: 8, font, color: gray });
  page.drawText(s('Pagina 2/4'), { x: W - margin - 50, y: 40, size: 8, font, color: gray });

  // ===== PAGE 3: AGENTE RESEARCH + MIGRATIONS =====
  page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: orange });
  y = H - 50;

  page.drawText(s('AGENTE RESEARCH -- FUNCIONAL (ADR-022)'), { x: margin, y, size: 12, font: fontBold, color: green });
  y -= 20;

  const researchSteps = [
    ['Migration 014 research_tasks', 'DONE'],
    ['Pasta _research/ estrutura', 'DONE'],
    ['API /api/research CRUD', 'DONE'],
    ['Motor research-agent.ts', 'DONE'],
    ['Chat tools integracao', 'DONE'],
    ['Teste RT-2026-001 MAN', 'DONE'],
  ];

  for (const [step, status] of researchSteps) {
    const dot = status === 'DONE' ? green : red;
    page.drawRectangle({ x: margin, y: y - 3, width: 8, height: 8, color: dot });
    page.drawText(s(step), { x: margin + 14, y, size: 9, font, color: black });
    page.drawText(s(status), { x: 350, y, size: 9, font: monoBold, color: dot });
    y -= 16;
  }

  y -= 10;
  page.drawText(s('RT-2026-001: MAN TGS/TGM bodybuilder guidelines'), { x: margin, y, size: 9, font: fontBold, color: black });
  y -= 14;
  page.drawText(s('34 fontes consultadas | 10 acedidas | 2 findings'), { x: margin, y, size: 8, font, color: darkGray });
  y -= 12;
  page.drawText(s('Nota: Portal MAN requer registo como bodybuilder autorizado'), { x: margin, y, size: 8, font, color: red });

  y -= 30;
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: lightGray });
  y -= 20;

  page.drawText(s('MIGRATIONS -- 15 EXISTENTES + 8 PENDENTES'), { x: margin, y, size: 12, font: fontBold, color: orange });
  y -= 20;

  page.drawRectangle({ x: margin, y: y - 2, width: W - 2 * margin, height: 14, color: rgb(0.95, 0.95, 0.95) });
  page.drawText(s('Migration'), { x: margin + 4, y, size: 8, font: fontBold, color: darkGray });
  page.drawText(s('Tabelas'), { x: 140, y, size: 8, font: fontBold, color: darkGray });
  page.drawText(s('Estado'), { x: 470, y, size: 8, font: fontBold, color: darkGray });
  y -= 16;

  const migrations = [
    ['001-013', 'Schema base + CRM + DMS + SGQ + Dossie', 'OK', green],
    ['014', 'research_tasks (Agente Research)', 'OK', green],
    ['015', 'fornecedores, faturas, notas_credito, recibos', 'URGENTE', red],
    ['016', 'nao_conformidades, wps, wpqr, cert. soldadores', 'Pendente', yellow],
    ['017', 'stocks, lotes_material, movimentos_stock', 'Pendente', yellow],
    ['018', 'equipamentos_csn, manutencao_plano, avarias', 'Pendente', yellow],
    ['019', 'marcas_veiculo, nomenclatura_marcas', 'Pendente', yellow],
    ['020', 'equipamentos_carrocaria, tipos_carrocaria', 'Pendente', yellow],
    ['021', 'colaboradores_rh, processamentos, recibos_vencimento', 'OK', green],
    ['022', 'sops, work_instructions, cadernos_montagem', 'Pendente', yellow],
    ['023', 'analises_fea', 'Pendente', yellow],
  ];

  for (const [num, tabelas, estado, cor] of migrations) {
    page.drawText(s(num), { x: margin + 4, y, size: 8, font: monoBold, color: black });
    page.drawText(s(tabelas), { x: 140, y, size: 8, font, color: black });
    page.drawText(s(estado), { x: 470, y, size: 8, font: fontBold, color: cor });
    y -= 14;
  }

  page.drawText(s('CSN Opus -- Controlo de Sistema v8'), { x: margin, y: 40, size: 8, font, color: gray });
  page.drawText(s('Pagina 3/4'), { x: W - margin - 50, y: 40, size: 8, font, color: gray });

  // ===== PAGE 4: PRONTIDAO AUDITORIA + PENDENTES =====
  page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: orange });
  y = H - 50;

  page.drawText(s('PRONTIDAO PARA AUDITORIA'), { x: margin, y, size: 12, font: fontBold, color: orange });
  y -= 20;

  const audits = [
    ['ISO 9001:2015', '15%', yellow],
    ['EN 1090-1/-2 + CE', '5%', red],
    ['Reg. 2018/858 + COC', '40%', yellow],
    ['EN ISO 3834-3', '5%', red],
    ['EN 12642 L/XL', '0%', red],
  ];

  for (const [norm, pct, cor] of audits) {
    page.drawText(s(norm), { x: margin + 4, y, size: 9, font: fontBold, color: black });
    page.drawText(s(pct), { x: 350, y, size: 14, font: fontBold, color: cor });
    y -= 18;
  }

  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: lightGray });
  y -= 20;

  page.drawText(s('PENDENTES -- POR ORDEM DE PRIORIDADE'), { x: margin, y, size: 12, font: fontBold, color: orange });
  y -= 20;

  const pendentes = [
    ['P1', 'Migration 015 -- ERP light (faturas, fornecedores)', red],
    ['P2', 'Carolina -- persona chat + tools RH dedicados', red],
    ['P3', 'Agente Documental', red],
    ['P4', 'Reescrever gerar-termo', red],
    ['P5', 'Migration 019 -- CSN Brain (marcas_veiculo)', yellow],
    ['P6', 'Funcao calcular_box_rules()', yellow],
    ['P7', 'Pagina Gestao de OTs', yellow],
    ['P8', 'COC Electronico IMT -- deadline Jul 2026', yellow],
    ['P9', 'Luisa -- Assistente CEO', gray],
    ['P10', 'Fernando -- migrar Sr. Manuel', gray],
    ['P11', 'Knowledge Base Nastran para Agente FEA', gray],
    ['P12', 'Registar CSN nos portais MAN, DAF, Iveco', gray],
  ];

  for (const [num, desc, cor] of pendentes) {
    page.drawRectangle({ x: margin, y: y - 3, width: 4, height: 10, color: cor });
    page.drawText(s(num), { x: margin + 10, y, size: 8, font: monoBold, color: darkGray });
    page.drawText(s(desc), { x: margin + 40, y, size: 8, font, color: black });
    y -= 14;
  }

  y -= 30;
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: lightGray });
  y -= 16;
  page.drawText(s('Gerado automaticamente pelo CSN Opus -- 27/03/2026 00:30 WET'), { x: margin, y, size: 8, font, color: gray });

  page.drawText(s('CSN Opus -- Controlo de Sistema v8'), { x: margin, y: 40, size: 8, font, color: gray });
  page.drawText(s('Pagina 4/4'), { x: W - margin - 50, y: 40, size: 8, font, color: gray });

  // Save
  const bytes = await doc.save();
  writeFileSync('docs/CSN-Controlo-Sistema-v8.pdf', bytes);
  console.log('PDF generated: docs/CSN-Controlo-Sistema-v8.pdf');
}

generatePDF().catch(console.error);
