require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseStoreIssue() {
  console.log('\n🔍 DIAGNÓSTICO: Loja não aparece na sidebar\n');
  console.log('='.repeat(60));

  const userId = 'bb6f3a4f-d900-40a3-94a4-44532d43537c';
  
  // 1. Verificar lojas do usuário
  console.log('\n1️⃣ Consultando stores.owner_id:\n');
  const { data: stores, error } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', userId);

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log(`Lojas encontradas: ${stores?.length || 0}\n`);
  
  if (stores && stores.length > 0) {
    stores.forEach((store, idx) => {
      console.log(`Loja ${idx + 1}:`);
      console.log('  - ID:', store.id);
      console.log('  - store_name:', store.store_name);
      console.log('  - owner_id:', store.owner_id);
      console.log('  - status:', store.status);
      console.log('  - phone:', store.phone);
      console.log('  - address:', store.address);
      console.log('  - approved_at:', store.approved_at);
      console.log('  - created_at:', store.created_at);
      console.log('');
    });

    // Verificar se status está bloqueando
    const activeStores = stores.filter(s => s.status === 'active');
    const blockedStores = stores.filter(s => s.status === 'blocked');
    
    console.log('📊 Filtros de status:');
    console.log(`  - Status "active": ${activeStores.length} loja(s)`);
    console.log(`  - Status "blocked": ${blockedStores.length} loja(s)`);
    console.log('');

    if (blockedStores.length > 0) {
      console.log('⚠️ PROBLEMA: Loja marcada como "blocked"!');
      console.log('   A sidebar do dashboard filtra lojas bloqueadas.');
      console.log('   Verificar: src/app/dashboard/page.tsx linha 88\n');
    }
  } else {
    console.log('❌ PROBLEMA: Nenhuma loja encontrada!');
    console.log('   Usuário não possui lojas vinculadas.\n');
  }

  // 2. Verificar perfil
  console.log('2️⃣ Verificando perfil:\n');
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, status')
    .eq('id', userId)
    .single();

  if (profile) {
    console.log('  - Role:', profile.role);
    console.log('  - Status:', profile.status);
    console.log('');
  }

  // 3. Explicar o bug do "Bloqueada"
  console.log('='.repeat(60));
  console.log('\n🐛 BUG IDENTIFICADO: Status "Bloqueada" no Admin\n');
  console.log('Problema: Página admin/lojas mostra "✓ Bloqueada" mesmo');
  console.log('quando status é "active".\n');
  console.log('Causa provável: Lógica invertida ou campo errado.');
  console.log('Arquivo: src/app/admin/lojas/page.tsx\n');

  console.log('='.repeat(60));
  console.log('\n💡 SOLUÇÕES:\n');
  console.log('1. Se loja estiver com status "blocked":');
  console.log('   → Atualizar para "active"');
  console.log('');
  console.log('2. Se status já for "active":');
  console.log('   → Corrigir lógica em admin/lojas/page.tsx');
  console.log('   → Verificar componente que renderiza "Bloqueada"\n');
}

diagnoseStoreIssue()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
