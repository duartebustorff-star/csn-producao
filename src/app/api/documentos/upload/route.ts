import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getServiceSupabase } from "@/lib/supabase"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---------- Prompts ----------

const IDENTIFY_PROMPT = `Analisa este documento. Identifica o tipo:
- "DAV" se for uma Declaração Aduaneira de Veículo (cabeçalho com logo AT – Autoridade Tributária e Aduaneira)
- "FAM" se for uma Folha de Aprovação de Modelo (cabeçalho com logo IMT – Instituto da Mobilidade e dos Transportes)
- "CIT" se for um Certificado de Incapacidade Temporária (documento da Segurança Social com dados de baixa médica)
- "VIN_PLATE" se for uma foto da placa VIN de um veículo
- "INSPECAO" se for um Relatório de Inspeção automóvel (cabeçalho com "Relatório de Inspeção", "Controlauto" ou centro de inspeção IMT, com dados de frénómetro/opacímetro/ripómetro)
- "OUTRO" para qualquer outro documento
Responde APENAS com o tipo (uma palavra).`

const DAV_PROMPT = `Analisa este documento. É uma Declaração Aduaneira de Veículo (DAV) portuguesa.
Extrai TODOS os campos em JSON com a seguinte estrutura:
{
  "tipo_documento": "DAV",
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
  "tipo_documento": "FAM",
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

const VIN_PROMPT = `Analisa esta foto de uma placa de identificação de veículo (VIN plate).
Extrai o número VIN (Vehicle Identification Number) – são 17 caracteres alfanuméricos.
Responde APENAS com o VIN, sem explicações. Se não conseguires ler, responde "ILEGIVEL".`

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
NOTA: O campo "tipo_cit" indica se o documento é um CIT inicial ("inicial") ou uma prorrogação ("prorrogacao").
Se não conseguires ler algum campo, coloca null. Responde APENAS com JSON.`

