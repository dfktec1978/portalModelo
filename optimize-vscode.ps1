# Script de Otimização - VS Code e Next.js
Write-Host "🔧 Iniciando otimização do ambiente..." -ForegroundColor Cyan

# 1. Limpar cache do Next.js
Write-Host "`n📦 Limpando cache do Next.js..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "   ✅ .next removido" -ForegroundColor Green
}

if (Test-Path ".turbo") {
    Remove-Item -Path ".turbo" -Recurse -Force
    Write-Host "   ✅ .turbo removido" -ForegroundColor Green
}

# 2. Limpar cache do TypeScript
Write-Host "`n📝 Limpando cache do TypeScript..." -ForegroundColor Yellow
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Path "tsconfig.tsbuildinfo" -Force
    Write-Host "   ✅ tsconfig.tsbuildinfo removido" -ForegroundColor Green
}

# 3. Limpar cache do ESLint
Write-Host "`n🔍 Limpando cache do ESLint..." -ForegroundColor Yellow
if (Test-Path ".eslintcache") {
    Remove-Item -Path ".eslintcache" -Force
    Write-Host "   ✅ .eslintcache removido" -ForegroundColor Green
}

# 4. Verificar uso de memória do Node
Write-Host "`n💾 Processos Node em execução:" -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Format-Table ProcessName, Id, @{Name = "Memory(MB)"; Expression = { [math]::Round($_.WorkingSet64 / 1MB, 2) } } -AutoSize
    
    $totalMemory = ($nodeProcesses | Measure-Object WorkingSet64 -Sum).Sum / 1MB
    Write-Host "   📊 Total de memória: $([math]::Round($totalMemory,2)) MB" -ForegroundColor Cyan
}
else {
    Write-Host "   ℹ️  Nenhum processo Node rodando" -ForegroundColor Gray
}

# 5. Verificar tamanho de node_modules
Write-Host "`n📁 Verificando node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $size = (Get-ChildItem -Path "node_modules" -Recurse -ErrorAction SilentlyContinue | 
        Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum / 1GB
    Write-Host "   📊 Tamanho: $([math]::Round($size,2)) GB" -ForegroundColor Cyan
}

Write-Host "`n✅ Otimização concluída!" -ForegroundColor Green
Write-Host "`n💡 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "   1. Feche e reabra o VS Code (Ctrl+Q depois reabrir)" -ForegroundColor White
Write-Host "   2. Desabilite extensões não essenciais" -ForegroundColor White
Write-Host "   3. Execute: npm run dev" -ForegroundColor White
Write-Host ""
