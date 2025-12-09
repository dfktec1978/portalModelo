"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getClassified, Classified } from "@/lib/classifiedQueries";
import { useAuth } from "@/lib/AuthContext";
import DeleteClassifiedButton from "@/components/DeleteClassifiedButton";

export default function ClassifiedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [classified, setClassified] = useState<Classified | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadClassified();
  }, [id]);

  async function loadClassified() {
    const { data, error } = await getClassified(id);
    if (error) {
      setError(error.message);
    } else {
      setClassified(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !classified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Classificado não encontrado</h1>
          <Link href="/classificados" className="text-blue-600 hover:underline">
            ← Voltar para classificados
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === classified.seller_id;
  const images = classified.image_urls || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/classificados" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Voltar para classificados
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images Section */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            {images.length > 0 ? (
              <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden mb-4">
                <Image
                  src={images[selectedImage]}
                  alt={classified.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <span className="text-gray-400">Sem imagem</span>
              </div>
            )}

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mb-8 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === idx ? "border-blue-600" : "border-gray-300"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Imagem ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Descrição</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{classified.description}</p>
            </div>
          </div>

          {/* Info Section */}
          <div>
            {/* Main Info Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{classified.title}</h1>

              {/* Price */}
              {classified.price && classified.price > 0 && (
                <div className="mb-4">
                  <p className="text-4xl font-bold text-blue-600">R$ {classified.price.toFixed(2)}</p>
                </div>
              )}

              {/* Category & Location */}
              <div className="space-y-2 mb-6 pb-6 border-b">
                {classified.category && (
                  <p className="text-gray-600">
                    <span className="font-semibold">Categoria:</span> {classified.category}
                  </p>
                )}
                {classified.location && (
                  <p className="text-gray-600">
                    <span className="font-semibold">📍 Local:</span> {classified.location}
                  </p>
                )}
                {classified.status && (
                  <p className="text-gray-600">
                    <span className="font-semibold">Status:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded text-sm font-semibold ${
                        classified.status === "active"
                          ? "bg-green-100 text-green-800"
                          : classified.status === "sold"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {classified.status === "active"
                        ? "Ativo"
                        : classified.status === "sold"
                        ? "Vendido"
                        : "Removido"}
                    </span>
                  </p>
                )}
              </div>

              {/* Contact Section */}
              {!isOwner && (
                <div>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition mb-3">
                    Entre em contato
                  </button>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition">
                    Conversar via WhatsApp
                  </button>
                </div>
              )}

              {/* Owner Actions */}
              {isOwner && (
                <div className="space-y-3">
                  <Link
                    href={`/classificados/${id}/editar`}
                    className="block text-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Editar
                  </Link>
                  <DeleteClassifiedButton id={id} variant="full" />
                </div>
              )}
            </div>

            {/* Timestamps */}
            {classified.created_at && (
              <div className="text-xs text-gray-500 text-center">
                <p>Publicado em {new Date(classified.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
