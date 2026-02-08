import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const ownerId = form.get('ownerId') as string | null;
    const productId = (form.get('productId') as string) || null;

    console.log('📸 Upload iniciado:', { hasFile: !!file, ownerId, productId });

    if (!file || !ownerId) {
      console.error('❌ Validação falhou:', { file: !!file, ownerId });
      return NextResponse.json({ error: 'missing file or ownerId' }, { status: 400 });
    }

    const bucket = process.env.NEXT_PUBLIC_PRODUCT_BUCKET || 'product-images';
    
    // Criar bucket se não existir
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError);
      }
    }
    
    // Usar storeId diretamente (ownerId já é o storeId neste caso)
    const storeId = ownerId;
    const fileName = `${storeId}/${Date.now()}_${(file as any).name}`;

    // Upload do arquivo
    const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(fileName, file as any, { upsert: false });
    if (upErr) {
      console.error('❌ Erro no upload:', upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
    const publicUrl = (urlData as any)?.publicUrl || null;

    console.log('✅ Upload sucesso:', { fileName, publicUrl });
    
    // Retornar apenas a URL pública (sem salvar em product_images que não existe)
    return NextResponse.json({ data: { publicUrl } });
  } catch (err: any) {
    console.error('🔥 Erro geral no upload:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
