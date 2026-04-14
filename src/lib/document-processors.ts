// src/lib/document-processors.ts
// CSN-L3-DOC — Agente Documental: funções extractoras partilhadas
// Ponto único de processamento documental — todas as entradas convergem aqui
// ISA-95 Level: L3-MOM/DOC

import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'

// ========== TYPES ==========

export interface ProcessResult {
  tipo: string
  classificacao: string
  dados: Record<string, unknown>
  tabela_destino: string | null
  registo_id: string | number | null
  documento_id: number | null
  mensagem: string
  erro?: string
}

interface ContentBlock {
  type: 'document'
  source: { type: 'base64'; media_type: 'application/pdf'; data: string }
}

// ========== PROMPTS ==========

const CLASSIFY_AND_EXTRACT_PROMPT = `Analisa este documento recebido pela CSN (fabricante de carroçarias para veículos comerciais, Mafra, Portugal).

PASSO 1 — CLASSIFICA o documento numa destas categorias:
- factura_fornecedor: factura/recibo de compra a fornecedor
- nota_credito_fornecedor: nota de crédito emitida por fornecedor (devolução/correcção)
- orcamento_fornecedor: orçamento/proposta de fornecedor (SEM compromisso de compra)
- fatura_recibo_fornecedor: fatura-recibo de fornecedor
- certificado_material_31: certificado de material EN 10204 3.1
- cit: certificado de incapacidade temporária (baixa médica)
- dav: declaração aduaneira de veículo (cabeçalho AT — Autoridade Tributária)
- fam: folha de aprovação de modelo (cabeçalho IMT)
- nota_encomenda: nota de encomenda / requisição de cliente (compra firme)
- coc: certificado de conformidade de veículo
- inspecao: relatório de inspecção automóvel
- guia_transporte: guia de transporte/remessa
- recibo_vencimento: recibo de vencimento/salário
- outro: documento não classificável

PASSO 2 — EXTRAI metadados gerais (para TODOS os documentos):
- entidade_nome: nome da empresa/pessoa que emitiu
- entidade_nif: NIF do emitente
- data_documento: data do documento (YYYY-MM-DD)
- numero_documento: número/referência do documento
- valor_total: valor total se aplicável
- resumo: frase curta descrevendo o conteúdo

PASSO 3 — Se for factura_fornecedor, nota_credito_fornecedor, fatura_recibo_fornecedor ou orcamento_fornecedor, extrai TAMBÉM:
- numero: número da factura/NC/orçamento
- data: data (YYYY-MM-DD)
- nif_emitente: NIF do fornecedor
- nome_emitente: nome do fornecedor
- base_tributavel: valor sem IVA
- iva: valor do IVA
- total: valor total com IVA
- atcud: código ATCUD se visível
- factura_referencia: para NC, número da factura original
- linhas: array de objectos com:
  - referencia: código artigo do fornecedor (se existir)
  - descricao: descrição do artigo/serviço
  - quantidade: quantidade
  - unidade: unidade (kg, un, m, m2, etc)
  - preco_unitario: preço unitário sem IVA
  - desconto_pct: percentagem de desconto (0 se sem desconto)
  - valor_linha: valor da linha sem IVA
  - taxa_iva: taxa de IVA aplicada (23, 13, 6, 0)

Responde APENAS com JSON:
{"classificacao":"...","geral":{...},"especifico":{...}}`

const DAV_PROMPT = `Analisa este documento. É uma Declaração Aduaneira de Veículo (DAV) portuguesa.
Extrai TODOS os campos em JSON com a seguinte estrutura:
{
  "numero_dav": "...", "data_aceitacao": "YYYY-MM-DD", "versao": null, "revisao": null,
  "data_documento": "YYYY-MM-DD", "regime_isv": "...", "numero_referencia": "...",
  "operador_nif": "...", "operador_nome": "...",
  "proprietario_tipo_id": "...", "proprietario_nif": "...", "proprietario_nome": "...",
  "proprietario_morada": "...", "proprietario_localidade": "...",
  "proprietario_cod_postal": "...", "proprietario_pais": "...",
  "declarante_qualidade": "...", "declarante_nif_representante": "...",
  "declarante_nif_sociedade": "...", "declarante_tipo_id": "...",
  "declarante_nif": "...", "declarante_nome": "...",
  "cod_homologacao": "...", "categoria_veiculo": "...", "tipo_veiculo_imt": "...",
  "tipo_veiculo_fiscal": "...", "marca": "...", "modelo": "...",
  "variante": "...", "versao_modelo": "...", "designacao_comercial": "...",
  "peso_bruto": null, "tara": null, "combustivel": "...", "cor": "...",
  "tipo_caixa": "...", "vin": "...", "numero_motor": "...", "numero_lugares": null,
  "cilindrada": null, "eixos_motores": "...", "comprimento_caixa": null,
  "altura_minima_caixa": null, "antepara_caixa": "...",
  "tipo_testes_co2": "...", "emissao_co2": null, "emissao_particulas": null,
  "caixa_velocidades": "...",
  "veiculo_estado": "...", "pais_procedencia": "...", "quilometros": null,
  "data_entrada_territorio": "YYYY-MM-DD", "tipo_entrada": "...",
  "termo_prazo_dav": "YYYY-MM-DD",
  "servico_emissor": "...", "matricula": "...", "data_matricula": "YYYY-MM-DD",
  "tabela_isv": "...", "total_isv": null
}
Se não conseguires ler algum campo, coloca null. Responde APENAS com JSON.`

const FAM_PROMPT = `Analisa este documento. É uma Folha de Aprovação de Modelo (FAM) portuguesa do IMT.
Extrai os campos principais em JSON. Presta especial atenção ao campo 50 (Anotações) pois contém limites legais de carroçamento.
{
  "numero_homologacao_nacional": "...", "extensao": "...",
  "numero_homologacao_ce": "...", "situacao": "...", "data_despacho": "YYYY-MM-DD",
  "campo_0_1_marca": "...", "campo_0_2_modelo": "...",
  "campo_0_2_1_designacao_comercial": "...", "campo_0_4_categoria": "...",
  "campo_0_5_fabricante": "...",
  "campo_3_distancia_entre_eixos": null,
  "campo_6_1_comprimento": null, "campo_7_1_largura": null, "campo_8_altura": null,
  "campo_12_1_tara_t": null, "campo_14_1_peso_bruto_total": null,
  "campo_24_cilindrada": null, "campo_25_combustivel": "...",
  "campo_37_tipo_caixa": "...",
  "campo_37_2_comprimento_exterior_max": null, "campo_37_2_comprimento_exterior_min": null,
  "campo_37_6_largura_exterior_max": null,
  "campo_42_1_lotacao_total": null,
  "campo_50_anotacoes": "texto completo das anotações"
}
Se não conseguires ler algum campo, coloca null. Responde APENAS com JSON.`

