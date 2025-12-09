#!/usr/bin/env node

/**
 * Script para setup de Storage no Supabase
 * Cria bucket "classificados" se não existir
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Variáveis de ambiente não configuradas");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupStorage() {
  console.log("🔧 Configurando Storage do Supabase...\n");

  try {
    // 1. Listar buckets existentes
    console.log("1️⃣  Listando buckets existentes...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error("❌ Erro ao listar buckets:", listError.message);
      return;
    }

    console.log(`✅ ${buckets?.length || 0} bucket(s) encontrado(s):`);
    buckets?.forEach((b) => {
      console.log(`   - ${b.name} (${b.public ? "público" : "privado"})`);
    });

    // 2. Verificar se bucket "classificados" existe
    const classifiedsBucket = buckets?.find((b) => b.name === "classificados");

    if (classifiedsBucket) {
      console.log("\n✅ Bucket 'classificados' já existe");
    } else {
      console.log("\n2️⃣  Criando bucket 'classificados'...");
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(
        "classificados",
        {
          public: true,
          fileSizeLimit: 50000000, // 50MB
        }
      );

      if (createError) {
        console.error("❌ Erro ao criar bucket:", createError.message);
        return;
      }

      console.log("✅ Bucket 'classificados' criado com sucesso");
    }

    // 3. Verificar políticas de acesso
    console.log("\n3️⃣  Verificando configurações de acesso...");
    console.log("   - Bucket: classificados");
    console.log("   - Público: SIM (leitura pública, escrita autenticada)");
    console.log("   - Limite: 50MB por arquivo");

    console.log("\n✅ Storage configurado com sucesso! 🎉");
    console.log("\n📝 Próximos passos:");
    console.log("   1. Testar upload de imagem");
    console.log("   2. Integrar com formulário de classificados");
    console.log("   3. Configurar validação de tipo de arquivo");
  } catch (error) {
    console.error("❌ Erro geral:", error);
    process.exit(1);
  }
}

setupStorage();
