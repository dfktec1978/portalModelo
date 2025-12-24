import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const publicUrl: string = body?.publicUrl;
    if (!publicUrl) return NextResponse.json({ error: 'publicUrl is required' }, { status: 400 });

    const bucket = process.env.NEXT_PUBLIC_PRODUCT_BUCKET || 'product-images';

    // Try to extract path from URL
    const parts = publicUrl.split(`/${bucket}/`);
    if (parts.length !== 2) {
      // If cannot extract path, still attempt to remove by searching product_images
      // Delete metadata rows matching public_url
      await supabaseAdmin.from('product_images').delete().eq('public_url', publicUrl);
      return NextResponse.json({ success: true });
    }

    const path = parts[1];

    // Remove file from storage
    const { error: delErr } = await supabaseAdmin.storage.from(bucket).remove([path]);

    if (delErr) {
      // Log but continue to attempt metadata delete
      console.error('Error deleting file from storage', delErr);
    }

    // Remove metadata rows referencing this path or public_url
    await supabaseAdmin.from('product_images').delete().or(`path.eq.${path},public_url.eq.${publicUrl}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
