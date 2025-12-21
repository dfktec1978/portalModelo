const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addHeroImageColumn() {
  try {
    console.log('Tentando adicionar função exec_sql...');
    const { error: funcError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
        RETURNS VOID AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (funcError) {
      console.log('Função exec_sql já existe ou erro:', funcError.message);
    } else {
      console.log('Função exec_sql criada com sucesso');
    }

    console.log('Adicionando coluna hero_image_index...');
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE news ADD COLUMN IF NOT EXISTS hero_image_index INTEGER DEFAULT 0;'
    });

    if (columnError) {
      console.error('Erro ao adicionar coluna:', columnError);
    } else {
      console.log('Coluna hero_image_index adicionada com sucesso');
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

addHeroImageColumn();