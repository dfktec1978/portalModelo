"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import {
  subscribeToAdminNews,
  createNews,
  updateNews,
  deleteNews,
  type NewsDoc,
} from "@/lib/adminQueries";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const MASTER = process.env.NEXT_PUBLIC_MASTER_UID || "";

export default function AdminNoticiasPage() {
  const { user, loading } = useAuth();
  const [news, setNews] = useState<NewsDoc[]>([]);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    link: "",
    source: "",
    imageUrls: [] as string[],
    // hold selected files before upload
    newFiles: [] as File[],
    publishedAt: "",
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

  if (loading) return <div className="p-8">Carregando...</div>;

  if (!user || user.uid !== MASTER) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Acesso negado</h1>
        <p>Somente o administrador principal pode acessar esta área.</p>
      </div>
    );
  }

  function resetForm() {
    setForm({ title: "", summary: "", link: "", source: "", imageUrls: [], newFiles: [], publishedAt: "" });
    setEditingId(null);
  }

  // helper: upload files and return array of download URLs
  async function uploadFiles(files: File[]) {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const path = `news/${user?.uid || 'anon'}_${Date.now()}_${i}_${f.name}`;
      const r = storageRef(storage, path);
      try {
        await uploadBytes(r, f);
        const url = await getDownloadURL(r);
        urls.push(url);
      } catch (uErr) {
        console.error('Erro ao enviar arquivo para Storage:', uErr, { path, name: f.name });
        throw uErr;
      }
    }
    return urls;
  }

  // fallback: convert files to data URLs (base64) when Storage is not available
  // resize image on the client and return a data URL (JPEG) to reduce stored size
  function resizeFileToDataURL(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const ratio = img.width / img.height;
          const targetWidth = Math.min(maxWidth, img.width);
          const targetHeight = Math.round(targetWidth / ratio);
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('Falha ao decodificar imagem'));
      };
      img.src = url;
    });
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!form.title.trim()) {
      return alert("Título é obrigatório");
    }
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        summary: form.summary || null,
        link: form.link || null,
        source: form.source || null,
        imageUrls: form.imageUrls || [],
      };

      // Handle publishedAt
      if (form.publishedAt) {
        payload.publishedAt = new Date(form.publishedAt);
      } else {
        payload.publishedAt = new Date();
      }

      // Upload files if any
      const fileList: File[] = (form as any).newFiles || [];
      if (fileList.length > 0) {
        try {
          const uploaded = await uploadFiles(fileList.slice(0, 10));
          payload.imageUrls = [...(payload.imageUrls || []), ...uploaded];
        } catch (uploadErr: any) {
          console.warn('Storage error, trying fallback:', uploadErr);
          try {
            const filesToEncode = fileList.slice(0, 10);
            const encoded = await Promise.all(
              filesToEncode.map((f) => resizeFileToDataURL(f, 800, 0.7))
            );
            payload.imageData = [...(payload.imageData || []), ...encoded];
            alert('Storage indisponível: imagens foram incorporadas como thumbnails.');
          } catch (encErr: any) {
            alert('Erro ao processar imagens: ' + encErr?.message);
            setSaving(false);
            return;
          }
        }
      }

      if (editingId) {
        await updateNews(editingId, payload);
        alert('Notícia atualizada com sucesso');
        resetForm();
      } else {
        await createNews(payload, user?.uid || 'anon');
        alert('Notícia publicada com sucesso');
        resetForm();
      }
    } catch (err: any) {
      console.error('Erro ao salvar notícia:', err);
      alert("Erro ao salvar notícia: " + (err?.message || 'erro desconhecido'));
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(item: NewsDoc) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      summary: item.summary || "",
      link: item.link || "",
      source: item.source || "",
      imageUrls: item.imageUrls || [],
      newFiles: [],
      publishedAt: item.publishedAt ? (item.publishedAt.seconds ? new Date(item.publishedAt.seconds * 1000).toISOString().slice(0, 16) : new Date(item.publishedAt).toISOString().slice(0, 16)) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta notícia?")) return;
    try {
      await deleteNews(id);
      alert("Notícia excluída com sucesso");
    } catch (e: any) {
      console.error(e);
      alert("Erro ao excluir: " + (e?.message || 'erro desconhecido'));
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Admin — Notícias</h1>

        <form onSubmit={handleSave} className="bg-white rounded shadow p-6 mb-6">
          <div className="grid grid-cols-1 gap-4">
            <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border rounded px-3 py-2" />
            <input placeholder="Fonte" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full border rounded px-3 py-2" />
            <input placeholder="Link (opcional)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="w-full border rounded px-3 py-2" />
            {/* Existing image thumbnails (editable) */}
            <div>
              <label className="text-sm font-medium">Imagens (máx 10)</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {(form.imageUrls || []).map((u, idx) => (
                  <div key={u} className="relative">
                    <img src={u} alt={`img-${idx}`} className="w-20 h-20 object-cover rounded" />
                    <button type="button" onClick={() => {
                      const arr = (form.imageUrls || []).slice();
                      arr.splice(idx, 1);
                      setForm({ ...form, imageUrls: arr });
                    }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    const existing = (form.imageUrls || []).length;
                    const allowed = Math.max(0, 10 - existing);
                    if (files.length > allowed) {
                      alert(`Você pode adicionar no máximo ${allowed} imagens adicionais (total máximo 10).`);
                      e.currentTarget.value = '';
                      return;
                    }
                    setForm({ ...form, newFiles: files });
                  }}
                />
                {((form as any).newFiles || []).length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-600">{(form as any).newFiles.length} arquivo(s) selecionado(s) — serão enviados ao salvar.</div>
                    <div className="mt-2 flex gap-2">
                      {(form as any).newFiles.map((f: File, i: number) => (
                        <div key={i} className="w-20 h-20 rounded overflow-hidden border">
                          <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <textarea placeholder="Resumo / conteúdo" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="w-full border rounded px-3 py-2 h-28" />
            <div className="flex gap-2">
              <input type="datetime-local" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} className="border rounded px-3 py-2" />
              <button type="submit" disabled={saving} onClick={() => console.log('Publicar button clicked', { saving, editingId })} className="bg-blue-700 text-white px-4 py-2 rounded">{editingId ? 'Atualizar' : 'Publicar'}</button>
              <button type="button" onClick={resetForm} className="bg-gray-200 px-4 py-2 rounded">Limpar</button>
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4">
          {news.map((n) => (
            <div key={n.id} className="bg-white rounded shadow p-4 flex justify-between items-start">
              <div className="flex gap-4">
                {n.imageUrls && n.imageUrls[0] ? (
                  <img src={n.imageUrls[0]} alt="thumb" className="w-28 h-20 object-cover rounded" />
                ) : n.imageData && n.imageData[0] ? (
                  <img src={n.imageData[0]} alt="thumb" className="w-28 h-20 object-cover rounded" />
                ) : null}
                <div>
                  <h3 className="text-lg font-semibold">{n.title}</h3>
                  <p className="text-sm text-gray-600">{n.source} • {n.publishedAt ? (n.publishedAt.seconds ? new Date(n.publishedAt.seconds * 1000).toLocaleString() : new Date(n.publishedAt).toLocaleString()) : '—'}</p>
                  <p className="mt-2 text-sm text-gray-700">{n.summary}</p>
                  {n.link ? <a href={n.link} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">Abrir original</a> : null}
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <button onClick={() => handleEdit(n)} className="px-3 py-1 bg-yellow-400 rounded">Editar</button>
                <button onClick={() => handleDelete(n.id)} className="px-3 py-1 bg-red-500 text-white rounded">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
