"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

type NewsDoc = {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  link?: string;
  source?: string;
  imageUrls?: string[];
  imageData?: string[];
  publishedAt?: any;
};

export default function NewsReader({ id, onCloseAction }: { id: string; onCloseAction?: () => void }) {
  const [news, setNews] = useState<NewsDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<NewsDoc[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const d = await getDoc(doc(db, "news", id));
        if (!mounted) return;
        if (d.exists()) {
          const data = d.data() as any;
          setNews({ id: d.id, ...data });
        } else {
          setNews(null);
        }
      } catch (e) {
        console.error("Erro ao carregar notícia:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function loadSuggestions() {
      try {
        const q = query(collection(db, "news"), orderBy("publishedAt", "desc"), limit(6));
        const snap = await getDocs(q);
        const arr: NewsDoc[] = [];
        snap.forEach((s) => {
          const d = s.data() as any;
          if (s.id !== id) arr.push({ id: s.id, ...d });
        });
        if (mounted) setSuggestions(arr.slice(0, 4));
      } catch (e) {
        console.error("Erro ao carregar sugestões:", e);
      }
    }

    load();
    loadSuggestions();

    const onPop = () => {
      // when user navigates back, close modal if provided
      if (onCloseAction) onCloseAction();
    };
    window.addEventListener("popstate", onPop);

    return () => {
      mounted = false;
      window.removeEventListener("popstate", onPop);
    };
  }, [id, onCloseAction]);

  if (loading) return (
    <div className="p-6">Carregando notícia...</div>
  );

  if (!news) return (
    <div className="p-6">Notícia não encontrada.</div>
  );

  const img = news.imageUrls && news.imageUrls[0] ? news.imageUrls[0] : (news.imageData && news.imageData[0] ? news.imageData[0] : null);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{news.title}</h1>
        <div className="flex items-center gap-2">
          <button
              onClick={() => {
                if (onCloseAction) {
                  // go back in history so URL restores
                  window.history.back();
                  onCloseAction();
                }
              }}
            className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            Voltar
          </button>
        </div>
      </div>

      {img ? (
        <div className="w-full h-60 mb-4 rounded overflow-hidden">
          <img src={img} alt={news.title} className="w-full h-full object-cover" />
        </div>
      ) : null}

      <p className="text-sm text-gray-500 mb-4">{news.source} • {news.publishedAt ? (news.publishedAt.seconds ? new Date(news.publishedAt.seconds * 1000).toLocaleString() : new Date(news.publishedAt).toLocaleString()) : '—'}</p>

      <div className="prose max-w-none text-gray-800 mb-6">
        {news.content ? <div dangerouslySetInnerHTML={{ __html: news.content }} /> : <p>{news.summary}</p>}
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-2">Sugestões</h4>
        {suggestions.length === 0 ? (
          <div className="text-sm text-gray-500">Sem sugestões por enquanto.</div>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li key={s.id}>
                <a href={`/noticias/${s.id}`} onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `/noticias/${s.id}`); window.location.reload(); }} className="text-sm text-[#CC2F30] hover:underline">{s.title}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
