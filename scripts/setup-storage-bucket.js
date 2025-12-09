#!/usr/bin/env node

/**
 * Script para criar bucket de storage via Supabase Admin API
 */

import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
  process.exit(1);
}

async function createStorageBucket() {
  console.log("🔧 Inicializando Storage Bucket...\n");

  try {
    // 1. Verificar se bucket existe
    console.log("1️⃣  Listando buckets...");
    const listResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
    });

    const buckets = await listResponse.json();
    console.log(`✅ ${buckets.length} bucket(s) encontrado(s)`);

    const hasClassificadosBucket = buckets.some((b) => b.name === "classificados");

    if (hasClassificadosBucket) {
      console.log("✅ Bucket 'classificados' já existe\n");
      return;
    }

    // 2. Criar bucket
    console.log("2️⃣  Criando bucket 'classificados'...");
    const createResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "classificados",
        public: true,
        allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        file_size_limit: 5242880, // 5MB
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error("❌ Erro ao criar bucket:", error.message);
      process.exit(1);
    }

    const newBucket = await createResponse.json();
    console.log("✅ Bucket criado com sucesso!");
    console.log(`   Nome: ${newBucket.name}`);
    console.log(`   Público: ${newBucket.public}`);
    console.log(`   Tamanho máximo: 5MB`);

    console.log("\n✅ Storage está pronto! 🚀");
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

createStorageBucket();
