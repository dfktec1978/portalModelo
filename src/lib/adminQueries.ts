/**
 * Admin Queries - Abstração para dual-mode (Firebase + Supabase)
 * 
 * Fornece funções para operações administrativas que funcionam em ambos os backends
 */

import { db } from './firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { supabase } from './supabaseClient';

// Auto-detect backend
const HAS_SUPABASE = !!supabase;

export type NewsDoc = {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  link?: string;
  source?: string;
  imageUrls?: string[];
  imageData?: string[];
  publishedAt?: any;
  createdBy?: string;
  createdAt?: any;
};

export type StoreDoc = {
  id: string;
  storeName?: string;
  ownerUid?: string;
  ownerEmail?: string;
  ownerName?: string;
  phone?: string;
  address?: any;
  status?: string;
  createdAt?: any;
  approvedAt?: any;
};

/**
 * Subscribe to news (admin view) with real-time updates
 */
export function subscribeToAdminNews(callback: (news: NewsDoc[]) => void) {
  if (!HAS_SUPABASE) {
    // Firebase mode
    const q = query(collection(db, 'news'), orderBy('publishedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const arr: NewsDoc[] = [];
      snap.forEach((d) => {
        arr.push({ id: d.id, ...(d.data() as any) });
      });
      callback(arr);
    });
  } else {
    // Supabase mode - poll every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase!
          .from('news')
          .select('*')
          .order('published_at', { ascending: false });

        if (!error && data) {
          const normalized = data.map((row: any) => ({
            id: row.id,
            title: row.title,
            summary: row.summary,
            content: row.content,
            link: row.link,
            source: row.source,
            imageUrls: (() => {
              if (!row.image_urls) return [];
              try {
                const parsed = JSON.parse(row.image_urls);
                return Array.isArray(parsed) ? parsed : [row.image_urls];
              } catch {
                // Se não for JSON válido, assume que é uma string URL
                return [row.image_urls];
              }
            })(),
            imageData: (() => {
              if (!row.image_data) return [];
              try {
                const parsed = JSON.parse(row.image_data);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })(),
            publishedAt: row.published_at,
            createdBy: row.created_by,
            createdAt: row.created_at,
          }));
          callback(normalized);
        }
      } catch (e) {
        console.error('Erro ao buscar notícias:', e);
      }
    }, 5000);

    // Initial fetch
    supabase!
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const normalized = data.map((row: any) => ({
            id: row.id,
            title: row.title,
            summary: row.summary,
            content: row.content,
            link: row.link,
            source: row.source,
            imageUrls: (() => {
              if (!row.image_urls) return [];
              try {
                const parsed = JSON.parse(row.image_urls);
                return Array.isArray(parsed) ? parsed : [row.image_urls];
              } catch {
                // Se não for JSON válido, assume que é uma string URL
                return [row.image_urls];
              }
            })(),
            imageData: (() => {
              if (!row.image_data) return [];
              try {
                const parsed = JSON.parse(row.image_data);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })(),
            publishedAt: row.published_at,
            createdBy: row.created_by,
            createdAt: row.created_at,
          }));
          callback(normalized);
        }
      });

    return () => clearInterval(pollInterval);
  }
}

/**
 * Create news
 */
export async function createNews(data: Partial<NewsDoc>, userId: string) {
  if (!HAS_SUPABASE) {
    // Firebase mode
    return addDoc(collection(db, 'news'), {
      ...data,
      publishedAt: data.publishedAt || serverTimestamp(),
      createdBy: userId,
      createdAt: serverTimestamp(),
    });
  } else {
    // Supabase mode
    const { data: result, error } = await supabase!
      .from('news')
      .insert([
        {
          title: data.title,
          summary: data.summary,
          content: data.content,
          link: data.link,
          source: data.source,
          image_urls: JSON.stringify(data.imageUrls || []),
          image_data: JSON.stringify(data.imageData || []),
          hero_image_index: (data as any).heroImageIndex || 0,
          published_at: data.publishedAt || new Date().toISOString(),
          created_by: userId,
        },
      ])
      .select();

    if (error) throw error;
    return result?.[0];
  }
}

/**
 * Update news
 */
export async function updateNews(id: string, data: Partial<NewsDoc>) {
  console.log('updateNews called with:', { id, data });
  console.log('HAS_SUPABASE:', HAS_SUPABASE);
  if (!HAS_SUPABASE) {
    // Firebase mode
    console.log('Using Firebase mode for update');
    return updateDoc(doc(db, 'news', id), {
      ...data,
      imageUrls: data.imageUrls,
    });
  } else {
    // Supabase mode
    console.log('Using Supabase mode for update');
    const updateData = {
      title: data.title,
      summary: data.summary,
      content: data.content,
      link: data.link,
      source: data.source,
      image_urls: JSON.stringify(data.imageUrls || []),
      image_data: JSON.stringify(data.imageData || []),
      hero_image_index: (data as any).heroImageIndex || 0,
      published_at: data.publishedAt,
    };
    console.log('Update data for Supabase:', updateData);
    
    const { error } = await supabase!
      .from('news')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    console.log('Supabase update successful');
  }
}

/**
 * Delete news
 */
export async function deleteNews(id: string) {
  if (!HAS_SUPABASE) {
    // Firebase mode
    return deleteDoc(doc(db, 'news', id));
  } else {
    // Supabase mode
    const { error } = await supabase!.from('news').delete().eq('id', id);
    if (error) throw error;
  }
}

/**
 * Subscribe to stores (admin view)
 */
