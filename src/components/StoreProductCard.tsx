"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

type Product = {
  id: string;
  title: string;
  price: string;
  image: string;
  badges?: string[];
};

export default function StoreProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded shadow p-3 flex flex-col">
      <div className="relative overflow-hidden rounded h-48 flex items-center justify-center bg-gray-50">
        <Image src={product.image} alt={product.title} fill className="object-contain" unoptimized />
        {product.badges?.length ? (
          <div className="absolute top-2 left-2">
            {product.badges.map((b, i) => <span key={i} className="bg-red-600 text-white px-2 py-1 text-xs rounded mr-1">{b}</span>)}
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex-1">
        <div className="text-sm font-semibold text-[#003049]">{product.title}</div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-lg font-bold text-green-700">{product.price}</div>
        <Link href={/produto/} className="bg-green-700 text-white px-3 py-1 rounded text-sm">Comprar</Link>
      </div>
    </div>
  );
}
