#!/usr/bin/env node

/**
 * Adiciona coluna 'featured' à tabela professionals
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: variáveis de ambiente obrigatórias');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function addFeaturedColumn() {
  console.log('🔧 Adicionando coluna featured à tabela professionals...');

  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE professionals
        ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
      `
    });

    if (error) {
      console.error('❌ Erro:', error.message);
      return;
    }

    console.log('✅ Coluna featured adicionada com sucesso!');
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}

addFeaturedColumn();