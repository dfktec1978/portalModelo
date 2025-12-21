"use client";
import React from "react";
import { useProfile } from "@/lib/useProfile";

type NewsDoc = {
  id: string;
  title: string;
  summary?: string;
  link?: string;
  source?: string;
  imageUrls?: string[];
  imageData?: string[];
  publishedAt?: any;
};

export default function NewsRow({
  news,
  onOpenAction,
  onEditAction,
  onDeleteAction,
}: {
  news: NewsDoc;
  onOpenAction: (id: string) => void;
  onEditAction?: (id: string) => void;
  onDeleteAction?: (id: string) => void;
}) {
  const { profile } = useProfile();
  const isAdmin = profile?.role === "admin";

  const imgSrc = news.imageUrls && news.imageUrls[0] ? news.imageUrls[0] : (news.imageData && news.imageData[0] ? news.imageData[0] : null);

  return (
    <div className="group w-full hover:bg-gray-50 p-3 rounded-md flex items-start gap-4">
      <button
        onClick={() => onOpenAction(news.id)}
        className="flex items-start gap-4 flex-1 text-left"
      >
        {imgSrc ? (
          <div className="w-28 h-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
            <img src={imgSrc} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
        ) : (
          <div className="w-28 h-20 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center text-sm text-gray-500">Sem imagem</div>
        )}

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#CC2F30] leading-tight mb-1">{news.title}</h3>
          <div
            className="text-sm text-gray-700"
            style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {news.summary}
          </div>
          <div className="text-xs text-gray-400 mt-2">{news.source} • {news.publishedAt ? (news.publishedAt.seconds ? new Date(news.publishedAt.seconds * 1000).toLocaleString() : new Date(news.publishedAt).toLocaleString()) : '—'}</div>
        </div>
      </button>

      {isAdmin && (
        <div className="flex items-center gap-2">
          {onEditAction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditAction(news.id);
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Editar
            </button>
          )}
          {onDeleteAction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Tem certeza que deseja excluir esta notícia?")) {
                  onDeleteAction(news.id);
                }
              }}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Excluir
            </button>
          )}
        </div>
      )}
    </div>
  );
}