const CIT_PROMPT = `Analisa este documento. É um Certificado de Incapacidade Temporária para o Trabalho (CIT) português.
Extrai TODOS os campos em JSON:
{
  "tipo_cit": "inicial"|"prorrogacao",
  "numero_cit": "...",
  "data_inicio": "YYYY-MM-DD",
  "data_fim": "YYYY-MM-DD",
  "numero_dias": null,
  "motivo": "...",
  "medico_nome": "...",
  "medico_cedula": "...",
  "unidade_saude": "...",
  "nif_utente": "...",
  "nome_utente": "...",
  "nuss": "...",
  "situacao": "...",
  "classificacao": "DN"|"DD"|"T"|"AF"|"DP"|"AT"|"RC"|"IG"|null
}
Se não conseguires ler algum campo, coloca null. Responde APENAS com JSON.`

const INSPECAO_PROMPT = `Analisa este Relatório de Inspecção automóvel português.
Extrai TODOS os campos em JSON:
{
  "matricula": "XX-XX-XX",
  "data_inspecao": "YYYY-MM-DDTHH:mm:ss",
  "centro_inspecao": "...",
  "codigo_imt": "...",
  "linha": "...",
  "inspetor": "...",
  "peso_estatico_total": null,
  "peso_dinamico_total": null,
  "peso_estatico_eixo1_total": null,
  "peso_estatico_eixo1_esq": null,
  "peso_estatico_eixo1_dir": null,
  "peso_estatico_eixo2_total": null,
  "peso_estatico_eixo2_esq": null,
  "peso_estatico_eixo2_dir": null,
  "peso_dinamico_eixo1_total": null,
  "peso_dinamico_eixo1_esq": null,
  "peso_dinamico_eixo1_dir": null,
  "peso_dinamico_eixo2_total": null,
  "peso_dinamico_eixo2_esq": null,
  "peso_dinamico_eixo2_dir": null,
  "forca_travagem_servico": null,
  "eficiencia_travao_servico_estatica": null,
  "eficiencia_travao_servico_dinamica": null,
  "forca_travagem_estacionamento": null,
  "eficiencia_travao_estacionamento": null,
  "opacidade_k": null,
  "combustivel": "...",
  "ripometro_eixo1": null,
  "deficiencias": [{"codigo": "...", "designacao": "...", "tipo": 1}],
  "resultado": "aprovado|reprovado"
}
Se não conseguires ler algum campo, coloca null. Responde APENAS com JSON.`

// ========== PROMPTS ECOSSISTEMA — CHAGAS ==========

const CHAGAS_FACTURA_PROMPT = `Analisa esta factura do fornecedor CHAGAS (NIF 500117152) — distribuidora de aços.
Existem DOIS formatos: v1 (2024, guia remessa com zeros à esquerda tipo 0015432, 1 página) e v2 (2025+, guia remessa sem zeros tipo 15432, 2 páginas com linhas divididas entre páginas).

Extrai TODOS os dados em JSON com EXACTAMENTE esta estrutura:
{
  "formato": "v1"|"v2",
  "numero_factura": "...",
  "serie": "...",
  "data_emissao": "YYYY-MM-DD",
  "data_vencimento": "YYYY-MM-DD",
  "cliente_chagas": "...",
  "atcud": "...",
  "base_tributavel": 0.00,
  "iva": 0.00,
  "total": 0.00,
  "forma_pagamento": "...",
  "iban": "...",
  "linhas": [
    {
      "guia_remessa": "...",
      "data_guia": "YYYY-MM-DD",
      "referencia_encomenda": "...",
      "numero_linha_chagas": 1,
      "referencia_chagas": "...",
      "descricao": "...",
      "quantidade": 0.00,
      "unidade": "TO|CH|M|CAL|CA|VAR|UN",
      "preco_unitario": 0.00,
      "desconto_pct": 0.00,
      "valor_liquido": 0.00,
      "valor_com_imposto": 0.00,
      "taxa_iva": 23,
      "qualidade_aco": "S235JR|S275JR|Zincor|null",
      "dimensoes_mm": "espessura x largura x comprimento ou perfil"
    }
  ]
}

REGRAS CRÍTICAS:
- desconto_pct é POR LINHA, nunca global. Se a coluna "Desc" estiver vazia numa linha, é 0.
- unidade: TO=tonelada, CH=chapa, M=metro, CAL=calha, CA=cada, VAR=vários, UN=unidade
- qualidade_aco: extrair da descrição (S235JR, S275JR, Zincor, DD11, DC01, etc). null se não mencionado.
- dimensoes_mm: extrair da descrição (ex: "3x1250x2500", "60x60x3", "Ø42.4x2.6"). null se não aplicável.
- Cuidado com v2: linhas podem estar divididas entre páginas. Não duplicar nem perder linhas.
- Se houver múltiplas guias remessa na mesma factura, cada linha tem a SUA guia.
Responde APENAS com JSON, sem markdown.`

// ========== PROMPTS ECOSSISTEMA — PECOL ==========

const PECOL_FACTURA_PROMPT = `Analisa esta factura do fornecedor PECOL (NIF 501425527) — parafusaria e fixações.

Extrai TODOS os dados em JSON com EXACTAMENTE esta estrutura:
{
  "serie_numero": "25ALV/5328",
  "data_emissao": "YYYY-MM-DD",
  "data_vencimento": "YYYY-MM-DD",
  "condicoes_pagamento": "...",
  "cliente_pecol": "...",
  "guia_remessa": "...",
  "confirmacao_encomenda": "...",
  "encomenda_cliente": "...",
  "local_carga": "ALVERCA|ÁGUEDA|...",
  "local_descarga": "...",
  "portes": 0.00,
  "base_tributavel": 0.00,
  "iva": 0.00,
  "total": 0.00,
  "atcud": "...",
  "linhas": [
    {
      "codigo_pecol": "...",
      "codigo_cliente": "P222|...",
      "descricao": "...",
      "quantidade": 0.00,
      "unidade": "Ml|UN|CX|...",
      "preco_unitario": 0.00,
      "valor_liquido": 0.00,
      "taxa_iva": 23
    }
  ]
}

REGRAS CRÍTICAS:
- serie_numero: formato "25ALV/5328" ou similar. Extrair exactamente como aparece.
- Ml = milheiro = 1000 unidades. Manter "Ml" como unidade, NÃO converter.
- codigo_cliente pode ser "P222" ou outro código CSN atribuído pela Pecol.
- local_carga: normalmente ALVERCA ou ÁGUEDA.
Responde APENAS com JSON, sem markdown.`

