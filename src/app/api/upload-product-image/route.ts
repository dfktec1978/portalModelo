import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const ownerId = form.get('ownerId') as string | null;
    const productId = (form.get('productId') as string) || null;

    if (!file || !ownerId) {
      return NextResponse.json({ error: 'missing file or ownerId' }, { status: 400 });
    }

    const bucket = process.env.NEXT_PUBLIC_PRODUCT_BUCKET || 'product-images';
    // build path using owner/store id
    // attempt to map owner -> store
    const { data: stores } = await supabaseAdmin.from('stores').select('id').eq('owner_id', ownerId).limit(1).maybeSingle();
    const storeId = (stores as any)?.id || ownerId;
    const fileName = `${storeId}/${Date.now()}_${(file as any).name}`;

    // upload using admin client
    const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(fileName, file as any, { upsert: false });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
    const publicUrl = (urlData as any)?.publicUrl || null;

    // insert metadata into product_images
    const { data, error } = await supabaseAdmin
      .from('product_images')
      .insert({ path: fileName, public_url: publicUrl, mime: (file as any).type || null, size: (file as any).size || null, product_id: productId, store_id: storeId, uploaded_by: ownerId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: { publicUrl, metadata: data } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
