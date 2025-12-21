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
  updateDoc,
  deleteDoc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';

// Auto-detect backend
const HAS_SUPABASE =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== 'undefined' &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = HAS_SUPABASE
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : null;

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
