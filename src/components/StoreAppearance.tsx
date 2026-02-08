"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { getThemesList, ThemeColor, ThemeConfig } from "@/lib/themes";
import { useImageUpload } from "@/lib/useImageUpload";
import InfoBanner from "@/components/InfoBanner";
import InfoTooltip from "@/components/InfoTooltip";

type Props = {
  store: any;
  onStoreUpdated?: (store: any) => void;
};

export default function StoreAppearance({ store, onStoreUpdated }: Props) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeColor>(
    store?.theme_color || 'azul'
  );
  const [logoUrl, setLogoUrl] = useState(store?.logo_url || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const themes = getThemesList();
  
  const { uploadImage, uploading } = useImageUpload({ 
    bucket: 'stores', 
    folder: 'logos' 
  });

  // Atualizar state quando store mudar
  useEffect(() => {
    if (store) {
      setSelectedTheme(store.theme_color || 'azul');
      setLogoUrl(store.logo_url || '');
    }
  }, [store]);

  async function handleSaveAppearance() {
    if (!store?.id) return;
    
    setSaving(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from('stores')
        .update({
          theme_color: selectedTheme,
          logo_url: logoUrl || null,
        })
        .eq('id', store.id)
        .select()
        .single();

      if (error) throw error;

      setMessage('✅ Aparência salva com sucesso!');
      
      if (onStoreUpdated && data) {
        onStoreUpdated(data);
      }

      // Scroll para o topo para ver a mensagem
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Limpar mensagem após 5 segundos
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      console.error('Erro ao salvar aparência:', err);
      setMessage('❌ Erro ao salvar: ' + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessage(null);
    }
  }

  async function handleUploadLogo() {
    if (!selectedFile || !store?.id) return;

    setSaving(true);
    setMessage(null);

    try {
      // 1. Fazer upload da imagem
      const url = await uploadImage(selectedFile);
      
      if (url) {
        // 2. Salvar URL no banco imediatamente
        const { data, error } = await supabase
          .from('stores')
          .update({ logo_url: url })
          .eq('id', store.id)
          .select()
          .single();

        if (error) throw error;

        // 3. Atualizar estados
        setLogoUrl(url);
        setSelectedFile(null);
        setMessage('✅ Logo enviada e salva com sucesso!');
        
        if (onStoreUpdated && data) {
          onStoreUpdated(data);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Limpar input file
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // Limpar mensagem após 5 segundos
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setMessage('❌ Erro ao fazer upload: ' + (err.message || String(err)));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  function ThemeCard({ theme }: { theme: ThemeConfig }) {
    const isSelected = selectedTheme === theme.id;
    
    return (
      <button
        type="button"
        onClick={() => setSelectedTheme(theme.id)}
        className={`relative p-4 rounded-lg border-2 transition-all ${
          isSelected 
            ? 'border-blue-600 bg-blue-50 shadow-lg scale-105' 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
      >
        {/* Preview de cor */}
        <div 
          className="w-full h-20 rounded mb-3"
          style={{ backgroundColor: theme.preview }}
        />
        
        {/* Nome do tema */}
        <div className="font-semibold text-gray-900 mb-1">{theme.name}</div>
        
        {/* Paleta de cores */}
        <div className="flex gap-1 justify-center">
          <div 
            className="w-6 h-6 rounded-full border border-gray-300"
            style={{ backgroundColor: theme.colors.primary }}
            title="Primária"
          />
          <div 
            className="w-6 h-6 rounded-full border border-gray-300"
            style={{ backgroundColor: theme.colors.secondary }}
            title="Secundária"
          />
          <div 
            className="w-6 h-6 rounded-full border border-gray-300"
            style={{ backgroundColor: theme.colors.accent }}
            title="Destaque"
          />
        </div>

        {/* Indicador de seleção */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            ✓
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Mensagem Educativa Principal */}
      <InfoBanner
        type="info"
        title="Como funciona a personalização no Portal Modelo"
        message="O Portal Modelo adapta automaticamente a apresentação da sua loja para oferecer a melhor experiência aos seus clientes. Você personaliza cores e logo, enquanto o layout é otimizado pela plataforma para garantir profissionalismo e conversão."
      />

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Aparência da Loja</h2>

      {/* Mensagem de Feedback */}
      {message && (
        <div className={`p-3 rounded mb-6 ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Seção: Logo da Loja */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Logo da Loja</h3>
          <InfoTooltip content="Formatos aceitos: JPG, PNG, GIF. Tamanho recomendado: 500x500px. Máximo: 5MB. Sua logo aparecerá no topo da página pública da loja." />
        </div>
        
        <div className="flex items-start gap-6">
          {/* Preview da Logo */}
          <div className="flex-shrink-0">
            {logoUrl ? (
              <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <Image
                  src={logoUrl}
                  alt="Logo da loja"
                  fill
                  className="object-contain p-2"
                />
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Upload de Logo */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {logoUrl ? 'Alterar Logo' : 'Enviar Logo'}
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="block flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleUploadLogo}
                  disabled={uploading || saving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {(uploading || saving) ? '⏳ Enviando...' : '📤 Enviar'}
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Recomendado: imagem quadrada (500x500px), fundo transparente PNG
            </p>
            {selectedFile && !uploading && !saving && (
              <p className="mt-2 text-sm text-green-600">
                ✓ Arquivo selecionado: {selectedFile.name}
              </p>
            )}
            {(uploading || saving) && (
              <p className="mt-2 text-sm text-blue-600">
                ⏳ Enviando logo...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Seção: Tema de Cores */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tema de Cores</h3>
        <p className="text-sm text-gray-600 mb-4">
          Escolha um dos temas pré-definidos do Portal Modelo
        </p>

        {/* Grid de Temas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSaveAppearance}
          disabled={saving || uploading}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '⏳ Salvando...' : '💾 Salvar Aparência'}
        </button>

        {store?.slug && (
          <a
            href={`/lojas/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            👁️ Visualizar Loja
          </a>
        )}
      </div>

      {/* Preview do Tema Selecionado */}
      <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Preview: Como ficará sua loja
        </h4>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            {logoUrl && (
              <div className="relative w-16 h-16">
                <Image
                  src={logoUrl}
                  alt="Logo preview"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div>
              <div className="text-xl font-bold" style={{ color: themes.find(t => t.id === selectedTheme)?.colors.primary }}>
                {store?.store_name || 'Sua Loja'}
              </div>
              <div className="text-sm text-gray-500">Tema: {themes.find(t => t.id === selectedTheme)?.name}</div>
            </div>
          </div>
          
          <button
            type="button"
            style={{ 
              backgroundColor: themes.find(t => t.id === selectedTheme)?.colors.primary,
              color: 'white'
            }}
            className="px-4 py-2 rounded font-medium"
          >
            Botão de Exemplo
          </button>
        </div>
      </div>
    </div>
  );
}
