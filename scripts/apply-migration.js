#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const fileArg = process.argv[2] || 'sql/migrations/001_create_product_images.sql';
  const sqlPath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(sqlPath)) {
    console.error('Arquivo SQL não encontrado:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Defina a variável de ambiente DATABASE_URL antes de rodar o script.');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Conectado ao banco. Executando migration:', sqlPath);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration executada com sucesso.');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Falha ao aplicar migration:', err.message || err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