export function subscribeToAdminStores(callback: (stores: StoreDoc[]) => void) {
  if (!HAS_SUPABASE) {
    // Firebase mode
    const q = query(collection(db, 'stores'));
    return onSnapshot(q, async (snap) => {
      const arr: StoreDoc[] = [];
      const fetches: Promise<void>[] = [];

      snap.forEach((d) => {
        const base = { id: d.id, ...(d.data() as any) } as StoreDoc;
        arr.push(base);

        // Fetch owner user data
        const ownerUid = base.ownerUid || d.id;
        fetches.push(
          getDoc(doc(db, 'users', ownerUid))
            .then((uSnap) => {
              if (uSnap.exists()) {
                const u = uSnap.data() as any;
                base.ownerEmail = base.ownerEmail || u.email;
                base.ownerName = base.ownerName || u.name || u.displayName;
                base.phone = base.phone || u.phone;
              }
            })
            .catch((e) => console.warn('Erro ao buscar owner:', e))
        );
      });

      Promise.all(fetches)
        .then(() => callback(arr))
        .catch(() => callback(arr));
    });
  } else {
    // Supabase mode
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase!
          .from('stores')
          .select('*, owner_id(*)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const normalized = data.map((row: any) => ({
            id: row.id,
            storeName: row.store_name,
            ownerUid: row.owner_id?.id,
            ownerEmail: row.owner_id?.email,
            ownerName: row.owner_id?.display_name,
            phone: row.phone,
            address: row.address,
            status: row.status,
            createdAt: row.created_at,
            approvedAt: row.approved_at,
          }));
          callback(normalized);
        }
      } catch (e) {
        console.error('Erro ao buscar lojas:', e);
      }
    }, 5000);

    // Initial fetch
    supabase!
      .from('stores')
      .select('*, owner_id(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const normalized = data.map((row: any) => ({
            id: row.id,
            storeName: row.store_name,
            ownerUid: row.owner_id?.id,
            ownerEmail: row.owner_id?.email,
            ownerName: row.owner_id?.display_name,
            phone: row.phone,
            address: row.address,
            status: row.status,
            createdAt: row.created_at,
            approvedAt: row.approved_at,
          }));
          callback(normalized);
        }
      });

    return () => clearInterval(pollInterval);
  }
}

/**
 * Update store status
 */
export async function updateStoreStatus(
  storeId: string,
  status: string,
  userId: string
) {
  if (!HAS_SUPABASE) {
    // Firebase mode
    const storeRef = doc(db, 'stores', storeId);
    await updateDoc(storeRef, { status, updatedAt: serverTimestamp() });

    // Try to sync with users/{ownerUid}
    try {
      const storeSnap = await getDoc(storeRef);
      if (storeSnap.exists()) {
        const storeData = storeSnap.data() as any;
        const ownerUid = storeData.ownerUid || storeData.uid || storeId;
        if (ownerUid) {
          await updateDoc(doc(db, 'users', ownerUid), {
            status,
            updatedAt: serverTimestamp(),
            approvedAt: status === 'approved' ? serverTimestamp() : null,
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao sincronizar users:', e);
    }

    // Audit log
    await addDoc(collection(db, 'auditLogs'), {
      action: status === 'approved' ? 'approve_store' : 'block_store',
      actorUid: userId,
      targetCollection: 'stores',
      targetId: storeId,
      ts: serverTimestamp(),
    });
  } else {
    // Supabase mode
    const { error } = await supabase!
      .from('stores')
      .update({ status })
      .eq('id', storeId);

    if (error) throw error;

    // Audit log
    const { error: auditError } = await supabase!
      .from('audit_logs')
      .insert([
        {
          action: status === 'approved' ? 'approve_store' : 'block_store',
          actor_id: userId,
          target_collection: 'stores',
          target_id: storeId,
        },
      ]);

    if (auditError) console.warn('Erro ao registrar audit log:', auditError);
  }
}

/**
 * Update arbitrary store fields (admin)
 */
export async function updateStore(storeId: string, data: Partial<StoreDoc>) {
  if (!HAS_SUPABASE) {
    const storeRef = doc(db, 'stores', storeId);
    return updateDoc(storeRef, data as any);
  } else {
    const updateData: any = {};
    if (data.storeName !== undefined) updateData.store_name = data.storeName;
    if ((data as any).store_name !== undefined) updateData.store_name = (data as any).store_name;
    if ((data as any).description !== undefined) updateData.description = (data as any).description;
    if ((data as any).external_url !== undefined) updateData.external_url = (data as any).external_url;
    if ((data as any).logo !== undefined) updateData.logo = (data as any).logo;
    if ((data as any).slug !== undefined) updateData.slug = (data as any).slug;

    const { error } = await supabase!.from('stores').update(updateData).eq('id', storeId);
    if (error) throw error;
    return true;
  }
}

/**
 * Create store with specific id (admin)
 */
export async function createStore(storeId: string, data: Partial<StoreDoc>) {
  if (!HAS_SUPABASE) {
    // Firebase: create or overwrite document with given id
    const storeRef = doc(db, 'stores', storeId);
    await setDoc(storeRef, { ...(data as any), createdAt: serverTimestamp() });
    return { id: storeId };
  } else {
    const insertData: any = {
      id: storeId,
      store_name: (data as any).storeName || (data as any).store_name || null,
      slug: (data as any).slug || null,
      description: (data as any).description || null,
      external_url: (data as any).external_url || null,
      logo: (data as any).logo || null,
      status: (data as any).status || 'approved',
      owner_id: (data as any).ownerUid || null,
    };
    const { data: result, error } = await supabase!.from('stores').insert([insertData]).select();
    if (error) throw error;
    return result?.[0];
  }
}
