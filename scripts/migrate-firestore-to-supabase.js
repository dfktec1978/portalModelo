#!/usr/bin/env node

/**
 * Script de Migração: Firestore → Supabase
 * 
 * Exporta dados do Firestore (Firebase) e importa para Supabase (PostgreSQL)
 * com transformação de estruturas conforme necessário.
 * 
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> node scripts/migrate-firestore-to-supabase.js
 * 
 * Coleções/Tabelas suportadas:
 *   - news → news (com normalização de campos)
 *   - users → profiles (com mapeamento de role/display_name)
 *   - stores → stores (com normalização)
 * 
 * Segurança:
 *   - Usa SERVICE_ROLE_KEY (server-side) para escrita no Supabase
 *   - Nunca exponha a chave em repositórios públicos
 */

const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações
const FIREBASE_CONFIG_PATH = path.join(__dirname, '../src/lib/firebase.ts');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validar variáveis de ambiente
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  console.error('   Use: SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> node scripts/migrate-firestore-to-supabase.js');
  process.exit(1);
}

// Inicializar Firebase (se não estiver inicializado)
if (!admin.apps.length) {
  console.log('🔥 Inicializando Firebase Admin SDK...');
  try {
    // Tentar ler a config do arquivo se existir
    // Caso contrário, assumir que já está configurado via variáveis de ambiente
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'portalmodelo78',
      databaseURL: undefined,
      // Credenciais virão de GOOGLE_APPLICATION_CREDENTIALS ou arquivo service account
    });
  } catch (e) {
    console.warn('⚠️  Firebase já estava inicializado ou erro:', e.message);
  }
}

// Inicializar Supabase
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Stats de migração
const stats = {};

/**
 * Normalizar dados do Firestore para Supabase
 */
function normalizeDocument(collection, doc) {
  const { id, ...data } = doc;

  switch (collection) {
    case 'news': {
      // Firestore: publishedAt (Timestamp), imageUrls (array), imageData (array)
      // Supabase: published_at (timestamptz), image_urls (jsonb)
      const normalized = {
        id,
        title: data.title,
        summary: data.summary,
        content: data.content,
        link: data.link,
        source: data.source,
        image_urls: JSON.stringify(data.imageUrls || data.image_urls || []),
        published_at: data.publishedAt
          ? new Date(data.publishedAt.seconds ? data.publishedAt.seconds * 1000 : data.publishedAt).toISOString()
          : new Date().toISOString(),
        created_by: data.createdBy || null,
      };
      return normalized;
    }

    case 'users': {
      // Firestore: users/<uid> → Supabase: profiles
      // Nota: Supabase profiles terá id = auth.user.id (gerado pelo trigger)
      // Aqui apenas normalizamos dados adicionais
      const normalized = {
        id,
        email: data.email,
        display_name: data.name || data.displayName || data.email.split('@')[0],
        role: data.role || 'cliente',
        status: data.status || 'active',
        phone: data.phone || null,
        metadata: JSON.stringify(data.metadata || {}),
      };
      return normalized;
    }

    case 'stores': {
      // Firestore: stores/<uid> → Supabase: stores
      const normalized = {
        id,
        owner_id: data.ownerUid || id,
        store_name: data.storeName || data.store_name,
        phone: data.phone,
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
    // Ler todos os documentos da coleção
    const snapshot = await admin.firestore().collection(collection).get();
    console.log(`   Total de documentos encontrados: ${snapshot.size}`);

    if (snapshot.empty) {
      console.log(`   ✓ Coleção vazia, pulando...`);
      return;
    }

    // Processar em lotes (para evitar timeout)
    const batchSize = 50;
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      console.log(`   Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(docs.length / batchSize)}...`);

      for (const doc of batch) {
        try {
          const normalized = normalizeDocument(collection, doc);
          stats[collection].read++;

          // Tentar upsert (insert or update)
          const { error } = await supabase
            .from(supabaseTable)
            .upsert([normalized], { onConflict: 'id' });

          if (error) {
            console.warn(`     ⚠️  Erro ao inserir ${doc.id}:`, error.message);
            stats[collection].failed++;
          } else {
            stats[collection].created++;
          }
        } catch (e) {
          console.warn(`     ⚠️  Erro ao processar ${doc.id}:`, e.message);
          stats[collection].failed++;
        }
      }
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
  console.log('║  🔄 Migração: Firestore → Supabase                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('🔑 Configuração:');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Firebase Project: portalmodelo78`);

  try {
    // Migrar coleções (order importa: profiles antes de stores para FK)
    // await migrateCollection('users', 'profiles');
    await migrateCollection('news', 'news');
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
    console.log('   4. Se tudo OK, remova NEXT_PUBLIC_SUPABASE_URL de .env.local para voltar a Firebase');
    console.log('   5. Depois execute novamente para produção com dados completos\n');

  } catch (e) {
    console.error('❌ Erro fatal durante migração:', e.message);
    process.exit(1);
  }
}

main();
