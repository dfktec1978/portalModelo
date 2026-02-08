-- SOLUÇÃO: Criar função que bypassa completamente o RLS

-- 1. Remover função anterior se existir
DROP FUNCTION IF EXISTS approve_user(uuid, boolean);
DROP FUNCTION IF EXISTS change_user_role(uuid, text);

-- 2. Criar função simplificada sem session_replication_role
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

-- 3. Criar função para mudar role
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
