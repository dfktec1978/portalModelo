"use client";

import React from "react";
import Image from "next/image";

interface StoreCardProps {
  store: {
    id?: string;
    store_name?: string;
    name?: string;
    slug?: string;
    description?: string;
    logo?: string;
    external_url?: string | null;
  };
  internalHref?: string | null;
}

/** Retorna a URL com UTM adicionadas (se possível) */
function buildUtmUrl(store: StoreCardProps["store"]) {
  if (!store?.external_url) return null;
  try {
    const u = new URL(store.external_url);
    u.searchParams.set("utm_source", "portal");
    u.searchParams.set("utm_medium", "loja");
    u.searchParams.set("utm_campaign", store.slug || store.store_name || store.name || "loja");
    return u.toString();
  } catch {
    return store.external_url;
  }
}

export default function StoreCard({ store, internalHref }: StoreCardProps) {
  const visitUrl = buildUtmUrl(store);
  const href = internalHref || undefined;

  const renderLogo = () => {
    if (!store?.logo) return (
      <div className="mb-3 flex justify-center">
        <div className="w-28 h-20 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-xs text-gray-400">Sem logo</span>
        </div>
      </div>
    );
    // Forçar tamanho uniforme para todas as miniaturas
    const isExternal = /^https?:\/\//i.test(store.logo);
    if (isExternal) {
      return (
        <div className="mb-3 flex justify-center">
          <div className="w-28 h-20 flex items-center justify-center overflow-hidden rounded bg-white">
            <Image
              src={store.logo}
              alt={store.store_name || store.name || "Loja"}
              width={112}
              height={80}
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      );
    }
    return (
      <div className="mb-3 flex justify-center">
        <div className="w-28 h-20 flex items-center justify-center overflow-hidden rounded bg-white">
          <Image
            src={store.logo}
            alt={store.store_name || store.name || "Loja"}
            width={112}
            height={80}
            className="object-contain"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-colors">
      {renderLogo()}

      <h3 className="text-lg font-semibold text-[#003049] text-center">
        {store.store_name || store.name || "Loja sem nome"}
      </h3>

      {store.description && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-3 text-center">
          {store.description}
        </p>
      )}

      <div className="mt-4 flex justify-center">
        {href || visitUrl ? (
          <a
            href={href || visitUrl}
            target={href ? undefined : "_blank"}
            rel={href ? undefined : "noopener noreferrer"}
            className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            Visitar Loja
          </a>
        ) : (
          <div className="text-sm text-gray-500 text-center">
            {store.description ? (
              <span className="line-clamp-3">{store.description}</span>
            ) : (
              <span>Sem descrição</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
