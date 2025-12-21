const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Variáveis de ambiente não encontradas');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas em .env.local');
  process.exit(1);
}

const projectRef = url.replace('https://', '').replace('.supabase.co', '');
const connectionString = `postgresql://postgres:${key}@db.${projectRef}.supabase.co:5432/postgres`;

console.log('Tentando conectar ao Supabase...');

const client = new Client({ connectionString });

async function setupLojistaApprovalTrigger() {
  try {
    await client.connect();
    console.log('✅ Conectado com sucesso ao banco de dados');

    // Ler o arquivo SQL
    const fs = require('fs');
    const path = require('path');
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'trigger-lojista-approval-email.sql');

    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ Arquivo SQL não encontrado:', sqlFilePath);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('📄 Executando script SQL...');

    // Executar o SQL
    await client.query(sqlContent);

    console.log('✅ Trigger de aprovação de lojista configurado com sucesso!');
    console.log('📝 O que foi configurado:');
    console.log('   - Função notify_lojista_approval()');
    console.log('   - Trigger trigger_lojista_approval_email');
    console.log('   - Extensão pg_net habilitada');
    console.log('');
    console.log('⚠️  IMPORTANTE: Você precisa:');
    console.log('   1. Configurar a variável RESEND_API_KEY no Supabase');
    console.log('   2. Atualizar a URL da Edge Function no código SQL');
    console.log('   3. Testar a funcionalidade');

  } catch (err) {
    console.error('❌ Erro ao configurar trigger:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

setupLojistaApprovalTrigger();