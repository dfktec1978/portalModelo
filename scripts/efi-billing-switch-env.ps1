param(
  [Parameter(Mandatory=$true)]
  [ValidateSet('hml','prd')]
  [string]$Target,

  [string]$EnvFile = '.env.local'
)

if (-not (Test-Path -LiteralPath $EnvFile)) {
  Write-Error "Arquivo de ambiente nao encontrado: $EnvFile"
  exit 1
}

$content = Get-Content -LiteralPath $EnvFile -Raw

function Get-VarValue {
  param([string]$Name)
  $m = [regex]::Match($content, "(?m)^" + [regex]::Escape($Name) + "=(.*)$")
  if ($m.Success) { return $m.Groups[1].Value }
  return $null
}

function Set-Or-Append {
  param([string]$Name, [string]$Value)
  $pattern = "(?m)^" + [regex]::Escape($Name) + "=.*$"
  $line = "$Name=$Value"
  if ([regex]::IsMatch($content, $pattern)) {
    $script:content = [regex]::Replace($content, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $line })
  } else {
    if (-not $content.EndsWith("`r`n") -and -not $content.EndsWith("`n")) {
      $script:content += "`r`n"
    }
    $script:content += "$line`r`n"
  }
}

if ($Target -eq 'hml') {
  $clientId = Get-VarValue 'EFI_BILLING_HML_CLIENT_ID'
  $clientSecret = Get-VarValue 'EFI_BILLING_HML_CLIENT_SECRET'
  $cert = Get-VarValue 'EFI_BILLING_HML_CERTIFICATE_B64'
  $pixKey = Get-VarValue 'EFI_BILLING_HML_PIX_KEY'

  if ([string]::IsNullOrWhiteSpace($clientId) -or [string]::IsNullOrWhiteSpace($clientSecret)) {
    Write-Error 'Credenciais HML nao encontradas (EFI_BILLING_HML_CLIENT_ID / EFI_BILLING_HML_CLIENT_SECRET).'
    exit 1
  }

  Set-Or-Append 'EFI_BILLING_SANDBOX' 'true'
  Set-Or-Append 'EFI_BILLING_CLIENT_ID' $clientId
  Set-Or-Append 'EFI_BILLING_CLIENT_SECRET' $clientSecret
  if (-not [string]::IsNullOrWhiteSpace($cert)) { Set-Or-Append 'EFI_BILLING_CERTIFICATE_B64' $cert }
  if (-not [string]::IsNullOrWhiteSpace($pixKey)) { Set-Or-Append 'EFI_BILLING_PIX_KEY' $pixKey }

  Set-Content -LiteralPath $EnvFile -Value $content -NoNewline
  Write-Host 'Ambiente ativo: HOMOLOGACAO (EFI_BILLING_SANDBOX=true)'
  Write-Host 'Reinicie o servidor Next.js para aplicar as variaveis.'
  exit 0
}

if ($Target -eq 'prd') {
  $clientId = Get-VarValue 'EFI_BILLING_PRD_CLIENT_ID'
  $clientSecret = Get-VarValue 'EFI_BILLING_PRD_CLIENT_SECRET'
  $cert = Get-VarValue 'EFI_BILLING_PRD_CERTIFICATE_B64'
  $pixKey = Get-VarValue 'EFI_BILLING_PRD_PIX_KEY'

  if ([string]::IsNullOrWhiteSpace($clientId) -or [string]::IsNullOrWhiteSpace($clientSecret)) {
    Write-Error 'Credenciais PRD nao encontradas (EFI_BILLING_PRD_CLIENT_ID / EFI_BILLING_PRD_CLIENT_SECRET).'
    exit 1
  }

  Set-Or-Append 'EFI_BILLING_SANDBOX' 'false'
  Set-Or-Append 'EFI_BILLING_CLIENT_ID' $clientId
  Set-Or-Append 'EFI_BILLING_CLIENT_SECRET' $clientSecret
  if (-not [string]::IsNullOrWhiteSpace($cert)) { Set-Or-Append 'EFI_BILLING_CERTIFICATE_B64' $cert }
  if (-not [string]::IsNullOrWhiteSpace($pixKey)) { Set-Or-Append 'EFI_BILLING_PIX_KEY' $pixKey }

  Set-Content -LiteralPath $EnvFile -Value $content -NoNewline
  Write-Host 'Ambiente ativo: PRODUCAO (EFI_BILLING_SANDBOX=false)'
  Write-Host 'Reinicie o servidor Next.js para aplicar as variaveis.'
  exit 0
}
