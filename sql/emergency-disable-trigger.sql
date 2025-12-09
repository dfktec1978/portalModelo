-- Emergency: Desabilitar trigger que está falhando
-- Executar no SQL Editor do Supabase Console

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Confirmar
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
