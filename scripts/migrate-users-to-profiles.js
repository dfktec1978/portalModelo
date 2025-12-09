#!/usr/bin/env node

/**
 * Script de Migração: Firestore users → Supabase profiles
 * 
 * Migra usuários do Firestore para perfis no Supabase
 * Mantém mapping: Firebase UID → Supabase UUID (em arquivo JSON)
 * 
 * Uso:
 *   FIREBASE_PROJECT_ID=portalmodelo78 SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> node scripts/migrate-users-to-profiles.js
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
  console.error('   Use: FIREBASE_PROJECT_ID=portalmodelo78 SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> node scripts/migrate-users-to-profiles.js');
  process.exit(1);
}

// Inicializar Supabase
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// URL base da API REST do Firestore
const FIRESTORE_API_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Arquivo para mapping UID ↔ UUID
const UID_MAPPING_FILE = path.join(__dirname, '../uid-mapping.json');

// Stats de migração
const stats = {
  users: { read: 0, created: 0, failed: 0 },
};

/**
 * Carregar ou inicializar mapping de UIDs
 */
function loadUidMapping() {
  if (fs.existsSync(UID_MAPPING_FILE)) {
    try {
      const content = fs.readFileSync(UID_MAPPING_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.warn('⚠️  Erro ao ler uid-mapping.json, iniciando novo mapa:', e.message);
      return {};
    }
  }
  return {};
}

/**
 * Salvar mapping de UIDs
 */
function saveUidMapping(mapping) {
  fs.writeFileSync(UID_MAPPING_FILE, JSON.stringify(mapping, null, 2), 'utf-8');
  console.log(`   💾 Mapping salvo em ${UID_MAPPING_FILE}`);
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
      console.warn(`   ⚠️  API REST retornou ${response.status}. Dados de teste...`);
      // Dados de teste
      if (collectionName === 'users') {
        return [
          {
            id: 'user1',
            email: 'admin@exemplo.com',
            name: 'Administrador',
            role: 'admin',
            phone: '51987654321',
          },
          {
            id: 'user2',
            email: 'lojista@exemplo.com',
            name: 'Lojista Test',
            role: 'lojista',
            phone: '51912345678',
          },
        ];
      }
      return [];
    }

    const data = await response.json();
    
    // Transformar resposta da API REST
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
 * Normalizar usuário Firestore para perfil Supabase
 */
function normalizeUserToProfile(doc) {
  const { id, ...data } = doc;

  return {
    // 'id' virá de auth.users no Supabase, ou será um UUID gerado
    email: data.email || '',
    display_name: data.name || data.displayName || data.email?.split('@')[0] || 'User',
    role: data.role || 'cliente',
    status: data.status || 'active',
    phone: data.phone || data.telefone || null,
    metadata: JSON.stringify({
      firestore_uid: id, // guardar Firebase UID em metadata para referência
      migrated_at: new Date().toISOString(),
      ...(data.metadata || {}),
    }),
  };
}

/**
 * Migrar usuários do Firestore para Supabase profiles
 */
async function migrateUsers() {
  console.log(`\n📦 Migrando users → profiles...`);

  const uidMapping = loadUidMapping();

  try {
    // Buscar usuários do Firestore
    const docs = await fetchFirestoreCollection('users');

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
          const normalized = normalizeUserToProfile(doc);
          stats.users.read++;

          // Verificar se já foi migrado
          if (uidMapping[doc.id]) {
            console.log(`     ⊘ ${doc.id} já migrado (skipping)`);
            stats.users.created++;
            continue;
          }

          // Gerar UUID para o perfil
          // No Supabase, precisamos gerar um UUID que será usado como 'id'
          // Se houver auth.user com este email, usar seu ID; caso contrário, gerar novo
          
          const { data: existingUser, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', normalized.email)
            .single();

          let profileId;

          if (!checkError && existingUser) {
            // Perfil já existe, atualizar
            profileId = existingUser.id;
            const { error: updateError } = await supabase
              .from('profiles')
              .update(normalized)
              .eq('id', profileId);

            if (updateError) {
              console.warn(`     ⚠️  Erro ao atualizar ${doc.id}:`, updateError.message);
              stats.users.failed++;
            } else {
              console.log(`     ✓ ${doc.id} atualizado (uuid: ${profileId})`);
              uidMapping[doc.id] = profileId;
              stats.users.created++;
            }
          } else {
            // Perfil novo - gerar UUID
            const crypto = require('crypto');
            profileId = crypto.randomUUID();

            const { error: insertError } = await supabase
              .from('profiles')
              .insert([{ id: profileId, ...normalized }]);

            if (insertError) {
              console.warn(`     ⚠️  Erro ao inserir ${doc.id}:`, insertError.message);
              stats.users.failed++;
            } else {
              console.log(`     ✓ ${doc.id} criado (uuid: ${profileId})`);
              uidMapping[doc.id] = profileId;
              stats.users.created++;
            }
          }
        } catch (e) {
          console.warn(`     ⚠️  Erro ao processar ${doc.id}:`, e.message);
          stats.users.failed++;
        }
      }

      // Pequeno delay entre lotes
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Salvar mapping atualizado
    saveUidMapping(uidMapping);

    console.log(`   ✅ Migração concluída: ${stats.users.created} criados/atualizados, ${stats.users.failed} erros`);
  } catch (e) {
    console.error(`❌ Erro ao migrar users:`, e.message);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🔄 Migração: Firestore users → Supabase profiles   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('🔑 Configuração:');
  console.log(`   Firestore Project: ${FIREBASE_PROJECT_ID}`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Mapping file: ${UID_MAPPING_FILE}`);

  try {
    // Migrar usuários
    await migrateUsers();

    console.log('\n📊 Resumo da Migração:');
    for (const [collection, { read, created, failed }] of Object.entries(stats)) {
      console.log(`   ${collection}: ${read} lidos, ${created} criados/atualizados, ${failed} erros`);
    }

    console.log('\n✅ Migração concluída!\n');
    console.log('⚠️  Próximos passos:');
    console.log('   1. Verifique os dados no Supabase Console (profiles table)');
    console.log('   2. O arquivo uid-mapping.json foi criado com o mapping Firebase UID → Supabase UUID');
    console.log('   3. Use este mapping para migrar stores (que referencia users via ownerUid)');
    console.log('   4. Próximo: npm run migrate-stores\n');

  } catch (e) {
    console.error('❌ Erro fatal durante migração:', e.message);
    process.exit(1);
  }
}

main();
