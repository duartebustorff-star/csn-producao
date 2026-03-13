$path = "src\app\api\documentos\upload\route.ts"
$c = Get-Content $path -Raw
$start = $c.IndexOf("const termoBody = {")
$end = $c.IndexOf("}", $start) + 1
$old = $c.Substring($start, $end - $start)
$new = $c.Replace($old, "const termoBody = { obra_id: obraId }")
Set-Content $path $new -NoNewline
Write-Host "OK"
