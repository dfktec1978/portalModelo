const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const sql = `
-- Remover função anterior se existir
DROP FUNCTION IF EXISTS approve_user(uuid, boolean);
DROP FUNCTION IF EXISTS change_user_role(uuid, text);

-- Criar função simplificada sem session_replication_role
CREATE OR REPLACE FUNCTION approve_user(p_user_id uuid, p_approve_store boolean DEFAULT false)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  -- Atualizar profile diretamente
  UPDATE profiles SET status = 'active', approved_at = NOW() WHERE id = p_user_id;

  -- Se for para aprovar loja também
  IF p_approve_store THEN
    UPDATE stores SET status = 'active', approved_at = NOW() WHERE owner_id = p_user_id;
  END IF;

  v_result := json_build_object(
    'success', true,
    'message', 'Usuário aprovado com sucesso'
  );

  RETURN v_result;
END;
$$;

-- Criar função para mudar role
CREATE OR REPLACE FUNCTION change_user_role(p_user_id uuid, p_new_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
`;

async function executeSQL() {
  console.log('🔄 Executando SQL para corrigir funções RPC...\n');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      return;
    }
    
    console.log('✅ SQL executado com sucesso!');
    console.log('📝 Resultado:', data);
  } catch (err) {
    console.error('❌ Erro na requisição:', err.message);
  }
}

executeSQL();
