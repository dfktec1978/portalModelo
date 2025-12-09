"use client";
import { useEffect, useState } from "react";
import { subscribeToNews, NewsDoc } from "@/lib/newsQueries";
import NewsRow from "@/components/NewsRow";
import NewsReader from "@/components/NewsReader";

export default function NoticiasPublicPage() {
  const [news, setNews] = useState<NewsDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to news (dual-mode: Firestore ou Supabase)
    try {
      const unsub = subscribeToNews(
        (news) => {
          setNews(news);
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


