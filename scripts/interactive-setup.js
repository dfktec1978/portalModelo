#!/usr/bin/env node

/**
 * Script interativo para configurar Supabase
 * Valida credenciais e oferece opções de remediation
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🔧 Assistente de Configuração — Supabase Portal Modelo\n');
  console.log('Este script irá ajudar a validar e configurar o Supabase.\n');

  // Step 1: Read current config
  const envPath = '.env.local';
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

  const currentUrl = urlMatch ? urlMatch[1].trim() : '';
  const currentKey = keyMatch ? keyMatch[1].trim() : '';

  console.log('📋 Configuração Atual:\n');
  console.log(`  URL: ${currentUrl ? '✓ ' + currentUrl : '✗ Não configurado'}`);
  console.log(`  Key: ${currentKey ? '✓ Configurado' : '✗ Não configurado'}\n`);

  // Step 2: Ask user
  const action = await question('O que deseja fazer?\n  1. Validar configuração atual\n  2. Atualizar credenciais\n  3. Sair\n\nOpção (1-3): ');

  if (action === '3') {
    console.log('Até logo!');
    rl.close();
    return;
  }

  if (action === '1') {
    // Validate
    await validateConfig(currentUrl, currentKey);
  } else if (action === '2') {
    // Update
    await updateCredentials(envPath, envContent);
  }

  rl.close();
}

async function validateConfig(url, key) {
  console.log('\n🔍 Validando configuração...\n');

  if (!url || !key) {
    console.log('❌ Credenciais incompletas.\n');
    const action = await question('Deseja adicioná-las agora? (s/n): ');
    if (action.toLowerCase() === 's') {
      await updateCredentials('.env.local', fs.readFileSync('.env.local', 'utf-8'));
    }
    return;
  }

  try {
    const client = createClient(url, key);
    console.log('✓ Cliente criado');

    const { data, error, status } = await client.from('news').select('1').limit(1);
    
    if (error && error.code === 'invalid_api_key') {
      console.log('\n❌ API Key Inválida\n');
      console.log('Possíveis causas:');
      console.log('  - A chave foi copiada incorretamente');
      console.log('  - A chave expirou');
      console.log('  - A chave não corresponde ao projeto\n');
      const action = await question('Deseja atualizar as credenciais? (s/n): ');
      if (action.toLowerCase() === 's') {
        await updateCredentials('.env.local', fs.readFileSync('.env.local', 'utf-8'));
      }
    } else if (error) {
      console.log(`\n⚠️  Aviso: ${error.message}\n`);
      console.log('Mas a API key parece válida.\n');
    } else {
      console.log('✓ API key válida');
      console.log(`✓ Status da query: ${status}`);
      console.log('✓ Tabela "news" acessível\n');
      console.log('✅ Configuração validada com sucesso!\n');
    }
  } catch (e) {
    console.log(`\n❌ Erro: ${e.message}\n`);
  }
}

async function updateCredentials(envPath, envContent) {
  console.log('\n📝 Atualizar Credenciais\n');
  console.log('Para obter as credenciais corretas:');
  console.log('1. Acesse https://app.supabase.com');
  console.log('2. Selecione seu projeto');
  console.log('3. Vá para Settings → API');
  console.log('4. Copie Project URL e anon public key\n');

  const url = await question('URL do Supabase (ex: https://project.supabase.co): ');
  const key = await question('Anon Key (JWT token): ');

  if (!url || !key) {
    console.log('\n❌ Valores inválidos.');
    return;
  }

  // Validate new credentials
  console.log('\n🔄 Validando novas credenciais...');
  try {
    const client = createClient(url, key);
    const { error } = await client.from('news').select('1').limit(1);
    
    if (error && error.code === 'invalid_api_key') {
      console.log('❌ API key inválida. Verifique e tente novamente.');
      return;
    }
  } catch (e) {
    console.log(`❌ Erro: ${e.message}`);
    return;
  }

  // Update .env.local
  let newEnv = envContent;

  if (newEnv.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
    newEnv = newEnv.replace(/NEXT_PUBLIC_SUPABASE_URL=.+/, `NEXT_PUBLIC_SUPABASE_URL=${url}`);
  } else {
    newEnv += `\n# Supabase config (pilot/testing)\nNEXT_PUBLIC_SUPABASE_URL=${url}`;
  }

  if (newEnv.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    newEnv = newEnv.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.+/, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${key}`);
  } else {
    newEnv += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${key}`;
  }

  fs.writeFileSync(envPath, newEnv);
  console.log('\n✅ Credenciais atualizadas em .env.local');
  console.log('\n⚠️  Reinicie o servidor para aplicar as mudanças:');
  console.log('  npm run dev\n');
}

main().catch(console.error);
