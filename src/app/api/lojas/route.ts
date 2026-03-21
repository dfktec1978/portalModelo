import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerPlanDefaults } from '@/lib/storePlansServer';

const DATA_PATH = path.join(process.cwd(), 'data', 'stores.json');

function readStores() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

function writeStores(data: any) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const ALLOWED_CATEGORIES = {
  varejo: 'Varejo',
  alimentacao: 'Alimentação'
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, category, theme } = body;
    const planDefaults = await getServerPlanDefaults('presenca');
    if (!name || !category) return NextResponse.json({ error: 'name and category required' }, { status: 400 });
    if (!Object.keys(ALLOWED_CATEGORIES).includes(category)) return NextResponse.json({ error: 'invalid category' }, { status: 400 });

    const stores = readStores();
    let s = slug && String(slug).trim() ? slugify(slug) : slugify(name);
    // ensure uniqueness
    let uniq = s;
    let i = 1;
    while (stores.find((x: any) => x.slug === uniq)) {
      uniq = `${s}-${i++}`;
    }

    const newStore = {
      id: Date.now().toString(),
      name,
      slug: uniq,
      category,
      theme: theme || 'azul',
      ...planDefaults,
      created_at: new Date().toISOString()
    };

    stores.push(newStore);
    writeStores(stores);

    return NextResponse.json({ store: newStore }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const stores = readStores();
    if (slug) {
      const found = stores.find((s: any) => s.slug === slug);
      return NextResponse.json({ store: found ?? null });
    }
    return NextResponse.json({ stores });
  } catch (err) {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
