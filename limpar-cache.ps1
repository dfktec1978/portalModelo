# Script de limpeza de cache e arquivos temporários
# Executar quando VS Code estiver lento

Write-Host "Limpando cache e arquivos temporários..." -ForegroundColor Cyan
Write-Host ""

# 1. Limpar .next (Next.js build cache)
if (Test-Path ".next") {
    Write-Host "Removendo .next..." -ForegroundColor Yellow
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "OK: .next removido" -ForegroundColor Green
}

# 2. Limpar .turbo (Turbopack cache)
if (Test-Path ".turbo") {
    Write-Host "Removendo .turbo..." -ForegroundColor Yellow
    Remove-Item -Path ".turbo" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "OK: .turbo removido" -ForegroundColor Green
}

# 3. Limpar node_modules/.cache
if (Test-Path "node_modules/.cache") {
    Write-Host "Removendo node_modules/.cache..." -ForegroundColor Yellow
    Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "OK: cache removido" -ForegroundColor Green
}

# 4. Limpar VS Code cache do projeto
if (Test-Path ".vscode/.cache") {
    Write-Host "Removendo .vscode/.cache..." -ForegroundColor Yellow
    Remove-Item -Path ".vscode/.cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "OK: VS Code cache removido" -ForegroundColor Green
}

# 5. Limpar TypeScript cache
if (Test-Path "node_modules/.cache/typescript") {
    Write-Host "Removendo TypeScript cache..." -ForegroundColor Yellow
    Remove-Item -Path "node_modules/.cache/typescript" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "OK: TS cache removido" -ForegroundColor Green
}

Write-Host ""
Write-Host "Limpeza concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Feche o VS Code completamente (Ctrl+Q)"
Write-Host "2. Aguarde 5 segundos"
Write-Host "3. Reabra o projeto"
Write-Host ""
