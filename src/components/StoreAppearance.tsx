"use client";
import React from "react";

export default function StoreAppearance({ category }: { category?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Aparência</h2>
      <div className="text-sm text-gray-600">Customize a aparência da sua loja — cores, logo, tema (placeholder).</div>
    </div>
  );
}
