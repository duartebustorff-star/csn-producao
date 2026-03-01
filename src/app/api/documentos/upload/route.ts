import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getServiceSupabase } from "@/lib/supabase"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---------- Prompts ----------

const IDENTIFY_PROMPT = `Analisa este documento. Identifica o tipo:
- "DAV" se for uma Declaração Aduaneira de Veículo (cabeçalho com logo AT — Autoridade Tributária e Aduaneira)
- "FAM" se for uma Folha de Aprovação de Modelo (cabeçalho com logo IMT — Instituto da Mobilidade e dos Transportes)
- "CIT" se for um Certificado de Incapacidade Temporária (documento da Segurança Social com dados de baixa médica)
- "VIN_PLATE" se for uma foto da placa VIN de um veículo
- "INSPECAO" se for um Relatório de Inspeção automóvel (cabeçalho com "Relatório de Inspeção", "Controlauto" ou centro de inspeção IMT, com dados de frenómetro/opacímetro/ripómetro)
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
Extrai o número VIN (Vehicle Identification Number) — são 17 caracteres alfanuméricos.
Responde APENAS com o VIN, sem explicações. Se não conseguires ler, responde "ILEGIVEL".`

const CIT_PROMPT = `Analisa este documento. É um Certificado de Incapacidade Temporária para o Trabalho (CIT) português.
Extrai TODOS os campos em JSON:
{
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
NOTA: Os pesos do frenómetro aparecem numa tabela. Peso estático e dinâmico total aparecem no final da secção do frenómetro. Os pesos por eixo aparecem nas linhas "Eixo 1" e "Eixo 2" nas colunas Esq/Dir/Total tanto para Estático como Dinâmico. Alguns relatórios têm banco de suspensões em vez de pesos no frenómetro — nesse caso o peso total aparece no banco de suspensões.
Se não conseguires ler algum campo, coloca null. Responde APENAS com JSON.`

// ---------- Helpers ----------

type ContentBlock = Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam

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
  // Remove ```json ... ``` or ``` ... ```
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/g, "")
  // Extract from first { to last }
  const start = s.indexOf("{")
  const end = s.lastIndexOf("}")
  if (start !== -1 && end !== -1 && end > start) {
    s = s.substring(start, end + 1)
  }
  return s
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

    // 1. Identify document type
    const identifyRes = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 50,
      messages: [{
        role: "user",
        content: [
          fileContent,
          { type: "text", text: IDENTIFY_PROMPT },
        ],
      }],
    })

    const docType = identifyRes.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text.trim().toUpperCase())
      .join("")

    const supabase = getServiceSupabase()

    // 2. Process based on type
    if (docType === "DAV") {
      return await processDAV(base64, fileContent, file, supabase)
    } else if (docType === "FAM") {
      return await processFAM(base64, fileContent, file, supabase)
    } else if (docType === "CIT") {
      return await processCIT(fileContent, file, uploadedBy, supabase)
    } else if (docType === "INSPECAO") {
      return await processINSPECAO(fileContent, file, uploadedBy, supabase)
    } else if (docType === "VIN_PLATE") {
      return await processVINPlate(fileContent, supabase)
    } else {
      return await processOUTRO(file, uploadedBy, supabase)
    }
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
  supabase: ReturnType<typeof getServiceSupabase>
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
  if (!vin) {
    return NextResponse.json({ tipo: "DAV", error: "VIN não encontrado no documento" })
  }

  // Upload file to storage
  const ext = file.name.split(".").pop() || "pdf"
  const mat = (dados.matricula as string) || "SEM-MATRICULA"
  const fileName = `DAV_${mat}_${vin}_${Date.now()}.${ext}`
  await supabase.storage.from("documentos").upload(fileName, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
  })
  const { data: urlData } = await supabase.storage.from("documentos").createSignedUrl(fileName, 60 * 60 * 24 * 365)

  // Upsert DAV (anti-duplicados por VIN)
  const davRecord: Record<string, unknown> = {
    ...dados,
    tipo_documento: undefined,
    url_ficheiro: urlData?.signedUrl || "",
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

  // Link to obra via VIN
  const { data: obra } = await supabase.from("obras").select("id").eq("vin", vin).maybeSingle()

  // Update obra matricula if available
  if (obra && dados.matricula) {
    await supabase.from("obras").update({ matricula: dados.matricula as string }).eq("id", obra.id)
  }

  const marcaModelo = [dados.marca, dados.modelo].filter(Boolean).join(" ")
  const mensagem = `✅ DAV ${existing ? "atualizado" : "registado"} — VIN: ${vin}`
    + (dados.matricula ? `, Matrícula: ${dados.matricula}` : "")
    + (marcaModelo ? `, ${marcaModelo}` : "")
    + (dados.cod_homologacao ? `\nHomologação: ${dados.cod_homologacao}` : "")
    + (obra ? `\nAssociado à obra ${obra.id}.` : "")

  return NextResponse.json({
    tipo: "DAV",
    dav,
    dados,
    obra_id: obra?.id || null,
    vin,
    matricula: dados.matricula || null,
    updated: !!existing,
    mensagem,
  })
}

