require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLojistaFlow() {
  console.log('\n🔍 VERIFICAÇÃO DO FLUXO DE LOJISTA\n');
  console.log('='.repeat(60));

  // 1. Verificar lojista padrão (lojista915b@hotmail.com)
  console.log('\n📊 1. LOJISTA PADRÃO (lojista915b@hotmail.com)\n');
  
  const { data: standardProfile, error: stdError } = await supabase
    .from('profiles')
    .select('*, stores(*)')
    .eq('email', 'lojista915b@hotmail.com')
    .single();

  if (stdError) {
    console.error('❌ Erro ao buscar lojista padrão:', stdError.message);
  } else if (standardProfile) {
    console.log('✅ Perfil encontrado:');
    console.log('   - ID:', standardProfile.id);
    console.log('   - Email:', standardProfile.email);
    console.log('   - Role:', standardProfile.role);
    console.log('   - Status:', standardProfile.status);
    console.log('   - Nome:', standardProfile.display_name);
    console.log('   - Telefone:', standardProfile.phone);
    console.log('   - Termos aceitos:', standardProfile.accepted_terms);
    
    if (standardProfile.stores && standardProfile.stores.length > 0) {
      console.log('\n🏪 Loja vinculada:');
      const store = standardProfile.stores[0];
      console.log('   - ID:', store.id);
      console.log('   - Nome:', store.store_name);
      console.log('   - Slug:', store.slug);
      console.log('   - Status:', store.status);
      console.log('   - Categoria:', store.category);
      console.log('   - Telefone:', store.phone);
    } else {
      console.log('⚠️  Nenhuma loja vinculada!');
    }
  }

  // 2. Listar todos os lojistas
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 2. TODOS OS LOJISTAS NO SISTEMA\n');

  const { data: allLojistas, error: allError } = await supabase
    .from('profiles')
    .select('id, email, role, status, display_name, stores(id, store_name, status)')
    .eq('role', 'lojista')
    .order('created_at', { ascending: false });

  if (allError) {
    console.error('❌ Erro ao buscar lojistas:', allError.message);
  } else {
    console.log(`Total: ${allLojistas?.length || 0} lojistas\n`);
    
    allLojistas?.forEach((lojista, idx) => {
      console.log(`${idx + 1}. ${lojista.email || 'Sem email'}`);
      console.log(`   - Status Perfil: ${lojista.status}`);
      console.log(`   - Nome: ${lojista.display_name || 'N/A'}`);
      
      if (lojista.stores && lojista.stores.length > 0) {
        console.log(`   - Loja: ${lojista.stores[0].store_name} (${lojista.stores[0].status})`);
      } else {
        console.log(`   - ⚠️  SEM LOJA VINCULADA`);
      }
      console.log('');
    });
  }

  // 3. Verificar função approve_user
  console.log('='.repeat(60));
  console.log('\n🔧 3. FUNÇÃO approve_user NO BANCO\n');

  const { data: funcData, error: funcError } = await supabase
    .rpc('approve_user', { 
      p_user_id: '00000000-0000-0000-0000-000000000000', // ID fake só para testar existência
      p_approve_store: false 
    });

  if (funcError) {
    if (funcError.message.includes('could not find')) {
      console.log('❌ Função approve_user NÃO existe no banco');
      console.log('   → Execute: fix-rpc.sql');
    } else {
      console.log('✅ Função approve_user existe (erro esperado com ID fake)');
      console.log('   Erro:', funcError.message);
    }
  } else {
    console.log('✅ Função approve_user executada');
  }

  // 4. Verificar estrutura das tabelas
  console.log('\n' + '='.repeat(60));
  console.log('\n📐 4. ESTRUTURA DAS TABELAS\n');

  // Verificar colunas de profiles
  const { data: profilesSchema } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (profilesSchema && profilesSchema.length > 0) {
    console.log('✅ Colunas da tabela profiles:');
    Object.keys(profilesSchema[0]).forEach(col => {
      console.log(`   - ${col}`);
    });
  }

  // Verificar colunas de stores
  const { data: storesSchema } = await supabase
    .from('stores')
    .select('*')
    .limit(1);

  if (storesSchema && storesSchema.length > 0) {
    console.log('\n✅ Colunas da tabela stores:');
    Object.keys(storesSchema[0]).forEach(col => {
      console.log(`   - ${col}`);
    });
  }

  // 5. Verificar email trigger/função
  console.log('\n' + '='.repeat(60));
  console.log('\n📧 5. SISTEMA DE EMAIL DE CONFIRMAÇÃO\n');

  console.log('⚠️  Trigger notify_lojista_approval foi removido (usava net.http_post)');
  console.log('   → Email precisa ser implementado via:');
  console.log('      - Supabase Edge Functions + Resend/SendGrid');
  console.log('      - Ou webhook externo após aprovação');

  // 6. Verificar páginas essenciais
  console.log('\n' + '='.repeat(60));
  console.log('\n🌐 6. PÁGINAS ESSENCIAIS DO SISTEMA\n');

  const fs = require('fs');
  const path = require('path');

  const pagesCheck = [
    { path: 'src/app/cadastro/page.tsx', desc: 'Cadastro de lojista' },
    { path: 'src/app/dashboard/page.tsx', desc: 'Dashboard do lojista' },
    { path: 'src/app/dashboard/editar-perfil/page.tsx', desc: 'Editar perfil' },
    { path: 'src/app/admin/usuarios/page.tsx', desc: 'Aprovação admin' },
  ];

  pagesCheck.forEach(({ path: pagePath, desc }) => {
    const fullPath = path.join(process.cwd(), pagePath);
    const exists = fs.existsSync(fullPath);
    console.log(`${exists ? '✅' : '❌'} ${desc}: ${pagePath}`);
  });

  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 RESUMO DO FLUXO ESPERADO\n');
  console.log('1. ✅ Usuário faz cadastro tipo lojista → /cadastro');
  console.log('   → Cria perfil (status: pending)');
  console.log('   → Cria loja (status: pending)');
  console.log('');
  console.log('2. ⏳ Loja aguardando aprovação');
  console.log('   → Lojista vê mensagem "Aguardando aprovação" no dashboard');
  console.log('');
  console.log('3. ✅ Admin aprova → /admin/usuarios');
  console.log('   → Chama approve_user(user_id, true)');
  console.log('   → Atualiza perfil: status = "active"');
  console.log('   → Atualiza loja: status = "active"');
  console.log('');
  console.log('4. 📧 Email de confirmação');
  console.log('   → ⚠️  NÃO IMPLEMENTADO (trigger removido)');
  console.log('   → Precisa implementar via Edge Function');
  console.log('');
  console.log('5. ✅ Lojista tem acesso completo');
  console.log('   → Dashboard: /dashboard');
  console.log('   → Editar perfil: /dashboard/editar-perfil');
  console.log('   → Gerenciar produtos, pedidos, etc.');

  console.log('\n' + '='.repeat(60) + '\n');
}

checkLojistaFlow()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
