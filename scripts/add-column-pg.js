const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Variáveis de ambiente não encontradas');
  process.exit(1);
}

const projectRef = url.replace('https://', '').replace('.supabase.co', '');
const connectionString = `postgresql://postgres:${key}@db.${projectRef}.supabase.co:5432/postgres`;

console.log('Tentando conectar...');
const client = new Client({ connectionString });

client.connect()
  .then(() => {
    console.log('Conectado com sucesso');
    return client.query('ALTER TABLE news ADD COLUMN IF NOT EXISTS hero_image_index INTEGER DEFAULT 0;');
  })
  .then(() => {
    console.log('Coluna hero_image_index adicionada com sucesso');
    return client.end();
  })
  .catch(err => {
    console.error('Erro:', err);
    client.end();
  });