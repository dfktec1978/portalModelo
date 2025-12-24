"use client";
import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { uploadProductImage, createProduct, updateProduct } from "@/lib/productQueries";
import ImageUploadNews from "@/components/ImageUploadNews";
import Editor from "@/components/Editor";

type Props = {
  initial?: any;
  onSaved?: (product: any) => void;
};

export default function ProductForm({ initial, onSaved }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initial?.title || "");
  const [price, setPrice] = useState(
    initial?.price !== undefined && initial?.price !== null
      ? String(Number(initial.price).toFixed(2))
      : ""
  );
  const [description, setDescription] = useState(initial?.description || "");
  // support alternative column names from DB (name/nome)
  React.useEffect(() => {
    if (!initial) return;
    if (initial.title === undefined && initial.name) setTitle(initial.name);
    if (initial.title === undefined && initial.nome) setTitle(initial.nome);
    if (initial.description === undefined && initial.desc) setDescription(initial.desc);
    if (initial.price === undefined && initial.preco) setPrice(initial.preco);
  }, [initial]);
  // images are stored as public URLs (already uploaded via uploadFn)
  const [images, setImages] = useState<string[]>(initial?.images || []);
  const [heroIndex, setHeroIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No direct file input here; uploads happen via ImageUploadNews using uploadFn

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setError("Usuário não autenticado");
    setLoading(true);
    setError(null);

    try {
      const ownerId = user.id;
      // images are managed/uploaded by ImageUploadNews via uploadFn, so use current images state
      const imageUrls = images;

      const payload: any = {
        owner_id: ownerId,
        title,
        price: price ? Number(parseFloat(String(price)).toFixed(2)) : null,
        description,
        images: imageUrls,
      };

      if (initial?.id) {
        const { data, error: updErr } = await updateProduct(initial.id, payload);
        if (updErr) throw updErr;
        onSaved?.(data);
      } else {
        const { data, error: createErr } = await createProduct(payload);
        if (createErr) throw createErr;
        onSaved?.(data);
      }

    } catch (err: any) {
      try {
        console.error(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      } catch (e) {
        console.error(err);
      }
      const msg = err?.message || err?.error || (typeof err === 'string' ? err : null) || JSON.stringify(err);
      setError(msg || "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label className="block text-sm font-medium">Título</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 rounded bg-white/5" />
      </div>

      <div>
        <label className="block text-sm font-medium">Preço</label>
        <input value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 rounded bg-white/5" />
      </div>

      <div>
        <label className="block text-sm font-medium">Descrição</label>
        <Editor
          value={description}
          onChange={(val) => setDescription(val)}
          placeholder="Descreva o produto..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Imagens (máx 5)</label>
        <ImageUploadNews
          images={images}
          heroImageIndex={heroIndex}
          onImagesChange={(imgs) => setImages(imgs)}
          onHeroImageChange={(idx) => setHeroIndex(idx)}
          maxImages={5}
          uploadFn={async (file: File) => {
            const res = await uploadProductImage(user!.id, file);
            return { success: !!res.publicUrl, url: res.publicUrl, error: res.error?.message || (res.error ? String(res.error) : undefined) };
          }}
          deleteFn={async (url: string) => {
            try {
              const r = await fetch('/api/delete-product-image', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ publicUrl: url }) });
              return r.ok;
            } catch (e) {
              console.error(e);
              return false;
            }
          }}
        />
      </div>

      <div>
        <button disabled={loading} className="bg-[#FDC500] px-4 py-2 rounded">
          {loading ? 'Salvando...' : 'Salvar produto'}
        </button>
      </div>
    </form>
  );
}
