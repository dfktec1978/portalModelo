/**
 * Product queries - dual mode (Firebase + Supabase)
 */
import { db } from './firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { supabase } from './supabaseClient';

const HAS_SUPABASE = !!supabase;

export type ProductDoc = {
  id: string;
  store_id?: string;
  title?: string;
  price?: number;
  description?: string;
  images?: string[];
  status?: string;
  createdAt?: any;
};

export function subscribeToProductsByStore(storeId: string, callback: (rows: ProductDoc[]) => void) {
  if (!HAS_SUPABASE) {
    const q = query(collection(db, 'products'), where('store_id', '==', storeId));
    return onSnapshot(q, (snap) => {
      const arr: ProductDoc[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      callback(arr);
    });
  } else {
    const poll = setInterval(async () => {
      try {
        const { data, error } = await supabase!.from('products').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
        if (!error && data) {
          const normalized = data.map((r: any) => ({
            id: r.id,
            store_id: r.store_id,
            title: r.title,
            price: r.price,
            description: r.description,
            images: (() => { try { return JSON.parse(r.images || '[]'); } catch { return r.images || []; } })(),
            status: r.status,
            createdAt: r.created_at,
          }));
          callback(normalized);
        }
      } catch (e) {
        console.error('Erro subscribe products', e);
      }
    }, 4000);
    // initial fetch
    supabase!.from('products').select('*').eq('store_id', storeId).order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data) {
        const normalized = data.map((r: any) => ({ id: r.id, store_id: r.store_id, title: r.title, price: r.price, description: r.description, images: (() => { try { return JSON.parse(r.images || '[]'); } catch { return r.images || []; } })(), status: r.status, createdAt: r.created_at }));
        callback(normalized);
      }
    });
    return () => clearInterval(poll);
  }
}

// Removed duplicated implementations above; unified implementations follow below.

async function getStoreIdByOwner(ownerId: string): Promise<string | null> {
  try {
    const { data: store, error } = await supabase.from('stores').select('id').eq('owner_id', ownerId).maybeSingle?.();
    if (error) return null;
    return (store as any)?.id || null;
  } catch (e) {
    return null;
  }
}

export async function listProductsByOwner(ownerId: string) {
  const storeId = await getStoreIdByOwner(ownerId);
  if (!storeId) return { data: [], error: null };
  const all = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (!all.error) return all;

  const msg = (all.error?.message || '').toString();
  if (msg.includes("Could not find the 'title' column")) {
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

/**
 * Flexible createProduct wrapper that accepts either:
 * - createProduct(storeId: string, data: Partial<ProductDoc>)
 * - createProduct(payload: any) where payload may include owner_id or store_id
 */
export async function createProduct(storeIdOrPayload: string | any, maybeData?: Partial<ProductDoc>) {
  let payload: any = {};
  if (typeof storeIdOrPayload === 'string') {
    // signature: (storeId, data)
    payload = { ...(maybeData || {}), store_id: storeIdOrPayload };
  } else {
    payload = { ...(storeIdOrPayload || {}) };
  }

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

  try {
    // Ensure images are stored as JSON string if present
    if (payload.images && Array.isArray(payload.images)) payload.images = JSON.stringify(payload.images);

    // Insert requesting only `id` to avoid forcing PostgREST to inspect all columns
    const insertRes = await supabase.from('products').insert(payload).select('id').single();
    if (insertRes.error) return { data: null, error: new Error(insertRes.error.message || JSON.stringify(insertRes.error)) };
    const newId = (insertRes.data as any)?.id;
    if (!newId) return { data: null, error: new Error('Unable to retrieve new product id') };

    // Fetch the new product with a safe subset of columns
    const fetched = await getProductById(newId);
    return fetched;
  } catch (e: any) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export async function updateProduct(id: string, payload: any) {
  // Map owner -> store if provided
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

  try {
    if (payload.images && Array.isArray(payload.images)) payload.images = JSON.stringify(payload.images);
    const updateRes = await supabase.from('products').update(payload).eq('id', id).select('id').single();
    if (updateRes.error) return { data: null, error: new Error(updateRes.error.message || JSON.stringify(updateRes.error)) };
    const fetched = await getProductById(id);
    return fetched;
  } catch (e: any) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export async function deleteProduct(id: string) {
  try {
    const { data, error } = await supabase.from('products').delete().eq('id', id).select();
    if (error) return { data: null, error: new Error(error.message || JSON.stringify(error)) };
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: new Error(String(e)) };
  }

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
