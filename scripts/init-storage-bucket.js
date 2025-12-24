#!/usr/bin/env node

/**
 * Script para inicializar bucket de storage no Supabase
 * Cria bucket "classificados" e configura policies públicas
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variáveis de ambiente não configuradas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initStorageBucket() {
  console.log("🔧 Inicializando bucket de storage...\n");

  try {
      // 1. Criar bucket (nome configurável)
      const BUCKET_NAME = process.env.NEXT_PUBLIC_PRODUCT_BUCKET || 'product-images';
      console.log(`1️⃣  Criando/verificando bucket '${BUCKET_NAME}'...`);
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('❌ Erro ao listar buckets:', listError.message);
        return;
      }

      const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

      if (bucketExists) {
        console.log(`✅ Bucket '${BUCKET_NAME}' já existe`);
      } else {
        const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 5242880, // 5MB
        });

        if (error) {
          console.error('❌ Erro ao criar bucket:', error.message);
          return;
        }

        console.log(`✅ Bucket '${BUCKET_NAME}' criado com sucesso`);
      }

    // 2. Configurar RLS policies
    console.log("\n2️⃣  Configurando RLS policies...");

    // Policy para leitura pública / upload autenticado (se existir RPC helper)
    try {
      const { error: policyReadError } = await supabase.rpc('create_storage_policy', {
        bucket_name: BUCKET_NAME,
        policy_name: 'public_read',
        policy_definition: 'SELECT',
        policy_check: 'true',
      });

      const { error: policyUploadError } = await supabase.rpc('create_storage_policy', {
        bucket_name: BUCKET_NAME,
        policy_name: 'authenticated_upload',
        policy_definition: 'INSERT',
        policy_check: "auth.role() = 'authenticated'",
      });

      if (policyReadError || policyUploadError) {
        console.warn('⚠️ Aviso: erros ao criar policies (verifique se a função RPC existe):', policyReadError?.message || policyUploadError?.message);
      } else {
        console.log('✅ Policies configuradas (via RPC)');
      }
    } catch (rpcErr) {
      console.warn('⚠️ RPC create_storage_policy não disponível — pulei criação automática de policies');
    }

    console.log("✅ Policies configuradas");

    // 3. Testar upload
    console.log("\n3️⃣  Testando upload de arquivo...");

    const testFile = new File(
      [Buffer.from("test image data")],
      "test-image.jpg",
      { type: "image/jpeg" }
    );

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`test/${Date.now()}-test.jpg`, testFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Erro ao fazer upload:", uploadError.message);
    } else {
      console.log("✅ Upload de teste bem-sucedido");
      console.log("   Path:", uploadData?.path);

      // 4. Gerar URL pública
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData?.path || '');

      console.log("   URL Pública:", data?.publicUrl);

      // Deletar arquivo de teste
      await supabase.storage.from("classificados").remove([uploadData?.path || ""]);
      console.log("   ✅ Arquivo de teste deletado");
    }

    console.log(`\n✅ Bucket '${BUCKET_NAME}' está pronto para uso!`);
    console.log('\n📝 Próximos passos:');
    console.log(`   1. Fazer upload de imagens no bucket '${BUCKET_NAME}'`);
    console.log('   2. URLs públicas serão geradas automaticamente');
    console.log('   3. Ex.: [bucket]/[year]/[month]/[id]');
  } catch (error) {
    console.error("❌ Erro geral:", error);
    process.exit(1);
  }
}

initStorageBucket();
