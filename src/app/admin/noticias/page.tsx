"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
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
} from "firebase/firestore";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

type NewsDoc = {
  id: string;
  title: string;
  summary?: string;
  link?: string;
  source?: string;
  imageUrls?: string[];
  imageData?: string[]; // data URLs fallback when Storage not available
  publishedAt?: any;
  createdBy?: string;
  createdAt?: any;
};

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
    const q = query(collection(db, "news"), orderBy("publishedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: NewsDoc[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setNews(arr);
    });
    return () => unsub();
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
    console.log('handleSave called', { saving, editingId, form });
    if (!form.title.trim()) {
      console.warn('Título vazio, abortando save');
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
        createdBy: user?.uid || null,
      };
      console.log('Payload prepared (before publishedAt/upload):', payload);
      // publishedAt
      if (form.publishedAt) {
        const d = new Date(form.publishedAt);
        payload.publishedAt = isNaN(d.getTime()) ? serverTimestamp() : Timestamp.fromDate(d);
      } else {
        payload.publishedAt = serverTimestamp();
      }

      // if there are new files selected, upload them first
      const fileList: File[] = (form as any).newFiles || [];
      if (fileList.length > 0) {
        console.log('Uploading files, count:', fileList.length);
        try {
          const uploaded = await uploadFiles(fileList.slice(0, 10));
          console.log('Uploaded files, urls:', uploaded);
          payload.imageUrls = [...(payload.imageUrls || []), ...uploaded];
        } catch (uploadErr: any) {
          console.warn('Falha no upload de arquivos para Storage, tentando fallback para data URLs:', uploadErr);
          // fallback gratuito: converter arquivos para data URLs (base64) e salvar no documento
          try {
            const filesToEncode = fileList.slice(0, 10);
            // generate thumbnails to reduce size before storing as data URLs
            const encoded = await Promise.all(
              filesToEncode.map((f) => resizeFileToDataURL(f, 800, 0.7))
            );
            // anexar como imageData (campo alternativo)
            payload.imageData = [...(payload.imageData || []), ...encoded];
            // avisar admin sobre limitação
            alert('Storage indisponível: imagens foram incorporadas como thumbnails (JPEG) para economizar espaço. Considere ativar o Storage para melhor performance e armazenamento de imagens em alta resolução.');
          } catch (encErr: any) {
            console.error('Falha ao converter imagens para data URLs (thumbnail):', encErr);
            alert('Erro ao processar imagens localmente: ' + (encErr?.message || 'erro desconhecido'));
            setSaving(false);
            return;
          }
        }
      } else {
        console.log('No new files to upload');
      }

      console.log('Final payload to save:', { editingId, payload });

      if (editingId) {
        console.log('Updating existing news, id:', editingId, 'payload:', payload);
        try {
          await updateDoc(doc(db, "news", editingId), payload);
          console.log('News updated:', editingId);
          alert('Notícia atualizada com sucesso');
          resetForm();
        } catch (updErr: any) {
          console.error('Erro ao atualizar notícia:', updErr);
          alert('Erro ao atualizar notícia: ' + (updErr?.message || updErr?.code || 'erro desconhecido'));
          // leave form as-is so admin can retry
          setSaving(false);
          return;
        }
      } else {
        payload.createdAt = serverTimestamp();
        const ref = await addDoc(collection(db, "news"), payload);
        console.log('News created, id:', ref.id);
        alert('Notícia publicada com sucesso');
        resetForm();
      }
    } catch (err) {
      console.error('Erro ao salvar notícia:', err);
      // show more detailed message when possible
      alert("Erro ao salvar notícia. Veja o console para mais detalhes.");
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
      await deleteDoc(doc(db, "news", id));
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir");
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
