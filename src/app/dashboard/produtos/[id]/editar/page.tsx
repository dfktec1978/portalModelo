"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProductForm from "@/components/Dashboard/ProductForm";
import { getProductById } from "@/lib/productQueries";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const id = params?.id;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      const { data, error } = await getProductById(id);
      if (mounted) {
        if (error) {
          console.error(error);
          router.push('/dashboard/produtos');
        } else {
          // normalize DB fields to what the form expects
          const normalized = { ...data } as any;
          if (normalized.title === undefined && normalized.name) normalized.title = normalized.name;
          if (normalized.title === undefined && normalized.nome) normalized.title = normalized.nome;
          if (normalized.description === undefined && normalized.desc) normalized.description = normalized.desc;
          if (normalized.price === undefined && normalized.preco) normalized.price = normalized.preco;
          setProduct(normalized);
        }
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, router]);

  if (loading) return <div>Carregando...</div>;
  if (!product) return <div>Produto não encontrado</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Editar Produto</h1>
      <ProductForm initial={product} onSaved={() => router.push('/dashboard/produtos')} />
    </div>
  );
}
