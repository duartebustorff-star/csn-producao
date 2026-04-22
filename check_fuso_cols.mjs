import { readFileSync } from 'fs'
const xlsx = await import('xlsx')
const XLSX = xlsx.default
const wb = XLSX.read(readFileSync('docs/fornecedores/fuso/CSN_FUSO_Catalog_S52_v3.xlsx'))
console.log('=== Diesel_60 ===')
const data = XLSX.utils.sheet_to_json(wb.Sheets['Diesel_60'], { header: 1 })
data[0].forEach(h => console.log(h))
console.log('=== eCanter_23 ===')
const data2 = XLSX.utils.sheet_to_json(wb.Sheets['eCanter_23'], { header: 1 })
data2[0].forEach(h => console.log(h))
