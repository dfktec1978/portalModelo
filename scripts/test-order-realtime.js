#!/usr/bin/env node
/**
 * teste-e2e-order-status.js
 * 
 * Simula o fluxo lojista → cliente em tempo real:
 *   1. Busca um pedido recente da loja informada
 *   2. Abre um canal Realtime como "cliente" inscrito no pedido
 *   3. Muda o status via UPDATE (simula ação do lojista)
 *   4. Verifica que o cliente recebe a atualização em ≤5s
 *   5. Reverte o status original ao final
 *
 * Uso:
 *   node scripts/test-order-realtime.js <store_id> [order_id]
 *
 * Pré-requisito: variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 *               (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) em .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou ANON_KEY) em .env.local');
  process.exit(1);
}

const storeId = process.argv[2];
if (!storeId) {
  console.error('Uso: node scripts/test-order-realtime.js <store_id> [order_id]');
  process.exit(1);
}

const targetOrderId = process.argv[3] || null;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { timeout: 10000 },
});

// Paleta de status para ciclar no teste
const TEST_STATUS = 'confirmed';

async function run() {
  console.log('\n🧪  Teste E2E — atualização de status de pedido em tempo real\n');

  // 1. Buscar pedido
  let orderId = targetOrderId;
  let originalStatus;

  if (!orderId) {
    console.log('🔍  Buscando pedido recente para a loja', storeId, '...');
    const { data, error } = await supabase
      .from('orders')
      .select('id, status')
      .eq('store_id', storeId)
      .not('status', 'in', '("delivered","cancelled")')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('❌  Nenhum pedido ativo encontrado para essa loja:', error?.message);
      process.exit(1);
    }

    orderId = data.id;
    originalStatus = data.status;
  } else {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single();

    if (error || !data) {
      console.error('❌  Pedido não encontrado:', error?.message);
      process.exit(1);
    }
    originalStatus = data.status;
  }

  console.log(`📦  Pedido: ${orderId}`);
  console.log(`📋  Status atual: ${originalStatus}`);
  console.log(`🎯  Status alvo:  ${TEST_STATUS}\n`);

  if (originalStatus === TEST_STATUS) {
    console.warn('⚠️   O pedido já está com o status alvo. Escolha outro pedido ou outro status.');
    process.exit(0);
  }

  // 2. Inscrever "cliente" via Realtime
  let received = false;
  let receivedAt = null;
  let receivedStatus = null;

  console.log('📡  Inscrevendo canal Realtime como "cliente"...');
  const channel = supabase.channel(`e2e-order-${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    }, (payload) => {
      received = true;
      receivedAt = Date.now();
      receivedStatus = payload.new?.status;
    });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout ao conectar ao Realtime (10s)')), 10000);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout);
        resolve();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timeout);
        reject(new Error(`Falha no canal Realtime: ${status}`));
      }
    });
  });

  console.log('✅  Canal inscrito. Aguardando...\n');

  // 3. Disparar UPDATE como "lojista"
  const updateAt = Date.now();
  console.log(`✏️   Atualizando status para "${TEST_STATUS}"...`);
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: TEST_STATUS, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (updateError) {
    console.error('❌  Erro ao atualizar pedido:', updateError.message);
    await supabase.removeChannel(channel);
    process.exit(1);
  }

  // 4. Aguardar evento Realtime por até 5s
  const TIMEOUT_MS = 5000;
  const pollInterval = 100;
  let waited = 0;

  while (!received && waited < TIMEOUT_MS) {
    await new Promise(r => setTimeout(r, pollInterval));
    waited += pollInterval;
  }

  await supabase.removeChannel(channel);

  // 5. Resultado
  if (received) {
    const latencyMs = receivedAt - updateAt;
    console.log(`\n✅  PASSOU — evento recebido em ${latencyMs} ms`);
    console.log(`    Status recebido: "${receivedStatus}"`);
    if (latencyMs < 1000) {
      console.log('    ⚡ Latência excelente (<1s)');
    } else if (latencyMs < 3000) {
      console.log('    👍 Latência boa (<3s)');
    } else {
      console.log('    ⚠️  Latência alta (>3s) — verifique a subscription Supabase Realtime');
    }
  } else {
    console.error('\n❌  FALHOU — nenhum evento recebido em 5 segundos');
    console.error('    Verifique se a tabela "orders" está na publication "supabase_realtime"');
    console.error('    SQL: ALTER PUBLICATION supabase_realtime ADD TABLE orders;');
  }

  // 6. Reverter status original
  console.log(`\n↩️   Revertendo status para "${originalStatus}"...`);
  const { error: revertError } = await supabase
    .from('orders')
    .update({ status: originalStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (revertError) {
    console.warn('⚠️   Erro ao reverter status:', revertError.message);
  } else {
    console.log('    Status revertido com sucesso.');
  }

  console.log('\n--- Fim do teste ---\n');
  process.exit(received ? 0 : 1);
}

run().catch(err => {
  console.error('Erro inesperado:', err.message);
  process.exit(1);
});
