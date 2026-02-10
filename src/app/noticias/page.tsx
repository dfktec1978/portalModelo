"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeToNews, NewsDoc } from "@/lib/newsQueries";
import { deleteNews } from "@/lib/adminQueries";
import { useAuth } from "@/lib/AuthContext";
import NewsRow from "@/components/NewsRow";

export default function NoticiasPublicPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [news, setNews] = useState<NewsDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to news (dual-mode: Firestore ou Supabase)
    let mounted = true;
    const init = () => {
      try {
        const unsub = subscribeToNews(
          (news) => {
            if (!mounted) return;
            setNews(news);
            setLoading(false);
          },
          (err) => {
            console.error("Erro ao carregar notícias:", err);
            if (mounted) setLoading(false);
          }
        );
        return unsub;
      } catch (e) {
        console.error("Erro ao iniciar listener de notícias", e);
        if (mounted) setLoading(false);
        return () => {};
      }
    };

    const unsub = init();
    return () => {
      mounted = false;
      try { if (typeof unsub === 'function') unsub(); } catch {}
    };
  }, []);

  function openNews(news: NewsDoc) {
    if (news?.id) {
      router.push(`/noticias/${news.id}`);
      return;
    }
    if (news?.link) {
      window.open(news.link, "_blank");
      return;
    }
    alert("Notícia sem identificador válido.");
  }

  function editNews(id: string) {
    router.push(`/admin/noticias?edit=${id}`);
  }

  async function deleteNewsItem(id: string) {
    try {
      await deleteNews(id);
      // A lista será atualizada automaticamente via subscription
    } catch (error) {
      console.error("Erro ao excluir notícia:", error);
      alert("Erro ao excluir notícia");
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
            {news.filter((n) => n.id || n.link).map((n) => (
              <div key={n.id} className="py-2">
                <NewsRow
                  news={n}
                  onOpenAction={openNews}
                  onEditAction={editNews}
                  onDeleteAction={deleteNewsItem}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


