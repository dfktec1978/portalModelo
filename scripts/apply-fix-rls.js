#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente faltando');
  process.exit(1);
}

// Extrair dados da URL e chave
const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];
const dbHost = `${projectRef}.supabase.co`;

const sqlStatements = [
  'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;',
  'DROP POLICY IF EXISTS "Users can read own profile" ON profiles;',
  'DROP POLICY IF EXISTS "Users can update own profile" ON profiles;',
  'DROP POLICY IF EXISTS "Admin can view all" ON profiles;',
  'DROP POLICY IF EXISTS "Public read" ON profiles;',
  'DROP POLICY IF EXISTS "Users can update own" ON profiles;',
  'DROP POLICY IF EXISTS "Users can delete own" ON profiles;',
  'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;',
  'CREATE POLICY "Public read" ON profiles FOR SELECT USING (true);',
  'CREATE POLICY "Users can update own" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);',
  'CREATE POLICY "Users can delete own" ON profiles FOR DELETE USING (auth.uid() = id);',
];

async function applyFix() {
  const client = new Client({
    host: dbHost,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: SERVICE_ROLE_KEY,
    ssl: { rejectUnauthorized: false },
  });

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🔧 Aplicando Correção de RLS em profiles            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL do Supabase\n');

    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      try {
        await client.query(sql);
        console.log(`[${i + 1}/${sqlStatements.length}] ✓ ${sql.substring(0, 55)}...`);
      } catch (e) {
        if (!e.message.includes('already exists')) {
          console.log(`[${i + 1}/${sqlStatements.length}] ⚠️  ${e.message.substring(0, 50)}`);
        } else {
          console.log(`[${i + 1}/${sqlStatements.length}] ✓ ${sql.substring(0, 55)}...`);
        }
      }
    }

    await client.end();
    console.log('\n✅ Correção aplicada com sucesso!\n');
    console.log('📋 Próximo passo:');
    console.log('   npm run test\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.log('\n💡 Verifique:');
    console.log('   - .env.local tem SUPABASE_SERVICE_ROLE_KEY correto');
    console.log('   - Firewall permite conexão em port 5432\n');
    process.exit(1);
  }
}

applyFix();
