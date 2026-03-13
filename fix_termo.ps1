$content = Get-Content src\app\api\documentos\upload\route.ts -Raw
$old = @'
  const lead = obra.leads as unknown as Record<string, unknown> | null
  const termoBody = {
    obra_id: obraId,
    marca: davRecord?.marca || null,
    modelo: davRecord?.modelo || null,
    matricula: obra.matricula || davRecord?.matricula || null,
    vin: obra.vin || null,
    cod_homologacao: davRecord?.cod_homologacao || null,
    tipo_carrocaria: lead?.tipo_carrocaria || null,
    comprimento: null,
    largura: null,
    altura: null,
    dist_eixo_frente: null,
    dist_eixo_retaguarda: null,
    tara_total: inspecaoRecord?.peso_estatico_total || null,
    tara_frontal: inspecaoRecord?.peso_estatico_eixo1_total || null,
    tara_traseira: inspecaoRecord?.peso_estatico_eixo2_total || null,
    peso_bruto: davRecord?.peso_bruto || lead?.pbt || null,
  }
'@
$new = @'
  const termoBody = { obra_id: obraId }
'@
$content = $content.Replace($old, $new)
Set-Content src\app\api\documentos\upload\route.ts $content
Write-Host "OK"
