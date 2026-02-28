// Horário de trabalho CSN
export const HORARIO = {
  manha_inicio: "08:30",
  manha_fim: "12:30",
  almoco_inicio: "12:30",
  almoco_fim: "13:30",
  tarde_inicio: "13:30",
  tarde_fim: "17:30",
  horas_dia: 8,
  dias_semana: 5, // seg-sex
} as const

// Operadores (excluindo Duarte que é gestor)
export const OPERADORES = ["bohdan", "joao", "jose"] as const
export const NUM_OPERADORES = OPERADORES.length // 3

// Férias
export const FERIAS_ANUAIS = 22 // dias úteis por colaborador

// Capacidade anual 2026
export const DIAS_UTEIS_ANO = 260 // total de dias úteis no ano
export const FERIADOS_PONTES = 14 // do seed calendario
export const DIAS_UTEIS_EFETIVOS = DIAS_UTEIS_ANO - FERIADOS_PONTES // 246
export const CAPACIDADE_POR_OPERADOR = (DIAS_UTEIS_EFETIVOS - FERIAS_ANUAIS) * HORARIO.horas_dia // 1792h
export const CAPACIDADE_TOTAL_ANUAL = NUM_OPERADORES * CAPACIDADE_POR_OPERADOR // 5376h

// Tipos de documento RH
export const TIPOS_DOCUMENTO_RH = [
  "baixa_medica",
  "atestado",
  "contrato",
  "recibo",
  "certificado",
  "outro",
] as const

// Tipos de ausência
export const TIPOS_AUSENCIA = [
  "ferias",
  "baixa",
  "falta_justificada",
  "falta_injustificada",
] as const

// Tipos de dia especial no calendário
export const TIPOS_CALENDARIO = [
  "feriado",
  "ponte",
  "ferias_empresa",
  "encerramento",
  "dia_extra_trabalho",
] as const
