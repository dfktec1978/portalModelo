import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'produtos.json');

function readProducts() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    if (!raw || !raw.trim()) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : (parsed.produtos || []);
  } catch (err) {
    console.error('readProducts error:', err);
    return [];
  }
}

function writeProducts(data: any) {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Write array directly
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const store = url.searchParams.get('store');
    
    if (!store) {
      return NextResponse.json({ error: 'store param required' }, { status: 400 });
    }

    const products = readProducts();
    const filtered = products.filter((p: any) => p.store === store);
    return NextResponse.json({ products: filtered });
  } catch (err) {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { store, name, price, description, category } = body;

    if (!store || !name || price === undefined) {
      return NextResponse.json({ error: 'store, name, price required' }, { status: 400 });
    }

    const products = readProducts();
    const newProduct = {
      id: Date.now().toString(),
      store,
      name,
      price: parseFloat(price),
      description: description ?? '',
      category: category ?? 'geral',
      created_at: new Date().toISOString(),
    };

    products.push(newProduct);
    writeProducts(products);

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, price, description, category } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const products = readProducts();
    const idx = products.findIndex((p: any) => p.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    if (name) products[idx].name = name;
    if (price !== undefined) products[idx].price = parseFloat(price);
    if (description !== undefined) products[idx].description = description;
    if (category !== undefined) products[idx].category = category;
    products[idx].updated_at = new Date().toISOString();

    writeProducts(products);
    return NextResponse.json({ product: products[idx] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id param required' }, { status: 400 });
    }

    const products = readProducts();
    const idx = products.findIndex((p: any) => p.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    const removed = products.splice(idx, 1)[0];
    writeProducts(products);

    return NextResponse.json({ removed });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
