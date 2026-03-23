"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  store: any;
  adminMode?: boolean;
};

type LandingProfile = {
  storeId: string;
  storeSlug: string;
  plan: string;
  store_name: string;
  category: string;
  specialty: string;
  address: string;
  phone: string;
  email: string;
  facebook_url: string;
  instagram_url: string;
  business_hours: string;
  landing_description: string;
  logo_url: string;
  landing_photo_urls: string[];
  city: string;
};

const EMPTY_PHOTOS = ["", "", "", "", ""];

export default function StoreLandingProfileSettings({ store, adminMode = false }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [form, setForm] = useState<LandingProfile | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);

  const canEdit = useMemo(() => {
    if (!store) return false;
    if (adminMode) return true;
    return String(store?.plan || "") === "landingpage";
  }, [store, adminMode]);

  useEffect(() => {
    if (!store?.id && !store?.slug) {
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      setMessage("");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error("Sessão não encontrada");

        const storeRef = store?.id || store?.slug;
        const storeSlug = store?.slug || null;

        const res = await fetch(`/api/store/landing-profile?storeId=${encodeURIComponent(storeRef)}${storeSlug ? `&storeSlug=${encodeURIComponent(storeSlug)}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.error || "Erro ao carregar perfil da landing");
        }

        const profile = payload?.profile as LandingProfile;
        const photos = Array.isArray(profile?.landing_photo_urls) ? [...profile.landing_photo_urls] : [];
        while (photos.length < 5) photos.push("");

        if (mounted) {
          setForm({
            ...profile,
            city: profile.city || '',
            landing_photo_urls: photos.slice(0, 5),
          });
        }
      } catch (error: any) {
        if (mounted) setMessage(error?.message || "Erro ao carregar perfil");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [store?.id, store?.slug]);

  const updatePhoto = (index: number, value: string) => {
    if (!form) return;
    const photos = [...(form.landing_photo_urls || EMPTY_PHOTOS)];
    photos[index] = value;
    setForm({ ...form, landing_photo_urls: photos.slice(0, 5) });
  };

  const activePhotos = useMemo(
    () => (form?.landing_photo_urls || []).map((photo) => photo.trim()).filter(Boolean).slice(0, 5),
    [form?.landing_photo_urls],
  );

  const uploadFile = async (file: File) => {
    if (!store?.id) throw new Error("Loja inválida para upload");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("ownerId", String(store.id));

    const res = await fetch("/api/upload-product-image", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || json?.error) {
      throw new Error(json?.error || "Falha no upload da imagem");
    }

    const publicUrl = json?.data?.publicUrl;
    if (!publicUrl) {
      throw new Error("Upload concluído sem URL pública");
    }

    return String(publicUrl);
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file || !form) return;
    setUploadingLogo(true);
    setMessage("");
    try {
      const publicUrl = await uploadFile(file);
      setForm({ ...form, logo_url: publicUrl });
      setMessage("Logo enviado com sucesso. Salve o perfil para concluir.");
    } catch (error: any) {
      setMessage(error?.message || "Erro ao enviar logo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handlePhotosUpload = async (files: FileList | null) => {
    if (!files || !form) return;
    const currentPhotos = (form.landing_photo_urls || []).map((photo) => photo.trim()).filter(Boolean);
    const availableSlots = Math.max(0, 5 - currentPhotos.length);

    if (availableSlots === 0) {
      setMessage("Você já atingiu o limite de 5 fotos.");
      if (photosInputRef.current) photosInputRef.current.value = "";
      return;
    }

    setUploadingPhotos(true);
    setMessage("");
    try {
      const selectedFiles = Array.from(files).slice(0, availableSlots);
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        const publicUrl = await uploadFile(file);
        uploadedUrls.push(publicUrl);
      }

      const nextPhotos = [...currentPhotos, ...uploadedUrls].slice(0, 5);
      const padded = [...nextPhotos];
      while (padded.length < 5) padded.push("");
      setForm({ ...form, landing_photo_urls: padded });
      setMessage("Fotos enviadas com sucesso. Salve o perfil para concluir.");
    } catch (error: any) {
      setMessage(error?.message || "Erro ao enviar fotos");
    } finally {
      setUploadingPhotos(false);
      if (photosInputRef.current) photosInputRef.current.value = "";
    }
  };

  const removeLogo = () => {
    if (!form) return;
    setForm({ ...form, logo_url: "" });
  };

  const removePhoto = (index: number) => {
    if (!form) return;
    const nextPhotos = activePhotos.filter((_, photoIndex) => photoIndex !== index);
    const padded = [...nextPhotos];
    while (padded.length < 5) padded.push("");
    setForm({ ...form, landing_photo_urls: padded });
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sessão não encontrada");

      const payload = {
        ...form,
        landing_photo_urls: (form.landing_photo_urls || []).map((p) => p.trim()).filter(Boolean).slice(0, 5),
      };

      const res = await fetch("/api/store/landing-profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erro ao salvar perfil da landing");

      setMessage("Perfil salvo com sucesso.");
    } catch (error: any) {
      setMessage(error?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (!store) {
    return <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-600">Selecione uma loja.</div>;
  }

  if (loading) {
    return <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-600">Carregando perfil da landing...</div>;
  }

  if (!canEdit) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-sm text-yellow-900">
        Este módulo é exclusivo para o plano LandingPage. As lojas no plano Grátis são gerenciadas pelo Admin.
      </div>
    );
  }

  if (!form) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-sm text-red-800">Não foi possível carregar os dados.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">🌐 Perfil da Landing Page</h2>
        <p className="text-sm text-gray-600 mt-1">Edite os dados exibidos na página institucional da loja.</p>
      </div>

      {message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${message.includes("sucesso") ? "border-green-200 bg-green-50 text-green-800" : "border-yellow-300 bg-yellow-50 text-yellow-900"}`}>
          {message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome/Empresa</label>
            <input value={form.store_name || ""} onChange={(e) => setForm({ ...form, store_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
            <input value={form.specialty || ""} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
            <input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
            <input value={form.facebook_url || ""} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            <input value={form.instagram_url || ""} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horário de atendimento</label>
          <input value={form.business_hours || ""} onChange={(e) => setForm({ ...form, business_hours: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (texto curto)</label>
          <textarea value={form.landing_description || ""} onChange={(e) => setForm({ ...form, landing_description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24" maxLength={500} />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Logotipo</label>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleLogoUpload(e.currentTarget.files?.[0] || null)}
          />
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {form.logo_url ? (
                <Image src={form.logo_url} alt="Logo da loja" fill className="object-contain p-2" sizes="112px" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">Sem logo</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {uploadingLogo ? "Enviando logo..." : "Enviar logotipo"}
              </button>
              {form.logo_url && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Remover logo
                </button>
              )}
              <p className="text-xs text-gray-500">Use PNG, JPG ou WebP. O upload salva a imagem e preenche o campo automaticamente.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <label className="block text-sm font-medium text-gray-700">Até 5 fotos</label>
            <span className="text-xs text-gray-500">{activePhotos.length}/5</span>
          </div>
          <input
            ref={photosInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handlePhotosUpload(e.currentTarget.files)}
          />
          <button
            type="button"
            onClick={() => photosInputRef.current?.click()}
            disabled={uploadingPhotos || activePhotos.length >= 5}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {uploadingPhotos ? "Enviando fotos..." : "Adicionar fotos"}
          </button>

          {activePhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {activePhotos.map((photo, idx) => (
                <div key={photo + idx} className="space-y-2">
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <Image src={photo} alt={`Foto ${idx + 1}`} fill className="object-cover" sizes="(max-width: 1280px) 33vw, 20vw" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Nenhuma foto enviada ainda.
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
            {saving ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>
      </div>
    </div>
  );
}
