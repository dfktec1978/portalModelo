param(
  [string]$EnvFile = '.env.local'
)

if (-not (Test-Path -LiteralPath $EnvFile)) {
  Write-Error "Arquivo de ambiente nao encontrado: $EnvFile"
  exit 1
}

$lines = Get-Content -LiteralPath $EnvFile
$map = @{}
foreach ($line in $lines) {
  if ($line -match '^(?<k>[A-Z0-9_]+)=(?<v>.*)$') {
    $map[$matches.k] = $matches.v
  }
}

$required = @(
  'BILLING_PAYMENT_METHOD',
  'BILLING_CRON_SECRET',
  'RESEND_API_KEY',
  'EFI_BILLING_CLIENT_ID',
  'EFI_BILLING_CLIENT_SECRET',
  'EFI_BILLING_CERTIFICATE_B64',
  'EFI_BILLING_PIX_KEY',
  'EFI_BILLING_SANDBOX'
)

$dummyPattern = 'dummy|dryrun|pix-dryrun-key|local-billing-secret|changeme|example'
$failed = $false
$rows = @()

foreach ($k in $required) {
  $v = if ($map.ContainsKey($k)) { $map[$k] } else { '' }
  $isSet = -not [string]::IsNullOrWhiteSpace($v)
  $isDummy = $isSet -and ($v.ToLower() -match $dummyPattern)
  if (-not $isSet -or $isDummy) { $failed = $true }
  $rows += [pscustomobject]@{
    Key = $k
    Set = $isSet
    LooksDummy = $isDummy
    Length = if ($isSet) { $v.Length } else { 0 }
  }
}

if ($map['BILLING_PAYMENT_METHOD'] -ne 'pix') {
  $failed = $true
}

$rows | Format-Table -AutoSize | Out-String | Write-Host

if ($failed) {
  Write-Host '[FAIL] Ambiente NAO pronto para producao.' -ForegroundColor Red
  exit 1
}

Write-Host '[PASS] Ambiente pronto para producao.' -ForegroundColor Green
exit 0
