const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ADMIN_EMAIL = 'dclojainfo@gmail.com';
const ADMIN_PASSWORD = 'dc120108';
const ADMIN_ID = '74670f12-7337-4ffe-93ff-5d12d462d9b0'; // ID do profile existente

async function recreateAdminAuth() {
  console.log(`🔄 Recriando usuário admin no Auth...\n`);

  try {
    // Criar novo usuário no Auth com o ID específico
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        role: 'admin'
      }
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      return;
    }

    console.log('✅ Usuário criado no Auth!');
    console.log(`   Email: ${data.user.email}`);
    console.log(`   ID Auth: ${data.user.id}`);
    console.log(`   Confirmado: Sim\n`);

    // Verificar se o profile já existe e está correto
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (profile) {
      console.log('✓ Profile já existe no banco');
      console.log(`  ID: ${profile.id}`);
      console.log(`  Role: ${profile.role}`);
      console.log(`  Status: ${profile.status}`);
    } else {
      console.log('⚠️  Profile não encontrado! Criando...');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: ADMIN_EMAIL,
          display_name: 'Admin Portal',
          role: 'admin',
          status: 'active'
        });

      if (insertError) {
        console.error('❌ Erro ao criar profile:', insertError);
      } else {
        console.log('✓ Profile criado com sucesso');
      }
    }

    console.log('\n✅ Admin dclojainfo@gmail.com está pronto para login!');
    console.log('   Email: dclojainfo@gmail.com');
    console.log('   Senha: dc120108');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

recreateAdminAuth().catch(console.error);
