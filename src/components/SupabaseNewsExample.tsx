"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type News = {
  id: string;
  title: string;
  summary?: string;
  image_urls?: string[];
  published_at?: string;
};

export default function SupabaseNewsExample() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('news')
          .select('id, title, summary, image_urls, published_at')
          .order('published_at', { ascending: false });
        if (error) {
          console.error('Erro ao buscar notícias do Supabase', error);
        } else if (mounted) {
          setNews((data as any) || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Carregando notícias (Supabase)...</div>;
  if (!news.length) return <div>Nenhuma notícia no Supabase.</div>;

  return (
    <div className="space-y-4">
      {news.map((n) => (
        <div key={n.id} className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold text-lg">{n.title}</h3>
          <p className="text-sm text-gray-600">{n.summary}</p>
        </div>
      ))}
    </div>
  );
}
