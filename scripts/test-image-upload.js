#!/usr/bin/env node

/**
 * Script para testar upload de imagens
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { uploadClassifiedImage, deleteClassifiedImage } from "./src/lib/imageUpload.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImageUpload() {
  console.log("🖼️  Iniciando testes de upload de imagens...\n");

  try {
    // Criar imagem de teste se não existir
    const testImagePath = path.join(__dirname, "test-image.jpg");
    if (!fs.existsSync(testImagePath)) {
      // Criar um arquivo JPEG mínimo (1x1 pixel branco)
      const minimalJpeg = Buffer.from([0xff,0xd8,0xff,0xe0,0x00,0x10,0x4a,0x46,0x49,0x46,0x00,0x01,0x01,0x01,0x00,0x48,0x00,0x48,0x00,0x00,0xff,0xd9]);
      fs.writeFileSync(testImagePath, minimalJpeg);
      console.log("✅ Imagem de teste criada\n");
    }

    // 1. Upload de imagem
    console.log("1️⃣  Fazendo upload de imagem...");
    const file = new File([fs.readFileSync(testImagePath)], "test-image.jpg", { type: "image/jpeg" });

    const uploadResult = await uploadClassifiedImage(file, "test-classified-1");

    if (!uploadResult.success) {
      console.error("❌ Erro ao fazer upload:", uploadResult.error);
      return;
    }

    console.log("✅ Upload bem-sucedido!");
    console.log("   URL:", uploadResult.url);
    const uploadedUrl = uploadResult.url;

    // 2. Delete imagem
    console.log("\n2️⃣  Deletando imagem...");
    const deleteResult = await deleteClassifiedImage(uploadedUrl);

    if (deleteResult) {
      console.log("✅ Imagem deletada com sucesso");
    } else {
      console.error("❌ Erro ao deletar imagem");
    }

    console.log("\n✅ Testes de upload concluídos! 🎉");
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

testImageUpload();
