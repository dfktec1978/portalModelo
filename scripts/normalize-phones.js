/*
 Simple normalization script for phone fields in Firestore.

 Usage:
 1. Install dependencies: npm install firebase-admin
 2. Set GOOGLE_APPLICATION_CREDENTIALS to the path of a service account JSON key.
 3. Run: node scripts/normalize-phones.js

 What it does:
 - Scans collections `users` and `stores`.
 - If a document has `telefone` but not `phone`, copies `telefone` -> `phone`.
 - If a doc has `phone`, normalizes formatting (keeps digits and leading +) and writes back.
 - Logs changes. Use carefully in production.
*/

const admin = require('firebase-admin');
const db = (function init() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
})();

function normalizeNumber(raw) {
  if (!raw) return raw;
  // keep digits and leading +, remove other chars
  const digits = raw.toString().trim().replace(/[^+0-9]/g, '');
  return digits;
}

async function processCollection(name) {
  console.log(`Scanning collection: ${name}`);
  const snapshot = await db.collection(name).get();
  console.log(`Found ${snapshot.size} documents in ${name}`);
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let toUpdate = {};
    if (data.telefone && !data.phone) {
      toUpdate.phone = normalizeNumber(data.telefone);
    }
    if (data.phone) {
      const normalized = normalizeNumber(data.phone);
      if (normalized !== data.phone) toUpdate.phone = normalized;
    }
    if (Object.keys(toUpdate).length > 0) {
      await doc.ref.update(toUpdate);
      updated++;
      console.log(`Updated ${name}/${doc.id}:`, toUpdate);
    }
  }
  console.log(`Updated ${updated} documents in ${name}`);
}

(async () => {
  try {
    await processCollection('users');
    await processCollection('stores');
    console.log('Normalization complete');
    process.exit(0);
  } catch (e) {
    console.error('Error during normalization:', e);
    process.exit(1);
  }
})();
