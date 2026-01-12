"use client";
import React, { useState } from 'react';

export default function CriarLojaPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('varejo');
  const [theme, setTheme] = useState('azul');
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/lojas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug, category, theme }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erro');
      setStatus('ok');
      // redirect to loja detalhe (principal)
      window.location.href = `/lojas/${j.store.slug}`;
    } catch (err: any) {
      setStatus(err.message || 'erro');
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Criar nova Loja</h1>
      <form onSubmit={submit} className="grid gap-3">
        <label className="block">
          <div className="text-sm font-medium">Nome da Loja</div>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border p-2 rounded" />
        </label>

        <label className="block">
          <div className="text-sm font-medium">Slug (opcional)</div>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 w-full border p-2 rounded" placeholder="ex: minha-loja" />
        </label>

        <label className="block">
          <div className="text-sm font-medium">Categoria</div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full border p-2 rounded">
            <option value="varejo">Varejo</option>
            <option value="alimentacao">Alimentação</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm font-medium">Tema</div>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className="mt-1 w-full border p-2 rounded">
            <option value="azul">Azul</option>
            <option value="verde">Verde</option>
            <option value="preto">Preto & Branco</option>
            <option value="vermelho">Vermelho</option>
            <option value="roxo">Roxo</option>
            <option value="laranja">Laranja</option>
          </select>
        </label>

        <div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Criar Loja</button>
        </div>

        {status && <div className="text-sm text-gray-600">{status}</div>}
      </form>
    </div>
  );
}
"use client";

import React from "react";
import StoreEditor from "@/components/StoreEditor";

export default function CriarLojaPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#003049] mb-4">Criar sua loja</h1>
        <p className="text-sm text-gray-600 mb-6">Preencha os dados abaixo para criar sua loja no Portal Modelo. Você poderá editar o conteúdo depois no painel.</p>
        <StoreEditor />
      </div>
    </div>
  );
}
