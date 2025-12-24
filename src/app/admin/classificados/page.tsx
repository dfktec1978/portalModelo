"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import { listClassifieds, Classified, adminUpdateClassified, adminDeleteClassified, createClassified, getCategories, getClassified } from "@/lib/classifiedQueries";
import Image from "next/image";
import Link from "next/link";
import ImageUploadNews from "@/components/ImageUploadNews";
import Editor from "@/components/Editor";

export default function AdminClassificados() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [loadingClassifieds, setLoadingClassifieds] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    price: "",
    imageUrls: [] as string[],
  });
  const [newCategory, setNewCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !profileLoading && profile?.role === "admin") {
      loadClassifieds();
      loadCategories();
    }
  }, [loading, profileLoading, profile]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      loadClassifiedForEdit(editId);
    }
  }, [searchParams]);

  async function loadClassifiedForEdit(id: string) {
    setLoadingClassifieds(true);
    try {
      const { data, error } = await getClassified(id);
      if (error || !data) {
        alert('Erro ao carregar classificado para edição');
        return;
      }
      const c = data as Classified;
      setForm({
        title: c.title || "",
        description: c.description || "",
        category: c.category || "",
        location: c.location || "",
        price: c.price ? String(c.price) : "",
        imageUrls: Array.isArray(c.image_urls) ? c.image_urls as string[] : (c.image_urls ? [c.image_urls as any] : []),
      });
      setEditingId(id);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar classificado para edição');
    } finally {
      setLoadingClassifieds(false);
    }
  }

  async function loadClassifieds() {
    setLoadingClassifieds(true);
    try {
      const { data, error } = await listClassifieds();
      if (error) {
        setError(error.message);
      } else {
        setClassifieds(data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar classificados:", err);
      setError("Erro ao carregar classificados");
    } finally {
      setLoadingClassifieds(false);
    }
  }

  async function loadCategories() {
    try {
      const { data, error } = await getCategories();
      if (error) {
        console.error("Erro ao carregar categorias:", error);
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  }

  async function handleStatusChange(id: string, newStatus: "active" | "sold" | "removed") {
    try {
      const { error } = await adminUpdateClassified(id, { status: newStatus });
      if (error) {
        alert("Erro ao atualizar status: " + error.message);
      } else {
        loadClassifieds(); // Recarregar lista
      }
    } catch (err) {
      alert("Erro ao atualizar status");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja deletar este classificado permanentemente?")) return;
    try {
      const { error } = await adminDeleteClassified(id);
      if (error) {
        alert("Erro ao deletar: " + error.message);
      } else {
        loadClassifieds(); // Recarregar lista
      }
    } catch (err) {
      alert("Erro ao deletar");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || "",
        category: form.category || "geral",
        location: form.location || "",
        price: parseFloat(form.price) || 0,
        image_urls: form.imageUrls,
      };
      if (editingId) {
        const { data, error } = await adminUpdateClassified(editingId, payload);
        if (error) throw error;
        alert('Classificado atualizado com sucesso');
      } else {
        await createClassified(user?.id || 'admin', payload);
        alert('Classificado criado com sucesso');
      }
      setForm({ title: "", description: "", category: "", location: "", price: "", imageUrls: [] });
      setEditingId(null);
      loadClassifieds(); // Recarregar lista
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || profileLoading) return <div className="p-8">Carregando...</div>;
  if (!user) return <div className="p-8">Acesse para continuar.</div>;
  if (profile?.role !== "admin") return <div className="p-8">Acesso negado. Apenas administradores podem acessar esta área.</div>;

  return (
    <div className="space-y-6">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-[#003049]">Gerenciar Classificados</h1>

        {/* Form to add new classified */}
        <form onSubmit={handleSave} className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-[#003049]">Adicionar Novo Classificado</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="form-label">Título</label>
            <input
              placeholder="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="form-label">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => {
                if (e.target.value === "add-new") {
                  setShowAddCategory(true);
                  setForm({ ...form, category: "" });
                } else {
                  setForm({ ...form, category: e.target.value });
                  setShowAddCategory(false);
                }
              }}
              className="form-select"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="add-new">Adicionar nova categoria</option>
            </select>
            {showAddCategory && (
              <input
                placeholder="Nova categoria"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="form-input mt-2"
                onBlur={() => {
                  if (newCategory.trim()) {
                    setForm({ ...form, category: newCategory.trim() });
                    setCategories([...categories, newCategory.trim()].sort());
                    setNewCategory("");
                    setShowAddCategory(false);
                  }
                }}
              />
            )}
          </div>
          <div>
            <label className="form-label">Localização</label>
            <input
              placeholder="Localização"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Preço</label>
            <input
              type="number"
              step="0.01"
              placeholder="Preço"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Descrição</label>
            <Editor
              value={form.description}
              onChange={(val) => setForm({ ...form, description: val })}
              placeholder="Descrição"
            />
          </div>
          <div>
            <label className="form-label">Imagens</label>
            <ImageUploadNews
              images={form.imageUrls}
              heroImageIndex={0}
              onImagesChange={(images) => setForm({ ...form, imageUrls: images })}
              onHeroImageChange={() => {}}
              disabled={saving}
              maxImages={5}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-700 text-white px-4 py-2 rounded"
            >
              {saving ? 'Salvando...' : (editingId ? 'Atualizar' : 'Adicionar Classificado')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  if (!confirm('Tem certeza que deseja excluir este classificado?')) return;
                  handleDelete(editingId);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Excluir
              </button>
            )}
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ title: "", description: "", category: "", location: "", price: "", imageUrls: [] }); }} className="bg-gray-200 px-4 py-2 rounded">Cancelar</button>
            )}
          </div>
        </div>
      </form>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-[#003049]">{classifieds.length}</p>
          <p className="text-gray-600 text-sm">Total</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-600">{classifieds.filter(c => c.status === "active").length}</p>
          <p className="text-gray-600 text-sm">Ativos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-yellow-600">{classifieds.filter(c => c.status === "sold").length}</p>
          <p className="text-gray-600 text-sm">Vendidos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-600">{classifieds.filter(c => c.status === "removed").length}</p>
          <p className="text-gray-600 text-sm">Removidos</p>
        </div>
      </div>

      {/* Content */}
      {loadingClassifieds ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003049] mx-auto"></div>
          <p className="text-[#003049] mt-4">Carregando classificados...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : classifieds.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Nenhum classificado encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classifieds.map((classified) => (
            <div key={classified.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex gap-4">
                {/* Image */}
                <div className="flex-shrink-0">
                  {classified.image_urls && classified.image_urls.length > 0 ? (
                    <Image
                      src={classified.image_urls[0]}
                      alt={classified.title}
                      width={80}
                      height={80}
                      className="rounded object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500 text-xs">Sem imagem</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-[#003049] truncate">{classified.title}</h3>
                  <div className="text-gray-600 text-sm line-clamp-2" dangerouslySetInnerHTML={{ __html: classified.description || "" }} />
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-[#FDC500] font-medium">R$ {classified.price?.toFixed(2) || "0.00"}</span>
                    <span className="text-gray-600">{classified.category}</span>
                    <span className="text-gray-600">{classified.location}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <select
                    value={classified.status}
                    onChange={(e) => handleStatusChange(classified.id, e.target.value as any)}
                    className="px-3 py-1 bg-gray-100 text-gray-800 border border-gray-300 rounded text-sm"
                  >
                    <option value="active">Ativo</option>
                    <option value="sold">Vendido</option>
                    <option value="removed">Removido</option>
                  </select>
                  <Link
                    href={`/classificados/${classified.id}`}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm text-center"
                  >
                    Ver
                  </Link>
                  <button
                    onClick={() => handleDelete(classified.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    Deletar
                  </button>
                  <button
                    onClick={() => window.location.href = `?edit=${classified.id}`}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}