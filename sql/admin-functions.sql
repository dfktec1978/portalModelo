-- Função para aprovar usuário (executa com privilégios do service role)
CREATE OR REPLACE FUNCTION approve_user(user_id uuid, approve_store boolean DEFAULT false)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do owner (bypass RLS)
AS $$
DECLARE
  result json;
BEGIN
  -- Atualizar profile
  UPDATE profiles
  SET 
    status = 'active',
    approved_at = NOW()
  WHERE id = user_id;

  -- Se for lojista e approve_store = true, aprovar loja também
  IF approve_store THEN
    UPDATE stores
    SET 
      status = 'active',
      approved_at = NOW()
    WHERE owner_id = user_id;
  END IF;

  -- Retornar dados atualizados
  SELECT json_build_object(
    'success', true,
    'message', 'Usuário aprovado com sucesso'
  ) INTO result;

  RETURN result;
END;
$$;

-- Função para alterar role do usuário
CREATE OR REPLACE FUNCTION change_user_role(user_id uuid, new_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Atualizar role
  UPDATE profiles
  SET role = new_role
  WHERE id = user_id;

  -- Retornar resultado
  SELECT json_build_object(
    'success', true,
    'message', 'Role atualizado com sucesso'
  ) INTO result;

  RETURN result;
END;
$$;
