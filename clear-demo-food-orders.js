require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearDemoFoodOrders() {
  console.log('🧹 Limpando pedidos da Loja Demo Food...\n');

  // 1. Buscar a loja pelo nome
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, store_name, category')
    .ilike('store_name', '%demo food%')
    .maybeSingle();

  if (storeError) {
    console.error('❌ Erro ao buscar loja:', storeError.message);
    process.exit(1);
  }

  if (!store) {
    console.log('⚠️  Loja "Demo Food" não encontrada. Verificando lojas existentes...\n');
    const { data: allStores } = await supabase
      .from('stores')
      .select('id, store_name, category')
      .order('store_name');
    if (allStores?.length) {
      console.log('Lojas disponíveis:');
      allStores.forEach((s) => console.log(`  - "${s.store_name}" (${s.category}) → ${s.id}`));
    }
    process.exit(1);
  }

  console.log(`✅ Loja encontrada: "${store.store_name}" (${store.category})`);
  console.log(`   ID: ${store.id}\n`);

  // 2. Contar pedidos antes
  const { count: totalBefore } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store.id);

  console.log(`📊 Pedidos encontrados: ${totalBefore ?? 0}`);

  if (!totalBefore || totalBefore === 0) {
    console.log('\n✅ Nenhum pedido para remover. Base já está limpa.');
    process.exit(0);
  }

  // 3. Excluir pedidos (ON DELETE CASCADE cuida dos order_items automaticamente)
  const { error: deleteError } = await supabase
    .from('orders')
    .delete()
    .eq('store_id', store.id);

  if (deleteError) {
    console.error('❌ Erro ao deletar pedidos:', deleteError.message);
    process.exit(1);
  }

  // 4. Confirmar
  const { count: totalAfter } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store.id);

  console.log(`\n✅ Pedidos removidos: ${totalBefore}`);
  console.log(`📊 Pedidos restantes: ${totalAfter ?? 0}`);
  console.log('\n🎉 Loja Demo Food pronta para novos testes!');
}

clearDemoFoodOrders().catch((err) => {
  console.error('Erro inesperado:', err);
  process.exit(1);
});
