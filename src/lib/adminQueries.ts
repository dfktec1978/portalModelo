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
import { getPlanDefaults } from './storePlans';

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
  store_name?: string;
  slug?: string;
  description?: string;
  category?: string;
  city?: string;
  state?: string;
  logo?: string;
  logo_url?: string;
  external_url?: string;
  ownerUid?: string;
  ownerEmail?: string;
  ownerName?: string;
  phone?: string;
  address?: any;
  status?: string;
  plan?: 'presenca' | 'destaque' | 'premium';
  plan_status?: 'active' | 'pending' | 'canceled';
  product_limit?: number;
  photo_limit?: number;
  priority_weight?: number;
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
    const selectWithPlans = `
            id,
            store_name,
            slug,
            description,
            category,
            city,
            state,
            logo,
            logo_url,
            external_url,
            owner_id,
            phone,
            address,
            status,
            plan,
            plan_status,
            product_limit,
            photo_limit,
            priority_weight,
            created_at,
            approved_at,
            profiles!owner_id (
              id,
              email,
              display_name,
              phone
            )
          `;

    const selectLegacy = `
            id,
            store_name,
            slug,
            description,
            category,
            city,
            state,
            logo,
            logo_url,
            external_url,
            owner_id,
            phone,
            address,
            status,
            created_at,
            approved_at,
            profiles!owner_id (
              id,
              email,
              display_name,
              phone
            )
          `;

    const normalizeStores = (rows: any[]) => rows.map((row: any) => ({
      id: row.id,
      storeName: row.store_name,
      store_name: row.store_name,
      slug: row.slug,
      description: row.description,
      category: row.category,
      city: row.city,
      state: row.state,
      logo: row.logo,
      logo_url: row.logo_url,
      external_url: row.external_url,
      ownerUid: row.owner_id,
      ownerEmail: row.profiles?.email,
      ownerName: row.profiles?.display_name,
      phone: row.phone || row.profiles?.phone,
      address: row.address,
      status: row.status || 'pending',
      plan: row.plan || 'presenca',
      plan_status: row.plan_status || 'active',
      product_limit: row.product_limit,
      photo_limit: row.photo_limit,
      priority_weight: row.priority_weight,
      createdAt: row.created_at,
      approvedAt: row.approved_at,
    }));

    const fetchStores = async () => {
      const selectWithPlansNoProfile = `
            id,
            store_name,
            slug,
            description,
            category,
            city,
            state,
            logo,
            logo_url,
            external_url,
            owner_id,
            phone,
            address,
            status,
            plan,
            plan_status,
            product_limit,
            photo_limit,
            priority_weight,
            created_at,
            approved_at
          `;

      const selectLegacyNoProfile = `
            id,
            store_name,
            slug,
            description,
            category,
            city,
            state,
            logo,
            logo_url,
            external_url,
            owner_id,
            phone,
            address,
            status,
            created_at,
            approved_at
          `;

      const attempts = [
        selectWithPlans,
        selectLegacy,
        selectWithPlansNoProfile,
        selectLegacyNoProfile,
      ];

      let lastError: any = null;
      for (const querySelect of attempts) {
        const result = await supabase!
          .from('stores')
          .select(querySelect)
          .order('created_at', { ascending: false });

        if (!result.error) return result;
        lastError = result.error;
      }

      return { data: null, error: lastError } as any;
    };

    const formatFetchError = (err: any) => {
      if (!err) return 'erro desconhecido';
      if (typeof err === 'string') return err;
      if (err?.message) return err.message;
      if (err?.details) return err.details;
      try {
        return JSON.stringify(err);
      } catch {
        return String(err);
      }
    };

    // Supabase mode
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await fetchStores();

        if (!error && data) {
          const normalized = normalizeStores(data as any[]);
          callback(normalized);
        } else if (error) {
          console.warn('Aviso ao buscar lojas:', formatFetchError(error));
          callback([]);
        }
      } catch (e) {
        console.warn('Aviso ao buscar lojas:', formatFetchError(e));
        callback([]);
      }
    }, 5000);

    // Initial fetch
    fetchStores().then(({ data, error }) => {
        if (!error && data) {
          const normalized = normalizeStores(data as any[]);
          callback(normalized);
        } else if (error) {
          console.warn('Aviso ao buscar lojas (initial fetch):', formatFetchError(error));
          callback([]);
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
    if ((data as any).logo_url !== undefined) updateData.logo_url = (data as any).logo_url;
    if ((data as any).slug !== undefined) updateData.slug = (data as any).slug;
    if ((data as any).plan !== undefined) updateData.plan = (data as any).plan;
    if ((data as any).plan_status !== undefined) updateData.plan_status = (data as any).plan_status;
    if ((data as any).product_limit !== undefined) updateData.product_limit = (data as any).product_limit;
    if ((data as any).photo_limit !== undefined) updateData.photo_limit = (data as any).photo_limit;
    if ((data as any).priority_weight !== undefined) updateData.priority_weight = (data as any).priority_weight;

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
    const planDefaults = getPlanDefaults((data as any).plan);
    const safePhotoLimit = Math.max(
      1,
      Number.isFinite(Number((data as any).photo_limit ?? planDefaults.photo_limit))
        ? Number((data as any).photo_limit ?? planDefaults.photo_limit)
        : Number(planDefaults.photo_limit || 1),
    );
    const insertData: any = {
      id: storeId,
      store_name: (data as any).storeName || (data as any).store_name || null,
      slug: (data as any).slug || null,
      description: (data as any).description || null,
      external_url: (data as any).external_url || null,
      logo: (data as any).logo || null,
      status: (data as any).status || 'approved',
      owner_id: (data as any).ownerUid || null,
      plan: (data as any).plan || planDefaults.plan,
      plan_status: (data as any).plan_status || planDefaults.plan_status,
      product_limit: (data as any).product_limit ?? planDefaults.product_limit,
      photo_limit: safePhotoLimit,
      priority_weight: (data as any).priority_weight ?? planDefaults.priority_weight,
      landing_photo_urls: [],
    };
    const { data: result, error } = await supabase!.from('stores').insert([insertData]).select();
    if (error) throw error;
    return result?.[0];
  }
}
