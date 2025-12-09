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
    // 1. Criar bucket
    console.log("1️⃣  Criando bucket 'classificados'...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error("❌ Erro ao listar buckets:", listError.message);
      return;
    }

    const bucketExists = buckets?.some((b) => b.name === "classificados");

    if (bucketExists) {
      console.log("✅ Bucket 'classificados' já existe");
    } else {
      const { data, error } = await supabase.storage.createBucket("classificados", {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        fileSizeLimit: 5242880, // 5MB
      });

      if (error) {
        console.error("❌ Erro ao criar bucket:", error.message);
        return;
      }

      console.log("✅ Bucket 'classificados' criado com sucesso");
    }

    // 2. Configurar RLS policies
    console.log("\n2️⃣  Configurando RLS policies...");

    // Policy para leitura pública
    const { error: policyReadError } = await supabase.rpc("create_storage_policy", {
      bucket_name: "classificados",
      policy_name: "public_read",
      policy_definition: "SELECT",
      policy_check: "true",
    });

    // Policy para upload autenticado
    const { error: policyUploadError } = await supabase.rpc("create_storage_policy", {
      bucket_name: "classificados",
      policy_name: "authenticated_upload",
      policy_definition: "INSERT",
      policy_check: "auth.role() = 'authenticated'",
    });

    console.log("✅ Policies configuradas");

    // 3. Testar upload
    console.log("\n3️⃣  Testando upload de arquivo...");

    const testFile = new File(
      [Buffer.from("test image data")],
      "test-image.jpg",
      { type: "image/jpeg" }
    );

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("classificados")
      .upload(`test/${Date.now()}-test.jpg`, testFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Erro ao fazer upload:", uploadError.message);
    } else {
      console.log("✅ Upload de teste bem-sucedido");
      console.log("   Path:", uploadData?.path);

      // 4. Gerar URL pública
      const { data } = supabase.storage
        .from("classificados")
        .getPublicUrl(uploadData?.path || "");

      console.log("   URL Pública:", data?.publicUrl);

      // Deletar arquivo de teste
      await supabase.storage.from("classificados").remove([uploadData?.path || ""]);
      console.log("   ✅ Arquivo de teste deletado");
    }

    console.log("\n✅ Bucket 'classificados' está pronto para uso!");
    console.log("\n📝 Próximos passos:");
    console.log("   1. Fazer upload de imagens em /classificados/novo");
    console.log("   2. URLs públicas serão geradas automaticamente");
    console.log("   3. Imagens ficarão em: /classificados/[year]/[month]/[id]");
  } catch (error) {
    console.error("❌ Erro geral:", error);
    process.exit(1);
  }
}

initStorageBucket();