// ---------- FAM ----------

async function processFAM(
  base64: string,
  fileContent: ContentBlock,
  file: File,
  supabase: ReturnType<typeof getServiceSupabase>
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

  if (!numHomologacao) {
    return NextResponse.json({ tipo: "FAM", error: "Número de homologação não encontrado" })
  }

  // Upload file
  const ext = file.name.split(".").pop() || "pdf"
  const fileName = `FAM_${numHomologacao || "DESCONHECIDO"}_${Date.now()}.${ext}`
  await supabase.storage.from("documentos").upload(fileName, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
  })
  const { data: urlData } = await supabase.storage.from("documentos").createSignedUrl(fileName, 60 * 60 * 24 * 365)

  const famRecord: Record<string, unknown> = {
    ...dados,
    tipo_documento: undefined,
    url_ficheiro: urlData?.signedUrl || "",
    dados_raw: dados,
    updated_at: new Date().toISOString(),
  }
  delete famRecord.tipo_documento

  // Upsert FAM
  const { data: existing } = await supabase
    .from("fams")
    .select("id")
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

  const marcaModelo = [dados.campo_0_1_marca, dados.campo_0_2_modelo].filter(Boolean).join(" ")
  const mensagem = `✅ FAM ${existing ? "atualizada" : "registada"} — Homologação: ${numHomologacao} ext. ${extensao}`
    + (marcaModelo ? `, ${marcaModelo}` : "")
    + (dados.campo_37_2_comprimento_exterior_max ? `\nComprimento máx: ${dados.campo_37_2_comprimento_exterior_max}mm` : "")
    + (dados.campo_37_6_largura_exterior_max ? `, Largura máx: ${dados.campo_37_6_largura_exterior_max}mm` : "")

  return NextResponse.json({
    tipo: "FAM",
    fam,
    dados,
    numero_homologacao: numHomologacao,
    extensao,
    updated: !!existing,
    anotacoes: dados.campo_50_anotacoes || null,
    mensagem,
  })
}

// ---------- VIN Plate ----------

async function processVINPlate(
  fileContent: ContentBlock,
  supabase: ReturnType<typeof getServiceSupabase>
) {
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

  // Find obra with this VIN
  const { data: obra } = await supabase.from("obras").select("id, estado, lugar_parque").eq("vin", vin).maybeSingle()

  // Find available parking spots
  const { data: lugaresLivres } = await supabase
    .from("lugares_parque")
    .select("numero")
    .eq("ocupado", false)
    .order("numero")
    .limit(10)

  const mensagem = obra
    ? `✅ VIN identificado: ${vin}\nObra ${obra.id} encontrada (${obra.estado}).`
    : `✅ VIN identificado: ${vin}\nNenhuma obra associada.`

  return NextResponse.json({
    tipo: "VIN_PLATE",
    vin,
    obra: obra || null,
    lugares_livres: (lugaresLivres || []).map((l) => l.numero),
    mensagem,
  })
}

// ---------- CIT ----------

