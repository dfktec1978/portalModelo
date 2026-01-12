"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import externalStores from "@/data/externalStores";

export default function LojaDetailPage() {
  const params = useParams() as { slug?: string };
  const key = params?.slug;
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!key) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        if (supabase) {
          // try lookup by slug first (using 'slug' column), then fallback to id
          let { data, error } = await supabase.from('stores').select('*').eq('slug', key).maybeSingle();
          if (error) console.warn('Supabase slug lookup error', error);
          if (!data) {
            const res = await supabase.from('stores').select('*').eq('id', key).maybeSingle();
            data = res.data;
          }
          if (!mounted) return;
          if (data) setStore(data);
          else {
            const ext = (externalStores || []).find((e: any) => String(e.id) === String(key) || String(e.slug) === String(key));
            if (ext) setStore({ ...ext, _externalOnly: true });
            else setStore(null);
          }
        } else {
          // Firebase mode: try slug query then id doc
          try {
            const q = query(collection(db, 'stores'), where('slug', '==', key));
            const snap = await getDocs(q);
            if (!mounted) return;
            if (!snap.empty) {
              const d = snap.docs[0];
              setStore({ id: d.id, ...(d.data() as any) });
            } else {
              const docRef = doc(db, 'stores', key);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) setStore({ id: docSnap.id, ...(docSnap.data() as any) });
              else {
                const ext = (externalStores || []).find((e: any) => String(e.id) === String(key) || String(e.slug) === String(key));
                if (ext) setStore({ ...ext, _externalOnly: true });
                else setStore(null);
              }
            }
          } catch (e) {
            console.error('Erro Firebase lookup loja:', e);
          }
        }
      } catch (e) {
        console.error('Erro ao buscar loja:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [key]);

  if (!key) return <div className="p-6">Slug da loja ausente.</div>;
  if (loading) return <div className="p-6">Carregando loja...</div>;
  if (!store) return <div className="p-6">Loja não encontrada.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded shadow">
            <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded">
              <div className="relative w-full h-64 flex items-center justify-center bg-gray-50 rounded">
                {store.logo ? (
                  <>
                    <Image src={store.logo} alt={store.store_name || store.name} fill className="object-contain" unoptimized />
                  </>
                ) : (
                  <div className="text-gray-400">Sem logo</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold text-[#003049]">{store.store_name || store.name}</h1>
          <p className="text-sm text-gray-600 mt-2">{store.description}</p>

          <div className="mt-4 flex gap-2">
            {store.phone && (
              <a href={`https://wa.me/55${String(store.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-green-600 text-white rounded">WhatsApp</a>
            )}

            {store._externalOnly && store.external_url ? (
              <div>
                <div className="mb-2 text-sm text-gray-500">Você está navegando em uma loja externa integrada.</div>
                <div className="w-full h-96 bg-white rounded overflow-hidden border">
                  <iframe src={store.external_url} title={store.store_name || 'Loja externa'} className="w-full h-full" />
                </div>
                <div className="mt-2">
                  <a href={store.external_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded">Visitar Loja</a>
                </div>
              </div>
            ) : (
              store.external_url && (
                <a href={store.external_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded">Visitar Loja</a>
              )
            )}
          </div>

          {store.gallery && store.gallery.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-[#003049] mb-2">Galeria</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {store.gallery.map((g: string, i: number) => (
                    <div key={i} className="relative h-32 bg-gray-100 overflow-hidden rounded">
                      <Image src={g} alt={`Imagem ${i+1}`} fill className="object-cover" unoptimized />
                    </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
