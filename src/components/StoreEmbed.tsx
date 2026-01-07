"use client";

import React from "react";

interface StoreEmbedProps {
  url: string;
  height?: number;
}

/** Componente para embutir uma landing externa com fallback */
export default function StoreEmbed({ url, height = 700 }: StoreEmbedProps) {
  if (!url) {
    return <div className="text-sm text-gray-500">URL inválida.</div>;
  }

  let safeUrl = url;
  try {
    const u = new URL(url);
    // permitir apenas https para segurança
    if (u.protocol !== "https:") return (
      <div className="text-sm text-gray-500">
        Link não permitido. <a href={url} target="_blank" rel="noopener noreferrer" className="underline">Abrir em nova aba</a>
      </div>
    );
  } catch {
    return <div className="text-sm text-gray-500">URL inválida.</div>;
  }

  return (
    <div className="w-full">
      <div className="border rounded overflow-hidden">
        <iframe
          src={safeUrl}
          title="Loja externa"
          className="w-full"
          style={{ height }}
          sandbox="allow-forms allow-same-origin allow-scripts allow-popups"
        />
      </div>

      <p className="mt-2 text-sm text-gray-600">
        Se a loja não carregar, <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="underline">abrir em nova aba</a>.
      </p>
    </div>
  );
}
