"use client";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import { useSearchParams } from "next/navigation";
import {
  subscribeToAdminNews,
  createNews,
  updateNews,
  deleteNews,
  type NewsDoc,
} from "@/lib/adminQueries";
import { fetchNewsById } from "@/lib/newsQueries";
import ImageUploadNews from "@/components/ImageUploadNews";
import Editor from "@/components/Editor";

function AdminNoticiasContent() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const searchParams = useSearchParams();
  const [news, setNews] = useState<NewsDoc[]>([]);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    link: "",
    source: "",
    imageUrls: [] as string[],
    publishedAt: "",
    heroImageIndex: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAdminNews((arr) => {
      setNews(arr);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && !loading && !profileLoading && profile?.role === "admin") {
      loadNewsForEdit(editId);
    }
  }, [searchParams, loading, profileLoading, profile]);

  async function loadNewsForEdit(id: string) {
    try {
      const newsData = await fetchNewsById(id);
      if (newsData) {
        setForm({
          title: newsData.title || "",
          summary: newsData.summary || "",
          link: newsData.link || "",
          source: newsData.source || "",
          imageUrls: Array.isArray(newsData.imageUrls) ? newsData.imageUrls : (newsData.image_urls ? (Array.isArray(newsData.image_urls) ? newsData.image_urls : [newsData.image_urls]) : []),
          publishedAt: newsData.publishedAt ? new Date(newsData.publishedAt.seconds ? newsData.publishedAt.seconds * 1000 : newsData.publishedAt).toISOString().slice(0, 16) : "",
          heroImageIndex: (newsData as any).heroImageIndex || 0,
        });
        setEditingId(id);
      }
    } catch (error) {
      console.error("Erro ao carregar notícia para edição:", error);
      alert("Erro ao carregar notícia para edição");
    }
  }

  if (loading || profileLoading) return <div className="p-8">Carregando...</div>;

  if (!user || profile?.role !== "admin") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Acesso negado</h1>
        <p>Somente administradores podem acessar esta área.</p>
      </div>
    );
  }

  function resetForm() {
    setForm({ title: "", summary: "", link: "", source: "", imageUrls: [], publishedAt: "", heroImageIndex: 0 });
    setEditingId(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    console.log('Iniciando salvamento...', { editingId, form });
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        summary: form.summary || null,
        link: form.link || null,
        source: form.source || null,
        imageUrls: form.imageUrls || [],
        heroImageIndex: form.heroImageIndex || 0,
      };

      if (form.publishedAt) {
        payload.publishedAt = new Date(form.publishedAt);
      } else {
        payload.publishedAt = new Date();
      }

      console.log('Payload preparado:', payload);

      if (editingId) {
        console.log('Atualizando notícia existente:', editingId);
        await updateNews(editingId, payload);
        alert('Notícia atualizada com sucesso');
        resetForm();
      } else {
        console.log('Criando nova notícia');
        await createNews(payload, user?.id || 'anon');
        alert('Notícia publicada com sucesso');
        resetForm();
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta notícia?")) return;

    try {
      await deleteNews(id);
      alert('Notícia excluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir: ' + error.message);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Gerenciar Notícias</h1>

        <form onSubmit={handleSave} className="bg-white rounded shadow p-6 mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="form-label">Título</label>
              <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Fonte</label>
              <input placeholder="Fonte" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Link (opcional)</label>
              <input placeholder="Link (opcional)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="form-input" />
            </div>

            <div>
              <label className="form-label">Imagens (máx 5)</label>
              <ImageUploadNews
                images={form.imageUrls}
                heroImageIndex={form.heroImageIndex}
                onImagesChange={(images) => setForm({ ...form, imageUrls: images })}
                onHeroImageChange={(index) => setForm({ ...form, heroImageIndex: index })}
                disabled={saving}
                maxImages={5}
              />
            </div>

            <div>
              <label className="form-label">Resumo / conteúdo</label>
              <Editor
                value={form.summary}
                onChange={(value) => setForm({ ...form, summary: value })}
                placeholder="Digite o resumo/conteúdo da notícia..."
              />
            </div>

            <div className="flex gap-2">
              <input type="datetime-local" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} className="form-input" />
              <button type="submit" disabled={saving} className="bg-[#003049] hover:bg-[#002035] text-white px-4 py-2 rounded">{editingId ? 'Atualizar' : 'Publicar'}</button>
              <button type="button" onClick={resetForm} className="bg-gray-200 px-4 py-2 rounded">Limpar</button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja excluir esta notícia?")) {
                      handleDelete(editingId);
                    }
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4">
          {news.map((n) => (
            <div key={n.id} className="bg-white rounded shadow p-4 flex justify-between items-start">
              <div className="flex gap-4">
                {n.imageUrls && n.imageUrls[0] ? (
                  <img src={n.imageUrls[0]} alt="thumb" className="w-28 h-20 object-cover rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : n.imageData && n.imageData[0] ? (
                  <img src={n.imageData[0]} alt="thumb" className="w-28 h-20 object-cover rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : null}
                <div>
                  <h3 className="text-lg font-semibold">{n.title}</h3>
                  <p className="text-sm text-gray-600">{n.source} • {n.publishedAt ? (n.publishedAt.seconds ? new Date(n.publishedAt.seconds * 1000).toLocaleString() : new Date(n.publishedAt).toLocaleString()) : '—'}</p>
                  <p className="text-sm text-gray-500 mt-1">{n.summary?.slice(0, 100)}...</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`/noticias/${n.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">Ver</a>
                <button onClick={() => window.location.href = `?edit=${n.id}`} className="text-green-600 hover:text-green-800 text-sm">Editar</button>
                <button onClick={() => {
                  if (confirm("Tem certeza que deseja excluir esta notícia?")) {
                    handleDelete(n.id);
                  }
                }} className="text-red-600 hover:text-red-800 text-sm">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminNoticiasPage() {
  return (
    <Suspense fallback={<div className="p-8">Carregando...</div>}>
      <AdminNoticiasContent />
    </Suspense>
  );
}
