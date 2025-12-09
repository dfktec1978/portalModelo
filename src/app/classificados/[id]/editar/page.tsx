"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getClassified, updateClassified, Classified } from "@/lib/classifiedQueries";
import { useAuth } from "@/lib/AuthContext";
import ImageUpload from "@/components/ImageUpload";

export default function EditarClassificadoPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const id = params.id as string;

  const [classified, setClassified] = useState<Classified | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    price: "",
  });

  useEffect(() => {
    loadClassified();
  }, [id]);

  async function loadClassified() {
    const { data, error } = await getClassified(id);

    if (error) {
      setError(error.message);
    } else if (data) {
      // Verificar se é o owner
      if (user && data.seller_id !== user.id) {
        setError("Você não tem permissão para editar este classificado");
      } else {
        setClassified(data);
        setImages(data.image_urls || []);
        setFormData({
          title: data.title,
          description: data.description,
          category: data.category || "",
          location: data.location || "",
          price: data.price ? data.price.toString() : "",
        });
      }
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !classified) return;

    setError(null);
    setSaving(true);

    // Validação
    if (!formData.title.trim()) {
      setError("Título é obrigatório");
      setSaving(false);
      return;
    }

    if (!formData.description.trim()) {
      setError("Descrição é obrigatória");
      setSaving(false);
      return;
    }

    try {
      const { error } = await updateClassified(id, user.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim() || null,
        price: formData.price ? parseFloat(formData.price) : 0,
        image_urls: images,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push(`/classificados/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar classificado");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  const categories = [
    { value: "eletrônicos", label: "Eletrônicos" },
    { value: "móveis", label: "Móveis" },
    { value: "roupas", label: "Roupas" },
    { value: "serviços", label: "Serviços" },
    { value: "outros", label: "Outros" },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Você precisa estar logado
          </h1>
          <Link href="/login" className="text-blue-600 hover:underline">
            Ir para login
          </Link>
        </div>
      </div>
    );
  }

  if (error && !classified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
          <Link href="/classificados" className="text-blue-600 hover:underline">
            Voltar para classificados
          </Link>
        </div>
      </div>
    );
  }

  if (!classified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Classificado não encontrado
          </h1>
          <Link href="/classificados" className="text-blue-600 hover:underline">
            Voltar para classificados
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/classificados/${id}`} className="text-blue-600 hover:underline mb-4 inline-block">
            ← Voltar para classificado
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Editar Classificado</h1>
          <p className="text-gray-600 mt-2">Atualize os detalhes do seu anúncio</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: iPhone 13 branco"
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 caracteres</p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descreva o produto ou serviço em detalhes..."
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/1000 caracteres
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Localização
              </label>
              <input
                id="location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: São Paulo - SP"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Preço
              </label>
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">R$</span>
                <input
                  id="price"
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Deixe em branco se não aplicável</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens
              </label>
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                disabled={saving}
                maxImages={5}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
