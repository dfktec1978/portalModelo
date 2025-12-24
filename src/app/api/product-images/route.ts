import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { path, public_url, legacy_url, mime, size, product_id, store_id, uploaded_by } = body;

    if (!path || !store_id || !uploaded_by) {
      return NextResponse.json({ error: 'missing required fields (path, store_id, uploaded_by)' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('product_images')
      .insert({ path, public_url, legacy_url, mime, size: size ?? null, product_id: product_id ?? null, store_id, uploaded_by })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
