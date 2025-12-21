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

async function addProfileColumns() {
  try {
    await client.connect();
    console.log('✅ Conectado com sucesso ao banco de dados');

    // Adicionar coluna profile_image
    console.log('📸 Adicionando coluna profile_image...');
    await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image text;');

    // Adicionar coluna instagram
    console.log('📱 Adicionando coluna instagram...');
    await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram text;');

    // Adicionar coluna facebook
    console.log('📘 Adicionando coluna facebook...');
    await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook text;');

    console.log('✅ Todas as colunas foram adicionadas com sucesso!');
    console.log('📝 Campos adicionados:');
    console.log('   - profile_image: URL da foto de perfil');
    console.log('   - instagram: Nome de usuário do Instagram');
    console.log('   - facebook: URL ou nome de usuário do Facebook');

  } catch (err) {
    console.error('❌ Erro ao adicionar colunas:', err.message);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

addProfileColumns();