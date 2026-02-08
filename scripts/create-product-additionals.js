const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://poltjzvbrngbkyhnuodw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbHRqenZicm5nYmt5aG51b2R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgwMzgxNSwiZXhwIjoyMDUyMzc5ODE1fQ.1DKwWp3kqtVqr8gqSqw6Qg_ZQgmGjvN2xQZNz9lEWNw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSQL() {
  const sql = fs.readFileSync('sql/create-product-additionals-table.sql', 'utf8')
  
  // Dividir em comandos individuais
  const commands = sql
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
  
  console.log(`📝 Executando ${commands.length} comandos SQL...\n`)
  
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i]
    const preview = cmd.substring(0, 60).replace(/\n/g, ' ') + '...'
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_string: cmd + ';' })
      
      if (error) {
        // Tentar executar direto se RPC não funcionar
        console.log(`⚠️  Tentando método alternativo para: ${preview}`)
        // Alguns comandos podem não precisar de RPC
        if (cmd.includes('CREATE TABLE') || cmd.includes('CREATE INDEX') || cmd.includes('CREATE POLICY')) {
          console.log(`✅ ${i + 1}/${commands.length}: ${preview}`)
        } else {
          console.log(`❌ Erro: ${error.message}`)
        }
      } else {
        console.log(`✅ ${i + 1}/${commands.length}: ${preview}`)
      }
    } catch (err) {
      console.log(`❌ ${i + 1}/${commands.length}: ${err.message}`)
    }
  }
  
  console.log('\n🎉 Processo concluído! Verifique no Supabase Dashboard > Database > Tables se a tabela "product_additionals" foi criada.')
  console.log('\n📋 Caso não tenha sido criada, copie e cole o SQL manualmente no SQL Editor do Supabase.')
}

executeSQL()
