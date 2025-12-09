#!/usr/bin/env node

/**
 * Script para testar CRUD de Classificados
 * Testa: Criar, Listar, Buscar, Atualizar, Deletar
 */

import { supabase } from "./src/lib/supabase.ts";

async function testCRUD() {
  console.log("🧪 Iniciando testes CRUD de Classificados...\n");

  try {
    // 1. CREATE - Criar classificado de teste
    console.log("1️⃣  CREATE - Criando novo classificado...");
    const { data: createdClassified, error: createError } = await supabase
      .from("classifieds")
      .insert({
        title: "iPhone 13 - Teste CRUD",
        description: "Celular em perfeito estado de funcionamento",
        category: "eletrônicos",
        location: "São Paulo - SP",
        price: 1500.0,
        image_urls: [],
        seller_id: "test-user-id",
        status: "active",
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Erro ao criar:", createError.message);
      return;
    }

    console.log("✅ Classificado criado:", createdClassified.id);
    const testId = createdClassified.id;

    // 2. READ - Listar classificados ativos
    console.log("\n2️⃣  READ - Listando classificados ativos...");
    const { data: activeClassifieds, error: listError } = await supabase
      .from("classifieds")
      .select("*")
      .eq("status", "active");

    if (listError) {
      console.error("❌ Erro ao listar:", listError.message);
      return;
    }

    console.log(`✅ ${activeClassifieds?.length} classificado(s) encontrado(s)`);

    // 3. GET - Buscar um classificado específico
    console.log("\n3️⃣  GET - Buscando classificado específico...");
    const { data: foundClassified, error: getError } = await supabase
      .from("classifieds")
      .select("*")
      .eq("id", testId)
      .single();

    if (getError) {
      console.error("❌ Erro ao buscar:", getError.message);
      return;
    }

    console.log("✅ Classificado encontrado:", foundClassified.title);

    // 4. UPDATE - Atualizar classificado
    console.log("\n4️⃣  UPDATE - Atualizando classificado...");
    const { error: updateError } = await supabase
      .from("classifieds")
      .update({
        title: "iPhone 13 - Teste CRUD (ATUALIZADO)",
        price: 1400.0,
      })
      .eq("id", testId);

    if (updateError) {
      console.error("❌ Erro ao atualizar:", updateError.message);
      return;
    }

    const { data: updatedClassified } = await supabase
      .from("classifieds")
      .select("*")
      .eq("id", testId)
      .single();

    console.log("✅ Classificado atualizado:", updatedClassified?.title);
    console.log("   Novo preço: R$", updatedClassified?.price);

    // 5. SEARCH - Buscar por texto
    console.log("\n5️⃣  SEARCH - Buscando por texto...");
    const { data: searchResults, error: searchError } = await supabase
      .from("classifieds")
      .select("*")
      .ilike("title", "%iPhone%")
      .eq("status", "active");

    if (searchError) {
      console.error("❌ Erro ao buscar:", searchError.message);
      return;
    }

    console.log(`✅ ${searchResults?.length} resultado(s) encontrado(s)`);

    // 6. STATS - Contar por status
    console.log("\n6️⃣  STATS - Contando por status...");
    const { data: activeCount } = await supabase
      .from("classifieds")
      .select("*", { count: "exact" })
      .eq("status", "active");

    const { data: soldCount } = await supabase
      .from("classifieds")
      .select("*", { count: "exact" })
      .eq("status", "sold");

    console.log("✅ Estatísticas:");
    console.log("   Ativos:", activeCount?.length || 0);
    console.log("   Vendidos:", soldCount?.length || 0);

    // 7. DELETE (Soft) - Deletar classificado
    console.log("\n7️⃣  DELETE - Deletando classificado (soft delete)...");
    const { error: deleteError } = await supabase
      .from("classifieds")
      .update({ status: "removed" })
      .eq("id", testId);

    if (deleteError) {
      console.error("❌ Erro ao deletar:", deleteError.message);
      return;
    }

    const { data: deletedClassified } = await supabase
      .from("classifieds")
      .select("*")
      .eq("id", testId)
      .single();

    console.log("✅ Classificado deletado (soft delete)");
    console.log("   Status:", deletedClassified?.status);

    console.log("\n✅ Todos os testes passaram com sucesso! 🎉");
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

testCRUD();