// ========== NIF ROUTING MAP ==========

const NIF_ECOSSISTEMA: Record<string, { fornecedor: string; fornecedor_id: number }> = {
  '500117152': { fornecedor: 'chagas', fornecedor_id: 10 },
  '501425527': { fornecedor: 'pecol', fornecedor_id: 34 },
}

// ========== HELPERS ==========

function cleanJSON(raw: string): string {
  let s = raw.trim()
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/g, '')
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    s = s.substring(start, end + 1)
  }
  return s
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizarNIF(nif: string | null | undefined): string | null {
  if (!nif) return null
  return nif.replace(/[\s.\-\/]/g, '').replace(/^PT/i, '')
}

// ========== MAIN: processar documento ==========

export async function processarDocumento(
  pdfBase64: string,
  nomeArquivo: string,
  storagePath: string,
  fileUrl: string,
  contexto: { ticket_id?: string; remetente?: string; uploaded_by?: string },
  anthropic: Anthropic,
  supabase: SupabaseClient
): Promise<ProcessResult> {
  
  // --- PASSO 1: Classificar + extrair metadados gerais (Sonnet, 1 call) ---
  const fileContent: ContentBlock = {
    type: 'document',
    source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
  }

  let classificacao: string
  let geral: Record<string, unknown> = {}
  let especifico: Record<string, unknown> = {}

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          fileContent,
          { type: 'text', text: CLASSIFY_AND_EXTRACT_PROMPT },
        ],
      }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text).join('')

    const parsed = JSON.parse(cleanJSON(text))
    classificacao = parsed.classificacao || 'outro'
    geral = parsed.geral || {}
    especifico = parsed.especifico || {}
  } catch (err: any) {
    console.error('Erro classificação:', err)
    return {
      tipo: 'erro', classificacao: 'erro_classificacao',
      dados: {}, tabela_destino: null, registo_id: null, documento_id: null,
      mensagem: `Erro ao classificar ${nomeArquivo}`, erro: err.message,
    }
  }

  // --- PASSO 2: Registar em documentos (SEMPRE — camada geral) ---
  let documentoId: number | null = null
  try {
    // Procurar fornecedor por NIF
    let fornecedorId: number | null = null
    const nifEmitente = (geral.entidade_nif || especifico.nif_emitente) as string | null
    if (nifEmitente) {
      const { data: forn } = await supabase
        .from('fornecedores').select('id').eq('nif', nifEmitente).limit(1)
      if (forn && forn.length > 0) fornecedorId = forn[0].id
    }

    const { data: doc } = await supabase.from('documentos').insert({
      nome_ficheiro: nomeArquivo,
      url_ficheiro: fileUrl,
      storage_path: storagePath,
      origem: contexto.ticket_id ? 'email' : 'upload',
      tipo_documento: classificacao,
      entidade_nome: geral.entidade_nome || especifico.nome_emitente || null,
      entidade_nif: nifEmitente || null,
      fornecedor_id: fornecedorId,
      classificacao: { geral, especifico },
      agente: 'L3-DOC',
      estado: 'processado',
      processado: true,
      processado_em: new Date().toISOString(),
    }).select('id').single()

    documentoId = doc?.id || null
  } catch (err) {
    console.error('Erro registar documento:', err)
  }

  // --- PASSO 3: Camada específica (se aplicável) ---
  const tiposComExtractor = [
    'factura_fornecedor', 'nota_credito_fornecedor', 'fatura_recibo_fornecedor', 'orcamento_fornecedor',
    'dav', 'fam', 'cit', 'inspecao', 'certificado_material_31',
  ]

  if (!tiposComExtractor.includes(classificacao)) {
    return {
      tipo: classificacao, classificacao, dados: { geral, especifico },
      tabela_destino: 'documentos', registo_id: documentoId, documento_id: documentoId,
      mensagem: `Documento classificado como ${classificacao}. Registado em documentos.`,
    }
  }

  // --- Extractores específicos ---

  // FACTURA / NC / ORÇAMENTO / FATURA-RECIBO FORNECEDOR — routing por NIF
  if (['factura_fornecedor', 'nota_credito_fornecedor', 'fatura_recibo_fornecedor', 'orcamento_fornecedor'].includes(classificacao)) {
    const nifEmit = normalizarNIF((especifico.nif_emitente || geral.entidade_nif) as string | null)
    const eco = nifEmit ? NIF_ECOSSISTEMA[nifEmit] : null

    if (eco && ['factura_fornecedor', 'fatura_recibo_fornecedor'].includes(classificacao)) {
      if (eco.fornecedor === 'chagas') {
        return await processarFacturaChagas(pdfBase64, fileContent, fileUrl, storagePath, documentoId, contexto, anthropic, supabase)
      }
      if (eco.fornecedor === 'pecol') {
        return await processarFacturaPecol(pdfBase64, fileContent, fileUrl, storagePath, documentoId, contexto, anthropic, supabase)
      }
    }
    // Fallback genérico (NC, orçamentos, ou fornecedores sem ecossistema)
    return await processarDocumentoFornecedor(classificacao, especifico, geral, fileUrl, storagePath, documentoId, contexto, supabase)
  }

  // DAV — precisa de segundo call com prompt dedicado
  if (classificacao === 'dav') {
    return await processarDAV(pdfBase64, fileContent, fileUrl, documentoId, anthropic, supabase)
  }

  // FAM
  if (classificacao === 'fam') {
    return await processarFAM(pdfBase64, fileContent, fileUrl, documentoId, anthropic, supabase)
  }

  // CIT
  if (classificacao === 'cit') {
    return await processarCIT(pdfBase64, fileContent, fileUrl, nomeArquivo, documentoId, contexto, anthropic, supabase)
  }

  // INSPECAO
  if (classificacao === 'inspecao') {
    return await processarINSPECAO(pdfBase64, fileContent, fileUrl, nomeArquivo, documentoId, contexto, anthropic, supabase)
  }

  // CERTIFICADO MATERIAL 3.1
  if (classificacao === 'certificado_material_31') {
    return await processarCertMaterial(especifico, geral, fileUrl, documentoId, contexto, supabase)
  }

  return {
    tipo: classificacao, classificacao, dados: { geral, especifico },
    tabela_destino: 'documentos', registo_id: documentoId, documento_id: documentoId,
    mensagem: `Classificado como ${classificacao}. Sem extractor específico.`,
  }
}

