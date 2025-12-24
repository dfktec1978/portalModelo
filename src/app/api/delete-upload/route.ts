import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const publicUrl: string = body?.publicUrl;
    if (!publicUrl) return NextResponse.json({ error: 'publicUrl is required' }, { status: 400 });

    // Attempt to extract bucket/path and remove file
    const url = new URL(publicUrl);
    // expected format: /storage/v1/object/public/{bucket}/{path}
    const parts = url.pathname.split('/');
    const idx = parts.findIndex(p => p === 'public');
    if (idx === -1 || parts.length <= idx + 2) {
      // fallback: try remove by scanning known buckets envs
      const buckets = [process.env.NEXT_PUBLIC_PRODUCT_BUCKET, process.env.NEXT_PUBLIC_CLASSIFIED_BUCKET, process.env.NEXT_PUBLIC_NEWS_BUCKET, process.env.NEXT_PUBLIC_PROFILE_BUCKET].filter(Boolean) as string[];
      for (const b of buckets) {
        const seg = `/${b}/`;
        if (publicUrl.includes(seg)) {
          const filePath = publicUrl.split(seg)[1];
          const { error } = await supabaseAdmin.storage.from(b).remove([filePath]);
          if (error) console.error('delete-upload remove error', error);
        }
      }
      return NextResponse.json({ success: true });
    }

    const bucket = parts[idx + 1];
    const filePath = parts.slice(idx + 2).join('/');

    const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath]);
    if (error) {
      console.error('delete-upload error', error);
      return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
