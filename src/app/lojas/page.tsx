"use client";

import Link from "next/link";
import Image from "next/image";

export default function LojasPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#003049] mb-4">Lojas de Modelo-SC</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubra os comércios locais da nossa cidade. Em breve você poderá explorar todas as lojas cadastradas aqui.
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <Image
              src="/img/logos/logo.png"
              alt="Portal Modelo"
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
            <h2 className="text-2xl font-semibold text-[#003049] mb-2">Em Breve!</h2>
            <p className="text-gray-600">
              Estamos trabalhando para trazer a você o melhor diretório de lojas de Modelo-SC.
              Enquanto isso, explore outras seções do portal:
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Link
              href="/classificados"
              className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition border border-blue-200"
            >
              <div className="text-2xl mb-2">📢</div>
              <h3 className="font-semibold text-[#003049]">Classificados</h3>
              <p className="text-sm text-gray-600">Compre e venda</p>
            </Link>

            <Link
              href="/profissionais"
              className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition border border-blue-200"
            >
              <div className="text-2xl mb-2">👷</div>
              <h3 className="font-semibold text-[#003049]">Profissionais</h3>
              <p className="text-sm text-gray-600">Encontre serviços</p>
            </Link>

            <Link
              href="/noticias"
              className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition border border-blue-200"
            >
              <div className="text-2xl mb-2">📰</div>
              <h3 className="font-semibold text-[#003049]">Notícias</h3>
              <p className="text-sm text-gray-600">Fique informado</p>
            </Link>
          </div>

          {/* Back to Home */}
          <div className="mt-8">
            <Link
              href="/"
              className="inline-block bg-[#003049] hover:bg-[#002038] text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              ← Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}