async function processCIT(
  fileContent: ContentBlock,
  file: File,
  uploadedBy: string,
  supabase: ReturnType<typeof getServiceSupabase>
) {
  // 1. Extract CIT data via Claude Vision
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

  // 2. Anti-duplicate by numero_cit
  if (numeroCit) {
    const { data: existing } = await supabase
      .from("cits")
      .select("id")
      .eq("numero_cit", numeroCit)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        tipo: "CIT",
        duplicado: true,
        cit_id: existing.id,
        mensagem: `⚠️ CIT ${numeroCit} já existe no sistema. Não foi duplicado.`,
      })
    }
  }

  // 3. Upload file to storage
  const ext = file.name.split(".").pop() || "pdf"
  const nomeUtenteCit = ((dados.nome_utente as string) || "DESCONHECIDO").replace(/\s+/g, "-")
  const dataInicioCit = (dados.data_inicio as string) || String(Date.now())
  const fileName = `CIT_${nomeUtenteCit}_${dataInicioCit}_${Date.now()}.${ext}`
  await supabase.storage.from("documentos").upload(fileName, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
  })
  const { data: urlData } = await supabase.storage.from("documentos").createSignedUrl(fileName, 60 * 60 * 24 * 365)

  // 4. Fuzzy match nome_utente against colaboradores
  const nomeUtente = dados.nome_utente as string | null
  let matchedColaboradorId: string | null = null
  let matchedColaboradorNome: string | null = null

  if (nomeUtente) {
    const { data: colaboradores } = await supabase
      .from("colaboradores")
      .select("id, nome")
      .eq("ativo", true)

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

  // 5. Insert CIT record
  const citRecord = {
    numero_cit: numeroCit,
    data_inicio: (dados.data_inicio as string) || null,
    data_fim: (dados.data_fim as string) || null,
    numero_dias: (dados.numero_dias as number) || null,
    motivo: (dados.motivo as string) || null,
    medico_nome: (dados.medico_nome as string) || null,
    medico_cedula: (dados.medico_cedula as string) || null,
    unidade_saude: (dados.unidade_saude as string) || null,
    nif_utente: (dados.nif_utente as string) || null,
    nome_utente: nomeUtente,
    nuss: (dados.nuss as string) || null,
    situacao: (dados.situacao as string) || null,
    url_ficheiro: urlData?.signedUrl || "",
    dados_raw: dados,
    uploaded_by: uploadedBy,
    colaborador_id: matchedColaboradorId,
    updated_at: new Date().toISOString(),
  }

  const { data: cit, error: insertError } = await supabase
    .from("cits")
    .insert(citRecord)
    .select()
    .single()

  if (insertError) {
    console.error("CIT insert error:", insertError)
    return NextResponse.json({ tipo: "CIT", error: "Erro ao registar CIT" }, { status: 500 })
  }

  // 6. Auto-create ausencia if dates found and collaborator matched
  let ausencia = null
  if (matchedColaboradorId && dados.data_inicio && dados.data_fim) {
    const { data: ausenciaData } = await supabase
      .from("ausencias")
      .insert({
        colaborador_id: matchedColaboradorId,
        data_inicio: dados.data_inicio,
        data_fim: dados.data_fim,
        tipo: "baixa",
        notas: `CIT ${numeroCit || "s/n"} — ${dados.numero_dias || "?"} dias (extração automática)`,
        aprovado: true,
      })
      .select()
      .single()

    ausencia = ausenciaData

    // Link ausencia back to CIT
    if (ausenciaData) {
      await supabase.from("cits").update({ ausencia_id: ausenciaData.id }).eq("id", cit.id)
    }
  }

  // 7. Build response message
  const dataInicioFmt = dados.data_inicio ? formatDate(dados.data_inicio as string) : "?"
  const dataFimFmt = dados.data_fim ? formatDate(dados.data_fim as string) : "?"

  let mensagem = `✅ CIT registado`
  if (matchedColaboradorNome) {
    mensagem += ` — ${matchedColaboradorNome}`
  } else if (nomeUtente) {
    mensagem += ` — ${nomeUtente}`
  }
  if (dados.numero_dias) {
    mensagem += `, ${dados.numero_dias} dias (${dataInicioFmt} a ${dataFimFmt})`
  }
  if (matchedColaboradorId && ausencia) {
    mensagem += `\nAusência criada automaticamente.`
  } else if (nomeUtente && !matchedColaboradorId) {
    mensagem += `\n⚠️ Não foi possível associar "${nomeUtente}" a nenhum colaborador. Ausência não criada.`
  }

  return NextResponse.json({
    tipo: "CIT",
    cit,
    dados,
    colaborador_match: matchedColaboradorId
      ? { id: matchedColaboradorId, nome: matchedColaboradorNome }
      : null,
    ausencia,
    mensagem,
  })
}

// ---------- INSPECAO ----------

