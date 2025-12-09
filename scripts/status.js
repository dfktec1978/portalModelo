#!/usr/bin/env node

/**
 * Status Dashboard — Portal Modelo
 * Mostra estado completo da configuração
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  📊 Portal Modelo — Dashboard de Status                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// 1. Environment Variables
console.log('📋 VARIÁVEIS DE AMBIENTE\n');
const envPath = '.env.local';
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

const checks = [
  { name: 'Firebase API Key', pattern: /NEXT_PUBLIC_FIREBASE_API_KEY=/ },
  { name: 'Firebase Project', pattern: /NEXT_PUBLIC_FIREBASE_PROJECT_ID=/ },
  { name: 'Supabase URL', pattern: /NEXT_PUBLIC_SUPABASE_URL=https:\/\// },
  { name: 'Supabase Anon Key', pattern: /NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ/ },
];

checks.forEach(check => {
  const status = check.pattern.test(envContent) ? '✓' : '✗';
  console.log(`  ${status} ${check.name}`);
});

// 2. Source Files
console.log('\n📁 ARQUIVOS PRINCIPAIS\n');
const files = [
  'src/lib/supabase.ts',
  'src/lib/useAuth.tsx',
  'src/lib/useSupabaseAuth.tsx',
  'src/components/SupabaseNewsExample.tsx',
  'src/app/supabase-test/page.tsx',
  'sql/supabase-init.sql',
  'scripts/test-supabase-connection.js',
  'scripts/generate-seed-sql.js',
  'scripts/interactive-setup.js',
  'SUPABASE.md',
  'SUPABASE-CONFIG.md',
];

files.forEach(file => {
  const exists = fs.existsSync(file) ? '✓' : '✗';
  const size = fs.existsSync(file) ? fs.statSync(file).size : 0;
  const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
  console.log(`  ${exists} ${file.padEnd(45)} ${sizeStr}`);
});

// 3. Configuration Status
console.log('\n⚙️  STATUS DE CONFIGURAÇÃO\n');

const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim() || '';
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim() || '';

console.log(`  Supabase URL: ${supabaseUrl ? '✓ ' + supabaseUrl : '✗ Não configurado'}`);
console.log(`  Supabase Key: ${supabaseKey ? '✓ Configurado' : '✗ Não configurado'}`);

// 4. Authentication Support
console.log('\n🔐 SUPORTE DE AUTENTICAÇÃO\n');
const useAuthContent = fs.readFileSync('src/lib/useAuth.tsx', 'utf-8');
console.log(`  Firebase: ${useAuthContent.includes('fbSignUp') ? '✓' : '✗'}`);
console.log(`  Supabase: ${useAuthContent.includes('supabase.auth.signUp') ? '✓' : '✗'}`);
console.log(`  Dual-Mode: ${useAuthContent.includes('useSupabase') ? '✓' : '✗'}`);

// 5. Next Steps
console.log('\n🚀 PRÓXIMOS PASSOS\n');

if (!supabaseUrl || !supabaseKey) {
  console.log('  1. Configure credenciais do Supabase:');
  console.log('     npm run setup-supabase');
  console.log('     (ou execute scripts/interactive-setup.js)\n');
}

console.log('  2. Valide a conexão:');
console.log('     npm run test-supabase\n');

console.log('  3. Acesse a página de teste:');
console.log('     http://localhost:3001/supabase-test\n');

console.log('  4. Consulte a documentação:');
console.log('     - SUPABASE-CONFIG.md (setup detalhado)');
console.log('     - SUPABASE.md (guia geral)');
console.log('     - STATUS-SUPABASE.md (status atual)\n');

// 6. Quick Commands
console.log('⌨️  COMANDOS RÁPIDOS\n');
console.log('  npm run dev              # Iniciar servidor');
console.log('  npm run build            # Build para produção');
console.log('  npm run lint             # Lint de código');
console.log('  node scripts/test-supabase-connection.js  # Testar conexão');
console.log('  node scripts/interactive-setup.js         # Setup interativo\n');

// 7. Browser URLs
console.log('🌐 URLS ÚTEIS\n');
console.log('  http://localhost:3001                # Home');
console.log('  http://localhost:3001/login          # Login');
console.log('  http://localhost:3001/cadastro-cliente       # Cadastro Cliente');
console.log('  http://localhost:3001/cadastro-logista       # Cadastro Lojista');
console.log('  http://localhost:3001/supabase-test  # Teste Supabase\n');

// 8. External Links
console.log('🔗 LINKS EXTERNOS\n');
console.log('  Supabase Console:     https://app.supabase.com');
console.log('  Firebase Console:     https://console.firebase.google.com');
console.log('  Supabase Docs:        https://supabase.com/docs');
console.log('  Next.js Docs:         https://nextjs.org/docs\n');

console.log('─'.repeat(62) + '\n');
