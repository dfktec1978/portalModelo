import { supabase } from './supabaseClient';

async function getStoreIdByOwner(ownerId: string): Promise<string | null> {
  const { data: store, error } = await supabase.from('stores').select('id').eq('owner_id', ownerId).maybeSingle?.();
  if (error) return null;
  return (store as any)?.id || null;
}

export async function listProductsByOwner(ownerId: string) {
  const storeId = await getStoreIdByOwner(ownerId);
  if (!storeId) return { data: [], error: null };
  // Try selecting all columns first; if PostgREST schema cache complains
  // about a missing column (ex.: 'title'), fallback to a safe subset.
  const all = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (!all.error) return all;

  const msg = (all.error?.message || '').toString();
  if (msg.includes("Could not find the 'title' column")) {
    // fallback columns - conservative set used across the app
    const fallbackCols = 'id,name,price,store_id,created_at';
    const fallback = await supabase
      .from('products')
      .select(fallbackCols)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    return fallback;
  }

  return all;
}

export async function getProductById(id: string) {
  // Try to fetch all columns; if schema cache complains about missing
  // columns, fallback to a conservative column set.
  const all = await supabase.from('products').select('*').eq('id', id).maybeSingle?.();
  if (!all.error) return { data: all.data, error: null };

  const msg = (all.error?.message || '').toString();
  if (msg.includes("Could not find the 'title' column")) {
    const fallbackCols = 'id,name,price,store_id,created_at';
    const fallback = await supabase.from('products').select(fallbackCols).eq('id', id).maybeSingle?.();
    if (fallback.error) return { data: null, error: new Error(fallback.error.message || JSON.stringify(fallback.error)) };
    return { data: fallback.data, error: null };
  }

  return { data: null, error: new Error(all.error.message || JSON.stringify(all.error)) };
}

export async function createProduct(payload: any) {
  // If caller provided owner_id (user id), map to store_id
  if (payload?.owner_id && !payload?.store_id) {
    const storeId = await getStoreIdByOwner(payload.owner_id);
    if (!storeId) return { data: null, error: new Error('Loja não encontrada para o usuário') };
    payload.store_id = storeId;
    delete payload.owner_id;
  }

  // Map `title` to `name` if backend uses `name` column instead of `title`.
  if (payload?.title && !payload?.name) {
    payload.name = payload.title;
    delete payload.title;
  }

  // Insert requesting only `id` to avoid forcing PostgREST to inspect all columns
  const insertRes = await supabase.from('products').insert(payload).select('id').single();
  if (insertRes.error) return { data: null, error: new Error(insertRes.error.message || JSON.stringify(insertRes.error)) };
  const newId = (insertRes.data as any)?.id;
  if (!newId) return { data: null, error: new Error('Unable to retrieve new product id') };

  // Fetch the new product with a safe subset of columns (getProductById will fallback if needed)
  const fetched = await getProductById(newId);
  return fetched;
}

export async function updateProduct(id: string, payload: any) {
  if (payload?.owner_id && !payload?.store_id) {
    const storeId = await getStoreIdByOwner(payload.owner_id);
    if (!storeId) return { data: null, error: new Error('Loja não encontrada para o usuário') };
    payload.store_id = storeId;
    delete payload.owner_id;
  }

  // Map `title` to `name` for update as well
  if (payload?.title && !payload?.name) {
    payload.name = payload.title;
    delete payload.title;
  }

  // Update and request only id to avoid schema inspection errors, then fetch
  const updateRes = await supabase.from('products').update(payload).eq('id', id).select('id').single();
  if (updateRes.error) return { data: null, error: new Error(updateRes.error.message || JSON.stringify(updateRes.error)) };
  const fetched = await getProductById(id);
  return fetched;
}

export async function deleteProduct(id: string) {
  const { data, error } = await supabase.from('products').delete().eq('id', id).select();
  if (error) return { data: null, error: new Error(error.message || JSON.stringify(error)) };
  return { data, error: null };
}

export async function uploadProductImage(ownerId: string, file: File) {
  // Use unified upload service
  try {
    const { uploadFile } = await import('./uploadService');
    const res = await uploadFile('product', ownerId, file);
    return { publicUrl: res.publicUrl, error: res.error ? new Error(res.error) : null };
  } catch (e: any) {
    return { publicUrl: null, error: new Error(e.message || String(e)) };
  }
}