// ========== DOCUMENTO FORNECEDOR (factura/NC/orçamento) ==========

async function processarDocumentoFornecedor(
  classificacao: string,
  especifico: Record<string, unknown>,
  geral: Record<string, unknown>,
  fileUrl: string,
  storagePath: string,
  documentoId: number | null,
  contexto: { ticket_id?: string },
  supabase: SupabaseClient
): Promise<ProcessResult> {
  
  const tipoMap: Record<string, string> = {
    factura_fornecedor: 'factura',
    nota_credito_fornecedor: 'nota_credito',
    fatura_recibo_fornecedor: 'fatura_recibo',
    orcamento_fornecedor: 'orcamento',
  }
  const tipo = tipoMap[classificacao] || 'factura'
  const nifEmitente = (especifico.nif_emitente || geral.entidade_nif) as string | null

  // Procurar fornecedor
  let fornecedorId: number | null = null
  if (nifEmitente) {
    const { data: forn } = await supabase
      .from('fornecedores').select('id').eq('nif', nifEmitente).limit(1)
    if (forn && forn.length > 0) fornecedorId = forn[0].id
  }

  // Match efatura por ATCUD
  let efaturaId: string | null = null
  const atcud = especifico.atcud as string | null
  if (atcud) {
    const { data: ef } = await supabase
      .from('efatura').select('id').eq('atcud', atcud).limit(1)
    if (ef && ef.length > 0) efaturaId = ef[0].id
  }

  // Dedup por ATCUD — se já existe, devolver sucesso (idempotente)
  if (atcud) {
    const { data: existing } = await supabase
      .from('documentos_fornecedor').select('id').eq('atcud', atcud).maybeSingle()
    if (existing) {
      return {
        tipo: classificacao, classificacao,
        dados: { geral, especifico, dedup: true },
        tabela_destino: 'documentos_fornecedor',
        registo_id: existing.id,
        documento_id: documentoId,
        mensagem: `${tipo} ${especifico.numero || '?'} já existe (ATCUD dedup)`,
      }
    }
  }

  // Inserir cabeçalho
  const { data: docForn, error: insertErr } = await supabase.from('documentos_fornecedor').insert({
    tipo,
    numero: especifico.numero || geral.numero_documento || null,
    data_documento: especifico.data || geral.data_documento || null,
    fornecedor_id: fornecedorId,
    nif_emitente: nifEmitente,
    nome_emitente: (especifico.nome_emitente || geral.entidade_nome) as string | null,
    base_tributavel: especifico.base_tributavel as number | null,
    iva: especifico.iva as number | null,
    total: especifico.total as number | null,
    atcud: atcud,
    efatura_id: efaturaId,
    documento_id: documentoId,
    url_ficheiro: fileUrl,
    storage_path: storagePath,
    dados_raw: especifico,
    factura_referencia: especifico.factura_referencia as string | null,
  }).select('id').single()

  if (insertErr || !docForn) {
    console.error('Erro inserir documento_fornecedor:', insertErr)
    return {
      tipo: classificacao, classificacao, dados: { geral, especifico },
      tabela_destino: 'documentos_fornecedor', registo_id: null, documento_id: documentoId,
      mensagem: `Erro ao inserir ${classificacao}`, erro: insertErr?.message,
    }
  }

  // Inserir linhas
  const linhas = (especifico.linhas || []) as Array<Record<string, unknown>>
  let linhasInseridas = 0

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]
    
    // Tentar match material por referência ou descrição
    let materialId: string | null = null
    if (l.referencia) {
      const { data: mat } = await supabase
        .from('materiais').select('id').eq('codigo', l.referencia).limit(1)
      if (mat && mat.length > 0) materialId = mat[0].id
    }

    const { error: lineErr } = await supabase.from('documentos_fornecedor_linhas').insert({
      documento_fornecedor_id: docForn.id,
      linha_num: i + 1,
      referencia: l.referencia || null,
      descricao: l.descricao || 'Sem descrição',
      quantidade: l.quantidade as number | null,
      unidade: l.unidade || null,
      preco_unitario: l.preco_unitario as number | null,
      desconto_pct: l.desconto_pct as number || 0,
      valor_linha: l.valor_linha as number | null,
      taxa_iva: l.taxa_iva as number | null,
      material_id: materialId,
    })

    if (!lineErr) linhasInseridas++

    // Criar movimento de stock se material match e tipo afecta stock
    if (materialId && (tipo === 'factura' || tipo === 'fatura_recibo')) {
      const qty = l.quantidade as number
      if (qty && qty > 0) {
        await supabase.from('movimentos_stock').insert({
          material_id: materialId,
          tipo: 'entrada',
          quantidade: qty,
          unidade: l.unidade || null,
          documento_fornecedor_id: docForn.id,
          motivo: `Factura ${especifico.numero || '?'} - ${l.descricao || ''}`,
          created_by: 'agente_documental',
        })
      }
    }

    if (materialId && tipo === 'nota_credito') {
      const qty = l.quantidade as number
      if (qty && qty > 0) {
        await supabase.from('movimentos_stock').insert({
          material_id: materialId,
          tipo: 'saida',
          quantidade: qty,
          unidade: l.unidade || null,
          documento_fornecedor_id: docForn.id,
          motivo: `NC ${especifico.numero || '?'} - ${l.descricao || ''}`,
          created_by: 'agente_documental',
        })
      }
    }
  }

  // Actualizar efatura se match
  if (efaturaId) {
    await supabase.from('efatura').update({
      estado_documento: 'documentado',
      documento_url: fileUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', efaturaId)
  }

  const nomeEmitente = (especifico.nome_emitente || geral.entidade_nome || 'Desconhecido') as string
  const mensagem = `${tipo === 'factura' ? 'Factura' : tipo === 'nota_credito' ? 'Nota crédito' : tipo === 'orcamento' ? 'Orçamento' : 'Fatura-recibo'} ${especifico.numero || '?'} de ${nomeEmitente} — €${especifico.total || '?'} — ${linhasInseridas} linha(s)${efaturaId ? ' — match e-Fatura OK' : ''}`

  return {
    tipo: classificacao, classificacao,
    dados: { geral, especifico, linhas_inseridas: linhasInseridas, efatura_match: !!efaturaId },
    tabela_destino: 'documentos_fornecedor',
    registo_id: docForn.id,
    documento_id: documentoId,
    mensagem,
  }
}

// ========== ECOSSISTEMA CHAGAS ==========

async function processarFacturaChagas(
  pdfBase64: string,
  fileContent: ContentBlock,
  fileUrl: string,
  storagePath: string,
  documentoId: number | null,
  contexto: { ticket_id?: string; remetente?: string; uploaded_by?: string },
  anthropic: Anthropic,
  supabase: SupabaseClient
): Promise<ProcessResult> {
  // Segundo call Sonnet com prompt dedicado Chagas
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    messages: [{ role: 'user', content: [fileContent, { type: 'text', text: CHAGAS_FACTURA_PROMPT }] }],
  })

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text).join('')

  let dados: Record<string, unknown>
  try { dados = JSON.parse(cleanJSON(rawText)) } catch {
    return { tipo: 'factura_fornecedor', classificacao: 'factura_fornecedor', dados: { erro: 'JSON parse failed', raw: rawText.substring(0, 500) }, tabela_destino: null, registo_id: null, documento_id: documentoId, mensagem: 'Erro ao extrair factura Chagas', erro: 'JSON parse failed' }
  }

  const atcud = dados.atcud as string | null

  // Dedup por ATCUD
  if (atcud) {
    const { data: existing } = await supabase.from('documentos_fornecedor').select('id').eq('atcud', atcud).maybeSingle()
    if (existing) {
      return { tipo: 'factura_fornecedor', classificacao: 'factura_fornecedor', dados, tabela_destino: 'documentos_fornecedor', registo_id: existing.id, documento_id: documentoId, mensagem: `Factura Chagas ${dados.numero_factura} já existe (ATCUD dedup)` }
    }
  }

  // Match efatura
  let efaturaId: string | null = null
  if (atcud) {
    const { data: ef } = await supabase.from('efatura').select('id').eq('atcud', atcud).limit(1)
    if (ef && ef.length > 0) efaturaId = ef[0].id
  }

  // 1. Insert documentos_fornecedor (registo central)
  const { data: docForn, error: docErr } = await supabase.from('documentos_fornecedor').insert({
    tipo: 'factura',
    numero: dados.numero_factura || null,
    data_documento: dados.data_emissao || null,
    fornecedor_id: 10,
    nif_emitente: '500117152',
    nome_emitente: 'Chagas',
    base_tributavel: dados.base_tributavel as number | null,
    iva: dados.iva as number | null,
    total: dados.total as number | null,
    atcud,
    efatura_id: efaturaId,
    documento_id: documentoId,
    url_ficheiro: fileUrl,
    storage_path: storagePath,
    dados_raw: dados,
  }).select('id').single()

  if (docErr || !docForn) {
    return { tipo: 'factura_fornecedor', classificacao: 'factura_fornecedor', dados, tabela_destino: null, registo_id: null, documento_id: documentoId, mensagem: 'Erro ao inserir documentos_fornecedor Chagas', erro: docErr?.message }
  }

  // 2. Insert facturas_chagas (ecossistema)
  const { data: fc, error: fcErr } = await supabase.from('facturas_chagas').insert({
    documento_fornecedor_id: docForn.id,
    numero_factura: dados.numero_factura || null,
    serie: dados.serie || null,
    data_emissao: dados.data_emissao || null,
    data_vencimento: dados.data_vencimento || null,
    cliente_chagas: dados.cliente_chagas || null,
    guia_remessa: null, // header-level, linhas têm as suas
    data_guia: null,
    referencia_encomenda: null,
    base_tributavel: dados.base_tributavel as number | null,
    iva: dados.iva as number | null,
    total: dados.total as number | null,
    atcud,
    efatura_id: efaturaId,
    url_ficheiro: fileUrl,
    storage_path: storagePath,
    dados_raw: dados,
    formato: dados.formato || null,
    forma_pagamento: dados.forma_pagamento || null,
    iban: dados.iban || null,
  }).select('id').single()

  if (fcErr || !fc) {
    return { tipo: 'factura_fornecedor', classificacao: 'factura_fornecedor', dados, tabela_destino: 'documentos_fornecedor', registo_id: docForn.id, documento_id: documentoId, mensagem: `Factura Chagas ${dados.numero_factura} — doc_forn OK mas erro ecossistema: ${fcErr?.message}`, erro: fcErr?.message }
  }

  // 3. Insert linhas
  const linhas = (dados.linhas || []) as Array<Record<string, unknown>>
  let linhasOk = 0

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]
    const refChagas = l.referencia_chagas as string | null

    // Auto-create materiais_fornecedor_ref
    let matRefId: number | null = null
    if (refChagas) {
      const { data: existingRef } = await supabase.from('materiais_fornecedor_ref')
        .select('id').eq('fornecedor_id', 10).eq('referencia_fornecedor', refChagas).maybeSingle()
      if (existingRef) {
        matRefId = existingRef.id
      } else {
        const { data: newRef } = await supabase.from('materiais_fornecedor_ref').insert({
          fornecedor_id: 10,
          referencia_fornecedor: refChagas,
          descricao_fornecedor: l.descricao || null,
        }).select('id').single()
        if (newRef) matRefId = newRef.id
      }
    }

    const { error: lineErr } = await supabase.from('facturas_chagas_linhas').insert({
      factura_chagas_id: fc.id,
      linha_num: i + 1,
      referencia_chagas: refChagas,
      descricao: l.descricao || 'Sem descrição',
      quantidade: l.quantidade as number | null,
      unidade: l.unidade || null,
      preco_unitario: l.preco_unitario as number | null,
      desconto_pct: l.desconto_pct as number || 0,
      valor_liquido: l.valor_liquido as number | null,
      valor_com_imposto: l.valor_com_imposto as number | null,
      taxa_iva: l.taxa_iva as number | null,
      qualidade_aco: l.qualidade_aco || null,
      dimensoes_mm: l.dimensoes_mm || null,
      material_fornecedor_ref_id: matRefId,
      guia_remessa: l.guia_remessa || null,
      data_guia: l.data_guia || null,
      referencia_encomenda: l.referencia_encomenda || null,
      numero_linha_chagas: l.numero_linha_chagas as number || (i + 1),
    })

    if (!lineErr) linhasOk++
  }

  // Update efatura
  if (efaturaId) {
    await supabase.from('efatura').update({ estado_documento: 'documentado', documento_url: fileUrl, updated_at: new Date().toISOString() }).eq('id', efaturaId)
  }

  return {
    tipo: 'factura_fornecedor', classificacao: 'factura_fornecedor',
    dados: { ...dados, linhas_inseridas: linhasOk, efatura_match: !!efaturaId, ecossistema: 'chagas' },
    tabela_destino: 'facturas_chagas', registo_id: fc.id, documento_id: documentoId,
    mensagem: `Factura Chagas ${dados.numero_factura || '?'} — €${dados.total || '?'} — ${linhasOk}/${linhas.length} linhas — formato ${dados.formato || '?'}${efaturaId ? ' — e-Fatura OK' : ''}`,
  }
}

