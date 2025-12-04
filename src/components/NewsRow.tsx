"use client";
import React from "react";

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
}: {
  news: NewsDoc;
  onOpenAction: (id: string) => void;
}) {
  const imgSrc = news.imageUrls && news.imageUrls[0] ? news.imageUrls[0] : (news.imageData && news.imageData[0] ? news.imageData[0] : null);

  return (
    <button
      onClick={() => onOpenAction(news.id)}
      className="group w-full text-left hover:bg-gray-50 p-3 rounded-md flex items-start gap-4"
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
  );
}
