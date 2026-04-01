import { PDFDocument } from "pdf-lib"

/**
 * Valida o PDF com pdf-lib e obtém uma amostra de texto legível a partir dos bytes
 * (pdf-lib não expõe API de extração de texto; usamos decodificação + limpeza como pré-análise).
 */
export async function analyzePdfForRoteador(buffer: ArrayBuffer): Promise<{
  pageCount: number
  extractedTextSample: string
  candidateNifs: string[]
}> {
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const pageCount = pdf.getPageCount()
  const raw = new TextDecoder("latin1").decode(new Uint8Array(buffer))
  const candidateNifs = collectNineDigitNumbers(raw)
  const extractedTextSample = extractPrintableSample(raw, 12_000)
  return { pageCount, extractedTextSample, candidateNifs }
}

function collectNineDigitNumbers(s: string): string[] {
  const set = new Set<string>()
  for (const m of s.matchAll(/\b(\d{9})\b/g)) {
    set.add(m[1])
  }
  return [...set].slice(0, 40)
}

function extractPrintableSample(s: string, maxLen: number): string {
  const cleaned = s.replace(/[^\t\n\r\x20-\x7E\u00A0-\u024F]/g, " ")
  return cleaned.replace(/\s{2,}/g, " ").trim().slice(0, maxLen)
}
