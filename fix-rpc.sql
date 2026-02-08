DROP FUNCTION IF EXISTS approve_user(uuid, boolean);
DROP FUNCTION IF EXISTS change_user_role(uuid, text);

-- Remover trigger e função problemáticos com CASCADE
DROP TRIGGER IF EXISTS trigger_lojista_approval_email ON profiles;
DROP FUNCTION IF EXISTS notify_lojista_approval() CASCADE;

CREATE OR REPLACE FUNCTION approve_user(p_user_id uuid, p_approve_store boolean DEFAULT false)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_result json;
  v_store_exists boolean;
  v_display_name text;
BEGIN
  UPDATE profiles SET status = 'active', approved_at = NOW() WHERE id = p_user_id;

  IF p_approve_store THEN
    -- Verificar se a loja já existe
    SELECT EXISTS(SELECT 1 FROM stores WHERE owner_id = p_user_id) INTO v_store_exists;
    
    IF v_store_exists THEN
      -- Atualizar loja existente
      UPDATE stores SET status = 'active', approved_at = NOW() WHERE owner_id = p_user_id;
    ELSE
      -- Criar loja se não existir
      SELECT display_name INTO v_display_name FROM profiles WHERE id = p_user_id;
      INSERT INTO stores (owner_id, store_name, status, created_at, approved_at)
      VALUES (p_user_id, COALESCE(v_display_name, 'Loja') || ' Store', 'active', NOW(), NOW());
    END IF;
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
$function$;

-- Teste a aprovação
SELECT approve_user('d5fc87dd-b4a7-4588-9daa-0562bd2a51e3'::uuid, true);
