"use client";
import React, { useEffect, useState, useMemo } from "react";
import { fetchNewsById, fetchNewsSuggestions, NewsDoc } from "@/lib/newsQueries";

export default function NewsReader({ id, onCloseAction }: { id: string; onCloseAction?: () => void }) {
  const [news, setNews] = useState<NewsDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<NewsDoc[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // Fetch notícia específica (dual-mode)
        const newsData = await fetchNewsById(id);
        if (!mounted) return;
        setNews(newsData);

        // Definir heroImageIndex baseado nos dados carregados
        if (newsData && typeof newsData.heroImageIndex === 'number') {
          setHeroImageIndex(newsData.heroImageIndex);
        }

        // Fetch sugestões
        const sugg = await fetchNewsSuggestions(id, 4);
        if (mounted) setSuggestions(sugg);
      } catch (e) {
        console.error("Erro ao carregar notícia:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    const onPop = () => {
      // when user navigates back, close modal if provided
      if (onCloseAction) onCloseAction();
    };
    window.addEventListener("popstate", onPop);

    return () => {
      mounted = false;
      window.removeEventListener("popstate", onPop);
    };
  }, [id, onCloseAction]);

  // Combinar todas as imagens disponíveis (sempre definido para evitar erros de hooks)
  const allImages = React.useMemo(() => {
    if (!news) return [];
    return [
      ...(news.imageUrls || []),
      ...(news.imageData || [])
    ].slice(0, 5); // Limitar a 5 imagens
  }, [news]);

  const heroImage = allImages[heroImageIndex];
  const gridImages = allImages.filter((_, idx) => idx !== heroImageIndex); // Todas exceto a hero

  // Fechar lightbox com ESC e navegação com setas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev + 1) % Math.max(1, allImages.length || 1));
      }
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => (prev - 1 + Math.max(1, allImages.length || 1)) % Math.max(1, allImages.length || 1));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, allImages.length]);

  if (loading) return (
    <div className="p-6">Carregando notícia...</div>
  );

  if (!news) return (
    <div className="p-6">Notícia não encontrada.</div>
  );

  // Funções do lightbox
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  // Função para trocar imagem principal
  const setAsHeroImage = (imageIndex: number) => {
    setHeroImageIndex(imageIndex);
  };

  // Função para compartilhar notícia
  const shareNews = async () => {
    const url = window.location.href;
    const title = news.title;
    const text = news.summary ? news.summary.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : title;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(`${title}\n\n${text}\n\n${url}`).then(() => {
        alert('Link copiado para a área de transferência!');
      }).catch(() => {
        alert(`Compartilhar: ${title} - ${url}`);
      });
    }
  };

  // Normalizar data: pode ser Timestamp (Firebase) ou string ISO (Supabase)
  let dateStr = "—";
  if (news.publishedAt) {
    if (typeof news.publishedAt === "object" && news.publishedAt.seconds) {
      // Firebase Timestamp
      dateStr = new Date(news.publishedAt.seconds * 1000).toLocaleString("pt-BR");
    } else if (typeof news.publishedAt === "string") {
      // Supabase ISO string
      dateStr = new Date(news.publishedAt).toLocaleString("pt-BR");
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{news.title}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={shareNews}
              className="text-sm px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Compartilhar
            </button>
            <button
              onClick={() => {
                window.location.href = "/noticias";
              }}
              className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              Voltar
            </button>
          </div>
        </div>

      {/* Layout Hero + Mosaico */}
      {allImages.length > 0 && (
        <div className="mb-6">
          {/* Imagem Hero (Capa) */}
          {heroImage && (
            <div className="w-full h-80 mb-4 rounded-lg overflow-hidden cursor-pointer bg-gray-100 flex items-center justify-center" onClick={() => openLightbox(heroImageIndex)}>
              <img
                src={heroImage}
                alt={`${news.title} - Imagem principal`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Miniaturas em linha horizontal */}
          {gridImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {gridImages.map((imgSrc, idx) => {
                // Calcular o índice real da imagem no array allImages
                const realIndex = allImages.findIndex(img => img === imgSrc);
                return (
                  <div key={idx} className="relative group">
                    <div className="h-20 rounded-lg overflow-hidden cursor-pointer" onClick={() => openLightbox(realIndex)}>
                      <img
                        src={imgSrc}
                        alt={`${news.title} - Imagem ${realIndex + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    {/* Botão para definir como principal */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAsHeroImage(realIndex);
                      }}
                      className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded opacity-100 transition-opacity hover:bg-blue-600"
                      title="Definir como imagem principal"
                    >
                      ⭐
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-gray-500 mb-4">
        {news.source} • {dateStr}
      </p>

      <div className="prose max-w-none text-gray-800 mb-6">
        {news.content ? (
          <div dangerouslySetInnerHTML={{ __html: news.content }} />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: news.summary || '' }} />
        )}
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-2">Sugestões</h4>
        {suggestions.length === 0 ? (
          <div className="text-sm text-gray-500">Sem sugestões por enquanto.</div>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li key={s.id}>
                <a
                  href={`/noticias/${s.id}`}
                  className="text-sm text-[#CC2F30] hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && allImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeLightbox}>
          <div className="relative max-w-4xl max-h-full p-4">
            {/* Botão fechar */}
            <button
              onClick={closeLightbox}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all z-10"
            >
              ✕
            </button>

            {/* Navegação anterior */}
            {allImages.length > 1 && (
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setCurrentImageIndex((prev) => (prev - 1 + Math.max(1, allImages?.length || 1)) % Math.max(1, allImages?.length || 1));
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition-all"
              >
                ‹
              </button>
            )}

            {/* Imagem principal */}
            <img
              src={allImages[currentImageIndex]}
              alt={`${news.title} - Imagem ${currentImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Navegação próxima */}
            {allImages.length > 1 && (
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setCurrentImageIndex((prev) => (prev + 1) % Math.max(1, allImages?.length || 1));
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition-all"
              >
                ›
              </button>
            )}

            {/* Indicador de imagem atual */}
            {allImages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}