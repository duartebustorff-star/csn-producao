import { getServiceSupabase } from "./supabase"
import { audit } from "./audit"

const supabase = getServiceSupabase()

// ============================================
// TOOL DEFINITIONS (para enviar ao Claude API)
// ============================================

export const CLAUDE_TOOLS = [
  {
    name: "consultar_tarefas",
    description: "Consulta as tarefas pendentes e em curso do colaborador atual",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "estado_obra",
    description: "Mostra o estado detalhado de uma obra específica",
    input_schema: {
      type: "object" as const,
      properties: {
        obra_id: { type: "string" as const, description: "ID da obra, ex: 2025-007" },
      },
      required: ["obra_id"],
    },
  },
  {
    name: "iniciar_timer",
    description: "Inicia o timer de trabalho para uma fase específica",
    input_schema: {
      type: "object" as const,
      properties: {
        obra_id: { type: "string" as const },
        fase_id: { type: "number" as const },
      },
      required: ["obra_id", "fase_id"],
    },
  },
  {
    name: "parar_timer",
    description: "Para o timer ativo e regista o tempo",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "concluir_fase",
    description: "Marca uma fase como concluída e avança para a próxima",
    input_schema: {
      type: "object" as const,
      properties: {
        obra_id: { type: "string" as const },
        fase_id: { type: "number" as const },
      },
      required: ["obra_id", "fase_id"],
    },
  },
  {
    name: "adicionar_nota",
    description: "Adiciona uma nota/observação a uma obra",
    input_schema: {
      type: "object" as const,
      properties: {
        obra_id: { type: "string" as const },
        texto: { type: "string" as const },
        tipo: { type: "string" as const, enum: ["nota", "problema", "material"] },
      },
      required: ["obra_id", "texto"],
    },
  },
  {
    name: "listar_obras",
    description: "Lista todas as obras em produção com progresso",
    input_schema: {
      type: "object" as const,
      properties: {
        estado: { type: "string" as const, enum: ["espera", "producao", "concluida", "todas"] },
      },
    },
  },
  {
    name: "registar_ausencia",
    description: "Regista uma ausência (férias, baixa médica, falta) para um colaborador",
    input_schema: {
      type: "object" as const,
      properties: {
        colaborador_id: { type: "string" as const, description: "ID do colaborador (se omitido, usa o atual)" },
        data_inicio: { type: "string" as const, description: "Data início YYYY-MM-DD" },
        data_fim: { type: "string" as const, description: "Data fim YYYY-MM-DD" },
        tipo: { type: "string" as const, enum: ["ferias", "baixa", "falta_justificada", "falta_injustificada"] },
        notas: { type: "string" as const },
      },
      required: ["data_inicio", "data_fim", "tipo"],
    },
  },
  {
    name: "consultar_ausencias",
    description: "Consulta ausências ativas ou futuras de um colaborador ou de todos",
    input_schema: {
      type: "object" as const,
      properties: {
        colaborador_id: { type: "string" as const, description: "ID do colaborador (omitir para ver todos)" },
      },
    },
  },
  {
    name: "verificar_documentacao",
    description: "Verifica se uma obra tem DAV e FAM completos. Procura por VIN.",
    input_schema: {
      type: "object" as const,
      properties: {
        obra_id: { type: "string" as const, description: "ID da obra (ex: L2026-001-01)" },
      },
      required: ["obra_id"],
    },
  },
  {
    name: "receber_veiculo",
    description: "Regista a receção de um veículo no parque. Atribui lugar de parque.",
    input_schema: {
      type: "object" as const,
      properties: {
        vin: { type: "string" as const, description: "VIN do veículo (17 caracteres)" },
        lugar_parque: { type: "number" as const, description: "Número do lugar de parque (1-50)" },
      },
      required: ["vin", "lugar_parque"],
    },
  },
  {
    name: "ver_parque",
    description: "Mostra o estado do parque — lugares ocupados e livres",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "criar_lead",
    description: "Cria uma nova lead/pedido de orçamento no sistema CRM. Usar quando o cliente forneceu informação suficiente (mínimo: nome, contacto, marca/modelo, tipo de trabalho).",
    input_schema: {
      type: "object" as const,
      properties: {
        cliente: { type: "string" as const, description: "Nome do cliente" },
        contacto_telefone: { type: "string" as const },
        contacto_email: { type: "string" as const },
        contacto_email_empresa: { type: "string" as const },
        empresa: { type: "string" as const },
        morada: { type: "string" as const },
        veiculo_novo: { type: "boolean" as const, description: "true = veículo novo, false = usado" },
        veiculo_marca: { type: "string" as const },
        veiculo_modelo: { type: "string" as const },
        veiculo_variante: { type: "string" as const },
        vin: { type: "string" as const },
        matricula: { type: "string" as const },
        pbt: { type: "number" as const, description: "Peso Bruto Total em kg" },
        tara: { type: "number" as const, description: "Tara em kg" },
        rodado: { type: "string" as const, enum: ["simples", "duplo"] },
        tipo_carrocaria: { type: "string" as const, description: "Ex: Caixa Aberta, Basculante, Estrado, Furgão" },
        dimensoes: { type: "string" as const, description: "Ex: 3200x2080mm" },
        plataforma_elevatoria: { type: "boolean" as const },
        grua_coluna: { type: "boolean" as const },
        notas: { type: "string" as const },
      },
      required: ["cliente", "veiculo_marca", "veiculo_modelo", "tipo_carrocaria"],
    },
  },
]

