import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      tipo_cit,
      data_inicio,
      data_fim,
      numero_cit,
      dados_originais,
      file_url,
      file_path,
      uploaded_by,
      colaborador_match_id,
      colaborador_match_nome,
    } = body

    if (!data_inicio || !data_fim || !tipo_cit) {
      return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Calculate numero_dias from confirmed dates
    const d1 = new Date(data_inicio)
    const d2 = new Date(data_fim)
    const numeroDias = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Insert CIT record with confirmed values overriding extracted ones
    const citRecord = {
      tipo_cit,
      numero_cit: numero_cit || null,
      data_inicio,
      data_fim,
      numero_dias: numeroDias,
      motivo: (dados_originais?.motivo as string) || null,
      medico_nome: (dados_originais?.medico_nome as string) || null,
      medico_cedula: (dados_originais?.medico_cedula as string) || null,
      unidade_saude: (dados_originais?.unidade_saude as string) || null,
      nif_utente: (dados_originais?.nif_utente as string) || null,
      nome_utente: (dados_originais?.nome_utente as string) || null,
      nuss: (dados_originais?.nuss as string) || null,
      situacao: (dados_originais?.situacao as string) || null,
      url_ficheiro: file_url || "",
      dados_raw: dados_originais,
      uploaded_by: uploaded_by || null,
      colaborador_id: colaborador_match_id || null,
      updated_at: new Date().toISOString(),
    }

    const { data: cit, error: insertError } = await supabase
      .from("cits")
      .insert(citRecord)
      .select()
      .single()

    if (insertError) {
      console.error("CIT confirm insert error:", insertError)
      return NextResponse.json({ error: "Erro ao registar CIT" }, { status: 500 })
    }

    // Auto-create ausencia if collaborator matched and dates OK
    let ausencia = null
    if (colaborador_match_id && data_inicio && data_fim) {
      const { data: ausenciaData } = await supabase
        .from("ausencias")
        .insert({
          colaborador_id: colaborador_match_id,
          data_inicio,
          data_fim,
          tipo: "baixa",
          notas: `CIT ${numero_cit || "s/n"} — ${numeroDias} dias (confirmado pelo utilizador)`,
          aprovado: true,
        })
        .select()
        .single()

      ausencia = ausenciaData

      if (ausenciaData) {
        await supabase.from("cits").update({ ausencia_id: ausenciaData.id }).eq("id", cit.id)
      }
    }

    // Build response message
    const dataInicioFmt = formatDate(data_inicio)
    const dataFimFmt = formatDate(data_fim)
    const tipoCitLabel = tipo_cit === "prorrogacao" ? "Prorrogação" : "Inicial"

    let mensagem = `✅ CIT registado`
    if (colaborador_match_nome) {
      mensagem += ` — Colaborador: ${colaborador_match_nome}.`
    } else if (dados_originais?.nome_utente) {
      mensagem += ` — ${dados_originais.nome_utente}.`
    }
    mensagem += ` Tipo: ${tipoCitLabel}.`
    mensagem += ` Período: ${dataInicioFmt} → ${dataFimFmt} (${numeroDias} dias).`
    if (colaborador_match_id && ausencia) {
      mensagem += `\nAusência criada automaticamente.`
    } else if (dados_originais?.nome_utente && !colaborador_match_id) {
      mensagem += `\n⚠️ Não foi possível associar "${dados_originais.nome_utente}" a nenhum colaborador. Ausência não criada.`
    }

    return NextResponse.json({
      tipo: "CIT",
      cit,
      ausencia,
      mensagem,
    })
  } catch (error) {
    console.error("CIT confirm error:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-")
    return `${d}/${m}/${y}`
  } catch {
    return dateStr
  }
}
