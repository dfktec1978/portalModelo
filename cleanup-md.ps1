# Script para deletar arquivos Markdown desnecessarios
# Mantem apenas documentacao essencial

Write-Host ""
Write-Host "LIMPEZA DE ARQUIVOS MARKDOWN" -ForegroundColor Yellow
Write-Host ""
Write-Host "Mantendo apenas documentacao essencial..." -ForegroundColor Cyan

$filesToDelete = @(
    "SESSAO-COMPLETA-RESUMO.md",
    "SESSAO-COMPLETADA-RESUMO.md",
    "SESSAO-CONSOLIDACAO-DASHBOARD-COMPLETA.md",
    "SESSAO-CORRECAO-DASHBOARD-RESUMO.md",
    "SESSAO-APROVACAO-FINALIZADA.md",
    "RESUMO-SESSAO-APROVACAO-REALTIME.md",
    "RESUMO-SESSAO-AUTENTICACAO.md",
    "RESUMO-EXECUTIVO.md",
    "RESUMO-VISUAL-COMPLETO.md",
    "STATUS-DESENVOLVIMENTO.md",
    "STATUS-SUPABASE.md",
    "STATUS-APROVACAO-USUARIOS.md",
    "DESENVOLVIMENTO-STATUS-VISUAL.md",
    "PROJETO-COMPLETO-STATUS-FINAL.md",
    "MIGRATION-GUIDE.md",
    "MIGRATION-STATUS-REALIZADO.md",
    "MIGRATE-USERS-STEPS.md",
    "SETUP-COMPLETO.md",
    "FIX-DATABASE-ERROR.md",
    "FIX-RLS-MANUAL.md",
    "FIX-RPC-PERMISSION.md",
    "EMERGENCIA-RLS.md",
    "RESOLVER-RLS-RECURSIVA.md",
    "CORRECAO-DASHBOARD-CONSOLIDADO.md",
    "CORRECAO-PRODUTOS-COLUNAS.md",
    "AUTENTICACAO-COMPLETA.md",
    "AUTENTICACAO-CRUD-ROADMAP.md",
    "AUTENTICACAO-GUIDE.md",
    "AUTH-STATUS-ATUAL.md",
    "UPLOAD-IMAGENS-COMPLETO.md",
    "UPLOAD-IMAGENS-FINALIZADO.md",
    "UPLOAD-IMAGENS-STATUS.md",
    "EXECUTAR-SQL-APROVAR.md",
    "SQL-EXECUTADO-SUCESSO.md",
    "ACAO-IMEDIATA-SQL.md",
    "EXECUTION-PARALELO-RESULTADO.md",
    "RELATORIO-EXECUTIVO-STAKEHOLDERS.md",
    "RELATORIO-FLUXO-LOJISTA.md",
    "SUPABASE-EMAIL-VALIDATION-ISSUE.md",
    "SUPABASE-SERVICE-KEY-FIX.md",
    "SUPABASE.md",
    "CHECKLIST-VALIDACAO.md",
    "DEBUG-PRODUTOS.md",
    "DIAGRAMA-FLUXO-APROVACAO.md",
    "DASHBOARD-GUIA-RAPIDO.md",
    "PAINEL-LOJISTA-CONSOLIDACAO.md",
    "NEXT-STEPS-PARALLEL.md",
    "PROXIMAS-ITERACOES.md",
    "PERFIL-CAMPOS-ADICIONAIS.md",
    "AUTOMATIZACAO-EMAIL-LOJISTA.md",
    "CRUD-CLASSIFICADOS-COMPLETO.md",
    "SISTEMA-VARIANTES-PRODUTOS.md",
    "VSCODE-PERFORMANCE.md",
    "ANALISE-MARKDOWN.md"
)

$deleted = 0
$notFound = 0

foreach ($file in $filesToDelete) {
    $filePath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $filePath) {
        Remove-Item $filePath -Force
        Write-Host "OK Deletado: $file" -ForegroundColor Green
        $deleted++
    }
    else {
        Write-Host "-- Nao encontrado: $file" -ForegroundColor DarkGray
        $notFound++
    }
}

Write-Host ""
Write-Host "RESUMO:" -ForegroundColor Yellow
Write-Host "Deletados: $deleted arquivos" -ForegroundColor Green
Write-Host "Nao encontrados: $notFound arquivos" -ForegroundColor Gray

Write-Host ""
Write-Host "Arquivos mantidos:" -ForegroundColor Cyan
Write-Host "- README.md" -ForegroundColor White
Write-Host "- README-NEWS.md" -ForegroundColor White
Write-Host "- 00-COMECE-AQUI.md" -ForegroundColor White
Write-Host "- QUICK-START.md" -ForegroundColor White
Write-Host "- SUPABASE-CONFIG.md" -ForegroundColor White
Write-Host "- INDICE-DOCUMENTACAO.md" -ForegroundColor White
Write-Host "- URLS-ACESSO-SISTEMA.md" -ForegroundColor White
Write-Host "- TESTE-FLUXO-LOJISTA.md" -ForegroundColor White
Write-Host "- SUCESSO-FLUXO-LOJISTA.md" -ForegroundColor White

Write-Host ""
Write-Host "Limpeza concluida!" -ForegroundColor Green
Write-Host ""
