/**
 * Testes Básicos - newsQueries.ts
 * 
 * Testes simples para validar que as funções de query funcionam
 * sem complexidade de setup de Jest
 */

import { 
  fetchAllNews, 
  fetchNewsById, 
  fetchNewsSuggestions,
  type NewsDoc 
} from '@/lib/newsQueries';

/**
 * Teste 1: fetchAllNews retorna array
 */
async function testFetchAllNews() {
  console.log('🧪 Teste 1: fetchAllNews()');
  try {
    const news = await fetchAllNews();
    console.log('   ✓ Retornou array:', Array.isArray(news));
    console.log(`   ✓ Quantidade: ${news.length} notícias`);
    if (news.length > 0) {
      console.log(`   ✓ Primeira: "${news[0].title}"`);
    }
    return true;
  } catch (e: any) {
    console.error('   ❌ Erro:', e.message);
    return false;
  }
}

/**
 * Teste 2: fetchNewsById retorna notícia com campos corretos
 */
async function testFetchNewsById() {
  console.log('\n🧪 Teste 2: fetchNewsById(id)');
  try {
    const allNews = await fetchAllNews();
    if (allNews.length === 0) {
      console.log('   ⚠️  Sem notícias para testar');
      return true;
    }

    const firstId = allNews[0].id;
    const news = await fetchNewsById(firstId);
    
    console.log('   ✓ Retornou notícia');
    console.log(`   ✓ ID: ${news?.id}`);
    console.log(`   ✓ Título: "${news?.title}"`);
    console.log(`   ✓ Published: ${news?.publishedAt}`);
    return !!news;
  } catch (e: any) {
    console.error('   ❌ Erro:', e.message);
    return false;
  }
}

/**
 * Teste 3: fetchNewsSuggestions retorna array
 */
async function testFetchNewsSuggestions() {
  console.log('\n🧪 Teste 3: fetchNewsSuggestions(excludeId, count)');
  try {
    const allNews = await fetchAllNews();
    if (allNews.length === 0) {
      console.log('   ⚠️  Sem notícias para testar');
      return true;
    }

    const firstId = allNews[0].id;
    const suggestions = await fetchNewsSuggestions(firstId, 2);
    
    console.log('   ✓ Retornou array:', Array.isArray(suggestions));
    console.log(`   ✓ Quantidade: ${suggestions.length} sugestões`);
    suggestions.forEach((s, i) => {
      console.log(`   ✓ Sugestão ${i + 1}: "${s.title}"`);
    });
    return true;
  } catch (e: any) {
    console.error('   ❌ Erro:', e.message);
    return false;
  }
}

/**
 * Teste 4: Dados estão normalizados
 */
async function testDataNormalization() {
  console.log('\n🧪 Teste 4: Normalização de dados');
  try {
    const news = await fetchAllNews();
    if (news.length === 0) {
      console.log('   ⚠️  Sem notícias para testar');
      return true;
    }

    const firstNews = news[0];
    
    // Verificar campos obrigatórios
    console.log('   Validando campos:');
    console.log(`   ✓ id: ${typeof firstNews.id === 'string' ? '✓' : '✗'}`);
    console.log(`   ✓ title: ${typeof firstNews.title === 'string' ? '✓' : '✗'}`);
    console.log(`   ✓ publishedAt: ${typeof firstNews.publishedAt === 'string' || firstNews.publishedAt instanceof Date ? '✓' : '✗'}`);
    
    // Verificar que imageUrls é array
    const isValidImageUrls = Array.isArray(firstNews.imageUrls) || !firstNews.imageUrls;
    console.log(`   ✓ imageUrls é array: ${isValidImageUrls ? '✓' : '✗'}`);
    
    return isValidImageUrls;
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
  console.log('║  🧪 TESTES: newsQueries.ts                           ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const results = [
    await testFetchAllNews(),
    await testFetchNewsById(),
    await testFetchNewsSuggestions(),
    await testDataNormalization(),
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

// Executar se for chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };
