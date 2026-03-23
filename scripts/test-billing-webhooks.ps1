param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$CronSecret = $env:BILLING_CRON_SECRET,
  [string]$WebhookSecret = $env:BILLING_WEBHOOK_SECRET,
  [string]$InvoiceId,
  [string]$ProviderChargeId,
  [switch]$SkipDryRun
)

$ErrorActionPreference = "Stop"

function Invoke-JsonPost {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][hashtable]$Headers,
    [Parameter(Mandatory = $false)][object]$Body
  )

  $jsonBody = $null
  if ($null -ne $Body) {
    $jsonBody = $Body | ConvertTo-Json -Depth 8
  }

  if ($null -eq $jsonBody) {
    return Invoke-RestMethod -Method Post -Uri $Url -Headers $Headers
  }

  return Invoke-RestMethod -Method Post -Uri $Url -Headers $Headers -Body $jsonBody -ContentType "application/json"
}

Write-Host "== Billing test helper ==" -ForegroundColor Cyan
Write-Host "BaseUrl: $BaseUrl"

if (-not $SkipDryRun) {
  if (-not $CronSecret) {
    Write-Warning "BILLING_CRON_SECRET nao informado. Dry-run sera pulado."
  }
  else {
    Write-Host "\n[1/2] Rodando dry-run do job mensal..." -ForegroundColor Yellow
    $dryRunHeaders = @{ "x-cron-secret" = $CronSecret }
    $dryRunUrl = "$BaseUrl/api/billing/run?dryRun=true"
    $dryRunResult = Invoke-JsonPost -Url $dryRunUrl -Headers $dryRunHeaders
    $dryRunResult | ConvertTo-Json -Depth 8 | Write-Host
  }
}

if (-not $WebhookSecret) {
  Write-Warning "BILLING_WEBHOOK_SECRET nao informado. Testes de webhook nao podem continuar."
  exit 0
}

if (-not $ProviderChargeId -and -not $InvoiceId) {
  Write-Warning "Informe -ProviderChargeId ou -InvoiceId para testar o webhook de boleto."
  Write-Host "Exemplo:" -ForegroundColor DarkGray
  Write-Host "  .\\scripts\\test-billing-webhooks.ps1 -BaseUrl http://localhost:3000 -WebhookSecret SEU_SECRET -InvoiceId UUID_DA_FATURA"
  exit 0
}

$webhookHeaders = @{ "x-webhook-secret" = $WebhookSecret }
$webhookUrl = "$BaseUrl/api/webhooks/boleto"

function Build-Payload {
  param([string]$Status)

  $payload = @{
    status = $Status
  }

  if ($ProviderChargeId) {
    $payload.providerChargeId = $ProviderChargeId
  }

  if ($InvoiceId) {
    $payload.invoiceId = $InvoiceId
  }

  return $payload
}

$tests = @("paid", "expired", "canceled")

Write-Host "\n[2/2] Disparando webhook de boleto (paid, expired, canceled)..." -ForegroundColor Yellow

foreach ($status in $tests) {
  Write-Host "\n-> Status: $status" -ForegroundColor Green
  $payload = Build-Payload -Status $status
  $result = Invoke-JsonPost -Url $webhookUrl -Headers $webhookHeaders -Body $payload
  $result | ConvertTo-Json -Depth 8 | Write-Host
}

Write-Host "\nConcluido." -ForegroundColor Cyan
