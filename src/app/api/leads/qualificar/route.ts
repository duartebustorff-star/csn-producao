import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { audit } from "@/lib/audit"

/**
 * POST /api/leads/qualificar
 * Cria lead qualificada apos os 3 portoes da Marta.
 * Body: todos os campos do veiculo + configuracao + contacto
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getServiceSupabase()

    // Portao 1: dados do veiculo (obrigatorio)
    if (!body.veiculo_marca || !body.veiculo_modelo) {
      return NextResponse.json({ error: "Portão 1: dados do veículo obrigatórios (marca, modelo)" }, { status: 400 })
    }

    // Portao 2: configuracao (obrigatorio)
    if (!body.tipo_carrocaria) {
      return NextResponse.json({ error: "Portão 2: tipo de carroçaria obrigatório" }, { status: 400 })
    }

    // Portao 3: contacto (obrigatorio)
    if (!body.contacto_nome || !body.contacto_telefone || !body.contacto_email) {
      return NextResponse.json({ error: "Portão 3: nome, telefone e email obrigatórios" }, { status: 400 })
    }

    // Validacoes automaticas
    const validacoes: Record<string, unknown>[] = []
    const pbt = body.veiculo_pbt || body.pbt
    const tara = body.veiculo_tara || body.tara

    if (body.medidas_largura && body.medidas_largura > 2550) {
      validacoes.push({ campo: "largura", erro: "Largura excede limite legal de 2.550mm (Dir. 96/53/CE)", valor: body.medidas_largura })
    }
    if (body.medidas_altura && body.medidas_altura > 4000) {
      validacoes.push({ campo: "altura", erro: "Altura total excede limite legal de 4.000mm", valor: body.medidas_altura })
    }
    if (pbt && tara) {
      const payload = pbt - tara - (body.peso_carrocaria || 0)
      if (payload < 0) {
        validacoes.push({ campo: "payload", erro: "Payload negativo (PBT - tara - peso carroçaria < 0)", valor: payload })
      }
    }

    const temErros = validacoes.some((v) => v.erro)
    if (temErros) {
      return NextResponse.json({
        ok: false,
        error: "Validação falhou",
        validacoes,
      }, { status: 422 })
    }

    // Generate lead ID
    const { count } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
    const leadNum = (count || 0) + 1
    const leadId = `L${new Date().getFullYear()}-${String(leadNum).padStart(3, "0")}`

    // Calculate payload if data available
    const payloadCalc = pbt && tara ? pbt - tara : null

    const leadData = {
      id: leadId,
      cliente: body.contacto_nome,
      cliente_final: body.cliente_final || null,
      contacto_nome: body.contacto_nome,
      contacto_telefone: body.contacto_telefone,
      contacto_email: body.contacto_email,
      empresa: body.empresa || null,
      tipo_carrocaria: body.tipo_carrocaria,
      tipo_taipais: body.tipo_taipais || null,
      veiculo_marca: body.veiculo_marca,
      veiculo_modelo: body.veiculo_modelo,
      veiculo_versao: body.veiculo_versao || null,
      veiculo_novo: body.tipo_veiculo === "novo",
      matricula: body.matricula || null,
      vin: body.vin || null,
      pbt: pbt || null,
      tara: tara || null,
      veiculo_pbt: pbt || null,
      veiculo_tara: tara || null,
      veiculo_entre_eixos: body.veiculo_entre_eixos || body.distancia_entre_eixos || null,
      veiculo_cabine: body.veiculo_cabine || null,
      veiculo_num_eixos: body.veiculo_num_eixos || null,
      tipo_veiculo: body.tipo_veiculo || null,
      tipo_cliente: body.tipo_cliente || "final",
      tipo_trabalho: body.tipo_trabalho || "carrocamento_novo",
      medidas_comprimento: body.medidas_comprimento || null,
      medidas_largura: body.medidas_largura || null,
      medidas_altura: body.medidas_altura || null,
      material: body.material || null,
      acessorios: body.acessorios || [],
      payload_calculado: payloadCalc,
      validacao_resultado: { validacoes, ok: !temErros },
      necessita_inspeccao_imt: body.necessita_inspeccao_imt || false,
      canal_origem: body.canal_origem || null,
      ticket_id: body.ticket_id || null,
      cliente_id: body.cliente_id || null,
      estado: "em_orcamentacao",
      estado_pipeline: "qualificada",
      api_matricula_response: body.api_matricula_response || null,
      api_vin_response: body.api_vin_response || null,
      quantidade: body.quantidade || 1,
    }

    const { data: lead, error } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single()

    if (error) {
      console.error("leads qualificar insert:", error)
      return NextResponse.json({ error: "Erro ao criar lead qualificada", detalhe: error.message }, { status: 500 })
    }

    await audit({
      entidade_tipo: "lead",
      entidade_id: leadId,
      acao: "criar",
      utilizador_id: "sistema",
      metadata: {
        estado_pipeline: "qualificada",
        tipo_carrocaria: body.tipo_carrocaria,
        canal_origem: body.canal_origem,
      },
    })

    return NextResponse.json({ ok: true, lead }, { status: 201 })
  } catch (e) {
    console.error("leads/qualificar error:", e)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
