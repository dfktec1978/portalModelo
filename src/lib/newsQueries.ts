"use client";

/**
 * Utilitários para queries dual-mode (Firestore + Supabase)
 * Abstrai diferenças entre Firebase e Supabase para simplicidade
 */

import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { supabase } from "@/lib/supabaseClient";


const HAS_SUPABASE = typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== "undefined" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type NewsDoc = {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  link?: string;
  source?: string;
  image_urls?: string[] | string; // pode vir como JSON string do Supabase
  imageUrls?: string[]; // normalizado
  imageData?: string[];
  published_at?: any;
  publishedAt?: any; // normalizado
  created_by?: string;
  heroImageIndex?: number;
};

/**
 * Normaliza um documento de notícia para formato uniforme
 */
function normalizeNews(doc: any): NewsDoc {
  // Handle Firestore naming (camelCase)
  if (doc.publishedAt !== undefined && doc.published_at === undefined) {
    doc.published_at = doc.publishedAt;
  }
  if (doc.imageUrls !== undefined && doc.image_urls === undefined) {
    doc.image_urls = doc.imageUrls;
  }

  // Parse image_urls se vier como string JSON (Supabase)
  let imageUrls = doc.imageUrls || doc.image_urls;
  if (typeof imageUrls === "string") {
    try {
      imageUrls = JSON.parse(imageUrls);
    } catch (e) {
      imageUrls = [];
    }
  }
  if (!Array.isArray(imageUrls)) imageUrls = [];

  // Parse image_data se vier como string JSON (Supabase)
  let imageData = doc.imageData || doc.image_data;
  if (typeof imageData === "string") {
    try {
      imageData = JSON.parse(imageData);
    } catch (e) {
      imageData = [];
    }
  }
  if (!Array.isArray(imageData)) imageData = [];

  return {
    id: doc.id,
    title: doc.title,
    summary: doc.summary,
    content: doc.content,
    link: doc.link,
    source: doc.source,
    imageUrls,
    image_urls: imageUrls,
    imageData,
    publishedAt: doc.published_at || doc.publishedAt,
    published_at: doc.published_at || doc.publishedAt,
    created_by: doc.created_by,
    heroImageIndex: doc.hero_image_index || doc.heroImageIndex || 0,
  };
}

/**
 * Buscar todas as notícias ordenadas por data (publicadas)
 * Usa Supabase se disponível, caso contrário Firestore
 */
export async function fetchAllNews(): Promise<NewsDoc[]> {
  if (HAS_SUPABASE) {
    // Supabase
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar notícias do Supabase:", error);
      return [];
    }

    return (data || []).map(normalizeNews);
  } else {
    // Firestore
    const q = query(collection(db, "news"), orderBy("publishedAt", "desc"));
    const snap = await getDocs(q);
    const arr: NewsDoc[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      arr.push(normalizeNews({ id: d.id, ...data }));
    });
    return arr;
  }
}

/**
 * Subscriber para notícias (real-time listener)
 * Retorna callback unsub para desinscrever
 */
export function subscribeToNews(
  callback: (news: NewsDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (HAS_SUPABASE) {
    // Supabase: usar polling simples (não há real-time para anon sem config)
    // Por enquanto, fazer fetch um vez e depois polling a cada 30s
    const interval = setInterval(async () => {
      try {
        const news = await fetchAllNews();
        callback(news);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }, 30000);

    // Fetch inicial
    fetchAllNews()
      .then(callback)
      .catch((e) => {
        if (onError) onError(e);
      });

    return () => clearInterval(interval);
  } else {
    // Firestore: real-time listener
    const q = query(collection(db, "news"), orderBy("publishedAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr: NewsDoc[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          arr.push(normalizeNews({ id: d.id, ...data }));
        });
        callback(arr);
      },
      (err) => {
        if (onError) onError(err);
      }
    );
    return unsub;
  }
}

/**
 * Buscar uma notícia específica por ID
 */
export async function fetchNewsById(id: string): Promise<NewsDoc | null> {
  if (HAS_SUPABASE) {
    // Supabase
    const { data, error } = await supabase.from("news").select("*").eq("id", id).single();

    if (error) {
      console.error("Erro ao buscar notícia do Supabase:", error);
      return null;
    }

    return data ? normalizeNews(data) : null;
  } else {
    // Firestore
    const d = await getDoc(doc(db, "news", id));
    if (d.exists()) {
      const data = d.data() as any;
      return normalizeNews({ id: d.id, ...data });
    }
    return null;
  }
}

/**
 * Buscar sugestões de notícias (exclui ID fornecido)
 */
export async function fetchNewsSuggestions(excludeId: string, count: number = 4): Promise<NewsDoc[]> {
  if (HAS_SUPABASE) {
    // Supabase
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .neq("id", excludeId)
      .order("published_at", { ascending: false })
      .limit(count);

    if (error) {
      console.error("Erro ao buscar sugestões do Supabase:", error);
      return [];
    }

    return (data || []).map(normalizeNews);
  } else {
    // Firestore
    const q = query(collection(db, "news"), orderBy("publishedAt", "desc"), limit(count + 1));
    const snap = await getDocs(q);
    const arr: NewsDoc[] = [];
    snap.forEach((d) => {
      if (d.id !== excludeId) {
        const data = d.data() as any;
        arr.push(normalizeNews({ id: d.id, ...data }));
      }
    });
    return arr.slice(0, count);
  }
}
