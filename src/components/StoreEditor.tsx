"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";
import { createStore, updateStore } from "@/lib/adminQueries";
import StorePreview from "@/components/StorePreview";
import { useImageUpload } from "@/lib/useImageUpload";

function generateId(name?: string) {
  const slugBase = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : `loja-${Date.now()}`;
  const id = `${slugBase}-${Date.now()}`;
  return { id, slug: slugBase };
}

export default function StoreEditor() {
  const { user, loading } = useSupabaseAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [logo, setLogo] = useState("");
  const [galleryText, setGalleryText] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const gallery = galleryText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const { uploading, uploadImage, uploadMultiple, progress, error: uploadError } = useImageUpload({ bucket: 'stores', folder: 'stores' });

  if (loading) return <div>Verificando usuário...</div>;
  if (!user) return <div>Faça login para criar sua loja.</div>;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const generated = generateId(storeName || undefined) as any;
      const id = generated.id;
      const slug = generated.slug;

      const payload: any = {
        storeName,
        slug,
        description,
        phone,
        external_url: externalUrl || null,
        logo: logo || null,
        gallery: gallery.length ? gallery : null,
        ownerUid: user.id,
        status: 'pending',
      };

      const created = await createStore(id, payload);
      setMessage('Loja criada com sucesso. ID: ' + (created?.id || id));
    } catch (err: any) {
      console.error('Erro ao criar loja:', err);
      setMessage('Erro ao criar loja: ' + String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={handleCreate} className="bg-white p-6 rounded shadow">
        <div className="mb-3">
          <label className="text-sm text-gray-600 block mb-1">Nome da loja</label>
          <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full form-input" />
        </div>

        <div className="mb-3">
          <label className="text-sm text-gray-600 block mb-1">Descrição (resumo)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full form-textarea h-24" />
        </div>

        <div className="mb-3">
          <label className="text-sm text-gray-600 block mb-1">Telefone (WhatsApp)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full form-input" placeholder="(xx) xxxxx-xxxx" />
        </div>

        <div className="mb-3">
          <label className="text-sm text-gray-600 block mb-1">Logo</label>
          <div className="flex gap-2 items-center">
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setSaving(true);
                uploadImage(f).then((url) => {
                  if (url) setLogo(url);
                }).catch((e) => console.error(e)).finally(() => setSaving(false));
              }
            }} />
            <input value={logo} onChange={(e) => setLogo(e.target.value)} className="w-full form-input" placeholder="ou cole uma URL" />
          </div>
          {logo && <div className="mt-2"><Image src={logo} alt="logo" width={128} height={64} className="object-contain" unoptimized /></div>}
        </div>

        <div className="mb-3">
          <label className="text-sm text-gray-600 block mb-1">Galeria (envie imagens ou cole URLs; uma URL por linha)</label>
          <div className="mb-2">
            <input type="file" accept="image/*" multiple onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setGalleryFiles(files);
            }} />
            <button type="button" onClick={async () => {
              if (galleryFiles.length === 0) return;
              setSaving(true);
              try {
                const urls = await uploadMultiple(galleryFiles);
                if (urls && urls.length) {
                  setGalleryText((prev) => prev + (prev ? '\n' : '') + urls.join('\n'));
                }
              } finally {
                setSaving(false);
              }
            }} className="ml-2 px-3 py-1 bg-gray-200 rounded">Upload selecionadas</button>
          </div>

          <textarea value={galleryText} onChange={(e) => setGalleryText(e.target.value)} className="w-full form-textarea h-24" />
          {uploading && <div className="text-sm text-gray-500 mt-2">Enviando imagens...</div>}
          {uploadError && <div className="text-sm text-red-500 mt-2">{uploadError}</div>}
        </div>

        <div className="mb-3">
          <label className="text-sm text-gray-600 block mb-1">Site externo (opcional)</label>
          <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className="w-full form-input" placeholder="https://loja.exemplo.com" />
        </div>

        <div className="flex gap-2 mt-4">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? 'Salvando...' : 'Criar loja'}</button>
          <button type="button" onClick={() => {
            setStoreName(''); setDescription(''); setPhone(''); setExternalUrl(''); setLogo(''); setGalleryText(''); setMessage(null);
          }} className="px-4 py-2 bg-gray-200 rounded">Limpar</button>
        </div>

        {message && <div className="mt-4 text-sm text-gray-700">{message}</div>}
      </form>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Pré-visualização</h3>
        <StorePreview store={{ store_name: storeName, description, logo, external_url: externalUrl }} internalHref={storeName ? `/lojas/preview-${encodeURIComponent(storeName)}` : undefined} />
      </div>
    </div>
  );
}
