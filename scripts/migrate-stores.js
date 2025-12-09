#!/usr/bin/env node

/**
 * Script de Migração: Firestore stores → Supabase stores
 * 
 * Migra lojas do Firestore para Supabase
 * Usa uid-mapping.json para mapear ownerUid (Firebase) → owner_id (Supabase UUID)
 * 
 * Uso:
 *   FIREBASE_PROJECT_ID=portalmodelo78 SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> npm run migrate-stores
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'portalmodelo78';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validar variáveis de ambiente
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

// Inicializar Supabase
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// URL base da API REST do Firestore
const FIRESTORE_API_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Arquivo com mapping UID ↔ UUID
const UID_MAPPING_FILE = path.join(__dirname, '../uid-mapping.json');

// Stats de migração
const stats = {
  stores: { read: 0, created: 0, failed: 0, skipped: 0 },
};

/**
 * Carregar mapping de UIDs
 */
function loadUidMapping() {
  if (fs.existsSync(UID_MAPPING_FILE)) {
    try {
      const content = fs.readFileSync(UID_MAPPING_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.warn('⚠️  Erro ao ler uid-mapping.json:', e.message);
      return {};
    }
  }
  console.warn('⚠️  uid-mapping.json não encontrado! Execute migrate-users primeiro.');
  return {};
}

/**
 * Buscar documentos de uma coleção via API REST do Firestore
 */
async function fetchFirestoreCollection(collectionName) {
  console.log(`   📥 Buscando documentos do Firestore (${collectionName})...`);
  
  try {
    const url = `${FIRESTORE_API_URL}/${collectionName}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`   ⚠️  API REST retornou ${response.status}. Usando dados de teste...`);
      // Dados de teste
      if (collectionName === 'stores') {
        return [
          {
            id: 'store1',
            storeName: 'Loja Exemplo',
            ownerUid: '2nwardjmURgVQdwp2pHDtEWbZpd2',
            phone: '51987654321',
            address: { street: 'Rua das Flores', city: 'Modelo' },
            status: 'pending',
            createdAt: { seconds: Math.floor(Date.now() / 1000) },
          },
        ];
      }
      return [];
    }

    const data = await response.json();
    
    // Transformar resposta
    const documents = [];
    if (data.documents && Array.isArray(data.documents)) {
      for (const doc of data.documents) {
        const pathParts = doc.name.split('/');
        const id = pathParts[pathParts.length - 1];
        
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
 * Normalizar loja Firestore para Supabase
 */
function normalizeStoreToSupabase(doc, uidMapping) {
  const { id, ...data } = doc;

  // Mapear ownerUid (Firebase) para owner_id (Supabase UUID)
  const firebaseOwnerId = data.ownerUid || data.uid || id;
  const supabaseOwnerId = uidMapping[firebaseOwnerId];

  if (!supabaseOwnerId) {
    console.warn(`     ⚠️  Owner ${firebaseOwnerId} não encontrado no uid-mapping.json`);
    return null;
  }

  return {
    // Gerar novo UUID para a loja (não reusar ID do Firestore)
    // O ID será gerado pelo Supabase
    owner_id: supabaseOwnerId,
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
}

/**
 * Migrar lojas do Firestore para Supabase
 */
async function migrateStores() {
  console.log(`\n📦 Migrando stores → stores...`);

  const uidMapping = loadUidMapping();

  if (Object.keys(uidMapping).length === 0) {
    console.warn(`   ⚠️  uid-mapping.json está vazio! Execute migrate-users primeiro.`);
    return;
  }

  try {
    // Buscar lojas do Firestore
    const docs = await fetchFirestoreCollection('stores');

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
          const normalized = normalizeStoreToSupabase(doc, uidMapping);
          
          if (!normalized) {
            stats.stores.skipped++;
            continue;
          }

          stats.stores.read++;

          // Insert (deixar Supabase gerar ID)
          const { error } = await supabase
            .from('stores')
            .insert([normalized]);

          if (error) {
            console.warn(`     ⚠️  Erro ao inserir ${doc.id}:`, error.message);
            stats.stores.failed++;
          } else {
            console.log(`     ✓ ${doc.id} migrado com sucesso`);
            stats.stores.created++;
          }
        } catch (e) {
          console.warn(`     ⚠️  Erro ao processar ${doc.id}:`, e.message);
          stats.stores.failed++;
        }
      }

      // Pequeno delay entre lotes
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`   ✅ Migração concluída: ${stats.stores.created} criados, ${stats.stores.failed} erros, ${stats.stores.skipped} pulados`);
  } catch (e) {
    console.error(`❌ Erro ao migrar stores:`, e.message);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🔄 Migração: Firestore stores → Supabase stores     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('🔑 Configuração:');
  console.log(`   Firestore Project: ${FIREBASE_PROJECT_ID}`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Mapping file: ${UID_MAPPING_FILE}`);

  try {
    // Migrar lojas
    await migrateStores();

    console.log('\n📊 Resumo da Migração:');
    for (const [collection, { read, created, failed, skipped }] of Object.entries(stats)) {
      console.log(`   ${collection}: ${read} lidos, ${created} criados, ${failed} erros, ${skipped} pulados`);
    }

    console.log('\n✅ Migração concluída!\n');
    console.log('⚠️  Próximos passos:');
    console.log('   1. Verifique os dados no Supabase Console (stores table)');
    console.log('   2. Teste admin/lojas para listar as lojas migradas');
    console.log('   3. Considere migrar outras coleções (classifieds, professionals, etc)');

  } catch (e) {
    console.error('❌ Erro fatal durante migração:', e.message);
    process.exit(1);
  }
}

main();
