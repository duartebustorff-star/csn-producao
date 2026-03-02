export interface Colaborador {
  id: string
  nome: string
  funcao: string
  avatar: string
  pin: string
  lang: 'pt' | 'en' | 'ua'
  role: 'admin' | 'worker'
  ativo: boolean
  created_at: string
}

export interface Lead {
  id: string
  cliente: string
  cliente_final: string | null
  contacto_nome: string | null
  contacto_telefone: string | null
  contacto_email: string | null
  contacto_email_empresa: string | null
  empresa: string | null
  morada: string | null
  tipo_carrocaria: string
  tipo_taipais: string | null
  dimensoes: string | null
  veiculo_marca: string | null
  veiculo_modelo: string | null
  veiculo_designacao: string | null
  veiculo_novo: boolean | null
  matricula: string | null
  vin: string | null
  pbt: number | null
  tara: number | null
  rodado: string | null
  quantidade: number
  valor_unitario: number | null
  num_homologacao: string | null
  plataforma_elevatoria: boolean
  grua_coluna: boolean
  distancia_entre_eixos: number | null
  dist_eixo_frontal_frente: number | null
  dist_eixo_traseiro_retaguarda: number | null
  dist_eixo_frontal_traseira_cabine: number | null
  largura_cabine: number | null
  dist_topo_chassi_topo_cabine: number | null
  notas_encomenda: string[] | null
  estado: 'novo' | 'em_orcamentacao' | 'proposta_enviada' | 'fechado' | 'perdido' | 'em_preparacao' | 'em_obra'
  created_at: string
  updated_at: string
  obras?: Obra[]
}

export type ObraEstado =
  | 'espera_documentacao'
  | 'espera_projeto'
  | 'espera_veiculo'
  | 'veiculo_recebido'
  | 'producao'
  | 'concluida'
  | 'entregue'

export interface Obra {
  id: string
  lead_id: string | null
  vin: string | null
  matricula: string | null
  lugar_parque: number | null
  estado: ObraEstado
  notas: string | null
  created_at: string
  updated_at: string
  fases_obra?: FaseObra[]
  leads?: Lead
}

export interface FaseObra {
  id: number
  obra_id: string
  fase_numero: number
  nome: string
  estado: 'pendente' | 'em_curso' | 'concluido'
  responsavel: string | null
  horas_estimadas: number
  horas_reais: number
  notas: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface Timetracking {
  id: number
  colaborador_id: string
  obra_id: string
  fase_obra_id: number
  inicio: string
  fim: string | null
  duracao_minutos: number | null
  notas: string | null
  created_at: string
  fases_obra?: FaseObra
}

export interface Mensagem {
  id: number
  colaborador_id: string
  role: 'user' | 'assistant'
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface NotaObra {
  id: number
  obra_id: string
  colaborador_id: string
  texto: string
  tipo: 'nota' | 'problema' | 'material' | 'foto'
  created_at: string
}

export interface DocumentoRH {
  id: number
  colaborador_id: string
  tipo: 'baixa_medica' | 'atestado' | 'contrato' | 'recibo' | 'certificado' | 'outro'
  nome_ficheiro: string
  descricao: string | null
  url: string
  dados_extraidos: DadosCIT | null
  uploaded_by: string
  created_at: string
}

export interface DadosCIT {
  colaborador_nome?: string | null
  niss?: string | null
  nuss?: string | null
  nif_utente?: string | null
  numero_cit?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  numero_dias?: number | null
  classificacao?: string | null
  motivo?: string | null
  inicial_ou_prorrogacao?: string | null
  medico_nome?: string | null
  medico_cedula?: string | null
  instituicao?: string | null
  unidade_saude?: string | null
}

export interface CIT {
  id: number
  colaborador_id: string | null
  numero_cit: string | null
  data_inicio: string | null
  data_fim: string | null
  numero_dias: number | null
  motivo: string | null
  medico_nome: string | null
  medico_cedula: string | null
  unidade_saude: string | null
  nif_utente: string | null
  nome_utente: string | null
  nuss: string | null
  situacao: string | null
  url_ficheiro: string | null
  dados_raw: Record<string, unknown> | null
  uploaded_by: string
  ausencia_id: number | null
  created_at: string
  updated_at: string
}

export interface Calendario {
  id: number
  data: string
  tipo: 'feriado' | 'ponte' | 'ferias_empresa' | 'encerramento' | 'dia_extra_trabalho'
  descricao: string | null
  colaboradores_ids: string[] | null
  created_at: string
}

export interface Ausencia {
  id: number
  colaborador_id: string
  data_inicio: string
  data_fim: string
  tipo: 'ferias' | 'baixa' | 'falta_justificada' | 'falta_injustificada'
  notas: string | null
  documento_rh_id: number | null
  aprovado: boolean
  created_at: string
  colaboradores?: Colaborador
}

export interface DAV {
  id: number
  numero_dav: string
  vin: string
  matricula: string | null
  cod_homologacao: string | null
  marca: string | null
  modelo: string | null
  designacao_comercial: string | null
  peso_bruto: number | null
  tara: number | null
  completo: boolean
  url_ficheiro: string | null
  dados_raw: Record<string, unknown> | null
  created_at: string
  [key: string]: unknown
}

export interface FAM {
  id: number
  numero_homologacao_nacional: string
  extensao: string
  campo_0_1_marca: string | null
  campo_0_2_modelo: string | null
  campo_0_2_1_designacao_comercial: string | null
  campo_37_2_comprimento_exterior_max: number | null
  campo_37_6_largura_exterior_max: number | null
  campo_14_1_peso_bruto_total: number | null
  campo_50_anotacoes: string | null
  url_ficheiro: string | null
  dados_raw: Record<string, unknown> | null
  created_at: string
  [key: string]: unknown
}

export interface Inspecao {
  id: number
  matricula: string
  data_inspecao: string | null
  centro_inspecao: string | null
  codigo_imt: string | null
  linha: string | null
  inspetor: string | null
  peso_estatico_total: number | null
  peso_dinamico_total: number | null
  peso_estatico_eixo1_total: number | null
  peso_estatico_eixo1_esq: number | null
  peso_estatico_eixo1_dir: number | null
  peso_estatico_eixo2_total: number | null
  peso_estatico_eixo2_esq: number | null
  peso_estatico_eixo2_dir: number | null
  peso_dinamico_eixo1_total: number | null
  peso_dinamico_eixo1_esq: number | null
  peso_dinamico_eixo1_dir: number | null
  peso_dinamico_eixo2_total: number | null
  peso_dinamico_eixo2_esq: number | null
  peso_dinamico_eixo2_dir: number | null
  forca_travagem_servico: number | null
  eficiencia_travao_servico_estatica: number | null
  eficiencia_travao_servico_dinamica: number | null
  forca_travagem_estacionamento: number | null
  eficiencia_travao_estacionamento: number | null
  opacidade_k: number | null
  combustivel: string | null
  ripometro_eixo1: number | null
  deficiencias: Array<{codigo: string, designacao: string, tipo: number}> | null
  resultado: string | null
  url_ficheiro: string | null
  dados_raw: Record<string, unknown> | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface LugarParque {
  numero: number
  obra_id: string | null
  ocupado: boolean
  updated_at: string
}

export interface TemplateFase {
  id: number
  tipo_carrocaria: string
  tipo_taipais: string | null
  fase_numero: number
  nome: string
  horas_estimadas: number
}
