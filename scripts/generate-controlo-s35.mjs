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
const blue = rgb(0.114, 0.306, 0.847);
const black = rgb(0, 0, 0);

function s(text) {
  return text
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u00B7/g, '.')
    .replace(/\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2018/g, "'")
    .replace(/\u00BA/g, 'o')
    .replace(/\u00E7/g, 'c')
    .replace(/\u00E3/g, 'a')
    .replace(/\u00E9/g, 'e')
    .replace(/\u00ED/g, 'i')
    .replace(/\u00F3/g, 'o')
    .replace(/\u00FA/g, 'u')
    .replace(/\u00E1/g, 'a')
    .replace(/\u00EA/g, 'e')
    .replace(/\u00F5/g, 'o')
    .replace(/\u00E2/g, 'a')
    .replace(/\u00C7/g, 'C')
    .replace(/[^\x00-\xFF]/g, '');
}

function drawTableHeader(page, y, cols, font, fontBold) {
  page.drawRectangle({ x: 50, y: y - 2, width: 495, height: 14, color: rgb(0.95, 0.95, 0.95) });
  for (const [label, x] of cols) {
    page.drawText(s(label), { x, y, size: 8, font: fontBold, color: darkGray });
  }
  return y - 16;
}

async function generatePDF() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const monoBold = await doc.embedFont(StandardFonts.CourierBold);

  const W = 595;
  const H = 842;
  const m = 50;

  // ===== PAGE 1: COVER =====
  let page = doc.addPage([W, H]);
  let y = H - 80;

  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: orange });

  page.drawText(s('CSN TECHNIC'), { x: m, y, size: 10, font: monoBold, color: orange });
  y -= 30;
  page.drawText(s('Controlo de Sistema'), { x: m, y, size: 28, font: fontBold, color: black });
  y -= 22;
  page.drawText(s('OPUS S35 -- 02 Abril 2026'), { x: m, y, size: 14, font, color: gray });
  y -= 12;
  page.drawText(s('Commit HEAD: 6b97a60'), { x: m, y, size: 10, font: mono, color: darkGray });
  y -= 40;

  page.drawLine({ start: { x: m, y }, end: { x: W - m, y }, thickness: 1, color: lightGray });
  y -= 30;

  const info = [
    ['Sistema interno', 'CSN Opus'],
    ['Produto comercial', 'CSN Brain'],
    ['Marca corporativa', 'CSN Technic -- Commercial Vehicle Engineering'],
    ['URL', 'https://csn-producao.vercel.app'],
    ['Stack', 'Next.js 16 + Supabase + Claude API + Vercel'],
    ['Tabelas Supabase', '37'],
    ['Migrations', '24'],
    ['ADRs', '31 (+ ADR-031 Interface Departamental)'],
    ['Agentes nucleus', '11'],
    ['Emails indexados', '18.169'],
    ['Documentos Storage', '3.333 PDFs'],
    ['Skills criados', '3 (SKILL-GUIDE + REGISTRY + _global)'],
    ['Chat Tools', '17 operacionais'],
    ['Routes API', '32+'],
  ];

  for (const [label, value] of info) {
    page.drawText(s(label), { x: m, y, size: 9, font: monoBold, color: darkGray });
    page.drawText(s(value), { x: 220, y, size: 9, font, color: black });
    y -= 16;
  }

  y -= 20;
  page.drawLine({ start: { x: m, y }, end: { x: W - m, y }, thickness: 1, color: lightGray });
  y -= 25;

  page.drawText(s('EMPRESA'), { x: m, y, size: 9, font: monoBold, color: orange });
  y -= 18;
  const empresa = [
    ['Nome legal', 'Carlos dos Santos Nascimento, Lda'],
    ['NIF', '500 861 790'],
    ['Morada', 'Rua da Industria n 8, Casal do Rodo, 2640-216 Encarnacao'],
    ['CEO', 'Duarte da Cunha Martins Bustorff-Silva'],
    ['Certidao', '3172-1374-8252'],
  ];
  for (const [label, value] of empresa) {
    page.drawText(s(label), { x: m, y, size: 9, font: monoBold, color: darkGray });
    page.drawText(s(value), { x: 220, y, size: 9, font, color: black });
    y -= 16;
  }

  page.drawText(s('CSN Opus -- Every build. Documented. Certified. Traceable.'), { x: m, y: 40, size: 8, font, color: gray });
  page.drawText(s('Pagina 1/4'), { x: W - m - 50, y: 40, size: 8, font, color: gray });

  // ===== PAGE 2: SKILL REGISTRY + TOOLS =====
  page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: orange });
  y = H - 50;

  page.drawText(s('SKILL REGISTRY -- Anthropic Agent Skills Standard'), { x: m, y, size: 12, font: fontBold, color: green });
  y -= 20;

  const skills = [
    ['SKILL-GUIDE.md', 'Transversal', 'activo', 'Guia criacao skills e tools'],
    ['REGISTRY.md', 'Transversal', 'activo', 'Log permanente skills e tools'],
    ['_global/SKILL.md', 'Transversal', 'activo', 'Contexto CSN, ISA-95, normas'],
    ['producao/SKILL.md', 'L3-PRD', 'S36', 'Obras, fases, KPIs, timer'],
    ['rh/SKILL.md', 'L3-PER', 'S36', 'Recibos, ferias, CITs'],
    ['financeiro/SKILL.md', 'L4-FIN', 'S36', 'e-Fatura, conta corrente'],
    ['comercial/SKILL.md', 'L4-COM', 'S36', 'Leads, DAVs, orcamentos'],
    ['engenharia/SKILL.md', 'L4-ENG', 'S36', 'COC, DoP, CE marking'],
    ['qualidade/SKILL.md', 'L3-QMS', 'S36', 'EN 1090, EN ISO 3834'],
    ['manutencao/SKILL.md', 'L3-MNT', 'S36', 'Bodor, Fronius, ciclos MNT'],
    ['inventario/SKILL.md', 'L3-INV', 'S36', 'Materiais, lotes, consumos'],
    ['fornecedores/chagas/', 'L3-DOC', 'S36', 'Chagas -- aco e perfis'],
    ['fornecedores/dhollandia/', 'L3-DOC', 'S36', 'Dhollandia -- tail lifts'],
  ];

  y = drawTableHeader(page, y, [['Skill', m + 4], ['ISA-95', 250], ['Estado', 340], ['Descricao', 400]], font, fontBold);

  for (const [nome, isa, estado, desc] of skills) {
    page.drawText(s(nome), { x: m + 4, y, size: 7.5, font: mono, color: black });
    page.drawText(s(isa), { x: 250, y, size: 7.5, font: mono, color: darkGray });
    const cor = estado === 'activo' ? green : blue;
    page.drawText(s(estado), { x: 340, y, size: 7.5, font: fontBold, color: cor });
    page.drawText(s(desc), { x: 400, y, size: 7.5, font, color: black });
    y -= 13;
  }

  y -= 20;
  page.drawText(s('TOOLS -- API ROUTES (32+)'), { x: m, y, size: 12, font: fontBold, color: orange });
  y -= 20;

  y = drawTableHeader(page, y, [['Rota', m + 4], ['ISA-95', 230], ['Acesso', 310], ['Estado', 370], ['Descricao', 420]], font, fontBold);

  const tools = [
    ['/api/timer/iniciar', 'L3-PRD', 'escrita', 'activo', 'Inicia timer'],
    ['/api/timer/parar', 'L3-PRD', 'escrita', 'activo', 'Para timer'],
    ['/api/timer/foto-fase', 'L3-PRD', 'escrita', 'activo', 'Upload foto fase'],
    ['/api/obras', 'L3-PRD', 'leitura', 'activo', 'Lista obras activas'],
    ['/api/kpis/worker', 'L3-PRD', 'leitura', 'activo', 'KPIs ISO 22400'],
    ['/api/rh/recibos', 'L3-PER', 'leitura', 'activo', 'Recibos colaborador'],
    ['/api/rh/declaracao', 'L3-PER', 'leitura', 'activo', 'Declaracao art. 119'],
    ['/api/roteador', 'L3-DOC', 'escrita', 'activo', 'Classifica doc Claude'],
    ['/api/faturacao/emitir', 'L4-FIN', 'escrita', 'activo', 'Emite fatura IX'],
    ['/api/faturacao/listar', 'L4-FIN', 'leitura', 'activo', 'Lista faturas IX'],
    ['/api/fornecedores/cc', 'L4-FIN', 'leitura', 'activo', 'Conta corrente NIF'],
    ['/api/mnt/001..004', 'L3-MNT', 'escrita', 'activo', 'Ciclos manutencao'],
    ['/api/embeddings', 'L3-DOC', 'escrita', 'S36', 'RAG pgvector'],
    ['/api/whatsapp/webhook', 'Fronteira', 'escrita', 'S36', 'Canal WhatsApp'],
    ['/api/telegram/webhook', 'Fronteira', 'escrita', 'S36', 'Canal Telegram'],
  ];

  for (const [rota, isa, acesso, estado, desc] of tools) {
    page.drawText(s(rota), { x: m + 4, y, size: 7, font: mono, color: black });
    page.drawText(s(isa), { x: 230, y, size: 7, font: mono, color: darkGray });
    const acCor = acesso === 'escrita' ? rgb(0.99, 0.65, 0.65) : rgb(0.49, 0.83, 0.99);
    page.drawText(s(acesso), { x: 310, y, size: 7, font, color: acCor });
    const estCor = estado === 'activo' ? green : blue;
    page.drawText(s(estado), { x: 370, y, size: 7, font: fontBold, color: estCor });
    page.drawText(s(desc), { x: 420, y, size: 7, font, color: black });
    y -= 12;
  }

  y -= 20;
  // ADR-031 highlight
  page.drawRectangle({ x: m, y: y - 5, width: W - 2 * m, height: 28, color: rgb(0.95, 0.92, 0.88), borderColor: orange, borderWidth: 1 });
  page.drawText(s('ADR-031: Interface Departamental -- Regra de Ouro'), { x: m + 8, y: y + 8, size: 9, font: fontBold, color: orange });
  page.drawText(s('Interfaces raciocinam e comunicam. Nunca escrevem no nucleo. Roteador = unico ponto de entrada.'), { x: m + 8, y: y - 2, size: 8, font, color: darkGray });

  page.drawText(s('CSN Opus -- Controlo OPUS S35'), { x: m, y: 40, size: 8, font, color: gray });
  page.drawText(s('Pagina 2/4'), { x: W - m - 50, y: 40, size: 8, font, color: gray });

  // ===== PAGE 3: AGENTS + ARCHITECTURE =====
  page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: orange });
  y = H - 50;

  page.drawText(s('AGENTES NUCLEUS -- 11'), { x: m, y, size: 12, font: fontBold, color: orange });
  y -= 20;

  y = drawTableHeader(page, y, [['Agente', m + 4], ['ISA-95', 230], ['ADR', 340], ['Estado', 420]], font, fontBold);

  const agents = [
    ['Roteador', 'Transversal', 'ADR-031', 'ACTIVO'],
    ['Documental', 'Nivel 3 MES', '--', 'Por fazer'],
    ['QMS', 'Nivel 3 MES', '--', 'Por fazer'],
    ['Stock', 'Nivel 3 MES', 'ADR-007', 'Por fazer'],
    ['Manutencao', 'Nivel 3 MES', '--', 'Por fazer'],
    ['KPIs', 'Transversal', '--', 'Por fazer'],
    ['Compliance', 'Transversal', 'ADR-006', 'Por fazer'],
    ['Inteligencia Marcas', 'Nivel 4 ERP', 'ADR-016', 'Por fazer'],
    ['Research', 'Transversal', 'ADR-022', 'FUNCIONAL'],
    ['FEA', 'Nivel 3 MES', 'ADR-024', 'Depende RAG'],
    ['Carolina (RH)', 'Nivel 4 ERP', 'ADR-020', 'EM PRODUCAO'],
  ];

  for (const [nome, isa, adr, estado] of agents) {
    page.drawText(s(nome), { x: m + 4, y, size: 8, font: fontBold, color: black });
    page.drawText(s(isa), { x: 230, y, size: 8, font: mono, color: darkGray });
    page.drawText(s(adr), { x: 340, y, size: 8, font: mono, color: darkGray });
    const c = estado === 'FUNCIONAL' || estado === 'ACTIVO' ? green : estado === 'EM PRODUCAO' ? yellow : estado.includes('Depende') ? blue : gray;
    page.drawText(s(estado), { x: 420, y, size: 8, font, color: c });
    y -= 14;
  }

  y -= 25;
  page.drawText(s('ARQUITECTURA ISA-95 -- 3 CAMADAS'), { x: m, y, size: 12, font: fontBold, color: orange });
  y -= 20;

  const layers = [
    ['Camada 1 -- Exterior', 'Clientes, fornecedores, colaboradores, canais (email, WhatsApp, Telegram)', gray],
    ['Camada 2 -- Fronteira', 'Roteador Externo + Interfaces Departamentais (read-only dashboards)', yellow],
    ['Camada 3 -- Nucleo ISA-95', 'L4-BPL + L3-MOM + L2-SUP + L1-SEN + L0-PHY + Supabase + Storage', red],
  ];

  for (const [nome, desc, cor] of layers) {
    page.drawRectangle({ x: m, y: y - 5, width: 4, height: 14, color: cor });
    page.drawText(s(nome), { x: m + 12, y, size: 9, font: fontBold, color: black });
    y -= 14;
    page.drawText(s(desc), { x: m + 12, y, size: 8, font, color: darkGray });
    y -= 18;
  }

  y -= 15;
  page.drawText(s('RAG -- RETRIEVAL AUGMENTED GENERATION (S36)'), { x: m, y, size: 10, font: fontBold, color: yellow });
  y -= 16;
  const ragLines = [
    '18.169 emails + 3.333 PDFs no Storage',
    'Embeddings pgvector -- migration 025 (tabela embeddings)',
    'Skills enriquecidos com documentos reais por fornecedor/departamento',
    'Fluxo: PDF -> Storage -> embedding -> pesquisa semantica -> skill carregado',
  ];
  for (const line of ragLines) {
    page.drawText(s('  . ' + line), { x: m, y, size: 8, font, color: darkGray });
    y -= 13;
  }

  y -= 20;
  page.drawText(s('PRONTIDAO PARA AUDITORIA'), { x: m, y, size: 10, font: fontBold, color: orange });
  y -= 18;

  const audits = [
    ['ISO 9001:2015', 'Controlo docs OK, SGQ 25%', yellow],
    ['ISO 22400 KPIs', '5/38 calculaveis, 7/38 parciais', yellow],
    ['EN 1090-1/-2 + CE', 'COC parcial, WPS/WPQR por criar', red],
    ['COC Electronico IMT', 'Deadline Jul 2026, por implementar', red],
  ];

  for (const [norm, estado, cor] of audits) {
    page.drawRectangle({ x: m, y: y - 3, width: 4, height: 10, color: cor });
    page.drawText(s(norm), { x: m + 12, y, size: 8, font: fontBold, color: black });
    page.drawText(s(estado), { x: 240, y, size: 8, font, color: darkGray });
    y -= 14;
  }

  page.drawText(s('CSN Opus -- Controlo OPUS S35'), { x: m, y: 40, size: 8, font, color: gray });
  page.drawText(s('Pagina 3/4'), { x: W - m - 50, y: 40, size: 8, font, color: gray });

  // ===== PAGE 4: PENDENTES + COMMITS =====
  page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: orange });
  y = H - 50;

  page.drawText(s('COMMITS S35'), { x: m, y, size: 12, font: fontBold, color: orange });
  y -= 20;

  y = drawTableHeader(page, y, [['Commit', m + 4], ['Descricao', 150]], font, fontBold);

  const commits = [
    ['25d82aa', 'feat: script upload emails_indice para Supabase'],
    ['d4690d5', 'feat: script upload PDFs emails_indice para Storage + tabela documentos'],
    ['f5a5cfd', 'docs: diagrama KPIs ISA-95 completo S35'],
    ['6b97a60', 'docs: fecho S35 -- arquitectura + skills-tools registry + SKILL-GUIDE + global skill'],
  ];

  for (const [hash, desc] of commits) {
    page.drawText(s(hash), { x: m + 4, y, size: 8, font: monoBold, color: blue });
    page.drawText(s(desc), { x: 150, y, size: 8, font, color: black });
    y -= 14;
  }

  y -= 25;
  page.drawText(s('PENDENTES IMEDIATOS -- S36'), { x: m, y, size: 12, font: fontBold, color: orange });
  y -= 20;

  const pendentes = [
    ['P1', 'RAG -- migration 025 pgvector + tabela embeddings', red],
    ['P2', 'Skill producao/SKILL.md -- obras, fases, timer, KPIs', red],
    ['P3', 'Skill rh/SKILL.md -- recibos, ferias, CITs', red],
    ['P4', 'Skill fornecedores/chagas/ -- aco e perfis', yellow],
    ['P5', 'Tools docs: tools/_global/ (supabase, storage, auth)', yellow],
    ['P6', '/api/embeddings endpoint (L3-DOC)', yellow],
    ['P7', '/api/whatsapp/webhook (Fronteira)', yellow],
    ['P8', '/api/telegram/webhook (Fronteira)', yellow],
  ];

  for (const [num, desc, cor] of pendentes) {
    page.drawRectangle({ x: m, y: y - 3, width: 4, height: 10, color: cor });
    page.drawText(s(num), { x: m + 10, y, size: 8, font: monoBold, color: darkGray });
    page.drawText(s(desc), { x: m + 40, y, size: 8, font, color: black });
    y -= 14;
  }

  y -= 25;
  page.drawText(s('PENDENTES HERDADOS'), { x: m, y, size: 12, font: fontBold, color: orange });
  y -= 20;

  const herdados = [
    ['Ciclo obra: COC, DoP, CE marking, invoice, dossier'],
    ['CIT Jose Julio -- criar ausencia associada'],
    ['Apagar src/app/portal/ duplicado'],
    ['Recibos 2023-2024 (fechar periodo completo)'],
    ['Bodor laser smart meter (ISO 50001 / ISO 22400 KPIs 35-38)'],
    ['COC Electronico IMT -- deadline Jul 2026'],
    ['Manuais Bodor (chapa e tubo) -- PDFs por obter'],
  ];

  for (const [desc] of herdados) {
    page.drawText(s('  . ' + desc), { x: m, y, size: 8, font, color: darkGray });
    y -= 13;
  }

  y -= 30;
  page.drawLine({ start: { x: m, y }, end: { x: W - m, y }, thickness: 1, color: lightGray });
  y -= 16;
  page.drawText(s('Gerado automaticamente pelo CSN Opus -- 02/04/2026 WET'), { x: m, y, size: 8, font, color: gray });

  page.drawText(s('CSN Opus -- Controlo OPUS S35'), { x: m, y: 40, size: 8, font, color: gray });
  page.drawText(s('Pagina 4/4'), { x: W - m - 50, y: 40, size: 8, font, color: gray });

  // Save
  const bytes = await doc.save();
  writeFileSync('docs/CSN-Controlo-OPUS-S35.pdf', bytes);
  console.log('PDF generated: docs/CSN-Controlo-OPUS-S35.pdf');
}

generatePDF().catch(console.error);
