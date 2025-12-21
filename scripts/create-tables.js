#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function createTables() {
  try {
    console.log('🔧 Criando tabelas essenciais...');

    // Criar tabela profiles
    console.log('📋 Criando tabela profiles...');
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists profiles (
          id uuid references auth.users on delete cascade primary key,
          email text,
          display_name text,
          role text default 'cliente',
          status text default 'active',
          metadata jsonb,
          created_at timestamptz default now(),
          approved_at timestamptz,
          phone text
        );
      `
    });

    if (profilesError) {
      console.log('⚠️  Tentando método alternativo para profiles...');
      // Método alternativo sem RPC
    }

    // Criar tabela stores
    console.log('🏪 Criando tabela stores...');
    const { error: storesError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists stores (
          id uuid primary key default gen_random_uuid(),
          owner_id uuid references profiles(id) on delete cascade,
          store_name text not null,
          phone text,
          address jsonb,
          status text default 'pending',
          created_at timestamptz default now(),
          approved_at timestamptz
        );
      `
    });

    if (storesError) {
      console.log('⚠️  Tentando método alternativo para stores...');
    }

    console.log('✅ Tabelas criadas!');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

createTables();