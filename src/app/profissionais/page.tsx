'use client';

import { useState, useEffect } from 'react';
import ProfessionalCard from '@/components/ProfessionalCard';
import { listProfessionals, type Professional, getProfessional } from '@/lib/professionalQueries';
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
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  async function openModal(id: string) {
    setModalLoading(true);
    try {
      const { data, error } = await getProfessional(id);
      if (error || !data) {
        console.error('Erro ao carregar profissional:', error);
        return;
      }
      setSelectedProfessional(data);
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    setSelectedProfessional(null);
  }

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
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-select"
          >
            {ALL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
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
                <ProfessionalCard key={prof.id} professional={prof} onClick={() => openModal(prof.id)} />
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

      {/* Modal */}
      {selectedProfessional && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 overflow-auto max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#003049]">{selectedProfessional.name}</h3>
              <button onClick={closeModal} className="text-gray-600 px-3 py-1">Fechar</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  {selectedProfessional.profile_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedProfessional.profile_image} alt={selectedProfessional.name} className="w-full h-auto rounded" />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center">👤</div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-4">{selectedProfessional.category} {selectedProfessional.specialty ? `• ${selectedProfessional.specialty}` : ''}</p>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedProfessional.description || '' }} />
                  <div className="mt-4">
                    {selectedProfessional.phone && (
                      <a href={`https://wa.me/55${selectedProfessional.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-block bg-green-600 text-white px-4 py-2 rounded mr-2">WhatsApp</a>
                    )}
                    {selectedProfessional.website && (
                      <a href={selectedProfessional.website} target="_blank" rel="noreferrer" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">Site</a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}