'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProfessional, type Professional } from '@/lib/professionalQueries';

export default function ProfessionalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProfessional();
    }
  }, [id]);

  const loadProfessional = async () => {
    setLoading(true);
    const { data, error } = await getProfessional(id);
    if (error) {
      setError('Profissional não encontrado');
      console.error('Erro ao carregar profissional:', error);
    } else {
      setProfessional(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003049]"></div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#003049] mb-4">Profissional não encontrado</h1>
          <Link href="/profissionais" className="text-blue-600 hover:text-blue-800">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const whatsappUrl = `https://wa.me/55${professional.phone.replace(/\D/g, '')}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {professional.profile_image ? (
                <Image
                  src={professional.profile_image}
                  alt={professional.name}
                  width={150}
                  height={150}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-36 h-36 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-4xl">👤</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#003049] mb-2">{professional.name}</h1>
              <p className="text-lg text-gray-600 mb-2">{professional.category}</p>
              {professional.specialty && (
                <p className="text-md text-gray-500 mb-4">Especialidade: {professional.specialty}</p>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-lg ${i < Math.floor(professional.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ⭐
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  ({professional.rating.toFixed(1)}) - {professional.reviews_count} avaliações
                </span>
              </div>

              {/* Contact */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  📱 Chamar no WhatsApp
                </a>
                {professional.email && (
                  <a
                    href={`mailto:${professional.email}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                  >
                    ✉️ Enviar E-mail
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-[#003049] mb-4">Sobre</h2>
              <p className="text-gray-700 leading-relaxed">{professional.description}</p>
            </div>

            {/* Gallery */}
            {professional.gallery_images && professional.gallery_images.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-[#003049] mb-4">Trabalhos Realizados</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {professional.gallery_images.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`Trabalho ${index + 1}`}
                      width={200}
                      height={200}
                      className="rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location & Hours */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-[#003049] mb-4">Informações</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-600">Cidade:</span>
                  <p className="text-gray-800">{professional.city}</p>
                </div>
                {professional.neighborhood && (
                  <div>
                    <span className="font-medium text-gray-600">Bairro:</span>
                    <p className="text-gray-800">{professional.neighborhood}</p>
                  </div>
                )}
                {professional.working_hours && (
                  <div>
                    <span className="font-medium text-gray-600">Horário:</span>
                    <p className="text-gray-800">{professional.working_hours}</p>
                  </div>
                )}
                {professional.emergency_service && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">🚨</span>
                    <span className="text-green-700 font-medium">Atende emergências</span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            {(professional.instagram || professional.facebook || professional.website) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-[#003049] mb-4">Redes Sociais</h3>
                <div className="space-y-2">
                  {professional.instagram && (
                    <a
                      href={professional.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
                    >
                      📷 Instagram
                    </a>
                  )}
                  {professional.facebook && (
                    <a
                      href={professional.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      📘 Facebook
                    </a>
                  )}
                  {professional.website && (
                    <a
                      href={professional.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
                    >
                      🌐 Website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/profissionais"
            className="bg-[#003049] hover:bg-[#002035] text-white px-6 py-2 rounded-lg font-semibold"
          >
            ← Voltar para Profissionais
          </Link>
        </div>
      </div>
    </div>
  );
}