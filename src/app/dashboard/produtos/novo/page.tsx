"use client";
import React from "react";
import ProductForm from "@/components/Dashboard/ProductForm";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Novo Produto</h1>
      <ProductForm
        onSaved={() => {
          router.push('/dashboard/produtos');
        }}
      />
    </div>
  );
}
