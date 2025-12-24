import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const ownerId = form.get('ownerId') as string | null;
    const entityId = form.get('entityId') as string | null;

    if (!file || !ownerId) {
      return NextResponse.json({ error: 'missing file or ownerId' }, { status: 400 });
    }

    const bucket = process.env.NEXT_PUBLIC_NEWS_BUCKET || process.env.NEXT_PUBLIC_PRODUCT_BUCKET || 'product-images';
    const fileName = `${ownerId}/${Date.now()}_${(file as any).name}`;

    const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(fileName, file as any, { upsert: false });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
    const publicUrl = (urlData as any)?.publicUrl || null;

    return NextResponse.json({ data: { publicUrl } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
