import pdfParse from "pdf-parse/lib/pdf-parse.js"

const url = process.argv[2]
const r = await fetch(url)
const buf = Buffer.from(await r.arrayBuffer())
const p = await pdfParse(buf)
console.log("=== TEXT ===")
console.log(p.text)
console.log("=== END ===")
console.log("bytes:", buf.length, "pages:", p.numpages)