const INSPECAO_PROMPT = `Analisa este Relatório de Inspeção automóvel português.
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

// ---------- Types ----------

type ContentBlock = Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam
type SupabaseClient = ReturnType<typeof getServiceSupabase>

// ---------- Helpers ----------

function buildFileContent(base64: string, mimeType: string): ContentBlock {
  if (mimeType === "application/pdf") {
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    }
  }
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
      data: base64,
    },
  }
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function cleanJSON(raw: string): string {
  let s = raw.trim()
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "")
  const start = s.indexOf("{")
  const end = s.lastIndexOf("}")
  if (start !== -1 && end !== -1 && end > start) {
    s = s.substring(start, end + 1)
  }
  return s
}

function formatDate(dateStr: string): string {
  try {
    const parts = dateStr.split("T")[0].split("-")
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  } catch {
    return dateStr
  }
}

// ---------- DOSSIER: marcar documento como ok ----------

async function marcarDossierOk(
  obraId: string,
  tipo: "dav" | "fam" | "inspecao",
  ficheiroUrl: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from("dossie_obra")
    .update({
      estado: "ok",
      ficheiro_url: ficheiroUrl,
      concluido_em: new Date().toISOString(),
      concluido_por: "system",
      updated_at: new Date().toISOString(),
    })
    .eq("obra_id", obraId)
    .eq("tipo", tipo)
}

// ---------- DOSSIER: verificar e gerar termo ----------

async function verificarEGerarTermo(
  obraId: string,
  supabase: SupabaseClient
): Promise<{ termoGerado: boolean; termoUrl: string | null; mensagem: string }> {
  // Verificar se DAV + INSPECAO estão ok (FAM não obrigatória para termo)
  const { data: docs } = await supabase
    .from("dossie_obra")
    .select("tipo, estado, ficheiro_url")
    .eq("obra_id", obraId)
    .in("tipo", ["dav", "inspecao", "termo_responsabilidade"])

  if (!docs) return { termoGerado: false, termoUrl: null, mensagem: "" }

  const dav = docs.find(d => d.tipo === "dav")
  const insp = docs.find(d => d.tipo === "inspecao")
  const termo = docs.find(d => d.tipo === "termo_responsabilidade")

  // Se termo já está ok, não gera de novo
  if (termo?.estado === "ok") {
    return { termoGerado: false, termoUrl: termo.ficheiro_url, mensagem: "" }
  }

  // Falta algum documento?
  const faltam = []
  if (dav?.estado !== "ok") faltam.push("DAV")
  if (insp?.estado !== "ok") faltam.push("Inspeção")

  if (faltam.length > 0) {
    return {
      termoGerado: false,
      termoUrl: null,
      mensagem: `\n⏳ Dossier incompleto – falta: ${faltam.join(", ")}`,
    }
  }

  // Todos presentes – buscar dados para o termo
  const { data: obra } = await supabase
    .from("obras")
    .select("id, vin, matricula, leads(tipo_carrocaria, dimensoes, pbt)")
    .eq("id", obraId)
    .single()

  if (!obra) return { termoGerado: false, termoUrl: null, mensagem: "" }

  const { data: davRecord } = await supabase
    .from("davs")
    .select("marca, modelo, matricula, vin, cod_homologacao, peso_bruto")
    .eq("vin", obra.vin)
    .maybeSingle()

  const { data: inspecaoRecord } = await supabase
    .from("inspecoes")
    .select("peso_estatico_total, peso_estatico_eixo1_total, peso_estatico_eixo2_total")
    .eq("matricula", obra.matricula || davRecord?.matricula || "")
    .order("data_inspecao", { ascending: false })
    .limit(1)
    .maybeSingle()

  const lead = obra.leads as Record<string, unknown> | null

  const termoBody = {
    obra_id: obraId,
    marca: davRecord?.marca || null,
    modelo: davRecord?.modelo || null,
    matricula: obra.matricula || davRecord?.matricula || null,
    vin: obra.vin || null,
    cod_homologacao: davRecord?.cod_homologacao || null,
    tipo_carrocaria: lead?.tipo_carrocaria || null,
    comprimento: null,
    largura: null,
    altura: null,
    dist_eixo_frente: null,
    dist_eixo_retaguarda: null,
    tara_total: inspecaoRecord?.peso_estatico_total || null,
    tara_frontal: inspecaoRecord?.peso_estatico_eixo1_total || null,
    tara_traseira: inspecaoRecord?.peso_estatico_eixo2_total || null,
    peso_bruto: davRecord?.peso_bruto || lead?.pbt || null,
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/documentos/gerar-termo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(termoBody),
    })
    const termoData = await res.json()

    if (termoData.sucesso && termoData.download_url) {
      await supabase
        .from("dossie_obra")
        .update({
          estado: "ok",
          ficheiro_url: termoData.download_url,
          concluido_em: new Date().toISOString(),
          concluido_por: "system",
          updated_at: new Date().toISOString(),
        })
        .eq("obra_id", obraId)
        .eq("tipo", "termo_responsabilidade")

      return {
        termoGerado: true,
        termoUrl: termoData.download_url,
        mensagem: `\n📋 DAV + Inspeção completos → **Termo gerado automaticamente!**\n🔗 ${termoData.download_url}`,
      }
    }
  } catch (err) {
    console.error("Erro ao gerar termo:", err)
  }

  return { termoGerado: false, termoUrl: null, mensagem: "" }
}

// ---------- POST ----------

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const uploadedBy = formData.get("uploaded_by") as string

    if (!file || !uploadedBy) {
      return NextResponse.json({ error: "Faltam campos" }, { status: 400 })
    }

    const isImage = file.type.startsWith("image/")
    const isPDF = file.type === "application/pdf"

    if (!isImage && !isPDF) {
      return NextResponse.json({ error: "Apenas imagens e PDFs são suportados" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const fileContent = buildFileContent(base64, file.type)

    // 1. Identificar tipo
    const identifyRes = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 50,
      messages: [{
        role: "user",
        content: [fileContent, { type: "text", text: IDENTIFY_PROMPT }],
      }],
    })

    const docType = identifyRes.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text.trim().toUpperCase())
      .join("")

    const supabase = getServiceSupabase()

    if (docType === "DAV") return await processDAV(base64, fileContent, file, supabase)
    if (docType === "FAM") return await processFAM(base64, fileContent, file, supabase)
    if (docType === "CIT") return await processCIT(fileContent, file, uploadedBy, supabase)
    if (docType === "INSPECAO") return await processINSPECAO(fileContent, file, uploadedBy, supabase)
    if (docType === "VIN_PLATE") return await processVINPlate(fileContent, supabase)
    return await processOUTRO(file, uploadedBy, supabase)

  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// ---------- DAV ----------

async function processDAV(
  base64: string,
  fileContent: ContentBlock,
  file: File,
  supabase: SupabaseClient
) {
  const extractRes = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: [fileContent, { type: "text", text: DAV_PROMPT }],
    }],
  })

  const rawText = extractRes.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text).join("")

  let dados: Record<string, unknown>
  try {
    dados = JSON.parse(cleanJSON(rawText))
  } catch {
    return NextResponse.json({ tipo: "DAV", error: "Erro ao extrair dados", raw: rawText })
  }

  const vin = dados.vin as string
  if (!vin) return NextResponse.json({ tipo: "DAV", error: "VIN não encontrado no documento" })

  // Upload storage
  const ext = file.name.split(".").pop() || "pdf"
  const mat = (dados.matricula as string) || "SEM-MATRICULA"
  const fileName = `DAV_${mat}_${vin}_${Date.now()}.${ext}`
  await supabase.storage.from("documentos").upload(fileName, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
  })
  const { data: urlData } = await supabase.storage.from("documentos").createSignedUrl(fileName, 60 * 60 * 24 * 365)
  const ficheiroUrl = urlData?.signedUrl || ""

  // Upsert DAV
  const davRecord: Record<string, unknown> = {
    ...dados,
    url_ficheiro: ficheiroUrl,
    dados_raw: dados,
    completo: !!(vin && dados.matricula && dados.cod_homologacao),
    updated_at: new Date().toISOString(),
  }
  delete davRecord.tipo_documento

  const { data: existing } = await supabase.from("davs").select("id").eq("vin", vin).maybeSingle()
  let dav
  if (existing) {
    const { data } = await supabase.from("davs").update(davRecord).eq("vin", vin).select().single()
    dav = data
  } else {
    const { data } = await supabase.from("davs").insert(davRecord).select().single()
    dav = data
  }

  // Associar obra
  const { data: obra } = await supabase.from("obras").select("id").eq("vin", vin).maybeSingle()
  if (obra && dados.matricula) {
    await supabase.from("obras").update({ matricula: dados.matricula as string }).eq("id", obra.id)
  }

  const marcaModelo = [dados.marca, dados.modelo].filter(Boolean).join(" ")
  let mensagem = `✅ DAV ${existing ? "atualizado" : "registado"} – VIN: ${vin}`
    + (dados.matricula ? `, Matrícula: ${dados.matricula}` : "")
    + (marcaModelo ? `, ${marcaModelo}` : "")
    + (dados.cod_homologacao ? `\nHomologação: ${dados.cod_homologacao}` : "")
    + (obra ? `\nAssociado à obra ${obra.id}.` : "")

  let termoGerado = false
  let termoUrl = null
  if (obra) {
    await marcarDossierOk(obra.id, "dav", ficheiroUrl, supabase)
    const resultado = await verificarEGerarTermo(obra.id, supabase)
    termoGerado = resultado.termoGerado
    termoUrl = resultado.termoUrl
    mensagem += resultado.mensagem
  } else {
    mensagem += "\n⚠️ Obra não encontrada para este VIN – dossier não atualizado."
  }

  return NextResponse.json({
    tipo: "DAV", dav, dados,
    obra_id: obra?.id || null, vin,
    matricula: dados.matricula || null,
    updated: !!existing,
    termo_gerado: termoGerado,
    termo_url: termoUrl,
    mensagem,
  })
}

// ---------- FAM ----------

async function processFAM(
  base64: string,
  fileContent: ContentBlock,
  file: File,
  supabase: SupabaseClient
) {
  const extractRes = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: [fileContent, { type: "text", text: FAM_PROMPT }],
    }],
  })

  const rawText = extractRes.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text).join("")

  let dados: Record<string, unknown>
  try {
    dados = JSON.parse(cleanJSON(rawText))
  } catch {
    return NextResponse.json({ tipo: "FAM", error: "Erro ao extrair dados", raw: rawText })
  }

  const numHomologacao = dados.numero_homologacao_nacional as string
  const extensao = (dados.extensao as string) || "0"
  if (!numHomologacao) return NextResponse.json({ tipo: "FAM", error: "Número de homologação não encontrado" })

  const ext = file.name.split(".").pop() || "pdf"
  const fileName = `FAM_${numHomologacao}_${Date.now()}.${ext}`
  await supabase.storage.from("documentos").upload(fileName, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
  })
  const { data: urlData } = await supabase.storage.from("documentos").createSignedUrl(fileName, 60 * 60 * 24 * 365)
  const ficheiroUrl = urlData?.signedUrl || ""

  const famRecord: Record<string, unknown> = {
    ...dados,
    url_ficheiro: ficheiroUrl,
    dados_raw: dados,
    updated_at: new Date().toISOString(),
  }
  delete famRecord.tipo_documento

  const { data: existing } = await supabase
    .from("fams").select("id")
    .eq("numero_homologacao_nacional", numHomologacao)
    .eq("extensao", extensao)
    .maybeSingle()

  let fam
  if (existing) {
    const { data } = await supabase.from("fams").update(famRecord)
      .eq("numero_homologacao_nacional", numHomologacao)
      .eq("extensao", extensao).select().single()
    fam = data
  } else {
    const { data } = await supabase.from("fams").insert(famRecord).select().single()
    fam = data
  }

  const { data: davsAssociados } = await supabase
    .from("davs")
    .select("vin")
    .eq("cod_homologacao", numHomologacao)

  let obrasAtualizadas = 0
  let mensagemTermo = ""

  if (davsAssociados && davsAssociados.length > 0) {
    const vins = davsAssociados.map(d => d.vin).filter(Boolean)
    for (const vin of vins) {
      const { data: obra } = await supabase.from("obras").select("id").eq("vin", vin).maybeSingle()
      if (obra) {
        await marcarDossierOk(obra.id, "fam", ficheiroUrl, supabase)
        obrasAtualizadas++
        const resultado = await verificarEGerarTermo(obra.id, supabase)
        if (resultado.mensagem) mensagemTermo += `\nObra ${obra.id}: ${resultado.mensagem}`
      }
    }
  }

  const marcaModelo = [dados.campo_0_1_marca, dados.campo_0_2_modelo].filter(Boolean).join(" ")
  const mensagem = `✅ FAM ${existing ? "atualizada" : "registada"} – Homologação: ${numHomologacao} ext. ${extensao}`
    + (marcaModelo ? `, ${marcaModelo}` : "")
    + (obrasAtualizadas > 0 ? `\n📝 Dossier atualizado em ${obrasAtualizadas} obra(s).` : "")
    + mensagemTermo

  return NextResponse.json({
    tipo: "FAM", fam, dados,
    numero_homologacao: numHomologacao, extensao,
    updated: !!existing,
    obras_atualizadas: obrasAtualizadas,
    anotacoes: dados.campo_50_anotacoes || null,
    mensagem,
  })
}

// ---------- INSPECAO ----------

async function processINSPECAO(
  fileContent: ContentBlock,
  file: File,
  uploadedBy: string,
  supabase: SupabaseClient
) {
  const extractRes = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: [fileContent, { type: "text", text: INSPECAO_PROMPT }],
    }],
  })

  const rawText = extractRes.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text).join("")

  let dados: Record<string, unknown>
  try {
    dados = JSON.parse(cleanJSON(rawText))
  } catch {
    return NextResponse.json({ tipo: "INSPECAO", error: "Erro ao extrair dados da inspeção", raw: rawText })
  }

  const matricula = dados.matricula as string
  if (!matricula) return NextResponse.json({ tipo: "INSPECAO", error: "Matrícula não encontrada" })

  const dataInspecao = dados.data_inspecao as string | null

  // Helper: correr dossier e termo para esta matrícula
  async function correrDossierInspecao(ficheiroUrl: string) {
    const { data: davAssociado } = await supabase
      .from("davs").select("vin")
      .eq("matricula", matricula).maybeSingle()

    if (davAssociado?.vin) {
      const { data: obra } = await supabase
        .from("obras").select("id")
        .eq("vin", davAssociado.vin).maybeSingle()

      if (obra) {
        await marcarDossierOk(obra.id, "inspecao", ficheiroUrl, supabase)
        return await verificarEGerarTermo(obra.id, supabase)
      }
    }
    return null
  }

  // Anti-duplicado — mas corre dossier na mesma
  if (dataInspecao) {
    const { data: existing } = await supabase
      .from("inspecoes").select("id, url_ficheiro")
      .eq("matricula", matricula).eq("data_inspecao", dataInspecao)
      .maybeSingle()

    if (existing) {
      const resultado = await correrDossierInspecao(existing.url_ficheiro || "")
      return NextResponse.json({
        tipo: "INSPECAO",
        duplicado: true,
        inspecao_id: existing.id,
        mensagem: `⚠️ Inspeção de ${matricula} em ${formatDate(dataInspecao)} já existe.`
          + (resultado?.mensagem || ""),
      })
    }
  }

  // Upload storage
  const ext = file.name.split(".").pop() || "pdf"
  const fileName = `INSP_${matricula}_${dataInspecao ? dataInspecao.split("T")[0] : Date.now()}.${ext}`
  await supabase.storage.from("documentos").upload(fileName, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
  })
  const { data: urlData } = await supabase.storage.from("documentos").createSignedUrl(fileName, 60 * 60 * 24 * 365)
  const ficheiroUrl = urlData?.signedUrl || ""

  // Insert inspeção
  const inspecaoRecord: Record<string, unknown> = {
    matricula, data_inspecao: dataInspecao,
    centro_inspecao: dados.centro_inspecao || null,
    codigo_imt: dados.codigo_imt || null,
    linha: dados.linha || null,
    inspetor: dados.inspetor || null,
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
    url_ficheiro: ficheiroUrl,
    dados_raw: dados,
    uploaded_by: uploadedBy,
    updated_at: new Date().toISOString(),
  }

  const { data: inspecao, error: insertError } = await supabase
    .from("inspecoes").insert(inspecaoRecord).select().single()

  if (insertError) {
    console.error("Inspecao insert error:", insertError)
    return NextResponse.json({ tipo: "INSPECAO", error: "Erro ao registar inspeção" }, { status: 500 })
  }

  const pesoTotal = dados.peso_estatico_total as number | null
  const pesoEixo1 = dados.peso_estatico_eixo1_total as number | null
  const pesoEixo2 = dados.peso_estatico_eixo2_total as number | null
  const resultadoStr = dados.resultado ? ` Resultado: ${(dados.resultado as string).toUpperCase()}.` : ""

  let pesosStr = ""
  if (pesoTotal != null || pesoEixo1 != null || pesoEixo2 != null) {
    pesosStr += `\n⚖️ Peso estático total: ${pesoTotal != null ? pesoTotal + "kg" : "?"}`
    pesosStr += `\n⚖️ Eixo 1: ${pesoEixo1 != null ? pesoEixo1 + "kg" : "?"}`
    pesosStr += `\n⚖️ Eixo 2: ${pesoEixo2 != null ? pesoEixo2 + "kg" : "?"}`
    if (pesoTotal != null && pesoEixo1 != null && pesoEixo2 != null) {
      const soma = pesoEixo1 + pesoEixo2
      pesosStr += soma === pesoTotal
        ? `\n✅ Soma dos eixos confere.`
        : `\n⚠️ Eixo 1 + Eixo 2 = ${soma}kg ≠ Total ${pesoTotal}kg. Verificar.`
    }
  }

  let mensagem = `✅ Inspeção registada – Matrícula: ${matricula}, Data: ${formatDate(dataInspecao || "")}.${resultadoStr}${pesosStr}`

  const resultado = await correrDossierInspecao(ficheiroUrl)
  if (resultado) {
    mensagem += resultado.mensagem
  } else {
    mensagem += "\n⚠️ DAV não encontrado para esta matrícula – dossier não atualizado."
  }

  return NextResponse.json({
    tipo: "INSPECAO", inspecao, dados, matricula, mensagem,
  })
}

// ---------- VIN Plate ----------

async function processVINPlate(fileContent: ContentBlock, supabase: SupabaseClient) {
  const vinRes = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: [fileContent, { type: "text", text: VIN_PROMPT }],
    }],
  })

  const vin = vinRes.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text.trim()).join("")

  if (vin === "ILEGIVEL" || vin.length !== 17) {
    return NextResponse.json({ tipo: "VIN_PLATE", error: "VIN ilegível", vin_tentativa: vin })
  }

  const { data: obra } = await supabase.from("obras").select("id, estado, lugar_parque").eq("vin", vin).maybeSingle()
  const { data: lugaresLivres } = await supabase
    .from("lugares_parque").select("numero")
    .eq("ocupado", false).order("numero").limit(10)

  return NextResponse.json({
    tipo: "VIN_PLATE", vin,
    obra: obra || null,
    lugares_livres: (lugaresLivres || []).map((l) => l.numero),
    mensagem: obra
      ? `✅ VIN identificado: ${vin}\nObra ${obra.id} encontrada (${obra.estado}).`
      : `✅ VIN identificado: ${vin}\nNenhuma obra associada.`,
  })
}

// ---------- CIT ----------

async function processCIT(
  fileContent: ContentBlock,
  file: File,
  uploadedBy: string,
  supabase: SupabaseClient
) {
  const extractRes = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: [fileContent, { type: "text", text: CIT_PROMPT }],
    }],
  })

  const rawText = extractRes.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text).join("")

  let dados: Record<string, unknown>
  try {
    dados = JSON.parse(cleanJSON(rawText))
  } catch {
    return NextResponse.json({ tipo: "CIT", error: "Erro ao extrair dados do CIT", raw: rawText })
  }

  const numeroCit = dados.numero_cit as string | null

  if (numeroCit) {
    const { data: existing } = await supabase
      .from("cits").select("id").eq("numero_cit", numeroCit).maybeSingle()
    if (existing) {
      return NextResponse.json({
        tipo: "CIT", duplicado: true, cit_id: existing.id,
        mensagem: `⚠️ CIT ${numeroCit} já existe no sistema.`,
      })
    }
  }

  const ext = file.name.split(".").pop() || "pdf"
  const tipoCitTag = (dados.tipo_cit as string) === "prorrogacao" ? "PRORR" : "INIC"
  const nomeUtenteCit = ((dados.nome_utente as string) || "DESCONHECIDO").replace(/\s+/g, "-")
  const fileName = `CIT_${tipoCitTag}_${nomeUtenteCit}_${dados.data_inicio || "?"}_${dados.data_fim || "?"}_${Date.now()}.${ext}`

  await supabase.storage.from("documentos").upload(fileName, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
  })
  const { data: urlData } = await supabase.storage.from("documentos").createSignedUrl(fileName, 60 * 60 * 24 * 365)

  const nomeUtente = dados.nome_utente as string | null
  let matchedColaboradorId: string | null = null
  let matchedColaboradorNome: string | null = null

  if (nomeUtente) {
    const { data: colaboradores } = await supabase.from("colaboradores").select("id, nome").eq("ativo", true)
    if (colaboradores) {
      const nomeNorm = normalize(nomeUtente)
      for (const c of colaboradores) {
        const cNorm = normalize(c.nome)
        if (nomeNorm.includes(cNorm) || cNorm.includes(nomeNorm)) {
          matchedColaboradorId = c.id
          matchedColaboradorNome = c.nome
          break
        }
      }
    }
  }

  return NextResponse.json({
    tipo: "CIT_PREVIEW", dados,
    file_url: urlData?.signedUrl || "",
    file_path: fileName,
    colaborador_match: matchedColaboradorId ? { id: matchedColaboradorId, nome: matchedColaboradorNome } : null,
    numero_cit: numeroCit,
    mensagem: "🏥 CIT detectado. Confirma os dados extraídos:",
  })
}

// ---------- OUTRO ----------

async function processOUTRO(file: File, uploadedBy: string, supabase: SupabaseClient) {
  const fileName = `OUTRO_${file.name}`
  const arrayBuffer = await file.arrayBuffer()
  await supabase.storage.from("documentos").upload(fileName, Buffer.from(arrayBuffer), { contentType: file.type })
  const { data: urlData } = await supabase.storage.from("documentos").createSignedUrl(fileName, 60 * 60 * 24 * 365)

  const { data: doc } = await supabase.from("documentos_rh").insert({
    colaborador_id: uploadedBy,
    tipo: "outro",
    nome_ficheiro: file.name,
    url: urlData?.signedUrl || "",
    uploaded_by: uploadedBy,
  }).select().single()

  return NextResponse.json({
    tipo: "OUTRO", documento: doc,
    mensagem: "Documento carregado mas não identificado como DAV, FAM, CIT ou Inspeção. Guardado como genérico.",
  })
}
