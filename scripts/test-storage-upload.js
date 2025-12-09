#!/usr/bin/env node

/**
 * Script para testar upload de imagem para Supabase Storage
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
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

async function testImageUpload() {
  console.log("🧪 Testando upload de imagem...\n");

  try {
    // 1. Criar imagem de teste (PNG simples)
    console.log("1️⃣  Criando imagem de teste...");
    
    // Criar PNG 1x1 pixel simples (transparente)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // Width: 1
      0x00, 0x00, 0x00, 0x01, // Height: 1
      0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
      0x1f, 0x15, 0xc4, 0x89, // CRC
      0x00, 0x00, 0x00, 0x0a, // IDAT length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
      0x0d, 0x0a, 0x2d, 0xb4, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND length
      0x49, 0x45, 0x4e, 0x44, // IEND
      0xae, 0x42, 0x60, 0x82, // CRC
    ]);

    const testFile = new File([pngBuffer], "test-image.png", { type: "image/png" });
    console.log(`✅ Imagem criada: ${testFile.name} (${testFile.size} bytes)`);

    // 2. Upload para bucket
    console.log("\n2️⃣  Fazendo upload para 'classificados' bucket...");
    
    const timestamp = Date.now();
    const filepath = `test/${timestamp}-test-image.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("classificados")
      .upload(filepath, testFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Erro ao fazer upload:", uploadError.message);
      process.exit(1);
    }

    console.log("✅ Upload bem-sucedido!");
    console.log(`   Path: ${uploadData?.path}`);

    // 3. Gerar URL pública
    console.log("\n3️⃣  Gerando URL pública...");
    const { data: publicUrlData } = supabase.storage
      .from("classificados")
      .getPublicUrl(uploadData?.path || "");

    console.log("✅ URL Pública gerada:");
    console.log(`   ${publicUrlData?.publicUrl}`);

    // 4. Testar acesso à URL
    console.log("\n4️⃣  Testando acesso à URL...");
    const response = await fetch(publicUrlData?.publicUrl || "");
    
    if (response.ok) {
      console.log(`✅ URL acessível (${response.headers.get("content-type")})`);
    } else {
      console.warn(`⚠️  URL retornou status: ${response.status}`);
    }

    // 5. Deletar arquivo de teste
    console.log("\n5️⃣  Deletando arquivo de teste...");
    const { error: deleteError } = await supabase.storage
      .from("classificados")
      .remove([uploadData?.path || ""]);

    if (deleteError) {
      console.error("❌ Erro ao deletar:", deleteError.message);
    } else {
      console.log("✅ Arquivo deletado com sucesso");
    }

    console.log("\n✅ Teste completo! Storage funcionando corretamente! 🎉");
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

testImageUpload();
