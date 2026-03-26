"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import {
  getThemesList,
  getThemeAccessibility,
  getThemeSemanticTokens,
  ThemeColor,
  ThemeConfig,
} from "@/lib/themes";
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
  const [hasChanges, setHasChanges] = useState(false);
  // Refs para os valores salvos (não causam re-render)
  const savedThemeRef = useRef<string>(store?.theme_color || 'azul');
  const savedLogoRef = useRef<string>(store?.logo_url || '');
  
  const themes = getThemesList();
  const selectedThemeConfig = themes.find((theme) => theme.id === selectedTheme) || themes[0];
  const selectedThemeTokens = getThemeSemanticTokens(selectedThemeConfig);
  const selectedThemeAccessibility = getThemeAccessibility(selectedThemeConfig);
  const normalizedStoreCategory = String(store?.category || '').trim().toLowerCase();
  
  const { uploadImage, uploading } = useImageUpload({ 
    bucket: 'stores', 
    folder: 'logos' 
  });

  const formatContrast = (value: number) => value.toFixed(2).replace('.', ',');
  const normalizeErrorMessage = (error: unknown): string => {
    if (!error) return 'Erro desconhecido';
    if (error instanceof Error) return error.message || 'Erro desconhecido';
    if (typeof error === 'string') return error;
    if (typeof error === 'object') {
      const raw = error as Record<string, unknown>;
      const parts = [raw.message, raw.details, raw.hint, raw.code]
        .filter(Boolean)
        .map((value) => String(value));
      if (parts.length > 0) return parts.join(' | ');
      try {
        return JSON.stringify(error);
      } catch {
        return 'Erro desconhecido';
      }
    }
    return String(error);
  };
  const getLegibilityLabel = (grade: 'A' | 'B' | 'C') => {
    if (grade === 'A') return 'Leitura excelente';
    if (grade === 'B') return 'Leitura boa';
    return 'Leitura no limite';
  };

  const getLegibilityHint = (grade: 'A' | 'B' | 'C') => {
    if (grade === 'A') return 'Ótimo para botões, títulos e destaques.';
    if (grade === 'B') return 'Funciona bem na maior parte dos cenários.';
    return 'Pode ficar difícil em telas claras; prefira outro tema.';
  };

  const getBestForLabel = (bestFor?: 'alimentacao' | 'varejo' | 'geral') => {
    if (bestFor === 'alimentacao') return 'Indicado para Alimentação';
    if (bestFor === 'varejo') return 'Indicado para Varejo';
    return 'Indicado para uso geral';
  };

  const getThemeCurations = (theme: ThemeConfig, preferredCategory?: string) => {
    const curations: Array<{ key: string; label: string; className: string; priority: number }> = [];

    if (theme.id === 'laranja' || theme.id === 'vermelho' || theme.id === 'terracota') {
      curations.push({
        key: 'vendas-rapidas',
        label: 'Mais indicado para vendas rápidas',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
        priority: 2,
      });
    }

    if (theme.id === 'preto-branco' || theme.id === 'petroleo' || theme.id === 'roxo') {
      curations.push({
        key: 'marca-premium',
        label: 'Mais indicado para marca premium',
        className: 'bg-slate-50 text-slate-800 border-slate-300',
        priority: 2,
      });
    }

    if (theme.id === 'verde' || theme.id === 'azul' || theme.id === 'terracota') {
      curations.push({
        key: 'cardapio-digital',
        label: 'Mais indicado para cardápio digital',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        priority: 2,
      });
    }

    const normalizedCategory = (preferredCategory || '').trim().toLowerCase();
    const boosted = curations.map((curation) => {
      let boost = 0;
      if (normalizedCategory === 'alimentacao') {
        if (curation.key === 'vendas-rapidas') boost = 3;
        if (curation.key === 'cardapio-digital') boost = 2;
      }
      if (normalizedCategory === 'varejo') {
        if (curation.key === 'marca-premium') boost = 3;
        if (curation.key === 'vendas-rapidas') boost = 1;
      }
      return { ...curation, priority: curation.priority + boost };
    });

    return boosted
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 2);
  };

  const selectedCurations = getThemeCurations(selectedThemeConfig, normalizedStoreCategory);

  // Atualizar state quando store mudar
  useEffect(() => {
    if (store) {
      setSelectedTheme(store.theme_color || 'azul');
      setLogoUrl(store.logo_url || '');
      setHasChanges(false);
      // Atualizar refs com os valores salvos
      savedThemeRef.current = store.theme_color || 'azul';
      savedLogoRef.current = store.logo_url || '';
    }
  }, [store]);

  // Detectar mudanças sem auto-save: aplicação só ocorre no botão "Salvar Aparência"
  useEffect(() => {
    const changed = selectedTheme !== savedThemeRef.current || logoUrl !== savedLogoRef.current;
    setHasChanges(changed);
  }, [selectedTheme, logoUrl]);

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

      if (error) {
        const dbErrorMessage = normalizeErrorMessage(error);
        const themeConstraintError = /stores_theme_check|theme_color|violates check constraint/i.test(dbErrorMessage);

        if (themeConstraintError) {
          // Reverte para o último tema salvo e evita loop de auto-save com tema inválido no banco.
          setSelectedTheme(savedThemeRef.current as ThemeColor);
          setHasChanges(false);
          setMessage('⚠️ O banco ainda não aceita este tema. Execute a migration de temas novos e tente novamente.');
          setSaving(false);
          return;
        }

        throw new Error(dbErrorMessage || 'Falha ao salvar aparência');
      }

      setMessage('✅ Aparência salva com sucesso!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setMessage(null), 5000);
      
      // Atualizar refs para os novos valores "salvos"
      savedThemeRef.current = selectedTheme;
      savedLogoRef.current = logoUrl;
      setHasChanges(false);
      
      if (onStoreUpdated && data) {
        onStoreUpdated(data);
      }
    } catch (err: any) {
      const safeErrorMessage = normalizeErrorMessage(err);
      setMessage('❌ Erro ao salvar: ' + safeErrorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveLogo() {
    if (!logoUrl) return;
    
    if (!confirm('Tem certeza que deseja remover a logo?')) return;
    
    setSaving(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from('stores')
        .update({ logo_url: null })
        .eq('id', store.id)
        .select()
        .single();

      if (error) throw error;

      setLogoUrl('');
      setMessage('✅ Logo removida com sucesso!');
      setHasChanges(false);
      
      if (onStoreUpdated && data) {
        onStoreUpdated(data);
      }

      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      console.error('Erro ao remover logo:', err);
      setMessage('❌ Erro ao remover: ' + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  }

  function handleDiscardChanges() {
    setSelectedTheme(savedThemeRef.current as ThemeColor);
    setLogoUrl(savedLogoRef.current || '');
    setSelectedFile(null);
    setHasChanges(false);
    setMessage('ℹ️ Alterações descartadas.');
    setTimeout(() => setMessage(null), 2200);
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
    const accessibility = getThemeAccessibility(theme);
    const curations = getThemeCurations(theme, normalizedStoreCategory);
    const gradeStyle = accessibility.grade === 'A'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : accessibility.grade === 'B'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-rose-50 text-rose-700 border-rose-200';
    
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

        {theme.description && (
          <p className="text-[11px] text-gray-500 mb-2 leading-snug">{theme.description}</p>
        )}

        <p className="text-[11px] text-gray-500 mb-2">{getBestForLabel(theme.bestFor)}</p>

        {curations.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {curations.map((curation) => (
              <span
                key={curation.key}
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${curation.className}`}
              >
                {curation.label}
              </span>
            ))}
          </div>
        )}

        <div className="mb-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${gradeStyle}`}>
            {getLegibilityLabel(accessibility.grade)}
          </span>
        </div>
        
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

      {/* Indicador de Mudanças Não Salvas */}
      {hasChanges && (
        <div className="p-3 rounded mb-6 bg-yellow-50 text-yellow-800 border border-yellow-200 flex items-center justify-between">
          <span className="text-sm">📝 Você tem alterações não salvas. Clique em “Salvar Aparência”.</span>
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
            {logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                disabled={saving}
                className="mt-3 px-4 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️ Remover Logo
              </button>
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

        {(normalizedStoreCategory === 'alimentacao' || normalizedStoreCategory === 'varejo') && (
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            {normalizedStoreCategory === 'alimentacao'
              ? 'Sugestão para Alimentação: Laranja Vibrante ou Terracota Mercado.'
              : 'Sugestão para Varejo: Preto & Branco ou Petróleo Urbano.'}
          </div>
        )}

        <div className="mb-4 p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 flex flex-wrap items-center gap-2">
          <span className="font-semibold">Tema selecionado:</span>
          <span>{selectedThemeConfig.name}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-semibold ${
            selectedThemeAccessibility.grade === 'A'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : selectedThemeAccessibility.grade === 'B'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {getLegibilityLabel(selectedThemeAccessibility.grade)}
          </span>
          <span>Contraste mínimo: {formatContrast(selectedThemeAccessibility.minContrast)}:1</span>
          <span className="text-slate-600">{getLegibilityHint(selectedThemeAccessibility.grade)}</span>
        </div>

        {selectedCurations.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {selectedCurations.map((curation) => (
              <span
                key={curation.key}
                className={`inline-flex items-center rounded-full border px-2.5 py-1 font-semibold ${curation.className}`}
              >
                {curation === selectedCurations[0] ? `Principal: ${curation.label}` : curation.label}
              </span>
            ))}
          </div>
        )}

        {/* Grid de Temas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {themes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>

        {/* Preview em Tempo Real */}
        <div className="border-t pt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Pré-visualização do Tema</h4>
          <div className="space-y-3">
            {/* Header Preview */}
            <div 
              className="p-4 rounded-lg flex items-center justify-between"
              style={{
                backgroundColor: selectedThemeConfig.colors.primary,
                color: selectedThemeTokens.buttonPrimaryText,
              }}
            >
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">
                    <span className="text-xs">📦</span>
                  </div>
                )}
                <span className="font-semibold">{store?.name || 'Sua Loja'}</span>
              </div>
              <a href="#" className="hover:opacity-80 text-sm" style={{ color: selectedThemeTokens.buttonPrimaryText }}>Menu</a>
            </div>

            {/* Product Card Preview */}
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: selectedThemeTokens.borderSubtle }}>
              <div 
                className="h-24 w-full rounded-t-lg"
                style={{ backgroundColor: selectedThemeConfig.colors.accent }}
              />
              <div className="p-3" style={{ backgroundColor: selectedThemeConfig.colors.background }}>
                <p className="text-sm font-semibold text-gray-900 mb-2">Exemplo de Produto</p>
                <div className="mb-2 flex items-center gap-2 text-[11px]">
                  <span
                    className="inline-flex px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: selectedThemeTokens.badgeSuccessBg,
                      color: selectedThemeTokens.badgeSuccessText,
                    }}
                  >
                    Em estoque
                  </span>
                  <span
                    className="inline-flex px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: selectedThemeTokens.badgeWarningBg,
                      color: selectedThemeTokens.badgeWarningText,
                    }}
                  >
                    Alerta baixo
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2 text-xs font-semibold rounded"
                    style={{
                      backgroundColor: selectedThemeTokens.buttonPrimaryBg,
                      color: selectedThemeTokens.buttonPrimaryText,
                    }}
                  >
                    Adicionar
                  </button>
                  <button
                    className="flex-1 py-2 text-xs font-semibold rounded border"
                    style={{
                      borderColor: selectedThemeTokens.buttonSecondaryBorder,
                      color: selectedThemeTokens.buttonSecondaryText,
                      backgroundColor: selectedThemeConfig.colors.background,
                    }}
                  >
                    Detalhes
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div className="rounded border p-2" style={{ borderColor: selectedThemeTokens.borderSubtle, backgroundColor: selectedThemeTokens.surfaceMuted }}>
                Botão principal: {formatContrast(selectedThemeAccessibility.buttonPrimaryContrast)}:1
              </div>
              <div className="rounded border p-2" style={{ borderColor: selectedThemeTokens.borderSubtle, backgroundColor: selectedThemeTokens.surfaceMuted }}>
                Botão secundário: {formatContrast(selectedThemeAccessibility.secondaryContrast)}:1
              </div>
              <div className="rounded border p-2" style={{ borderColor: selectedThemeTokens.borderSubtle, backgroundColor: selectedThemeTokens.surfaceMuted }}>
                Faixa de destaque: {formatContrast(selectedThemeAccessibility.accentContrast)}:1
              </div>
              <div className="rounded border p-2" style={{ borderColor: selectedThemeTokens.borderSubtle, backgroundColor: selectedThemeTokens.surfaceMuted }}>
                Qualidade de leitura: {getLegibilityLabel(selectedThemeAccessibility.grade)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSaveAppearance}
          disabled={saving || uploading || !hasChanges}
          className={`px-6 py-3 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            hasChanges
              ? 'bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
          } disabled:cursor-not-allowed`}
        >
          {saving ? '⏳ Salvando...' : '💾 Salvar Aparência'}
          {hasChanges && <span className="text-xs bg-white/30 px-2 py-0.5 rounded">Não salvo</span>}
        </button>

        <button
          type="button"
          onClick={handleDiscardChanges}
          disabled={saving || uploading || !hasChanges}
          className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ↺ Descartar alterações
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

    </div>
  );
}