// ========== ECOSSISTEMA PECOL ==========

async function processarFacturaPecol(
  pdfBase64: string,
  fileContent: ContentBlock,
  fileUrl: string,
  storagePath: string,
  documentoId: number | null,
  contexto: { ticket_id?: string; remetente?: string; uploaded_by?: string },
  anthropic: Anthropic,
  supabase: SupabaseClient
): Promise<ProcessResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    messages: [{ role: 'user', content: [fileContent, { type: 'text', text: PECOL_FACTURA_PROMPT }] }],
  })

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text).join('')

  let dados: Record<string, unknown>
  try { dados = JSON.parse(cleanJSON(rawText)) } catch {
    return { tipo: 'factura_fornecedor', classificacao: 'factura_fornecedor', dados: { erro: 'JSON parse failed', raw: rawText.substring(0, 500) }, tabela_destino: null, registo_id: null, documento_id: documentoId, mensagem: 'Erro ao extrair factura Pecol', erro: 'JSON parse failed' }
  }

  const atcud = dados.atcud as string | null

  // Dedup
  if (atcud) {
    const { data: existing } = await supabase.from('documentos_fornecedor').select('id').eq('atcud', atcud).maybeSingle()
    if (existing) {
      return { tipo: 'factura_fornecedor', classificacao: 'factura_fornecedor', dados, tabela_destino: 'documentos_fornecedor', registo_id: existing.id, documento_id: documentoId, mensagem: `Factura Pecol ${dados.serie_numero} já existe (ATCUD dedup)` }
    }
  }

  let efaturaId: string | null = null
  if (atcud) {
    const { data: ef } = await supabase.from('efatura').select('id').eq('atcud', atcud).limit(1)
    if (ef && ef.length > 0) efaturaId = ef[0].id
  }

  // 1. documentos_fornecedor
  const { data: docForn, error: docErr } = await supabase.from('documentos_fornecedor').insert({
    tipo: 'factura',
    numero: dados.serie_numero || null,
    data_documento: dados.data_emissao || null,
    fornecedor_id: 34,
    nif_emitente: '501425527',
    nome_emitente: 'Pecol',
    base_tributavel: dados.base_tributavel as number | null,
    iva: dados.iva as number | null,
    total: dados.total as number | null,
    atcud,
    efatura_id: efaturaId,
    documento_id: documentoId,
    url_ficheiro: fileUrl,
    storage_path: storagePath,
    dados_raw: dados,
  }).select('id').single()

  if (docErr || !docForn) {
    return { tipo: 'factura_fornecedor', classificacao: 'factura_fornecedor', dados, tabela_destino: null, registo_id: null, documento_id: documentoId, mensagem: 'Erro ao inserir documentos_fornecedor Pecol', erro: docErr?.message }
  }

  // 2. facturas_pecol
  const { data: fp, error: fpErr } = await supabase.from('facturas_pecol').insert({
    documento_fornecedor_id: docForn.id,
    serie_numero: dados.serie_numero || null,
    data_emissao: dados.data_emissao || null,
    data_vencimento: dados.data_vencimento || null,
    condicoes_pagamento: dados.condicoes_pagamento || null,
    cliente_pecol: dados.cliente_pecol || null,
    guia_remessa: dados.guia_remessa || null,
    confirmacao_encomenda: dados.confirmacao_encomenda || null,
    encomenda_cliente: dados.encomenda_cliente || null,
    local_carga: dados.local_carga || null,
    local_descarga: dados.local_descarga || null,
    portes: dados.portes as number | null,
    base_tributavel: dados.base_tributavel as number | null,
    iva: dados.iva as number | null,
    total: dados.total as number | null,
    atcud,
    efatura_id: efaturaId,
    url_ficheiro: fileUrl,
    storage_path: storagePath,
    dados_raw: dados,
  }).select('id').single()

  if (fpErr || !fp) {
    return { tipo: 'factura_fornecedor', classificacao: 'factura_fornecedor', dados, tabela_destino: 'documentos_fornecedor', registo_id: docForn.id, documento_id: documentoId, mensagem: `Factura Pecol ${dados.serie_numero} — doc_forn OK mas erro ecossistema: ${fpErr?.message}`, erro: fpErr?.message }
  }

  // 3. Linhas
  const linhas = (dados.linhas || []) as Array<Record<string, unknown>>
  let linhasOk = 0

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]
    const codPecol = l.codigo_pecol as string | null

    // Auto-create materiais_fornecedor_ref
    let matRefId: number | null = null
    if (codPecol) {
      const { data: existingRef } = await supabase.from('materiais_fornecedor_ref')
        .select('id').eq('fornecedor_id', 34).eq('referencia_fornecedor', codPecol).maybeSingle()
      if (existingRef) {
        matRefId = existingRef.id
      } else {
        const { data: newRef } = await supabase.from('materiais_fornecedor_ref').insert({
          fornecedor_id: 34,
          referencia_fornecedor: codPecol,
          descricao_fornecedor: l.descricao || null,
        }).select('id').single()
        if (newRef) matRefId = newRef.id
      }
    }

    const { error: lineErr } = await supabase.from('facturas_pecol_linhas').insert({
      factura_pecol_id: fp.id,
      linha_num: i + 1,
      codigo_pecol: codPecol,
      codigo_cliente: l.codigo_cliente || null,
      descricao: l.descricao || 'Sem descrição',
      quantidade: l.quantidade as number | null,
      unidade: l.unidade || null,
      preco_unitario: l.preco_unitario as number | null,
      valor_liquido: l.valor_liquido as number | null,
      taxa_iva: l.taxa_iva as number | null,
      material_fornecedor_ref_id: matRefId,
    })

    if (!lineErr) linhasOk++
  }

  if (efaturaId) {
    await supabase.from('efatura').update({ estado_documento: 'documentado', documento_url: fileUrl, updated_at: new Date().toISOString() }).eq('id', efaturaId)
  }

  return {
    tipo: 'factura_fornecedor', classificacao: 'factura_fornecedor',
    dados: { ...dados, linhas_inseridas: linhasOk, efatura_match: !!efaturaId, ecossistema: 'pecol' },
    tabela_destino: 'facturas_pecol', registo_id: fp.id, documento_id: documentoId,
    mensagem: `Factura Pecol ${dados.serie_numero || '?'} — €${dados.total || '?'} — ${linhasOk}/${linhas.length} linhas${efaturaId ? ' — e-Fatura OK' : ''}`,
  }
}

