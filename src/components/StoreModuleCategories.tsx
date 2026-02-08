"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = { store: any };

type Category = {
  id: string;
  name: string;
  icon: string;
  store_id: string;
};

export default function StoreModuleCategories({ store }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("🍴");

  const loadCategories = async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("store_id", store.id)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (store?.id) {
      loadCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id]);

  async function handleAdd() {
    if (!newCategoryName.trim()) {
      alert("Digite o nome da categoria");
      return;
    }

    try {
      const { error } = await supabase.from("product_categories").insert({
        store_id: store.id,
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
      });

      if (error) throw error;

      setNewCategoryName("");
      setNewCategoryIcon("🍴");
      await loadCategories();
    } catch (err) {
      alert("Erro ao adicionar categoria: " + String(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza? Essa categoria será removida de todos os produtos que a usam.")) return;

    try {
      const { error } = await supabase.from("product_categories").delete().eq("id", id);

      if (error) throw error;
      await loadCategories();
    } catch (err) {
      alert("Erro ao deletar categoria: " + String(err));
    }
  }

  const commonIcons = ["🍔", "🍕", "🥤", "🍰", "🍟", "🎯", "🍱", "🌮", "🍜", "🍗", "🥗", "🍣"];

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Gerenciar Categorias</h3>
        <p className="text-sm text-gray-600">
          Crie categorias personalizadas para organizar seu cardápio. Elas aparecerão no dropdown ao adicionar produtos.
        </p>
      </div>

      {/* Formulário de Adicionar */}
      <div className="bg-gray-50 border rounded-lg p-4 mb-6">
        <h4 className="font-semibold mb-3 text-gray-900">Nova Categoria</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Categoria</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="w-full border rounded px-3 py-2 text-gray-900"
              placeholder="Ex: Hambúrgueres Artesanais"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
            <select
              value={newCategoryIcon}
              onChange={(e) => setNewCategoryIcon(e.target.value)}
              className="w-full border rounded px-3 py-2 text-gray-900 bg-white"
            >
              {commonIcons.map((icon) => (
                <option key={icon} value={icon}>
                  {icon} {icon === "🍔" ? "Hambúrguer" : icon === "🍕" ? "Pizza" : icon === "🥤" ? "Bebida" : icon === "🍰" ? "Sobremesa" : icon === "🍟" ? "Porção" : icon === "🎯" ? "Combo" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          ➕ Adicionar Categoria
        </button>
      </div>

      {/* Lista de Categorias */}
      {loading ? (
        <div className="p-4 text-gray-700">Carregando...</div>
      ) : categories.length === 0 ? (
        <div className="p-4 border rounded bg-white text-gray-500 text-center">
          Nenhuma categoria personalizada ainda. As categorias padrão sempre estarão disponíveis.
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 mb-3">Categorias Personalizadas ({categories.length})</h4>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between bg-white border rounded-lg p-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-medium text-gray-900">{cat.name}</span>
              </div>
              <button
                onClick={() => handleDelete(cat.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm transition"
              >
                Deletar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Categorias Padrão (Informativo) */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">📌 Categorias Padrão</h4>
        <p className="text-sm text-blue-800 mb-2">
          As seguintes categorias estão sempre disponíveis:
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-white rounded text-sm">🍔 Lanches</span>
          <span className="px-2 py-1 bg-white rounded text-sm">🍕 Pizza</span>
          <span className="px-2 py-1 bg-white rounded text-sm">� Porções</span>
          <span className="px-2 py-1 bg-white rounded text-sm">🥤 Bebidas</span>
          <span className="px-2 py-1 bg-white rounded text-sm">🍰 Sobremesas</span>
          <span className="px-2 py-1 bg-white rounded text-sm">🎯 Combo</span>
        </div>
      </div>
    </div>
  );
}
