"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = { store: any };

type PizzaFlavor = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
};

export default function StoreModulePizzaFlavors({ store }: Props) {
  const [flavors, setFlavors] = useState<PizzaFlavor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", image_url: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (store?.id) {
      loadFlavors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id]);

  const loadFlavors = async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pizza_flavors")
        .select("*")
        .eq("store_id", store.id)
        .order("name");

      if (error) throw error;
      setFlavors(data || []);
    } catch (err) {
      console.error("Erro ao carregar sabores:", err);
      setFlavors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Digite o nome do sabor");
      return;
    }

    try {
      const payload = {
        store_id: store.id,
        name: form.name.trim(),
        description: form.description || null,
        image_url: form.image_url || null,
        active: true,
      };

      if (editingId) {
        const { error } = await supabase
          .from("pizza_flavors")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pizza_flavors").insert(payload);
        if (error) throw error;
      }

      setForm({ name: "", description: "", image_url: "" });
      setEditingId(null);
      setIsAdding(false);
      await loadFlavors();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const handleEdit = (flavor: PizzaFlavor) => {
    setForm({ 
      name: flavor.name, 
      description: flavor.description || "",
      image_url: flavor.image_url || ""
    });
    setEditingId(flavor.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    try {
      const { error } = await supabase.from("pizza_flavors").delete().eq("id", id);
      if (error) throw error;
      await loadFlavors();
    } catch (err: any) {
      alert("Erro ao deletar: " + err.message);
    }
  };

  const handleCancel = () => {
    setForm({ name: "", description: "", image_url: "" });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem');
      return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande! Máximo 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${store.id}/pizza-flavors/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('products')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
    } catch (err: any) {
      alert('Erro ao fazer upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sabores de Pizza</h3>
        <p className="text-sm text-gray-600">
          Cadastre os sabores disponíveis. Ao criar uma pizza, você poderá definir tamanhos e quantos sabores cada um permite.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Sabores Cadastrados</h4>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            ➕ Novo Sabor
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="mb-6 p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-3">{editingId ? "Editar" : "Novo"} Sabor</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Sabor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded px-3 py-2 text-gray-900"
                placeholder="Ex: Mussarela, Calabresa, 4 Queijos"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (Ingredientes)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded px-3 py-2 text-gray-900"
                rows={2}
                placeholder="Ex: Mussarela, tomate, manjericão"
              />
            </div>
            
            {/* Upload de Imagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foto do Sabor (Opcional)
              </label>
              <div className="space-y-2">
                {form.image_url && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300">
                    <img 
                      src={form.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: "" })}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploading && (
                  <p className="text-sm text-blue-600">📤 Enviando imagem...</p>
                )}
                <p className="text-xs text-gray-500">
                  Recomendado: 300x300px, máximo 2MB
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {editingId ? "Atualizar" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-4 text-gray-700">Carregando...</div>
      ) : flavors.length === 0 ? (
        <div className="p-4 border rounded bg-white text-gray-500 text-center">
          Nenhum sabor cadastrado ainda.
        </div>
      ) : (
        <div className="space-y-2">
          {flavors.map((flavor) => (
            <div
              key={flavor.id}
              className="flex items-center gap-3 bg-white border rounded p-3"
            >
              {/* Imagem do sabor */}
              {flavor.image_url ? (
                <img 
                  src={flavor.image_url} 
                  alt={flavor.name}
                  className="w-16 h-16 object-cover rounded border"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center text-2xl">
                  🍕
                </div>
              )}
              
              <div className="flex-1">
                <div className="font-medium text-gray-900">{flavor.name}</div>
                {flavor.description && (
                  <div className="text-sm text-gray-600">{flavor.description}</div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(flavor)}
                  className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(flavor.id)}
                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Como funciona</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Cadastre todos os sabores que sua pizzaria oferece</li>
          <li>• Ao criar um produto de Pizza no Cardápio, você define os tamanhos</li>
          <li>• Cada tamanho permite um número diferente de sabores</li>
          <li>• Na página pública, o cliente escolhe tamanho e sabores</li>
        </ul>
      </div>
    </div>
  );
}
