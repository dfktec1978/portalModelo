"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ProfessionalCard from "@/components/ProfessionalCard";
import { listProfessionals, type Professional, getProfessional } from "@/lib/professionalQueries";
import { PROFESSIONAL_CATEGORIES } from "@/lib/professionalConstants";

// Flatten categories for filter
const ALL_CATEGORIES = ["Todos", ...Object.values(PROFESSIONAL_CATEGORIES).flat()];

function SafeHtml({ html, className }: { html?: string; className?: string }) {
  const [safe, setSafe] = useState<string>("");
  useEffect(() => {
    let mounted = true;
    (async () => {
      const raw = html || "";
      if (typeof window === "undefined") {
        const cleaned = raw.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
        if (mounted) setSafe(cleaned);
        return;
      }
      const mod = await import("isomorphic-dompurify");
      const DOMPurify = (mod as any).default || mod;
      if (mounted) setSafe(DOMPurify.sanitize(raw));
    })();
    return () => { mounted = false; };
  }, [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: safe }} />;
}

export default function ProfissionaisPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // inicialização: buscar profissionais quando os filtros mudam
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      const { data, error } = await listProfessionals({
        category: selectedCategory === "Todos" ? undefined : selectedCategory,
        search: searchTerm || undefined,
      });
      if (error) {
        console.error("Erro ao carregar profissionais:", error);
      } else if (mounted) {
        setProfessionals(data || []);
      }
      if (mounted) setLoading(false);
    };
    init();
    return () => { mounted = false; };
  }, [selectedCategory, searchTerm]);

  const paginatedProfessionals = professionals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(professionals.length / itemsPerPage);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Helpers para normalizar links sociais e ícones
  const makeExternalUrl = (val?: string, prefix?: string) => {
    if (!val) return null;
    if (/^https?:\/\//i.test(val)) return val;
    if (prefix) return `${prefix}${val}`;
    return `https://${val}`;
  };

  async function openModal(id: string) {
    setModalLoading(true);
    try {
      const { data, error } = await getProfessional(id);
      if (error || !data) {
        console.error("Erro ao carregar profissional:", error);
        return;
      }
      setSelectedProfessional(data);
      setGalleryIndex(0);
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    setSelectedProfessional(null);
    setGalleryIndex(0);
  }

  // URLs normalizadas para links sociais do profissional selecionado
  const websiteUrl = makeExternalUrl(selectedProfessional?.website);
  const facebookUrl = makeExternalUrl(selectedProfessional?.facebook, "https://facebook.com/");
  const instagramUrl = makeExternalUrl(selectedProfessional?.instagram, "https://instagram.com/");

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
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="form-select">
            {ALL_CATEGORIES.map((cat) => (
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
              {paginatedProfessionals.map((prof) => (
                <ProfessionalCard key={prof.id} professional={prof} onClick={() => openModal(prof.id)} />
              ))}
            </div>
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50">
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 mx-1 rounded ${currentPage === page ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                    {page}
                  </button>
                ))}
                <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50">
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
          <div className="relative bg-white rounded-lg shadow-lg max-w-6xl w-full mx-4 overflow-auto max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#003049]">{selectedProfessional.name}</h3>
              <button onClick={closeModal} className="text-gray-600 px-3 py-1">
                Fechar
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Foto / Logo (col 1) */}
                <div className="md:col-span-1">
                  {selectedProfessional.profile_image ? (
                    <div className="w-full">
                      <Image src={selectedProfessional.profile_image} alt={selectedProfessional.name} width={320} height={320} className="w-full h-auto rounded" />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center">👤</div>
                  )}
                </div>

                {/* Descrição / contatos (col 2) */}
                <div className="md:col-span-1 md:border-r md:border-gray-200 md:pr-6">
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedProfessional.category} {selectedProfessional.specialty ? `• ${selectedProfessional.specialty}` : ""}
                  </p>
                  <SafeHtml html={selectedProfessional.description || ""} className="prose max-w-none" />

                  {/* Linha separadora (tom de cinza, padrão do portal) */}
                  <div className="border-t border-gray-200 my-4" />

                  <div className="mt-4 flex items-center gap-4">
                    {selectedProfessional.phone && (
                      <a
                        href={`https://wa.me/55${selectedProfessional.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center text-center"
                        aria-label="Chamar no WhatsApp"
                      >
                        <Image src="/img/logos/whatsapp.png" alt="WhatsApp" width={56} height={56} />
                        <span className="text-xs mt-1 text-gray-700">WhatsApp</span>
                      </a>
                    )}

                    {websiteUrl && (
                      <a href={websiteUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center text-center" aria-label="Visitar site">
                        <Image src="/img/logos/site.png" alt="Site" width={56} height={56} />
                        <span className="text-xs mt-1 text-gray-700">Site</span>
                      </a>
                    )}

                    {facebookUrl && (
                      <a href={facebookUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center text-center" aria-label="Facebook">
                        <Image src="/img/logos/facebook.png" alt="Facebook" width={56} height={56} />
                        <span className="text-xs mt-1 text-gray-700">Facebook</span>
                      </a>
                    )}

                    {instagramUrl && (
                      <a href={instagramUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center text-center" aria-label="Instagram">
                        <Image src="/img/logos/instagram.png" alt="Instagram" width={56} height={56} />
                        <span className="text-xs mt-1 text-gray-700">Instagram</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Galeria (col 3) */}
                <div className="md:col-span-1">
                  <h4 className="text-sm font-semibold text-[#003049] mb-3">Trabalhos Realizados</h4>

                  <div className="w-full mb-3">
                      {selectedProfessional.gallery_images && selectedProfessional.gallery_images.length > 0 ? (
                      <div className="w-full h-48 relative rounded overflow-hidden">
                        <Image src={selectedProfessional.gallery_images[galleryIndex]} alt={`Imagem ${galleryIndex + 1}`} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400">Sem imagens</div>
                    )}
                  </div>

                  {/* Thumbnails (até 4) */}
                  <div className="flex gap-3">
                        {(selectedProfessional.gallery_images || []).slice(0, 4).map((img, idx) => (
                      <button key={idx} onClick={() => setGalleryIndex(idx)} className="w-20 h-14 rounded overflow-hidden border-2" aria-label={`Ver imagem ${idx + 1}`}>
                        <Image src={img} alt={`Miniatura ${idx + 1}`} width={160} height={112} className={`${galleryIndex === idx ? "ring-2 ring-blue-400" : ""}`} />
                      </button>
                    ))}
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