// ========== DAV ==========

async function processarDAV(
  pdfBase64: string,
  fileContent: ContentBlock,
  fileUrl: string,
  documentoId: number | null,
  anthropic: Anthropic,
  supabase: SupabaseClient
): Promise<ProcessResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [{ role: 'user', content: [fileContent, { type: 'text', text: DAV_PROMPT }] }],
  })

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text).join('')

  let dados: Record<string, unknown>
  try { dados = JSON.parse(cleanJSON(rawText)) } catch {
    return { tipo: 'dav', classificacao: 'dav', dados: {}, tabela_destino: null, registo_id: null, documento_id: documentoId, mensagem: 'Erro ao extrair DAV', erro: 'JSON parse failed' }
  }

  const vin = dados.vin as string
  if (!vin) return { tipo: 'dav', classificacao: 'dav', dados, tabela_destino: null, registo_id: null, documento_id: documentoId, mensagem: 'VIN não encontrado no DAV' }

  const davRecord: Record<string, unknown> = { ...dados, url_ficheiro: fileUrl, dados_raw: dados, completo: !!(vin && dados.matricula && dados.cod_homologacao), updated_at: new Date().toISOString() }

  const { data: existing } = await supabase.from('davs').select('id').eq('vin', vin).maybeSingle()
  let dav
  if (existing) {
    const { data } = await supabase.from('davs').update(davRecord).eq('vin', vin).select('id').single()
    dav = data
  } else {
    const { data } = await supabase.from('davs').insert(davRecord).select('id').single()
    dav = data
  }

  // Associar obra
  const { data: obra } = await supabase.from('obras').select('id').eq('vin', vin).maybeSingle()
  if (obra && dados.matricula) {
    await supabase.from('obras').update({ matricula: dados.matricula as string }).eq('id', obra.id)
  }

  return {
    tipo: 'dav', classificacao: 'dav', dados,
    tabela_destino: 'davs', registo_id: dav?.id || null, documento_id: documentoId,
    mensagem: `DAV ${existing ? 'actualizado' : 'registado'} — VIN: ${vin}${dados.matricula ? `, Mat: ${dados.matricula}` : ''}`,
  }
}

