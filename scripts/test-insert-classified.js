// Script de teste: autentica um usuário e tenta inserir um registro em `classifieds`
// Requer estas variáveis de ambiente:
// NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Erro: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  console.error('Erro: defina TEST_USER_EMAIL e TEST_USER_PASSWORD no .env para autenticar o usuário de teste');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

async function run() {
  console.log('Tentando autenticar usuário de teste:', TEST_USER_EMAIL);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (signInError) {
    console.error('Falha ao autenticar:', signInError.message || signInError);
    process.exit(1);
  }

  const user = signInData?.user;
  if (!user) {
    console.error('Nenhum usuário retornado na autenticação');
    process.exit(1);
  }

  console.log('Autenticado. user.id =', user.id);

  // Montar payload de teste
  const payload = {
    title: `Teste RLS - ${Date.now()}`,
    description: 'Teste automático para verificar policies de INSERT',
    category: 'geral',
    location: 'teste-local',
    price: 1,
    image_urls: [],
    seller_id: user.id,
    status: 'active',
  };

  console.log('Inserindo classificado de teste...');
  const { data, error } = await supabase.from('classifieds').insert(payload).select().single();

  if (error) {
    console.error('Erro ao inserir classificado:', error.message || error);
    process.exit(1);
  }

  console.log('Inserção bem-sucedida! id =', data.id);

  // Limpeza: deletar o registro criado (mesmo usuário)
  try {
    const { error: delError } = await supabase.from('classifieds').delete().eq('id', data.id);
    if (delError) console.warn('Aviso: erro ao deletar registro de teste:', delError.message || delError);
    else console.log('Registro de teste removido.');
  } catch (e) {
    console.warn('Erro durante cleanup:', e);
  }

  process.exit(0);
}

run().catch((e) => {
  console.error('Erro inesperado:', e);
  process.exit(1);
});
