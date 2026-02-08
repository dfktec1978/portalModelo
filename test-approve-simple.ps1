$url = 'https://poltjzvbrngbkyhnuodw.supabase.co/rest/v1/profiles?status=eq.pending&limit=1'
$key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbHRqenZicm5nYmt5aG51b2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzY0MTUsImV4cCI6MjA4MDQ1MjQxNX0.iRkMRv8k5vySqBBuXErBMV7RNBTct49hGiqVTLHrx44'

try {
    $response = Invoke-WebRequest -Uri $url -Headers @{ apikey = $key; Authorization = "Bearer $key" } -ContentType 'application/json'
    $data = $response.Content | ConvertFrom-Json
  
    if ($data.Count -gt 0) {
        Write-Host "Encontrado usuario: $($data[0].id)"
        $userId = $data[0].id
    
        $approveUrl = 'http://192.168.1.8:3000/api/admin/usuarios'
        $approveBody = @{ userId = $userId; action = 'approve'; approveLoja = $false } | ConvertTo-Json
    
        Write-Host "Enviando POST para $approveUrl"
        Write-Host "Body: $approveBody"
        
        $approveResponse = Invoke-WebRequest -Uri $approveUrl -Method Post -Headers @{ 'Content-Type' = 'application/json' } -Body $approveBody -TimeoutSec 10
        
        Write-Host "Status: $($approveResponse.StatusCode)"
        $approveData = $approveResponse.Content | ConvertFrom-Json
    
        Write-Host "Resposta:"
        $approveData | ConvertTo-Json -Depth 10
    }
    else {
        Write-Host "Nenhum usuario pendente"
    }
}
catch {
    Write-Host "Erro: $($_.Exception.Message)"
    Write-Host "Details: $_"
}
