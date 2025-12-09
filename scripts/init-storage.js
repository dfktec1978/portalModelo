#!/usr/bin/env node

/**
 * Script para inicializar Supabase Storage bucket para classificados
 */

import { ensureClassifiedBucketExists } from "./src/lib/imageUpload.ts";

async function initStorage() {
  console.log("🔄 Inicializando Supabase Storage para classificados...\n");

  try {
    const success = await ensureClassifiedBucketExists();

    if (success) {
      console.log("✅ Bucket 'classificados-images' criado com sucesso!");
      console.log("   Status: Pronto para receber uploads de imagens");
      console.log("   Tipo: Público (URLs acessíveis)");
      console.log("   Limite: 5 imagens por classificado, máximo 5MB por imagem");
    } else {
      console.log("⚠️  Erro ao criar bucket. Verifique as credenciais do Supabase.");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

initStorage();
