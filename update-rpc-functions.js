const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = `DROP FUNCTION IF EXISTS approve_user(uuid, boolean);
DROP FUNCTION IF EXISTS change_user_role(uuid, text);

CREATE OR REPLACE FUNCTION approve_user(p_user_id uuid, p_approve_store boolean DEFAULT false)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_result json;
BEGIN
  UPDATE profiles SET status = 'active', approved_at = NOW() WHERE id = p_user_id;

  IF p_approve_store THEN
    UPDATE stores SET status = 'active', approved_at = NOW() WHERE owner_id = p_user_id;
  END IF;

  v_result := json_build_object(
    'success', true,
    'message', 'Usuário aprovado com sucesso'
  );

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION change_user_role(p_user_id uuid, p_new_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_result json;
BEGIN
  UPDATE profiles SET role = p_new_role WHERE id = p_user_id;

  v_result := json_build_object(
    'success', true,
    'message', 'Role atualizado com sucesso'
  );

  RETURN v_result;
END;
$function$;`;

async function executeSQL() {
  console.log('🔄 Executando SQL para corrigir funções RPC...\n');
  
  try {
    // Tentar via RPC de execução SQL genérica se existir
    // Caso contrário, exibir as instruções para executar manualmente
    
    console.log('📋 SQL a ser executado:\n');
    console.log(sql);
    console.log('\n\n⚠️ INSTRUÇÕES:');
    console.log('1. Abra o Supabase Dashboard: https://app.supabase.com');
    console.log('2. Vá para: SQL Editor');
    console.log('3. Clique em "New query"');
    console.log('4. Cole o SQL acima');
    console.log('5. Clique em "Run"');
    console.log('\nOu execute via terminal com psql (se tiver acesso)');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

executeSQL();