// ============================================
// TOOL HANDLERS
// ============================================

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  colaboradorId: string
): Promise<string> {
  switch (toolName) {
    case "consultar_tarefas":
      return consultarTarefas(colaboradorId)
    case "estado_obra":
      return estadoObra(toolInput.obra_id as string)
    case "iniciar_timer":
      return iniciarTimer(colaboradorId, toolInput.obra_id as string, toolInput.fase_id as number)
    case "parar_timer":
      return pararTimer(colaboradorId)
    case "concluir_fase":
      return concluirFase(colaboradorId, toolInput.obra_id as string, toolInput.fase_id as number)
    case "adicionar_nota":
      return adicionarNota(
        toolInput.obra_id as string,
        colaboradorId,
        toolInput.texto as string,
        (toolInput.tipo as string) || "nota"
      )
    case "listar_obras":
      return listarObras((toolInput.estado as string) || "todas")
    case "registar_ausencia":
      return registarAusencia(
        (toolInput.colaborador_id as string) || colaboradorId,
        toolInput.data_inicio as string,
        toolInput.data_fim as string,
        toolInput.tipo as string,
        (toolInput.notas as string) || undefined
      )
    case "consultar_ausencias":
      return consultarAusencias((toolInput.colaborador_id as string) || undefined)
    case "verificar_documentacao":
      return verificarDocumentacao(toolInput.obra_id as string)
    case "receber_veiculo":
      return receberVeiculo(toolInput.vin as string, toolInput.lugar_parque as number)
    case "ver_parque":
      return verParque()
    case "criar_lead":
      return criarLead(toolInput, colaboradorId)
    default:
      return JSON.stringify({ error: `Tool desconhecida: ${toolName}` })
  }
}

async function consultarTarefas(colaboradorId: string): Promise<string> {
  const { data: fases } = await supabase
    .from("fases_obra")
    .select("*, obras(id, cliente, tipo)")
    .eq("responsavel", colaboradorId)
    .in("estado", ["em_curso", "pendente"])
    .order("estado", { ascending: true })
    .order("fase_numero", { ascending: true })

  if (!fases || fases.length === 0) {
    return JSON.stringify({ tarefas: [], mensagem: "Sem tarefas pendentes" })
  }

  const emCurso = fases.filter((f) => f.estado === "em_curso")
  const pendentes = fases.filter((f) => f.estado === "pendente")

  return JSON.stringify({ em_curso: emCurso, pendentes })
}

async function estadoObra(obraId: string): Promise<string> {
  const { data: obra } = await supabase
    .from("obras")
    .select("*, fases_obra(*), leads(cliente, tipo_carrocaria, tipo_taipais)")
    .eq("id", obraId)
    .single()

  if (!obra) return JSON.stringify({ error: "Obra não encontrada" })

  const fases = obra.fases_obra || []
  const concluidas = fases.filter((f: { estado: string }) => f.estado === "concluido").length
  const total = fases.length
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0

  return JSON.stringify({
    id: obra.id,
    lead_id: obra.lead_id,
    vin: obra.vin,
    matricula: obra.matricula,
    lugar_parque: obra.lugar_parque,
    estado: obra.estado,
    lead: obra.leads,
    fases: obra.fases_obra,
    progresso: `${progresso}%`,
  })
}

