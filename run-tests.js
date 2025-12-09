#!/usr/bin/env node

/**
 * Script wrapper para rodar testes TypeScript
 * Carrega as variáveis de ambiente e executa os testes compilados
 */

require('dotenv').config({ path: '.env.local' });

const { spawn } = require('child_process');
const path = require('path');

async function runTest(testFile) {
  return new Promise((resolve) => {
    const npxProcess = spawn('npx', [
      'ts-node',
      '--project', 'tsconfig.json',
      testFile
    ], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env
    });

    npxProcess.on('close', resolve);
  });
}

async function main() {
  console.log('\n🧪 Executando testes...\n');
  
  const testFiles = [
    'src/lib/__tests__/newsQueries.test.ts',
    'src/lib/__tests__/adminQueries.test.ts'
  ];

  for (const testFile of testFiles) {
    console.log(`\n📋 Teste: ${testFile}`);
    await runTest(testFile);
  }

  console.log('\n✅ Testes concluídos!');
}

main().catch(console.error);
