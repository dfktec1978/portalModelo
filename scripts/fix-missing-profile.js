const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingProfile(userId) {
  try {
    console.log(`🔍 Verificando perfil para user: ${userId}`);
    
    // Buscar se perfil já existe
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar perfil:', fetchError);
      return;
    }
    
    if (existingProfile) {
      console.log('✅ Perfil já existe:', existingProfile);
      return;
    }
    
    console.log('⚠️ Perfil não encontrado, criando...');
    
    // Buscar dados do usuário na tabela auth.users
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    if (!user) {
      console.error('❌ Usuário não encontrado no auth');
      return;
    }
    
    console.log('📧 Email do usuário:', user.email);
    console.log('📝 Metadata:', user.user_metadata);
    
    // Criar perfil com dados do metadata
    const metadata = user.user_metadata || {};
    const role = metadata.role || 'cliente';
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: user.email,
        role: role,
        status: role === 'lojista' ? 'pending' : 'active',
        display_name: metadata.display_name || user.email?.split('@')[0] || 'Usuário',
        phone: metadata.phone || null
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Erro ao criar perfil:', createError);
      return;
    }
    
    console.log('✅ Perfil criado com sucesso:', newProfile);
    
    // Se for lojista, verificar se tem loja criada
    if (role === 'lojista') {
      const { data: stores } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', userId);
      
      if (stores && stores.length > 0) {
        console.log(`✅ Loja encontrada: ${stores[0].store_name}`);
      } else {
        console.log('⚠️ Nenhuma loja vinculada a este lojista');
      }
    }
    
  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

// Se passou userId como argumento
const userId = process.argv[2] || '2af300ce-55bf-4f0b-ae2f-e6e3a933a797';

fixMissingProfile(userId).then(() => {
  console.log('\n✅ Script finalizado');
  process.exit(0);
});
