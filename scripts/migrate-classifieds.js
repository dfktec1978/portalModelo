#!/usr/bin/env node

/**
 * Script de Migração: Firestore classifieds → Supabase classifieds
 * 
 * Usa API REST do Firestore (sem credential file)
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'portalmodelo78';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const FIRESTORE_API_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const stats = { classifieds: { read: 0, created: 0, failed: 0 } };

async function fetchFirestoreCollection(collectionName) {
  console.log(`   📥 Buscando ${collectionName}...`);
  try {
    const url = `${FIRESTORE_API_URL}/${collectionName}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`   ⚠️  API retornou ${response.status}`);
      return [];
    }

    const data = await response.json();
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
    
    console.log(`   ✓ ${documents.length} encontrados`);
    return documents;
  } catch (e) {
    console.error(`   ❌ Erro:`, e.message);
    return [];
  }
}

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

function normalizeClassified(doc) {
  const { id, ...data } = doc;
  return {
    title: data.title || '',
    description: data.description || data.desc || '',
    category: data.category || 'geral',
    price: data.price ? parseFloat(data.price) : null,
    status: data.status || 'active',
    posted_by: data.posted_by || null,
    images: JSON.stringify(data.images || []),
    created_at: data.createdAt ? new Date(data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt).toISOString() : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function migrateClassifieds() {
  console.log(`\n📦 Migrando classifieds → classifieds...`);

  try {
    const docs = await fetchFirestoreCollection('classifieds');
    if (docs.length === 0) {
      console.log(`   ✓ Coleção vazia`);
      return;
    }

    const batchSize = 50;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      console.log(`   Lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(docs.length / batchSize)}...`);

      for (const doc of batch) {
        try {
          const normalized = normalizeClassified(doc);
          stats.classifieds.read++;

          const { error } = await supabase.from('classifieds').insert([normalized]);

          if (error) {
            console.warn(`     ⚠️  Erro ${doc.id}:`, error.message);
            stats.classifieds.failed++;
          } else {
            stats.classifieds.created++;
          }
        } catch (e) {
          console.warn(`     ⚠️  Erro ao processar ${doc.id}:`, e.message);
          stats.classifieds.failed++;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`   ✅ ${stats.classifieds.created} criados, ${stats.classifieds.failed} erros`);
  } catch (e) {
    console.error(`❌ Erro:`, e.message);
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🔄 Migração: Firestore classifieds → Supabase       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('🔑 Configuração:');
  console.log(`   Firestore: ${FIREBASE_PROJECT_ID}`);
  console.log(`   Supabase: ${SUPABASE_URL}`);

  await migrateClassifieds();

  console.log('\n📊 Resumo:');
  console.log(`   classifieds: ${stats.classifieds.read} lidos, ${stats.classifieds.created} criados\n`);
}

main();
