"use client";
import React, { useState } from "react";

export default function StoreAppearance({ category }: { category: string }) {
  const [theme, setTheme] = useState('azul');
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setLogo(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Aparência da Loja</h2>
      <p className="text-sm text-gray-600 mb-4">O Portal Modelo controla layout; personalize apenas tema e logo.</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Tema</label>
          <div className="mt-2 flex gap-2">
            {['azul','verde','preto','vermelho','roxo','laranja'].map(t => (
              <button key={t} onClick={() => setTheme(t)} className={`px-3 py-2 rounded ${theme===t?'ring-2 ring-offset-1':''}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Logo</label>
          <input type="file" accept="image/*" onChange={onFile} className="mt-2" />
          {preview && <img src={preview} alt="preview" className="mt-2 h-24 object-contain" />}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium">Pré-visualização</h3>
        <div className={["mt-2 p-4 border rounded", theme==='azul'?'bg-blue-50':theme==='verde'?'bg-green-50':theme==='preto'?'bg-gray-800 text-white':''].join(' ')}>
          <div className="flex items-center gap-4">
            {preview ? <img src={preview} alt="logo" className="h-12 object-contain" /> : <div className="h-12 w-12 bg-gray-200 rounded" />}
            <div>
              <div className="text-lg font-semibold">Nome da Loja</div>
              <div className="text-sm text-gray-600">Categoria: {category === 'varejo' ? 'Varejo' : 'Alimentação'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
