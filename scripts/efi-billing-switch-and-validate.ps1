param(
  [Parameter(Mandatory=$true)]
  [ValidateSet('hml','prd')]
  [string]$Target,

  [string]$EnvFile = '.env.local',

  [switch]$RunApi,

  [int[]]$Ports = @(3000,3001,3002)
)

$ErrorActionPreference = 'Stop'

function Read-EnvMap {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Arquivo de ambiente nao encontrado: $Path"
  }

  $lines = Get-Content -LiteralPath $Path
  $map = @{}
  foreach ($line in $lines) {
    if ($line -match '^(?<k>[A-Z0-9_]+)=(?<v>.*)$') {
      $map[$matches.k] = $matches.v
    }
  }
  return $map
}

function Assert-Set {
  param(
    [hashtable]$Map,
    [string[]]$Keys
  )

  $missing = @()
  foreach ($k in $Keys) {
    if (-not $Map.ContainsKey($k) -or [string]::IsNullOrWhiteSpace($Map[$k])) {
      $missing += $k
    }
  }

  if ($missing.Count -gt 0) {
    throw ("Variaveis ausentes no env: " + ($missing -join ', '))
  }
}

# 1) Alterna ambiente usando script existente
$switchScript = Join-Path $PSScriptRoot 'efi-billing-switch-env.ps1'
if (-not (Test-Path -LiteralPath $switchScript)) {
  throw "Script nao encontrado: $switchScript"
}

& $switchScript -Target $Target -EnvFile $EnvFile

# 2) Rele e valida variaveis obrigatorias
$envMap = Read-EnvMap -Path $EnvFile
Assert-Set -Map $envMap -Keys @(
  'BILLING_PAYMENT_METHOD',
  'BILLING_CRON_SECRET',
  'EFI_BILLING_CLIENT_ID',
  'EFI_BILLING_CLIENT_SECRET',
  'EFI_BILLING_CERTIFICATE_B64',
  'EFI_BILLING_PIX_KEY'
)

if ($Target -eq 'hml') {
  if ($envMap['EFI_BILLING_SANDBOX'] -ne 'true') {
    throw 'Esperado EFI_BILLING_SANDBOX=true para homologacao'
  }
}

if ($Target -eq 'prd') {
  if ($envMap['EFI_BILLING_SANDBOX'] -ne 'false') {
    throw 'Esperado EFI_BILLING_SANDBOX=false para producao'
  }
}

Write-Host "[OK] Ambiente alternado e variaveis obrigatorias validadas ($Target)."

if (-not $RunApi) {
  Write-Host '[INFO] Validacao de API pulada (use -RunApi para testar /api/billing/run?dryRun=1).'
  exit 0
}

# 3) Testa dry-run da API em portas candidatas
$secret = $envMap['BILLING_CRON_SECRET']
$lastErr = $null

foreach ($port in $Ports) {
  $url = "http://localhost:$port/api/billing/run?dryRun=1"
  try {
    $resp = Invoke-RestMethod -Uri $url -Method POST -Headers @{ 'x-cron-secret' = $secret } -TimeoutSec 12
    Write-Host "[OK] API dry-run respondeu em $url"
    $resp | ConvertTo-Json -Depth 8
    exit 0
  } catch {
    $lastErr = $_
    continue
  }
}

Write-Error "Nao foi possivel validar dry-run em nenhuma porta: $($Ports -join ', '). Ultimo erro: $($lastErr.Exception.Message)"
exit 1
