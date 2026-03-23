"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import StoreLandingProfileSettings from "@/components/StoreLandingProfileSettings";

type AdminStore = {
  id: string;
  store_name?: string;
  storeName?: string;
  slug?: string;
  plan?: string;
  plan_status?: string;
  category?: string;
  status?: string;
};

export default function AdminVitrinesPage() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [storesLoading, setStoresLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user || profile?.role !== "admin") return;

    let mounted = true;
    (async () => {
      setStoresLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/lojas?userId=${encodeURIComponent(user.id)}`, {
          cache: "no-store",
        });

        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error || "Erro ao carregar lojas");

        const all = (payload?.stores || []) as AdminStore[];
        const showcase = all.filter((s) => {
          const plan = String(s.plan || "presenca");
          return plan === "presenca" || plan === "landingpage";
        });

        if (!mounted) return;
        setStores(showcase);
        if (showcase.length > 0) {
          setSelectedId((prev) => prev || String(showcase[0].id));
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Erro ao carregar lojas");
      } finally {
        if (mounted) setStoresLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [user, profile?.role]);

  const selectedStore = useMemo(
    () => stores.find((s) => String(s.id) === String(selectedId)) || null,
    [stores, selectedId],
  );

  if (loading || profileLoading || storesLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!user || profile?.role !== "admin") {
    return <div className="p-8">Acesso negado. Apenas administradores podem acessar esta área.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D62828] to-[#C41E1E] rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Vitrines Grátis e LandingPage</h1>
        <p className="text-white/80">Plano Grátis é operado pelo Admin. LandingPage pode ser ajustado aqui e também pelo cliente no dashboard.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-4 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Lojas</h2>
          <p className="text-xs text-gray-500 mb-3">Somente planos Grátis e LandingPage.</p>
          <div className="space-y-2 max-h-[65vh] overflow-auto pr-1">
            {stores.length === 0 && (
              <div className="text-sm text-gray-500">Nenhuma loja nesses planos.</div>
            )}
            {stores.map((store) => {
              const isSelected = String(store.id) === String(selectedId);
              const plan = String(store.plan || "presenca");
              return (
                <button
                  key={store.id}
                  onClick={() => setSelectedId(String(store.id))}
                  className={`w-full text-left p-3 rounded-lg border transition ${isSelected ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                >
                  <div className="font-semibold text-sm text-gray-900 truncate">{store.store_name || store.storeName || "(Sem nome)"}</div>
                  <div className="text-xs text-gray-500 truncate">/lojas/{store.slug || store.id}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${plan === "landingpage" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"}`}>
                      {plan === "landingpage" ? "LandingPage" : "Grátis"}
                    </span>
                    <span className="text-[10px] text-gray-500">status: {store.status || "pending"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="lg:col-span-2">
          {selectedStore ? (
            <StoreLandingProfileSettings store={selectedStore} adminMode />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
              Selecione uma loja para editar os campos da vitrine.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