// ========== FAM ==========

async function processarFAM(
  pdfBase64: string,
  fileContent: ContentBlock,
  fileUrl: string,
  documentoId: number | null,
  anthropic: Anthropic,
  supabase: SupabaseClient
): Promise<ProcessResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [{ role: 'user', content: [fileContent, { type: 'text', text: FAM_PROMPT }] }],
  })

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text).join('')

  let dados: Record<string, unknown>
  try { dados = JSON.parse(cleanJSON(rawText)) } catch {
    return { tipo: 'fam', classificacao: 'fam', dados: {}, tabela_destino: null, registo_id: null, documento_id: documentoId, mensagem: 'Erro ao extrair FAM', erro: 'JSON parse failed' }
  }

  const numHomologacao = dados.numero_homologacao_nacional as string
  const extensao = (dados.extensao as string) || '0'
  if (!numHomologacao) return { tipo: 'fam', classificacao: 'fam', dados, tabela_destino: null, registo_id: null, documento_id: documentoId, mensagem: 'Número de homologação não encontrado' }

  const famRecord: Record<string, unknown> = { ...dados, url_ficheiro: fileUrl, dados_raw: dados, updated_at: new Date().toISOString() }

  const { data: existing } = await supabase.from('fams').select('id').eq('numero_homologacao_nacional', numHomologacao).eq('extensao', extensao).maybeSingle()
  let fam
  if (existing) {
    const { data } = await supabase.from('fams').update(famRecord).eq('numero_homologacao_nacional', numHomologacao).eq('extensao', extensao).select('id').single()
    fam = data
  } else {
    const { data } = await supabase.from('fams').insert(famRecord).select('id').single()
    fam = data
  }

  return {
    tipo: 'fam', classificacao: 'fam', dados,
    tabela_destino: 'fams', registo_id: fam?.id || null, documento_id: documentoId,
    mensagem: `FAM ${existing ? 'actualizada' : 'registada'} — Homologação: ${numHomologacao} ext. ${extensao}`,
  }
}

// ========== CIT ==========

async function processarCIT(
  pdfBase64: string,
  fileContent: ContentBlock,
  fileUrl: string,
  nomeArquivo: string,
  documentoId: number | null,
  contexto: { uploaded_by?: string },
  anthropic: Anthropic,
  supabase: SupabaseClient
): Promise<ProcessResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    messages: [{ role: 'user', content: [fileContent, { type: 'text', text: CIT_PROMPT }] }],
  })

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text).join('')

  let dados: Record<string, unknown>
  try { dados = JSON.parse(cleanJSON(rawText)) } catch {
    return { tipo: 'cit', classificacao: 'cit', dados: {}, tabela_destino: null, registo_id: null, documento_id: documentoId, mensagem: 'Erro ao extrair CIT', erro: 'JSON parse failed' }
  }

  // Dedup
  const numeroCit = dados.numero_cit as string | null
  if (numeroCit) {
    const { data: existing } = await supabase.from('cits').select('id').eq('numero_cit', numeroCit).maybeSingle()
    if (existing) return { tipo: 'cit', classificacao: 'cit', dados, tabela_destino: 'cits', registo_id: existing.id, documento_id: documentoId, mensagem: `CIT ${numeroCit} já existe` }
  }

  // Match colaborador
  let colaboradorId: string | null = null
  const nomeUtente = dados.nome_utente as string | null
  if (nomeUtente) {
    const { data: colabs } = await supabase.from('colaboradores').select('id, nome').eq('ativo', true)
    if (colabs) {
      const nomeNorm = normalize(nomeUtente)
      for (const c of colabs) {
        const cNorm = normalize(c.nome)
        if (nomeNorm.includes(cNorm) || cNorm.includes(nomeNorm)) { colaboradorId = c.id; break }
      }
    }
  }

  const { data: cit } = await supabase.from('cits').insert({
    ...dados,
    colaborador_id: colaboradorId,
    url_ficheiro: fileUrl,
    uploaded_by: contexto.uploaded_by || null,
  }).select('id').single()

  return {
    tipo: 'cit', classificacao: 'cit', dados: { ...dados, colaborador_id: colaboradorId },
    tabela_destino: 'cits', registo_id: cit?.id || null, documento_id: documentoId,
    mensagem: `CIT ${numeroCit || '?'} registado${colaboradorId ? ' — colaborador identificado' : ''}`,
  }
}