async function iniciarTimer(
  colaboradorId: string,
  obraId: string,
  faseId: number
): Promise<string> {
  // Verificar se já tem timer ativo
  const { data: timerAtivo } = await supabase
    .from("timetracking")
    .select("*")
    .eq("colaborador_id", colaboradorId)
    .is("fim", null)
    .maybeSingle()

  if (timerAtivo) {
    return JSON.stringify({
      error: "Já tens um timer ativo. Para o timer atual antes de iniciar outro.",
      timer_ativo: timerAtivo,
    })
  }

  // Criar timer
  const { data: timer, error } = await supabase
    .from("timetracking")
    .insert({
      colaborador_id: colaboradorId,
      obra_id: obraId,
      fase_obra_id: faseId,
      inicio: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return JSON.stringify({ error: "Erro ao iniciar timer" })

  // Marcar fase como em_curso se estava pendente
  await supabase
    .from("fases_obra")
    .update({ estado: "em_curso", started_at: new Date().toISOString() })
    .eq("id", faseId)
    .eq("estado", "pendente")

  await audit({
    entidade_tipo: "timer", entidade_id: String(timer.id),
    acao: "criar", utilizador_id: colaboradorId,
    metadata: { obra_id: obraId, fase_id: faseId },
  })

  return JSON.stringify({ sucesso: true, timer })
}

async function pararTimer(colaboradorId: string): Promise<string> {
  const { data: timer } = await supabase
    .from("timetracking")
    .select("*")
    .eq("colaborador_id", colaboradorId)
    .is("fim", null)
    .maybeSingle()

  if (!timer) {
    return JSON.stringify({ error: "Não tens nenhum timer ativo" })
  }

  const fim = new Date()
  const inicio = new Date(timer.inicio)
  const duracaoMinutos = Math.round(((fim.getTime() - inicio.getTime()) / 60000) * 100) / 100

  // Atualizar timer
  await supabase
    .from("timetracking")
    .update({ fim: fim.toISOString(), duracao_minutos: duracaoMinutos })
    .eq("id", timer.id)

  // Somar horas à fase
  const duracaoHoras = Math.round((duracaoMinutos / 60) * 100) / 100
  const { data: fase } = await supabase
    .from("fases_obra")
    .select("horas_reais")
    .eq("id", timer.fase_obra_id)
    .single()

  if (fase) {
    await supabase
      .from("fases_obra")
      .update({ horas_reais: (fase.horas_reais || 0) + duracaoHoras })
      .eq("id", timer.fase_obra_id)
  }

  await audit({
    entidade_tipo: "timer", entidade_id: String(timer.id),
    acao: "atualizar", campo_alterado: "fim",
    valor_novo: String(duracaoMinutos) + " min",
    utilizador_id: colaboradorId,
  })

  return JSON.stringify({
    sucesso: true,
    duracao_minutos: duracaoMinutos,
    duracao_formatada: formatDuration(duracaoMinutos),
  })
}

async function concluirFase(
  colaboradorId: string,
  obraId: string,
  faseId: number
): Promise<string> {
  // Parar timer se ativo nesta fase
  const { data: timerAtivo } = await supabase
    .from("timetracking")
    .select("*")
    .eq("colaborador_id", colaboradorId)
    .eq("fase_obra_id", faseId)
    .is("fim", null)
    .maybeSingle()

  if (timerAtivo) {
    await pararTimer(colaboradorId)
  }

  // Marcar fase como concluída
  const { error } = await supabase
    .from("fases_obra")
    .update({ estado: "concluido", completed_at: new Date().toISOString() })
    .eq("id", faseId)

  if (error) return JSON.stringify({ error: "Erro ao concluir fase" })

  await audit({
    entidade_tipo: "fase_obra", entidade_id: String(faseId),
    acao: "mudar_estado", campo_alterado: "estado",
    valor_anterior: "em_curso", valor_novo: "concluido",
    utilizador_id: colaboradorId, metadata: { obra_id: obraId },
  })

  // Buscar próxima fase da mesma obra
  const { data: faseAtual } = await supabase
    .from("fases_obra")
    .select("fase_numero")
    .eq("id", faseId)
    .single()

  let proximaFase = null
  if (faseAtual) {
    const { data: proxima } = await supabase
      .from("fases_obra")
      .select("*")
      .eq("obra_id", obraId)
      .eq("fase_numero", faseAtual.fase_numero + 1)
      .single()

    if (proxima) {
      await supabase
        .from("fases_obra")
        .update({ estado: "em_curso", started_at: new Date().toISOString() })
        .eq("id", proxima.id)
      proximaFase = proxima
    } else {
      // Verificar se todas as fases estão concluídas
      const { data: fasesPendentes } = await supabase
        .from("fases_obra")
        .select("id")
        .eq("obra_id", obraId)
        .neq("estado", "concluido")

      if (!fasesPendentes || fasesPendentes.length === 0) {
        await supabase
          .from("obras")
          .update({ estado: "concluida", updated_at: new Date().toISOString() })
          .eq("id", obraId)
        await audit({
          entidade_tipo: "obra", entidade_id: obraId,
          acao: "mudar_estado", campo_alterado: "estado",
          valor_anterior: "producao", valor_novo: "concluida",
          utilizador_id: colaboradorId,
        })
      }
    }
  }

  return JSON.stringify({
    sucesso: true,
    fase_concluida: faseId,
    proxima_fase: proximaFase,
  })
}

async function adicionarNota(
  obraId: string,
  colaboradorId: string,
  texto: string,
  tipo: string
): Promise<string> {
  const { data, error } = await supabase
    .from("notas_obra")
    .insert({ obra_id: obraId, colaborador_id: colaboradorId, texto, tipo })
    .select()
    .single()

  if (error) return JSON.stringify({ error: "Erro ao adicionar nota" })

  await audit({
    entidade_tipo: "nota", entidade_id: String(data.id),
    acao: "criar", utilizador_id: colaboradorId,
    metadata: { obra_id: obraId, tipo },
  })

  return JSON.stringify({ sucesso: true, nota: data })
}

async function listarObras(estado: string): Promise<string> {
  let query = supabase
    .from("obras")
    .select("*, fases_obra(*), leads(cliente, tipo_carrocaria)")
    .order("created_at", { ascending: false })

  if (estado && estado !== "todas") {
    query = query.eq("estado", estado)
  }

  const { data: obras } = await query

  if (!obras) return JSON.stringify({ obras: [] })

  const obrasComProgresso = obras.map((obra) => {
    const fases = obra.fases_obra || []
    const concluidas = fases.filter((f: { estado: string }) => f.estado === "concluido").length
    const total = fases.length
    const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0
    const lead = obra.leads as { cliente: string; tipo_carrocaria: string } | null
    return {
      id: obra.id,
      lead_id: obra.lead_id,
      vin: obra.vin,
      cliente: lead?.cliente || "—",
      tipo: lead?.tipo_carrocaria || "—",
      estado: obra.estado,
      lugar_parque: obra.lugar_parque,
      progresso: `${progresso}%`,
      fases_concluidas: `${concluidas}/${total}`,
    }
  })

  return JSON.stringify({ obras: obrasComProgresso })
}

async function registarAusencia(
  colaboradorId: string,
  dataInicio: string,
  dataFim: string,
  tipo: string,
  notas?: string
): Promise<string> {
  const { data, error } = await supabase
    .from("ausencias")
    .insert({
      colaborador_id: colaboradorId,
      data_inicio: dataInicio,
      data_fim: dataFim,
      tipo,
      notas,
      aprovado: tipo === "baixa", // baixas auto-aprovadas
    })
    .select()
    .single()

  if (error) return JSON.stringify({ error: "Erro ao registar ausência" })

  await audit({
    entidade_tipo: "ausencia", entidade_id: String(data.id),
    acao: "criar", utilizador_id: colaboradorId,
    metadata: { tipo, data_inicio: dataInicio, data_fim: dataFim },
  })

  return JSON.stringify({
    sucesso: true,
    ausencia: data,
    mensagem: tipo === "baixa"
      ? "Baixa registada. Se tiveres o CIT, envia-o pelo menu RH para extração automática."
      : "Ausência registada com sucesso.",
  })
}

async function consultarAusencias(colaboradorId?: string): Promise<string> {
  const today = new Date().toISOString().split("T")[0]

  let query = supabase
    .from("ausencias")
    .select("*, colaboradores(nome)")
    .gte("data_fim", today)
    .order("data_inicio", { ascending: true })

  if (colaboradorId) {
    query = query.eq("colaborador_id", colaboradorId)
  }

  const { data } = await query

  if (!data || data.length === 0) {
    return JSON.stringify({ ausencias: [], mensagem: "Sem ausências ativas ou futuras" })
  }

  return JSON.stringify({ ausencias: data })
}

async function verificarDocumentacao(obraId: string): Promise<string> {
  const { data: obra } = await supabase
    .from("obras")
    .select("id, vin, matricula, lead_id")
    .eq("id", obraId)
    .single()

  if (!obra) return JSON.stringify({ error: "Obra não encontrada" })
  if (!obra.vin) return JSON.stringify({ obra_id: obraId, status: "sem_vin", mensagem: "Obra sem VIN atribuído" })

  // Check DAV
  const { data: dav } = await supabase
    .from("davs")
    .select("id, cod_homologacao, matricula, marca, modelo, completo")
    .eq("vin", obra.vin)
    .maybeSingle()

  if (!dav) {
    return JSON.stringify({
      obra_id: obraId,
      vin: obra.vin,
      dav: false,
      fam: false,
      mensagem: `Falta DAV para VIN ${obra.vin}`,
    })
  }

  // Check FAM
  let fam = null
  if (dav.cod_homologacao) {
    const { data: famData } = await supabase
      .from("fams")
      .select("id, numero_homologacao_nacional, extensao, campo_50_anotacoes")
      .eq("numero_homologacao_nacional", dav.cod_homologacao)
      .maybeSingle()
    fam = famData
  }

  return JSON.stringify({
    obra_id: obraId,
    vin: obra.vin,
    dav: { existe: true, completo: dav.completo, matricula: dav.matricula },
    fam: fam
      ? { existe: true, anotacoes: fam.campo_50_anotacoes }
      : { existe: false, mensagem: `Falta FAM para homologação ${dav.cod_homologacao}` },
  })
}

async function receberVeiculo(vin: string, lugarParque: number): Promise<string> {
  // Find obra
  const { data: obra } = await supabase
    .from("obras")
    .select("id, estado")
    .eq("vin", vin)
    .maybeSingle()

  if (!obra) return JSON.stringify({ error: `Nenhuma obra encontrada para VIN ${vin}` })

  // Check spot
  const { data: lugar } = await supabase
    .from("lugares_parque")
    .select("ocupado")
    .eq("numero", lugarParque)
    .single()

  if (!lugar) return JSON.stringify({ error: `Lugar ${lugarParque} não existe` })
  if (lugar.ocupado) return JSON.stringify({ error: `Lugar ${lugarParque} já está ocupado` })

  // Assign
  await supabase
    .from("lugares_parque")
    .update({ ocupado: true, obra_id: obra.id, updated_at: new Date().toISOString() })
    .eq("numero", lugarParque)

  await supabase
    .from("obras")
    .update({ lugar_parque: lugarParque, estado: "veiculo_recebido", updated_at: new Date().toISOString() })
    .eq("id", obra.id)

  await audit({
    entidade_tipo: "obra", entidade_id: obra.id,
    acao: "mudar_estado", campo_alterado: "estado",
    valor_anterior: obra.estado, valor_novo: "veiculo_recebido",
    utilizador_id: "system", metadata: { vin, lugar_parque: lugarParque },
  })

  return JSON.stringify({
    sucesso: true,
    obra_id: obra.id,
    vin,
    lugar_parque: lugarParque,
    mensagem: `Veículo VIN ${vin} recebido no lugar ${lugarParque} (obra ${obra.id})`,
  })
}

async function verParque(): Promise<string> {
  const { data: lugares } = await supabase
    .from("lugares_parque")
    .select("numero, ocupado, obra_id")
    .order("numero")

  if (!lugares) return JSON.stringify({ error: "Erro ao consultar parque" })

  const ocupados = lugares.filter((l) => l.ocupado)
  const livres = lugares.filter((l) => !l.ocupado).map((l) => l.numero)

  return JSON.stringify({
    total: lugares.length,
    ocupados: ocupados.length,
    livres: livres.length,
    primeiros_livres: livres.slice(0, 10),
    detalhes_ocupados: ocupados.map((l) => ({ lugar: l.numero, obra: l.obra_id })),
  })
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

async function criarLead(
  input: Record<string, unknown>,
  colaboradorId: string
): Promise<string> {
  const ano = new Date().getFullYear()
  const prefix = `L${ano}-`

  // 1. Gerar ID sequencial
  const { data: lastLead } = await supabase
    .from("leads")
    .select("id")
    .like("id", `${prefix}%`)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle()

  let nextNum = 1
  if (lastLead) {
    const lastNum = parseInt(lastLead.id.replace(prefix, ""), 10)
    if (!isNaN(lastNum)) nextNum = lastNum + 1
  }
  const leadId = `${prefix}${String(nextNum).padStart(3, "0")}`

  // 2. Verificar duplicados por matrícula ou VIN
  const matricula = input.matricula as string | undefined
  const vin = input.vin as string | undefined

  if (matricula || vin) {
    let dupQuery = supabase.from("leads").select("id, cliente")
    if (matricula) dupQuery = dupQuery.eq("matricula", matricula)
    else if (vin) dupQuery = dupQuery.eq("vin", vin)

    const { data: duplicados } = await dupQuery
    if (duplicados && duplicados.length > 0) {
      return JSON.stringify({
        sucesso: false,
        error: "duplicado",
        lead_existente: duplicados[0].id,
        cliente: duplicados[0].cliente,
        mensagem: `Já existe uma lead (${duplicados[0].id}) para ${matricula ? `matrícula ${matricula}` : `VIN ${vin}`} do cliente ${duplicados[0].cliente}.`,
      })
    }
  }

  // 3. Inserir na tabela leads
  const { error } = await supabase.from("leads").insert({
    id: leadId,
    cliente: input.cliente as string,
    contacto_nome: (input.cliente as string) || null,
    contacto_telefone: (input.contacto_telefone as string) || null,
    contacto_email: (input.contacto_email as string) || null,
    contacto_email_empresa: (input.contacto_email_empresa as string) || null,
    empresa: (input.empresa as string) || null,
    morada: (input.morada as string) || null,
    veiculo_novo: input.veiculo_novo != null ? (input.veiculo_novo as boolean) : null,
    veiculo_marca: (input.veiculo_marca as string) || null,
    veiculo_modelo: (input.veiculo_modelo as string) || null,
    veiculo_designacao: input.veiculo_variante
      ? `${input.veiculo_marca} ${input.veiculo_modelo} ${input.veiculo_variante}`
      : null,
    matricula: matricula || null,
    vin: vin || null,
    pbt: input.pbt != null ? (input.pbt as number) : null,
    tara: input.tara != null ? (input.tara as number) : null,
    rodado: (input.rodado as string) || null,
    tipo_carrocaria: input.tipo_carrocaria as string,
    dimensoes: (input.dimensoes as string) || null,
    plataforma_elevatoria: (input.plataforma_elevatoria as boolean) || false,
    grua_coluna: (input.grua_coluna as boolean) || false,
    notas_encomenda: input.notas ? [input.notas as string] : null,
    estado: "novo",
  })

  if (error) {
    console.error("Erro ao criar lead:", error)
    return JSON.stringify({ sucesso: false, error: "Erro ao criar lead no sistema" })
  }

  // 4. Audit log
  await audit({
    entidade_tipo: "lead",
    entidade_id: leadId,
    acao: "criar",
    utilizador_id: colaboradorId,
    metadata: {
      cliente: input.cliente,
      tipo_carrocaria: input.tipo_carrocaria,
      veiculo_marca: input.veiculo_marca,
      veiculo_modelo: input.veiculo_modelo,
    },
  })

  return JSON.stringify({
    sucesso: true,
    lead_id: leadId,
    mensagem: `Lead ${leadId} criada com sucesso para ${input.cliente} — ${input.veiculo_marca} ${input.veiculo_modelo} (${input.tipo_carrocaria}).`,
  })
}
