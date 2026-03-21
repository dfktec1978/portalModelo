"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { listClassifieds, Classified } from "@/lib/classifiedQueries";

export default function ClassifiedsPage() {
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");

  const loadClassifieds = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await listClassifieds({
        category: selectedCategory === "todos" ? undefined : selectedCategory,
      });

      if (error) {
        setError(error.message);
      } else {
        const filtered = data?.filter((c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setClassifieds(filtered || []);
      }
    } catch (err) {
      console.error("Erro ao carregar classificados:", err);
      setError("Erro ao carregar classificados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadClassifieds();
  }, [selectedCategory, loadClassifieds]);

  const categories = [
    { value: "todos", label: "Todos" },
    { value: "eletrônicos", label: "Eletrônicos" },
    { value: "móveis", label: "Móveis" },
    { value: "roupas", label: "Roupas" },
    { value: "serviços", label: "Serviços" },
    { value: "outros", label: "Outros" },
  ];

  // Limpa HTML/entidades e retorna texto simples
  function cleanText(input?: string) {
    if (!input) return "";
    // remover tags HTML
    let t = input.replace(/<[^>]*>/g, "");
    // decode entidades HTML comuns
    t = t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    // colapsar espaços e trim
    t = t.replace(/\s+/g, " ").trim();
    return t;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Classificados</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
              Grátis
            </span>
          </div>
          <p className="text-gray-600">Encontre produtos e serviços locais</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="form-label">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Digite o produto ou serviço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Category */}
            <div>
              <label className="form-label">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex gap-4">
            <button
              onClick={loadClassifieds}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              🔍 Buscar
            </button>
            <Link
              href="/classificados/novo"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              + Novo Classificado
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Carregando classificados...</p>
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
          <>
            {/* Count */}
            <div className="mb-6 text-gray-600">
              {classifieds.length} classificado{classifieds.length !== 1 ? "s" : ""} encontrado
              {classifieds.length !== 1 ? "s" : ""}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classifieds.map((classified) => (
                <Link
                  key={classified.id}
                  href={`/classificados/${classified.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group"
                >
                  {/* Image */}
                  {classified.image_urls && classified.image_urls.length > 0 ? (
                    <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                      <Image
                        src={classified.image_urls[0]}
                        alt={classified.title}
                        fill
                        className="object-cover group-hover:scale-105 transition"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">Sem imagem</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                      {classified.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {cleanText(classified.description)}
                    </p>

                    <div className="flex justify-between items-end">
                      <div>
                        {classified.price && classified.price > 0 && (
                          <p className="text-2xl font-bold text-blue-600">
                            R$ {classified.price.toFixed(2)}
                          </p>
                        )}
                        {classified.location && (
                          <p className="text-sm text-gray-500 mt-1">📍 {classified.location}</p>
                        )}
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {classified.category}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