// ========== INSPECAO ==========

async function processarINSPECAO(
  pdfBase64: string,
  fileContent: ContentBlock,
  fileUrl: string,
  nomeArquivo: string,
  documentoId: number | null,
  contexto: { uploaded_by?: string },
  anthropic: Anthropic,
  supabase: SupabaseClient
): Promise<ProcessResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [{ role: 'user', content: [fileContent, { type: 'text', text: INSPECAO_PROMPT }] }],
  })

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text).join('')

  let dados: Record<string, unknown>
  try { dados = JSON.parse(cleanJSON(rawText)) } catch {
    return { tipo: 'inspecao', classificacao: 'inspecao', dados: {}, tabela_destino: null, registo_id: null, documento_id: documentoId, mensagem: 'Erro ao extrair inspeção', erro: 'JSON parse failed' }
  }

  const matricula = dados.matricula as string
  if (!matricula) return { tipo: 'inspecao', classificacao: 'inspecao', dados, tabela_destino: null, registo_id: null, documento_id: documentoId, mensagem: 'Matrícula não encontrada' }

  // Dedup
  const dataInspecao = dados.data_inspecao as string | null
  if (dataInspecao) {
    const { data: existing } = await supabase.from('inspecoes').select('id').eq('matricula', matricula).eq('data_inspecao', dataInspecao).maybeSingle()
    if (existing) return { tipo: 'inspecao', classificacao: 'inspecao', dados, tabela_destino: 'inspecoes', registo_id: existing.id, documento_id: documentoId, mensagem: `Inspeção ${matricula} ${dataInspecao} já existe` }
  }

  const { data: insp } = await supabase.from('inspecoes').insert({
    matricula, data_inspecao: dataInspecao,
    centro_inspecao: dados.centro_inspecao || null,
    codigo_imt: dados.codigo_imt || null,
    peso_estatico_total: dados.peso_estatico_total ?? null,
    peso_dinamico_total: dados.peso_dinamico_total ?? null,
    peso_estatico_eixo1_total: dados.peso_estatico_eixo1_total ?? null,
    peso_estatico_eixo1_esq: dados.peso_estatico_eixo1_esq ?? null,
    peso_estatico_eixo1_dir: dados.peso_estatico_eixo1_dir ?? null,
    peso_estatico_eixo2_total: dados.peso_estatico_eixo2_total ?? null,
    peso_estatico_eixo2_esq: dados.peso_estatico_eixo2_esq ?? null,
    peso_estatico_eixo2_dir: dados.peso_estatico_eixo2_dir ?? null,
    peso_dinamico_eixo1_total: dados.peso_dinamico_eixo1_total ?? null,
    peso_dinamico_eixo1_esq: dados.peso_dinamico_eixo1_esq ?? null,
    peso_dinamico_eixo1_dir: dados.peso_dinamico_eixo1_dir ?? null,
    peso_dinamico_eixo2_total: dados.peso_dinamico_eixo2_total ?? null,
    peso_dinamico_eixo2_esq: dados.peso_dinamico_eixo2_esq ?? null,
    peso_dinamico_eixo2_dir: dados.peso_dinamico_eixo2_dir ?? null,
    forca_travagem_servico: dados.forca_travagem_servico ?? null,
    eficiencia_travao_servico_estatica: dados.eficiencia_travao_servico_estatica ?? null,
    eficiencia_travao_servico_dinamica: dados.eficiencia_travao_servico_dinamica ?? null,
    forca_travagem_estacionamento: dados.forca_travagem_estacionamento ?? null,
    eficiencia_travao_estacionamento: dados.eficiencia_travao_estacionamento ?? null,
    opacidade_k: dados.opacidade_k ?? null,
    combustivel: dados.combustivel || null,
    ripometro_eixo1: dados.ripometro_eixo1 ?? null,
    deficiencias: dados.deficiencias || null,
    resultado: dados.resultado || null,
    url_ficheiro: fileUrl,
    dados_raw: dados,
    uploaded_by: contexto.uploaded_by || null,
  }).select('id').single()

  return {
    tipo: 'inspecao', classificacao: 'inspecao', dados,
    tabela_destino: 'inspecoes', registo_id: insp?.id || null, documento_id: documentoId,
    mensagem: `Inspeção registada — ${matricula} ${dados.resultado || ''}`,
  }
}

// ========== CERTIFICADO MATERIAL 3.1 ==========

async function processarCertMaterial(
  especifico: Record<string, unknown>,
  geral: Record<string, unknown>,
  fileUrl: string,
  documentoId: number | null,
  contexto: { remetente?: string },
  supabase: SupabaseClient
): Promise<ProcessResult> {
  let fornecedorId: number | null = null
  const nif = (geral.entidade_nif) as string | null
  if (nif) {
    const { data: forn } = await supabase.from('fornecedores').select('id').eq('nif', nif).limit(1)
    if (forn && forn.length > 0) fornecedorId = forn[0].id
  }

  const { data: cert } = await supabase.from('certificados_material').insert({
    qualidade_aco: especifico.qualidade_aco || null,
    composicao_quimica: especifico.composicao || null,
    propriedades_mecanicas: especifico.propriedades_mecanicas || null,
    lote: especifico.lote || null,
    vazamento: especifico.vazamento || null,
    fornecedor_id: fornecedorId,
    url_certificado: fileUrl,
    notas: `Processado pelo Ag. Documental`,
  }).select('id').single()

  return {
    tipo: 'certificado_material_31', classificacao: 'certificado_material_31',
    dados: { geral, especifico },
    tabela_destino: 'certificados_material', registo_id: cert?.id || null, documento_id: documentoId,
    mensagem: `Certificado material 3.1 registado${especifico.qualidade_aco ? ` — ${especifico.qualidade_aco}` : ''}`,
  }
}
