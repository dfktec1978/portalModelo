"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import NewsRow from "@/components/NewsRow";
import NewsReader from "@/components/NewsReader";

type NewsDoc = {
  id: string;
  title: string;
  summary?: string;
  link?: string;
  source?: string;
  imageUrls?: string[];
  imageData?: string[]; // data URLs fallback when Storage is not available
  publishedAt?: any;
};

export default function NoticiasPublicPage() {
  const [news, setNews] = useState<NewsDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    // load published news ordered by publishedAt desc
    try {
      const q = query(collection(db, "news"), orderBy("publishedAt", "desc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const arr: NewsDoc[] = [];
          snap.forEach((d) => {
            const data = d.data() as any;
            if (data) arr.push({ id: d.id, ...data });
          });
          setNews(arr);
          setLoading(false);
        },
        (err) => {
          console.error("Erro ao carregar notícias:", err);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (e) {
      console.error("Erro ao iniciar listener de notícias", e);
      setLoading(false);
    }
  }, []);

  function openModal(id: string) {
    setOpenId(id);
    // update URL so it can be shared without navigating away (initial version)
    try {
      window.history.pushState({}, "", `/noticias/${id}`);
    } catch (e) {
      // ignore
    }
  }

  function closeModal() {
    setOpenId(null);
    try {
      // go back to restore URL if possible
      window.history.back();
    } catch (e) {
      // fallback: push base URL
      window.history.pushState({}, "", `/noticias`);
    }
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">Notícias</h1>
        <p className="text-gray-600 mb-6">Últimas notícias publicadas pelo Portal Modelo.</p>

        {loading ? (
          <div>Carregando...</div>
        ) : news.length === 0 ? (
          <div className="bg-white rounded p-6">Nenhuma notícia publicada no momento.</div>
        ) : (
          <div className="flex flex-col divide-y">
            {news.map((n) => (
              <div key={n.id} className="py-2">
                <NewsRow news={n} onOpenAction={openModal} />
              </div>
            ))}
          </div>
        )}

        {/* Modal reader overlay */}
        {openId ? (
          <div className="fixed inset-0 z-40 flex items-start justify-center pt-20 px-4">
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
            <div className="relative z-50 w-full max-w-3xl">
              <NewsReader id={openId} onCloseAction={closeModal} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
