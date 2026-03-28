import { getServiceSupabase } from "./supabase"

interface AuditEntry {
  entidade_tipo: string
  entidade_id: string
  acao: "criar" | "atualizar" | "eliminar" | "mudar_estado" | "gerar_documento"
  campo_alterado?: string
  valor_anterior?: string
  valor_novo?: string
  utilizador_id: string
  utilizador_nome?: string
  metadata?: Record<string, unknown>
}

/** Fire-and-forget audit log — never throws */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = getServiceSupabase()
    await supabase.from("audit_log").insert({
      ...entry,
      valor_anterior: entry.valor_anterior ?? null,
      valor_novo: entry.valor_novo ?? null,
    })
  } catch (e) {
    console.error("Audit log error:", e)
  }
}

/** Log multiple field changes from a before/after comparison */
export async function auditChanges(
  entidade_tipo: string,
  entidade_id: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  utilizador_id: string,
  utilizador_nome?: string,
): Promise<void> {
  const entries: AuditEntry[] = []

  for (const key of Object.keys(after)) {
    const oldVal = before[key]
    const newVal = after[key]
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      entries.push({
        entidade_tipo,
        entidade_id,
        acao: key === "estado" ? "mudar_estado" : "atualizar",
        campo_alterado: key,
        valor_anterior: oldVal != null ? String(oldVal) : null,
        valor_novo: newVal != null ? String(newVal) : null,
        utilizador_id,
        utilizador_nome,
      } as AuditEntry)
    }
  }

  if (entries.length > 0) {
    try {
      const supabase = getServiceSupabase()
      await supabase.from("audit_log").insert(entries)
    } catch (e) {
      console.error("Audit log error:", e)
    }
  }
}