async function processINSPECAO(
  fileContent: ContentBlock,
  file: File,
  uploadedBy: string,
  supabase: ReturnType<typeof getServiceSupabase>
) {
  // 1. Extract inspection data via Claude Vision
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
  if (!matricula) {
    return NextResponse.json({ tipo: "INSPECAO", error: "Matrícula não encontrada no documento" })
  }

  const dataInspecao = dados.data_inspecao as string | null

  // 2. Anti-duplicate by matricula + data_inspecao
  if (dataInspecao) {
    const { data: existing } = await supabase
      .from("inspecoes")
      .select("id")
      .eq("matricula", matricula)
      .eq("data_inspecao", dataInspecao)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        tipo: "INSPECAO",
        duplicado: true,
        inspecao_id: existing.id,
        mensagem: `⚠️ Inspeção de ${matricula} em ${formatDate(dataInspecao)} já existe no sistema. Não foi duplicada.`,
      })
    }
  }

  // 3. Upload file to storage
  const ext = file.name.split(".").pop() || "pdf"
  const fileName = `INSP_${matricula}_${dataInspecao ? dataInspecao.split("T")[0] : Date.now()}.${ext}`
  await supabase.storage.from("documentos").upload(fileName, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
  })
  const { data: urlData } = await supabase.storage.from("documentos").createSignedUrl(fileName, 60 * 60 * 24 * 365)

  // 4. Insert into inspecoes table
  const inspecaoRecord: Record<string, unknown> = {
    matricula,
    data_inspecao: dataInspecao,
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
    url_ficheiro: urlData?.signedUrl || "",
    dados_raw: dados,
    uploaded_by: uploadedBy,
    updated_at: new Date().toISOString(),
  }

  const { data: inspecao, error: insertError } = await supabase
    .from("inspecoes")
    .insert(inspecaoRecord)
    .select()
    .single()

  if (insertError) {
    console.error("Inspecao insert error:", insertError)
    return NextResponse.json({ tipo: "INSPECAO", error: "Erro ao registar inspeção" }, { status: 500 })
  }

  // 5. Build response message
  const dataFmt = dataInspecao ? formatDate(dataInspecao) : "?"
  const resultadoStr = dados.resultado ? ` Resultado: ${(dados.resultado as string).toUpperCase()}.` : ""

  const pesoTotal = dados.peso_estatico_total as number | null
  const pesoEixo1 = dados.peso_estatico_eixo1_total as number | null
  const pesoEixo2 = dados.peso_estatico_eixo2_total as number | null

  let pesosStr = `\n⚖️ Peso estático total: ${pesoTotal != null ? `${pesoTotal}kg` : "?"}`
  pesosStr += `\n⚖️ Peso estático total eixo 1: ${pesoEixo1 != null ? `${pesoEixo1}kg` : "?"}`
  pesosStr += `\n⚖️ Peso estático total eixo 2: ${pesoEixo2 != null ? `${pesoEixo2}kg` : "?"}`

  if (pesoTotal != null && pesoEixo1 != null && pesoEixo2 != null) {
    const soma = pesoEixo1 + pesoEixo2
    if (soma === pesoTotal) {
      pesosStr += `\n✅ Soma dos eixos confere.`
    } else {
      pesosStr += `\n⚠️ ATENÇÃO: Eixo 1 + Eixo 2 = ${soma}kg ≠ Total ${pesoTotal}kg. Verificar leitura do documento.`
    }
  } else {
    pesosStr += `\n⚠️ Não foi possível validar — valores em falta.`
  }

  const mensagem = `✅ Inspeção registada — Matrícula: ${matricula}, Data: ${dataFmt}.${resultadoStr}${pesosStr}`

  return NextResponse.json({
    tipo: "INSPECAO",
    inspecao,
    dados,
    matricula,
    mensagem,
  })
}

// ---------- OUTRO ----------

async function processOUTRO(
  file: File,
  uploadedBy: string,
  supabase: ReturnType<typeof getServiceSupabase>
) {
  // Upload to storage
  const fileName = `OUTRO_${file.name}`
  const arrayBuffer = await file.arrayBuffer()
  await supabase.storage.from("documentos").upload(fileName, Buffer.from(arrayBuffer), {
    contentType: file.type,
  })
  const { data: urlData } = await supabase.storage.from("documentos").createSignedUrl(fileName, 60 * 60 * 24 * 365)

  // Store in documentos_rh as generic
  const { data: doc } = await supabase
    .from("documentos_rh")
    .insert({
      colaborador_id: uploadedBy,
      tipo: "outro",
      nome_ficheiro: file.name,
      url: urlData?.signedUrl || "",
      uploaded_by: uploadedBy,
    })
    .select()
    .single()

  return NextResponse.json({
    tipo: "OUTRO",
    documento: doc,
    mensagem: `Documento carregado mas não identifiquei como DAV, FAM ou CIT. Guardado como documento genérico.`,
  })
}

// ---------- Utils ----------

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-")
    return `${d}/${m}/${y}`
  } catch {
    return dateStr
  }
}
