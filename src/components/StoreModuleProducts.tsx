"use client";
import React, { useEffect, useState } from "react";

type Props = { storeSlug: string };

export default function StoreModuleProducts({ storeSlug }: Props) {
  const [products, setProducts] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', category: 'geral' });

  useEffect(() => {
    loadProducts();
  }, [storeSlug]);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/produtos?store=${storeSlug}`);
      const j = await res.json();
      setProducts(j.products || []);
    } catch (e) {
      console.warn('failed load products', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert('Nome e preço são obrigatórios');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/produtos';
      const body: any = { ...form, price: parseFloat(form.price), store: storeSlug };
      if (editingId) body.id = editingId;

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Save failed');

      setForm({ name: '', price: '', description: '', category: 'geral' });
      setEditingId(null);
      setIsAdding(false);
      await loadProducts();
    } catch (e) {
      alert('Erro ao salvar: ' + String(e));
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Tem certeza?')) return;
    try {
      const res = await fetch(`/api/produtos?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await loadProducts();
    } catch (e) {
      alert('Erro ao deletar: ' + String(e));
    }
  }

  function startEdit(p: any) {
    setEditingId(p.id);
    setForm({ name: p.name, price: String(p.price), description: p.description, category: p.category });
    setIsAdding(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: '', price: '', description: '', category: 'geral' });
    setIsAdding(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Produtos</h3>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Adicionar</button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={saveProduct} className="mb-6 p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-3">{editingId ? 'Editar' : 'Novo'} Produto</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1 w-full border rounded p-2 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preço (R$) *</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} className="mt-1 w-full border rounded p-2 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoria</label>
              <input type="text" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="mt-1 w-full border rounded p-2 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="mt-1 w-full border rounded p-2 text-gray-900" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{editingId ? 'Atualizar' : 'Salvar'}</button>
            <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="p-4 text-gray-700">Carregando...</div>
      ) : products.length === 0 ? (
        <div className="p-4 border rounded bg-white text-gray-900">Nenhum produto cadastrado.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {products.map((p: any) => (
            <div key={p.id} className="border rounded p-4 bg-white text-gray-900 flex justify-between items-center">
              <div className="flex-1">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-gray-600">{p.description}</div>
                <div className="text-xs text-gray-500">{p.category}</div>
              </div>
              <div className="text-right mr-4">
                <div className="font-semibold">R$ {p.price.toFixed(2)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(p)} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm">Editar</button>
                <button onClick={() => deleteProduct(p.id)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Deletar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

