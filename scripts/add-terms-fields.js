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

async function addTermsColumns() {
  try {
    await client.connect();
    console.log('✅ Conectado com sucesso ao banco de dados');

    // Adicionar coluna accepted_terms
    console.log('📝 Adicionando coluna accepted_terms...');
    await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepted_terms boolean default false;');

    // Adicionar coluna terms_version
    console.log('📝 Adicionando coluna terms_version...');
    await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_version text;');

    // Adicionar coluna accepted_at
    console.log('📝 Adicionando coluna accepted_at...');
    await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepted_at timestamptz;');

    console.log('✅ Todas as colunas foram adicionadas com sucesso!');
    console.log('📝 Campos adicionados:');
    console.log('   - accepted_terms: Se o usuário aceitou os termos');
    console.log('   - terms_version: Versão dos termos aceitos');
    console.log('   - accepted_at: Data e hora do aceite');

  } catch (err) {
    console.error('❌ Erro ao adicionar colunas:', err.message);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

addTermsColumns();