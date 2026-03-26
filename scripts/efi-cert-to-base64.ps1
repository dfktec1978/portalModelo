param(
  [Parameter(Mandatory=$true)]
  [string]$P12Path,

  [string]$EnvFile = ".env.local",

  [ValidateSet("EFI_BILLING_CERTIFICATE_B64","EFI_BILLING_HML_CERTIFICATE_B64","EFI_BILLING_PRD_CERTIFICATE_B64")]
  [string]$EnvVar = "EFI_BILLING_CERTIFICATE_B64"
)

if (-not (Test-Path -LiteralPath $P12Path)) {
  Write-Error "Arquivo .p12 nao encontrado: $P12Path"
  exit 1
}

$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $P12Path))
$b64 = [Convert]::ToBase64String($bytes)

Write-Host "\nBase64 gerado com sucesso. Tamanho:" $b64.Length
Write-Host "Variavel alvo:" $EnvVar

if (-not (Test-Path -LiteralPath $EnvFile)) {
  Write-Warning "Env file nao encontrado: $EnvFile"
  Write-Host "\nCopie e cole manualmente:"
  Write-Host "$EnvVar=$b64"
  exit 0
}

$content = Get-Content -LiteralPath $EnvFile -Raw
$pattern = "(?m)^" + [Regex]::Escape($EnvVar) + "=.*$"
$replacement = "$EnvVar=$b64"

if ([Regex]::IsMatch($content, $pattern)) {
  $updated = [Regex]::Replace($content, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $replacement })
} else {
  if (-not $content.EndsWith("`r`n") -and -not $content.EndsWith("`n")) {
    $content += "`r`n"
  }
  $updated = $content + "$replacement`r`n"
}

Set-Content -LiteralPath $EnvFile -Value $updated -NoNewline
Write-Host "\nArquivo atualizado:" $EnvFile
Write-Host "Pronto. Reinicie o servidor Next.js para aplicar as variaveis."
