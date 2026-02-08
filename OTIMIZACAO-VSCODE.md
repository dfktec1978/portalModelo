# Otimizacao VS Code - Acoes Imediatas

## EXECUTADO AUTOMATICAMENTE
- [x] Settings otimizados (.vscode/settings.json)
- [x] Cache limpo (.\limpar-cache.ps1)

## FACA AGORA (em ordem):

### 1. REINICIE O VS CODE
```
Ctrl+Shift+P → "Reload Window"
OU feche completamente (Ctrl+Q) e reabra
```

### 2. DESABILITE EXTENSOES NAO ESSENCIAIS
Pressione: Ctrl+Shift+X (Extensoes)

MANTER HABILITADAS:
- GitHub Copilot
- ESLint
- Prettier (se usar)

DESABILITAR TEMPORARIAMENTE:
- GitLens
- Live Server
- Beautify
- Color Highlight
- Bracket Pair Colorizer
- Todo Highlight
- Qualquer extensao de tema/icones extra

### 3. FECHE ABAS DESNECESSARIAS
```
Ctrl+K W  (fecha todas as abas)
Abra apenas o arquivo que esta editando
```

### 4. DESABILITE TYPESCRIPT EM ARQUIVOS GRANDES
Se tiver arquivos .md muito grandes:
```
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### 5. VERIFIQUE PROCESSOS
```powershell
# No PowerShell, verifique uso de CPU:
Get-Process -Name "Code" | Select-Object CPU,WS,ProcessName

# Se WS > 1GB, reinicie VS Code
```

## SE AINDA ESTIVER LENTO

### A. Limpe cache global do VS Code
```powershell
# FECHE VS CODE ANTES
Remove-Item "$env:APPDATA\Code\Cache" -Recurse -Force
Remove-Item "$env:APPDATA\Code\CachedData" -Recurse -Force
Remove-Item "$env:APPDATA\Code\Code Cache" -Recurse -Force
```

### B. Reinstale node_modules
```powershell
Remove-Item node_modules -Recurse -Force
npm install
```

### C. Aumente memoria do Node.js
Adicione em package.json:
```json
"scripts": {
  "dev": "NODE_OPTIONS='--max-old-space-size=8192' next dev --turbopack"
}
```

### D. Use WSL2 (se no Windows)
```
wsl --install
# Abra projeto no WSL: code . --remote wsl
```

## MONITORAMENTO

### Verificar uso de recursos:
```
Ctrl+Shift+P → "Developer: Show Running Extensions"
Ctrl+Shift+P → "Developer: Startup Performance"
```

### Logs de erro:
```
Ctrl+Shift+P → "Developer: Toggle Developer Tools"
Console → verificar erros vermelhos
```

## CONFIGURACOES APLICADAS

As seguintes otimizacoes JA FORAM APLICADAS:

1. TypeScript:
   - Memoria maxima: 8GB
   - Diagnosticos desabilitados
   - Auto-import de tipos desabilitado

2. Editor:
   - Minimap desabilitado
   - CodeLens desabilitado
   - Bracket colorization desabilitado
   - Format on save desabilitado

3. Arquivos excluidos:
   - node_modules (watcher)
   - .next (watcher)
   - .turbo (watcher)

## RESULTADO ESPERADO

Apos seguir esses passos:
- VS Code deve responder em < 1s
- Autocomplete rapido
- Salvamento instantaneo
- CPU < 30% (normal)

Se ainda estiver lento, reporte:
1. Quantidade de RAM (Task Manager)
2. CPU usage (Task Manager)
3. Extensoes ativas (Ctrl+Shift+X)
