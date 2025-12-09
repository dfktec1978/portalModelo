#!/usr/bin/env node

/**
 * Script para obter um usuário válido para testes
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Credenciais não configuradas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function getTestUser() {
  try {
    console.log("🔍 Buscando usuário de teste...\n");

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .limit(1);

    if (error) {
      console.error("❌ Erro ao buscar profiles:", error.message);
      process.exit(1);
    }

    if (!profiles || profiles.length === 0) {
      console.log("❌ Nenhum usuário encontrado no banco");
      console.log("\n📝 Crie um usuário executando:");
      console.log("   node scripts/quick-test-user.js");
      process.exit(1);
    }

    const user = profiles[0];
    console.log("✅ Usuário encontrado:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.display_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`\n📝 Use este ID em testes:\n   ${user.id}`);
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

getTestUser();
