#!/usr/bin/env node

/**
 * Script para criar bucket de storage usando Supabase JavaScript client
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function createStorageBucket() {
  console.log("🔧 Inicializando Storage Bucket...\n");

  try {
    // 1. Listar buckets
    console.log("1️⃣  Listando buckets existentes...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error("❌ Erro ao listar buckets:", listError.message);
      process.exit(1);
    }

    console.log(`✅ ${buckets?.length || 0} bucket(s) encontrado(s):`);
    buckets?.forEach((b) => console.log(`   - ${b.name} (público: ${b.public})`));

    const hasClassificadosBucket = buckets?.some((b) => b.name === "classificados");

    if (hasClassificadosBucket) {
      console.log("\n✅ Bucket 'classificados' já existe!");
      return;
    }

    // 2. Criar bucket
    console.log("\n2️⃣  Criando bucket 'classificados'...");
    const { data: newBucket, error: createError } = await supabase.storage.createBucket(
      "classificados",
      {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        fileSizeLimit: 5242880, // 5MB
      }
    );

    if (createError) {
      console.error("❌ Erro ao criar bucket:", createError.message);
      process.exit(1);
    }

    console.log("✅ Bucket 'classificados' criado!");
    console.log(`   Nome: ${newBucket?.name}`);
    console.log(`   Público: ${newBucket?.public}`);
    console.log(`   Tamanho máximo: 5MB`);

    console.log("\n✅ Storage pronto para uso! 🚀");
    console.log("\n📝 Próximos passos:");
    console.log("   1. Fazer upload de imagens em /classificados/novo");
    console.log("   2. URLs públicas serão geradas automaticamente");
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

createStorageBucket();
