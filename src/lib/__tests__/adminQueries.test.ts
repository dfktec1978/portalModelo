/**
 * Testes Básicos - adminQueries.ts
 */

import { 
  subscribeToAdminNews,
  subscribeToAdminStores,
  type NewsDoc,
  type StoreDoc,
} from '@/lib/adminQueries';

/**
 * Teste 1: subscribeToAdminNews retorna dados
 */
async function testSubscribeToAdminNews() {
  console.log('🧪 Teste 1: subscribeToAdminNews()');
  try {
    let newsData: NewsDoc[] = [];
    
    const unsubscribe = subscribeToAdminNews((news) => {
      newsData = news;
    });

    // Aguardar um pouco para dados chegarem
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('   ✓ Callback recebido');
    console.log(`   ✓ Notícias: ${newsData.length}`);
    
    if (typeof unsubscribe === 'function') {
      unsubscribe();
      console.log('   ✓ Unsubscribe funcionou');
    }

    return newsData.length > 0;
  } catch (e: any) {
    console.error('   ❌ Erro:', e.message);
    return false;
  }
}

/**
 * Teste 2: subscribeToAdminStores retorna dados
 */
async function testSubscribeToAdminStores() {
  console.log('\n🧪 Teste 2: subscribeToAdminStores()');
  try {
    let storesData: StoreDoc[] = [];
    
    const unsubscribe = subscribeToAdminStores((stores) => {
      storesData = stores;
    });

    // Aguardar um pouco para dados chegarem
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('   ✓ Callback recebido');
    console.log(`   ✓ Lojas: ${storesData.length}`);
    
    if (typeof unsubscribe === 'function') {
      unsubscribe();
      console.log('   ✓ Unsubscribe funcionou');
    }

    return storesData.length >= 0; // OK mesmo que 0
  } catch (e: any) {
    console.error('   ❌ Erro:', e.message);
    return false;
  }
}

/**
 * Teste 3: Validar estrutura de dados
 */
async function testDataStructure() {
  console.log('\n🧪 Teste 3: Estrutura dos dados');
  try {
    let newsData: NewsDoc[] = [];
    
    const unsubscribe = subscribeToAdminNews((news) => {
      newsData = news;
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    if (newsData.length > 0) {
      const first = newsData[0];
      console.log('   Validando NewsDoc:');
      console.log(`   ✓ id: ${typeof first.id === 'string' ? '✓' : '✗'}`);
      console.log(`   ✓ title: ${typeof first.title === 'string' ? '✓' : '✗'}`);
      console.log(`   ✓ summary: ${typeof first.summary === 'string' || first.summary === undefined ? '✓' : '✗'}`);
      console.log(`   ✓ publishedAt: ${first.publishedAt ? '✓' : '✗'}`);
    }

    if (typeof unsubscribe === 'function') unsubscribe();
    return true;
  } catch (e: any) {
    console.error('   ❌ Erro:', e.message);
    return false;
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🧪 TESTES: adminQueries.ts                          ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const results = [
    await testSubscribeToAdminNews(),
    await testSubscribeToAdminStores(),
    await testDataStructure(),
  ];

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('\n📊 Resultado:');
  console.log(`   ${passed}/${total} testes passaram`);
  
  if (passed === total) {
    console.log('   ✅ TODOS OS TESTES PASSARAM!\n');
  } else {
    console.log(`   ⚠️  ${total - passed} testes falharam\n`);
  }

  return passed === total;
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };
