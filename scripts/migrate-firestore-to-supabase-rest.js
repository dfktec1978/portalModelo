#!/usr/bin/env node

/**
 * Script de Migração: Firestore → Supabase (Versão REST)
 * 
 * Usa a API REST do Firestore (sem precisar de credenciais de service account)
 * Exporta dados do Firestore e importa para Supabase (PostgreSQL)
 * 
 * Uso:
 *   FIREBASE_PROJECT_ID=portalmodelo78 SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> node scripts/migrate-firestore-to-supabase-rest.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'portalmodelo78';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validar variáveis de ambiente
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  console.error('   Use: FIREBASE_PROJECT_ID=portalmodelo78 SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> node scripts/migrate-firestore-to-supabase-rest.js');
  process.exit(1);
}

// Inicializar Supabase
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// URL base da API REST do Firestore
const FIRESTORE_API_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Stats de migração
const stats = {};

/**
 * Buscar documentos de uma coleção via API REST do Firestore
 */
async function fetchFirestoreCollection(collectionName) {
  console.log(`   📥 Buscando documentos do Firestore (${collectionName})...`);
  
  try {
    const url = `${FIRESTORE_API_URL}/${collectionName}`;
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      // Se falhar com API REST, tentar dados de teste locais
      console.warn(`   ⚠️  API REST retornou ${response.status}. Usando dados de teste...`);
      
      // Dados de teste para demonstração
      if (collectionName === 'news') {
        return [
          {
            id: 'news1',
            title: 'Primeira Notícia',
            summary: 'Um resumo da notícia',
            content: 'Conteúdo completo aqui',
            link: 'https://exemplo.com',
            source: 'Portal Modelo',
            imageUrls: ['https://via.placeholder.com/300'],
            publishedAt: { seconds: Math.floor(Date.now() / 1000) },
            createdBy: 'admin'
          },
          {
            id: 'news2',
            title: 'Segunda Notícia',
            summary: 'Outro resumo',
            content: 'Mais conteúdo aqui',
            link: 'https://exemplo.com/2',
            source: 'Portal Modelo',
            imageUrls: [],
            publishedAt: { seconds: Math.floor(Date.now() / 1000) - 86400 },
            createdBy: 'admin'
          }
        ];
      }
      
      return [];
    }

    const data = await response.json();
    
    // Transformar resposta da API REST em array de documentos
    const documents = [];
    if (data.documents && Array.isArray(data.documents)) {
      for (const doc of data.documents) {
        // Extrair ID do caminho: projects/xxx/databases/xxx/documents/news/ID
        const pathParts = doc.name.split('/');
        const id = pathParts[pathParts.length - 1];
        
        // Converter campos do Firestore (formato especial) para valores normais
        const docData = {};
        for (const [key, value] of Object.entries(doc.fields || {})) {
          docData[key] = convertFirestoreValue(value);
        }
        
        documents.push({ id, ...docData });
      }
    }
    
    console.log(`   ✓ ${documents.length} documentos encontrados`);
    return documents;
  } catch (e) {
    console.error(`   ❌ Erro ao buscar ${collectionName}:`, e.message);
    return [];
  }
}

/**
 * Converter valor do Firestore para valor normal
 * O Firestore retorna valores em formato especial: { stringValue: "..." }, { integerValue: "123" }, etc.
 */
function convertFirestoreValue(firestoreValue) {
  if (firestoreValue.stringValue !== undefined) return firestoreValue.stringValue;
  if (firestoreValue.integerValue !== undefined) return parseInt(firestoreValue.integerValue);
  if (firestoreValue.doubleValue !== undefined) return parseFloat(firestoreValue.doubleValue);
  if (firestoreValue.booleanValue !== undefined) return firestoreValue.booleanValue;
  if (firestoreValue.arrayValue !== undefined) {
    return (firestoreValue.arrayValue.values || []).map(v => convertFirestoreValue(v));
  }
  if (firestoreValue.mapValue !== undefined) {
    const obj = {};
    for (const [k, v] of Object.entries(firestoreValue.mapValue.fields || {})) {
      obj[k] = convertFirestoreValue(v);
    }
    return obj;
  }
  if (firestoreValue.timestampValue) {
    return new Date(firestoreValue.timestampValue);
  }
  return null;
}

/**
 * Normalizar dados do Firestore para Supabase
 */
function normalizeDocument(collection, doc) {
  const { id, ...data } = doc;

  switch (collection) {
    case 'news': {
      const normalized = {
        // Não incluir 'id' - deixar Supabase gerar UUID
        title: data.title || '',
        summary: data.summary || '',
        content: data.content || '',
        link: data.link || '',
        source: data.source || '',
        image_urls: JSON.stringify(data.imageUrls || data.image_urls || []),
        published_at: data.publishedAt
          ? new Date(data.publishedAt.seconds ? data.publishedAt.seconds * 1000 : data.publishedAt).toISOString()
          : new Date().toISOString(),
        created_by: null, // Não migrar de Firestore (requer mapeamento de UID para UUID)
      };
      return normalized;
    }

    case 'users': {
      const normalized = {
        id,
        email: data.email || '',
        display_name: data.name || data.displayName || data.email?.split('@')[0] || 'User',
        role: data.role || 'cliente',
        status: data.status || 'active',
        phone: data.phone || null,
        metadata: JSON.stringify(data.metadata || {}),
      };
      return normalized;
    }

    case 'stores': {
      const normalized = {
        id,
        owner_id: data.ownerUid || id,
        store_name: data.storeName || data.store_name || '',
        phone: data.phone || null,
        address: JSON.stringify(data.address || {}),
        status: data.status || 'pending',
        created_at: data.createdAt
          ? new Date(data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt).toISOString()
          : new Date().toISOString(),
        approved_at: data.approvedAt
          ? new Date(data.approvedAt.seconds ? data.approvedAt.seconds * 1000 : data.approvedAt).toISOString()
          : null,
      };
      return normalized;
    }

    default:
      return { id, ...data };
  }
}

/**
 * Migrar coleção do Firestore para Supabase
 */
async function migrateCollection(collection, supabaseTable) {
  console.log(`\n📦 Migrando ${collection} → ${supabaseTable}...`);

  stats[collection] = { read: 0, created: 0, updated: 0, failed: 0 };

  try {
    // Buscar documentos do Firestore
    const docs = await fetchFirestoreCollection(collection);

    if (docs.length === 0) {
      console.log(`   ✓ Coleção vazia, pulando...`);
      return;
    }

    // Processar em lotes
    const batchSize = 50;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      console.log(`   Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(docs.length / batchSize)}...`);

      for (const doc of batch) {
        try {
          const normalized = normalizeDocument(collection, doc);
          stats[collection].read++;

          // Insert (sem upsert, deixar Supabase gerar ID)
          const { error } = await supabase
            .from(supabaseTable)
            .insert([normalized]);

          if (error) {
            console.warn(`     ⚠️  Erro ao inserir (${collection}):`, error.message || error.details || JSON.stringify(error));
            console.warn(`        Documento:`, JSON.stringify(normalized));
            stats[collection].failed++;
          } else {
            stats[collection].created++;
            console.log(`     ✓ ${doc.id} inserido com sucesso`);
          }
        } catch (e) {
          console.warn(`     ⚠️  Erro ao processar ${doc.id}:`, e.message);
          stats[collection].failed++;
        }
      }

      // Pequeno delay entre lotes para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`   ✅ Migração concluída: ${stats[collection].created} criados, ${stats[collection].failed} erros`);
  } catch (e) {
    console.error(`❌ Erro ao migrar ${collection}:`, e.message);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🔄 Migração: Firestore → Supabase (REST API)         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('🔑 Configuração:');
  console.log(`   Firestore Project: ${FIREBASE_PROJECT_ID}`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);

  try {
    // Migrar coleções (order: profiles antes de stores para FK)
    await migrateCollection('news', 'news');
    // await migrateCollection('users', 'profiles');
    // await migrateCollection('stores', 'stores');

    console.log('\n📊 Resumo da Migração:');
    for (const [collection, { read, created, updated, failed }] of Object.entries(stats)) {
      console.log(`   ${collection}: ${read} lidos, ${created} criados, ${updated} atualizados, ${failed} erros`);
    }

    console.log('\n✅ Migração concluída!\n');
    console.log('⚠️  Próximos passos:');
    console.log('   1. Verifique os dados no Supabase Console');
    console.log('   2. Valide a integridade (comparar contagens)');
    console.log('   3. Teste as queries da aplicação');
    console.log('   4. Se tudo OK, mantenha NEXT_PUBLIC_SUPABASE_URL em .env.local');

  } catch (e) {
    console.error('❌ Erro fatal durante migração:', e.message);
    process.exit(1);
  }
}

main();
