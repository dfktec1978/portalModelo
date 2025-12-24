export type UploadType = "news" | "product" | "classified" | "profile";

type UploadResult = { publicUrl: string | null; error?: string | null };

const ENDPOINT_MAP: Record<UploadType, string> = {
  news: '/api/upload-news-image',
  product: '/api/upload-product-image',
  classified: '/api/upload-classified-image',
  profile: '/api/upload-profile-image',
};

const BUCKET_ENV_MAP: Record<UploadType, string> = {
  news: process.env.NEXT_PUBLIC_NEWS_BUCKET || 'news',
  product: process.env.NEXT_PUBLIC_PRODUCT_BUCKET || 'product-images',
  classified: process.env.NEXT_PUBLIC_CLASSIFIED_BUCKET || 'classificados',
  profile: process.env.NEXT_PUBLIC_PROFILE_BUCKET || 'profiles',
};

export async function uploadFile(type: UploadType, ownerId: string, file: File, options?: { entityId?: string }): Promise<UploadResult> {
  try {
    const endpoint = ENDPOINT_MAP[type];
    const form = new FormData();
    form.append('file', file as any);
    form.append('ownerId', ownerId);
    if (options?.entityId) form.append('entityId', options.entityId);

    const res = await fetch(endpoint, { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok) return { publicUrl: null, error: json?.error || 'upload_failed' };
    return { publicUrl: json?.data?.publicUrl || json?.publicUrl || null, error: null };
  } catch (e: any) {
    return { publicUrl: null, error: e?.message || String(e) };
  }
}

export async function deleteFile(publicUrl: string): Promise<{ success: boolean; error?: string | null }> {
  try {
    const res = await fetch('/api/delete-upload', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ publicUrl }) });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json?.error || 'delete_failed' };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || String(e) };
  }
}

export function getBucketName(type: UploadType) {
  return BUCKET_ENV_MAP[type];
}
