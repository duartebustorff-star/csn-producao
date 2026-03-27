import { NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

const INVOICEXPRESS_BASE = "https://carlosdossantosna.app.invoicexpress.com"

function s(str: string | null | undefined): string {
  if (!str) return ""
  return str
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\xFF]/g, "?")
}

function formatDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

export async function POST(req: NextRequest) {
  try {
    const { obra_id, cliente_nif, items } = await req.json()

    if (!obra_id || !cliente_nif || !items?.length) {
      return NextResponse.json(
        { error: "Campos obrigatórios: obra_id, cliente_nif, items[]" },
        { status: 400 }
      )
    }

    const apiKey = process.env.INVOICEXPRESS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "INVOICEXPRESS_API_KEY não configurada" },
        { status: 500 }
      )
    }

    const supabase = getServiceSupabase()

    // Buscar dados da obra + lead + davs
    const { data: obra, error: obraErr } = await supabase
      .from("obras")
      .select("*, leads(*), davs(*)")
      .eq("id", obra_id)
      .single()

    if (obraErr || !obra) {
      return NextResponse.json(
        { error: "Obra não encontrada" },
        { status: 404 }
      )
    }

    const lead = obra.leads
    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() + 30)

    const clientName = s(lead?.cliente || lead?.empresa) || `NIF ${cliente_nif}`

    // Payload InvoiceXpress — POST /invoices.json
    const invoicePayload = {
      invoice: {
        date: formatDate(today),
        due_date: formatDate(dueDate),
        reference: `Obra ${obra_id}`,
        observations: s(obra.notas) || undefined,
        client: {
          name: clientName,
          code: cliente_nif,
          fiscal_id: cliente_nif,
          email: s(lead?.contacto_email || lead?.contacto_email_empresa) || undefined,
          address: s(lead?.morada) || undefined,
          country: "Portugal",
        },
        items: items.map(
          (item: {
            name: string
            description?: string
            unit_price: number
            quantity: number
            tax?: string
          }) => ({
            name: s(item.name) || item.name,
            description: s(item.description || item.name),
            unit_price: item.unit_price,
            quantity: item.quantity,
            tax: { name: item.tax || "IVA23" },
          })
        ),
      },
    }

    // Criar fatura no InvoiceXpress
    const ixRes = await fetch(
      `${INVOICEXPRESS_BASE}/invoices.json?api_key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(invoicePayload),
      }
    )

    if (!ixRes.ok) {
      const ixErr = await ixRes.text()
      console.error("InvoiceXpress erro:", ixRes.status, ixErr)
      return NextResponse.json(
        { error: "Erro ao criar fatura no InvoiceXpress", detalhes: ixErr },
        { status: ixRes.status }
      )
    }

    const ixData = await ixRes.json()
    const invoice = ixData.invoice

    // Upsert cliente_faturacao (select + insert se não existir)
    let clienteFatId: number | null = null
    const { data: existingCliente } = await supabase
      .from("clientes_faturacao")
      .select("id")
      .eq("nif", cliente_nif)
      .single()

    if (existingCliente) {
      clienteFatId = existingCliente.id
    } else {
      const { data: newCliente } = await supabase
        .from("clientes_faturacao")
        .insert({
          nif: cliente_nif,
          nome: clientName,
          email: lead?.contacto_email || null,
          morada: lead?.morada || null,
        })
        .select("id")
        .single()
      clienteFatId = newCliente?.id || null
    }

    // Guardar metadados na tabela faturas
    const { data: fatura, error: faturaErr } = await supabase
      .from("faturas")
      .insert({
        invoicexpress_id: String(invoice.id),
        obra_id,
        cliente_faturacao_id: clienteFatId,
        numero_fatura: invoice.sequence_number || null,
        estado: "rascunho",
        tipo: "fatura",
        data_emissao: today.toISOString().split("T")[0],
        data_vencimento: dueDate.toISOString().split("T")[0],
        base_tributavel: invoice.before_taxes ?? 0,
        iva: invoice.taxes ?? 0,
        total: invoice.total ?? 0,
        invoicexpress_url: invoice.permalink || null,
        referencia_interna: `Obra ${obra_id}`,
      })
      .select()
      .single()

    if (faturaErr) {
      console.error("Erro ao guardar fatura:", faturaErr)
      return NextResponse.json(
        {
          error: "Fatura criada no InvoiceXpress mas erro ao guardar localmente",
          invoicexpress_id: invoice.id,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      fatura,
      invoicexpress: {
        id: invoice.id,
        numero: invoice.sequence_number,
        estado: invoice.status,
        permalink: invoice.permalink,
        total: invoice.total,
      },
    })
  } catch (err) {
    console.error("Erro emitir fatura:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
