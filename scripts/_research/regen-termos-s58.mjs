import { writeFileSync } from "node:fs"
import pdfParse from "pdf-parse/lib/pdf-parse.js"

const ENDPOINT = "https://csn-producao.vercel.app/api/documentos/gerar-termo"
const OBRAS = [
  { id: "L2026-001-01", matricula: "CB-42-LF", esperado: { tara: 2311, eixo1: 1421, eixo2: 890 } },
  { id: "L2026-001-04", matricula: "CB-98-LF", esperado: { tara: 2311, eixo1: 1416, eixo2: 895 } },
  { id: "L2026-001-05", matricula: "CB-72-LD", esperado: { tara: 2255, eixo1: 1411, eixo2: 844 } },
  { id: "L2026-001-06", matricula: "CB-28-LD", esperado: { tara: 2323, eixo1: 1432, eixo2: 891 } },
]

async function regen(obra) {
  const t0 = Date.now()
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ obra_id: obra.id }),
  })
  const ms = Date.now() - t0
  const text = await r.text()
  let body
  try { body = JSON.parse(text) } catch { body = { raw: text } }
  return { obra, status: r.status, ms, body }
}

async function validar(obra, downloadUrl) {
  if (!downloadUrl) return { ok: false, reason: "sem download_url" }
  const r = await fetch(downloadUrl)
  if (!r.ok) return { ok: false, reason: `download HTTP ${r.status}` }
  const buf = Buffer.from(await r.arrayBuffer())
  const parsed = await pdfParse(buf)
  const t = parsed.text
  const lines = t.split("\n").map(s => s.trim())

  const checks = {
    matricula: t.includes(obra.matricula),
    modelo_RDB: /\bRDB\b/.test(t) && !/\bMASTER\b/.test(t),
    tipo_legal: t.includes("CAIXA ABERTA COM OU SEM COBERTURA"),
    nao_tem_slug: !t.includes("CAIXA_ABERTA_MADEIRA"),
    carimbo: t.includes("CARLOS DOS SANTOS NASCIMENTO") && t.includes("NIF 500 861 790"),
    tara_total: t.includes(String(obra.esperado.tara)),
    nao_tara_chassis: !t.includes("2269") || obra.esperado.tara === 2269,
    tara_frontal: t.includes(String(obra.esperado.eixo1)),
    tara_traseira: t.includes(String(obra.esperado.eixo2)),
  }
  const ok = Object.values(checks).every(Boolean)
  return { ok, checks, bytes: buf.length, pages: parsed.numpages, lines: lines.slice(0, 5) }
}

const results = []
for (const obra of OBRAS) {
  const r = await regen(obra)
  console.log(`[${obra.id}] status=${r.status} ms=${r.ms} body=${JSON.stringify(r.body).slice(0,200)}`)
  let v = null
  if (r.status === 200 && r.body?.download_url) {
    v = await validar(obra, r.body.download_url)
    console.log(`  validacao: ok=${v.ok} bytes=${v.bytes} pages=${v.pages}`)
    console.log(`  checks=${JSON.stringify(v.checks)}`)
  }
  results.push({ obra, regen: r, validacao: v })
}

writeFileSync("scripts/regen-termos-s58.out.json", JSON.stringify(results, null, 2))
console.log("\n--- WROTE scripts/regen-termos-s58.out.json ---")
