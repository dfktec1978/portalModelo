"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ordersDashboardTokens as ui } from "@/components/ordersDashboardTokens";

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
  state: string;
};

const EMPTY_PHOTOS = ["", "", "", "", ""];
const PRESET_CATEGORIES = [
  "Restaurante",
  "Lanchonete",
  "Pizzaria",
  "Padaria",
  "Doceria",
  "Mercado",
  "Moda",
  "Beleza",
  "Saúde",
  "Serviços",
  "Eletrônicos",
  "Casa e Decoração",
];

export default function StoreLandingProfileSettings({ store, adminMode = false }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [form, setForm] = useState<LandingProfile | null>(null);
  const [useCustomCategory, setUseCustomCategory] = useState(false);
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
            state: profile.state || '',
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

  const profileCompletion = useMemo(() => {
    if (!form) return 0;
    const checks = [
      !!form.store_name?.trim(),
      !!form.category?.trim(),
      !!form.address?.trim(),
      !!form.city?.trim(),
      !!form.state?.trim(),
      !!form.phone?.trim(),
      !!form.email?.trim(),
      !!form.business_hours?.trim(),
      !!form.landing_description?.trim(),
      !!form.logo_url?.trim(),
      activePhotos.length > 0,
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }, [form, activePhotos.length]);

  const isRequiredFilled = (value?: string | null) => Boolean(String(value || "").trim());
  const isMissingField = (key: string) => missingFields.includes(key);
  const clearMissingField = (key: string) => setMissingFields((prev) => prev.filter((item) => item !== key));
  const inputClass = (key: string) => `w-full px-3 py-2 border rounded-lg ${isMissingField(key) ? "border-red-400 bg-red-50" : "border-gray-300"}`;
  const textareaClass = (key: string) => `w-full px-3 py-2 border rounded-lg h-24 ${isMissingField(key) ? "border-red-400 bg-red-50" : "border-gray-300"}`;
  const fieldLabel = (label: string, isRequired: boolean, filled?: boolean) => (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      {isRequired && (
        <>
          <span className="text-red-500">*</span>
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
              filled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
            title={filled ? "Campo obrigatório preenchido" : "Campo obrigatório pendente"}
          >
            {filled ? "✓" : "!"}
          </span>
        </>
      )}
    </span>
  );

  useEffect(() => {
    if (!form) return;
    const currentCategory = String(form.category || "").trim();
    if (!currentCategory) {
      setUseCustomCategory(false);
      return;
    }
    setUseCustomCategory(!PRESET_CATEGORIES.includes(currentCategory));
  }, [form?.category]);

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
      clearMissingField("logo_url");
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
      clearMissingField("landing_photo_urls");
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

  const focusFieldBySelector = (selector: string) => {
    const target = document.querySelector(selector) as HTMLElement | null;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof (target as HTMLInputElement).focus === "function") {
      (target as HTMLInputElement).focus();
    }
  };

  const save = async () => {
    if (!form) return;

    const requiredFields = [
      { key: "store_name", label: "Nome/Empresa", selector: "#landing-store-name", valid: isRequiredFilled(form.store_name) },
      { key: "category", label: "Categoria", selector: useCustomCategory ? "#landing-category-custom" : "#landing-category-select", valid: isRequiredFilled(form.category) },
      { key: "address", label: "Endereço", selector: "#landing-address", valid: isRequiredFilled(form.address) },
      { key: "city", label: "Cidade", selector: "#landing-city", valid: isRequiredFilled(form.city) },
      { key: "state", label: "Estado", selector: "#landing-state", valid: isRequiredFilled(form.state) },
      { key: "phone", label: "Telefone / WhatsApp", selector: "#landing-phone", valid: isRequiredFilled(form.phone) },
      { key: "email", label: "E-mail", selector: "#landing-email", valid: isRequiredFilled(form.email) },
      { key: "business_hours", label: "Horário de atendimento", selector: "#landing-business-hours", valid: isRequiredFilled(form.business_hours) },
      { key: "landing_description", label: "Descrição", selector: "#landing-description", valid: isRequiredFilled(form.landing_description) },
      { key: "logo_url", label: "Logotipo", selector: "#landing-logo-upload-btn", valid: isRequiredFilled(form.logo_url) },
      { key: "landing_photo_urls", label: "Fotos", selector: "#landing-photos-upload-btn", valid: activePhotos.length > 0 },
    ];

    const missing = requiredFields.filter((field) => !field.valid);
    if (missing.length > 0) {
      setMissingFields(missing.map((field) => field.key));
      setMessage(`Preencha os campos obrigatórios: ${missing.map((field) => field.label).join(", ")}.`);
      focusFieldBySelector(missing[0].selector);
      return;
    }

    setMissingFields([]);

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
    return <div className={`${ui.panel} p-6 text-sm text-gray-600`}>Selecione uma loja.</div>;
  }

  if (loading) {
    return <div className={`${ui.panel} p-6 text-sm text-gray-600`}>Carregando perfil da landing...</div>;
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
    <div className={ui.stack}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">🌐 Perfil da Landing Page</h2>
          <p className="text-sm text-gray-600 mt-1">Organize as informações da sua loja para uma apresentação mais clara e profissional.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar perfil"}
        </button>
      </div>

      {message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${message.includes("sucesso") ? "border-green-200 bg-green-50 text-green-800" : "border-yellow-300 bg-yellow-50 text-yellow-900"}`}>
          {message}
        </div>
      )}

      <div className={`${ui.panel} p-6 space-y-6`}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Plano atual</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{String(form.plan || 'landingpage').toUpperCase()}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Fotos enviadas</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{activePhotos.length} de 5</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Perfil preenchido</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{profileCompletion}%</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Identidade e contato</h3>
            <p className="text-xs text-gray-500 mt-1">Informações principais que aparecem no topo da sua landing.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel("Nome/Empresa", true, isRequiredFilled(form.store_name))}</label>
              <input id="landing-store-name" value={form.store_name || ""} onChange={(e) => { setForm({ ...form, store_name: e.target.value }); clearMissingField("store_name"); }} className={inputClass("store_name")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel("Categoria", true, isRequiredFilled(form.category))}</label>
              <select
                id="landing-category-select"
                value={PRESET_CATEGORIES.includes(form.category || "") ? form.category : useCustomCategory ? "__custom__" : ""}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === "__custom__") {
                    setUseCustomCategory(true);
                    if (PRESET_CATEGORIES.includes(form.category || "")) {
                      setForm({ ...form, category: "" });
                    }
                    return;
                  }

                  setUseCustomCategory(false);
                  setForm({ ...form, category: next });
                  clearMissingField("category");
                }}
                className={`${inputClass("category")} bg-white`}
              >
                <option value="">Selecione uma categoria</option>
                {PRESET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
                <option value="__custom__">+ Adicionar nova categoria</option>
              </select>

              {useCustomCategory && (
                <div className="space-y-2">
                  <input
                    id="landing-category-custom"
                    value={form.category || ""}
                    onChange={(e) => { setForm({ ...form, category: e.target.value }); clearMissingField("category"); }}
                    className={inputClass("category")}
                    placeholder="Digite a categoria desejada"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomCategory(false);
                      setForm({ ...form, category: "" });
                    }}
                    className="text-xs text-blue-700 hover:text-blue-800"
                  >
                    Voltar para categorias principais
                  </button>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">Escolha uma categoria principal ou adicione uma nova personalizada.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel("Especialidade", false, isRequiredFilled(form.specialty))}</label>
              <input id="landing-specialty" value={form.specialty || ""} onChange={(e) => { setForm({ ...form, specialty: e.target.value }); clearMissingField("specialty"); }} className={inputClass("specialty")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel("Endereço", true, isRequiredFilled(form.address))}</label>
              <input
                id="landing-address"
                value={form.address || ""}
                onChange={(e) => { setForm({ ...form, address: e.target.value }); clearMissingField("address"); }}
                className={inputClass("address")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel("Cidade", true, isRequiredFilled(form.city))}</label>
              <input id="landing-city" value={form.city || ""} onChange={(e) => { setForm({ ...form, city: e.target.value }); clearMissingField("city"); }} className={inputClass("city")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel("Estado", true, isRequiredFilled(form.state))}</label>
              <input id="landing-state" value={form.state || ""} onChange={(e) => { setForm({ ...form, state: e.target.value }); clearMissingField("state"); }} className={inputClass("state")} maxLength={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel("Telefone / WhatsApp", true, isRequiredFilled(form.phone))}</label>
              <input id="landing-phone" value={form.phone || ""} onChange={(e) => { setForm({ ...form, phone: e.target.value }); clearMissingField("phone"); }} className={inputClass("phone")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel("E-mail", true, isRequiredFilled(form.email))}</label>
              <input id="landing-email" value={form.email || ""} onChange={(e) => { setForm({ ...form, email: e.target.value }); clearMissingField("email"); }} className={inputClass("email")} />
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
        </div>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Apresentação da loja</h3>
            <p className="text-xs text-gray-500 mt-1">Texto e horário que ajudam o cliente a entender seu negócio rapidamente.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel("Horário de atendimento", true, isRequiredFilled(form.business_hours))}</label>
            <input id="landing-business-hours" value={form.business_hours || ""} onChange={(e) => { setForm({ ...form, business_hours: e.target.value }); clearMissingField("business_hours"); }} className={inputClass("business_hours")} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel("Descrição (texto curto)", true, isRequiredFilled(form.landing_description))}</label>
            <textarea id="landing-description" value={form.landing_description || ""} onChange={(e) => { setForm({ ...form, landing_description: e.target.value }); clearMissingField("landing_description"); }} className={textareaClass("landing_description")} maxLength={500} />
            <p className="mt-1 text-xs text-gray-500">{(form.landing_description || "").length}/500 caracteres</p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Mídia visual</h3>
            <p className="text-xs text-gray-500 mt-1">Imagens de qualidade aumentam confiança e conversão na landing.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{fieldLabel("Logotipo", true, isRequiredFilled(form.logo_url))}</label>
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
                  id="landing-logo-upload-btn"
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 ${isMissingField("logo_url") ? "bg-red-500" : "bg-blue-600"}`}
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
              <label className="block text-sm font-medium text-gray-700">{fieldLabel("Até 5 fotos", true, activePhotos.length > 0)}</label>
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
              id="landing-photos-upload-btn"
              type="button"
              onClick={() => photosInputRef.current?.click()}
              disabled={uploadingPhotos || activePhotos.length >= 5}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 ${isMissingField("landing_photo_urls") ? "bg-red-500" : "bg-blue-600"}`}
            >
              {uploadingPhotos ? "Enviando fotos..." : "Adicionar fotos"}
            </button>

            {activePhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                {activePhotos.map((photo, idx) => (
                  <div key={photo + idx} className="space-y-2">
                    <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <Image src={photo} alt={`Foto ${idx + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw" />
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
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
            {saving ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>
      </div>
    </div>
  );
}
