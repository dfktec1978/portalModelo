import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const store = url.searchParams.get('store');
    
    if (!store) {
      return NextResponse.json({ error: 'store param required' }, { status: 400 });
    }

    // Placeholder: retornar array vazio por enquanto
    return NextResponse.json({ items: [] });
  } catch (err) {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
