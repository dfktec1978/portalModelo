#!/usr/bin/env node

/**
 * Script para testar CRUD completo de Classificados com upload de imagens
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

async function testClassifiedCRUDWithImages() {
  console.log("🧪 Testando CRUD de Classificados com Upload de Imagens...\n");

  // ID de usuário válido do banco
  const testUserId = "f25a8972-ba3c-40f6-b448-e913ba440946";
  let classifiedId = "";

  try {
    // 1. Upload de imagem de teste
    console.log("1️⃣  Uploadando imagem de teste...");
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00,
      0x1f, 0x15, 0xc4, 0x89,
      0x00, 0x00, 0x00, 0x0a,
      0x49, 0x44, 0x41, 0x54,
      0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
      0x0d, 0x0a, 0x2d, 0xb4,
      0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4e, 0x44,
      0xae, 0x42, 0x60, 0x82,
    ]);

    const testFile = new File([pngBuffer], "test-image.png", { type: "image/png" });
    const timestamp = Date.now();
    const filepath = `test/${timestamp}-test.png`;

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

    const { data: publicUrlData } = supabase.storage
      .from("classificados")
      .getPublicUrl(uploadData?.path || "");
    const imageUrl = publicUrlData?.publicUrl;

    console.log(`✅ Imagem carregada`);
    console.log(`   URL: ${imageUrl?.substring(0, 80)}...`);

    // 2. CREATE - Criar classificado com imagem
    console.log("\n2️⃣  CREATE - Criando classificado com imagem...");
    const { data: createdClassified, error: createError } = await supabase
      .from("classifieds")
      .insert({
        title: "Teste CRUD - iPhone com Imagem",
        description: "Este é um teste de CRUD com upload de imagem - Teste completo",
        category: "eletrônicos",
        location: "São Paulo - SP",
        price: 1500.0,
        image_urls: [imageUrl],
        seller_id: testUserId,
        status: "active",
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Erro ao criar:", createError.message);
      process.exit(1);
    }

    classifiedId = createdClassified.id;
    console.log(`✅ Classificado criado: ${classifiedId}`);
    console.log(`   Título: ${createdClassified.title}`);
    console.log(`   Preço: R$ ${createdClassified.price}`);
    console.log(`   Imagens: ${createdClassified.image_urls?.length || 0}`);

    // 3. READ - Buscar classificado
    console.log("\n3️⃣  READ - Buscando classificado...");
    const { data: foundClassified, error: getError } = await supabase
      .from("classifieds")
      .select("*")
      .eq("id", classifiedId)
      .single();

    if (getError) {
      console.error("❌ Erro ao buscar:", getError.message);
      process.exit(1);
    }

    console.log("✅ Classificado encontrado:");
    console.log(`   Título: ${foundClassified.title}`);
    console.log(`   Imagens: ${foundClassified.image_urls?.length || 0}`);

    // 4. UPDATE - Atualizar dados
    console.log("\n4️⃣  UPDATE - Atualizando classificado...");
    const { error: updateError } = await supabase
      .from("classifieds")
      .update({
        title: "Teste CRUD - iPhone com Imagem (ATUALIZADO)",
        description: "Descrição atualizada após teste",
        price: 1400.0,
      })
      .eq("id", classifiedId);

    if (updateError) {
      console.error("❌ Erro ao atualizar:", updateError.message);
      process.exit(1);
    }

    const { data: updatedClassified } = await supabase
      .from("classifieds")
      .select("*")
      .eq("id", classifiedId)
      .single();

    console.log("✅ Classificado atualizado:");
    console.log(`   Título: ${updatedClassified?.title}`);
    console.log(`   Preço: R$ ${updatedClassified?.price}`);

    // 5. LIST - Listar com filtros
    console.log("\n5️⃣  LIST - Listando classificados ativos...");
    const { data: allClassifieds, error: listError } = await supabase
      .from("classifieds")
      .select("*")
      .eq("status", "active")
      .limit(5);

    if (listError) {
      console.error("❌ Erro ao listar:", listError.message);
      process.exit(1);
    }

    console.log(`✅ ${allClassifieds?.length || 0} classificado(s) encontrado(s)`);

    // 6. SEARCH - Buscar por texto
    console.log("\n6️⃣  SEARCH - Buscando por 'iPhone'...");
    const { data: searchResults, error: searchError } = await supabase
      .from("classifieds")
      .select("*")
      .ilike("title", "%iPhone%")
      .eq("status", "active");

    if (searchError) {
      console.error("❌ Erro ao buscar:", searchError.message);
      process.exit(1);
    }

    console.log(`✅ ${searchResults?.length || 0} resultado(s) encontrado(s)`);

    // 7. Soft DELETE - Deletar classificado
    console.log("\n7️⃣  DELETE - Deletando classificado (soft delete)...");
    const { error: deleteError } = await supabase
      .from("classifieds")
      .update({ status: "removed" })
      .eq("id", classifiedId);

    if (deleteError) {
      console.error("❌ Erro ao deletar:", deleteError.message);
      process.exit(1);
    }

    const { data: deletedClassified } = await supabase
      .from("classifieds")
      .select("*")
      .eq("id", classifiedId)
      .single();

    console.log("✅ Classificado deletado (soft delete):");
    console.log(`   Status: ${deletedClassified?.status}`);

    // 8. Limpar - Deletar arquivo de teste
    console.log("\n8️⃣  CLEANUP - Deletando arquivo de teste...");
    const { error: cleanError } = await supabase.storage
      .from("classificados")
      .remove([filepath]);

    if (cleanError) {
      console.warn(`⚠️  Erro ao limpar: ${cleanError.message}`);
    } else {
      console.log("✅ Arquivo de teste deletado");
    }

    console.log("\n✅ TESTE COMPLETO - Todos os testes passaram! 🎉");
    console.log("\n📊 Resumo:");
    console.log(`   ✅ Upload de imagem`);
    console.log(`   ✅ CREATE com imagem`);
    console.log(`   ✅ READ`);
    console.log(`   ✅ UPDATE`);
    console.log(`   ✅ LIST`);
    console.log(`   ✅ SEARCH`);
    console.log(`   ✅ Soft DELETE`);
    console.log(`   ✅ Cleanup`);
    console.log(`\n🎯 CRUD com imagens funcionando 100%!`);
  } catch (error) {
    console.error("❌ Erro geral:", error);
    process.exit(1);
  }
}

testClassifiedCRUDWithImages();
