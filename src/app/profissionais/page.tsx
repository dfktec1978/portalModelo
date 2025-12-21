'use client';

import { useState, useEffect } from 'react';
import ProfessionalCard from '@/components/ProfessionalCard';
import { listProfessionals, type Professional } from '@/lib/professionalQueries';
import { PROFESSIONAL_CATEGORIES } from '@/lib/professionalConstants';

// Flatten categories for filter
const ALL_CATEGORIES = ['Todos', ...Object.values(PROFESSIONAL_CATEGORIES).flat()];

export default function ProfissionaisPage() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    setLoading(true);
    const { data, error } = await listProfessionals({
      category: selectedCategory === 'Todos' ? undefined : selectedCategory,
      search: searchTerm || undefined,
    });
    if (error) {
      console.error('Erro ao carregar profissionais:', error);
    } else {
      setProfessionals(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfessionals();
  }, [selectedCategory, searchTerm]);

  const paginatedProfessionals = professionals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(professionals.length / itemsPerPage);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-center text-[#003049]">Profissionais</h1>

      {/* Busca e Filtros */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Buscar Profissionais</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Buscar por nome ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Lista de Profissionais */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Todos os Profissionais</h2>
        {loading ? (
          <p className="text-center text-gray-500">Carregando...</p>
        ) : professionals.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProfessionals.map(prof => (
                <ProfessionalCard key={prof.id} professional={prof} />
              ))}
            </div>
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 mx-1 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500">Nenhum profissional encontrado.</p>
        )}
      </section>
    </div>
  );
}