param(
  [string]$DatabaseUrl,
  [string]$SqlPath = 'sql/migrations/001_create_product_images.sql'
)

function Write-Title($t){ Write-Host "`n=== $t ===`n" -ForegroundColor Cyan }

Write-Title "Diagnóstico rápido do DB / Rede"

if (-not $DatabaseUrl) { $DatabaseUrl = $env:DATABASE_URL }
if (-not $DatabaseUrl) {
  Write-Host 'Nenhuma DATABASE_URL fornecida nem definida em $env:DATABASE_URL' -ForegroundColor Yellow
  Write-Host 'Formato esperado: postgresql://user:pass@host:port/dbname?sslmode=require' -ForegroundColor Gray
  exit 2
}

# extrai host do DATABASE_URL (após @ e antes de :) 
$m = [regex]::Match($DatabaseUrl, '@([^:/?#]+)')
if (-not $m.Success) {
  Write-Host 'Não foi possível extrair host da DATABASE_URL' -ForegroundColor Red
  Write-Host $DatabaseUrl
  exit 2
}
$dbHost = $m.Groups[1].Value
Write-Host "Host detectado: $dbHost"

Write-Title '1) Resolução DNS (Resolve-DnsName)'
try {
  $dns = Resolve-DnsName $dbHost -ErrorAction Stop
  $dns | Select-Object Name,IPAddress,Type | Format-Table -AutoSize
} catch {
  Write-Host "Resolve-DnsName falhou: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host 'Tentando nslookup...' -ForegroundColor Yellow
  nslookup $dbHost
}

Write-Title '2) Teste de conectividade TCP na porta 5432'
$test = Test-NetConnection -ComputerName $dbHost -Port 5432 -WarningAction SilentlyContinue
$test | Select-Object @{n='Target';e={$_.ComputerName}}, @{n='Port';e={$_.RemotePort}}, TcpTestSucceeded, @{n='Latency(ms)';e={$_.PingReplyDetails.RoundTripTime}} | Format-Table -AutoSize
if (-not $test.TcpTestSucceeded) { Write-Host 'Conexão TCP falhou — talvez rede/Firewall bloqueado ou host incorreto.' -ForegroundColor Red }

Write-Title '3) Verificar caminho do arquivo SQL'
if (Test-Path $SqlPath) { Write-Host "Arquivo encontrado: $SqlPath" -ForegroundColor Green } else { Write-Host "Arquivo NÃO encontrado: $SqlPath" -ForegroundColor Red; Write-Host 'Verifique nome/caminho (nota: seu último comando tinha .sqls.sql por engano).' -ForegroundColor Yellow }

Write-Title 'Resumo / Próximos passos'
if ($test.TcpTestSucceeded) { Write-Host 'Rede parece OK — você pode rodar o script Node ou psql.' -ForegroundColor Green } else { Write-Host 'Rede/Resolucao DNS com problemas — use o SQL Editor do Supabase (recomendado) ou verifique VPN/firewall.' -ForegroundColor Yellow }

Write-Host "Se quiser executar a migration agora (usando este DATABASE_URL):`nnode scripts/apply-migration.js $SqlPath" -ForegroundColor Cyan
