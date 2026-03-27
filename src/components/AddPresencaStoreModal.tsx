"use client";

import { useRef, useState } from "react";
import { PORTAL_THEMES, ThemeColor } from "@/lib/themes";

const PRESET_CATEGORIES = [
  "Restaurante", "Lanchonete", "Pizzaria", "Padaria", "Doceria",
  "Mercado", "Moda", "Beleza", "Saúde", "Serviços", "Eletrônicos", "Casa e Decoração",
];

type UploadStep = "saving" | "uploading" | null;

type Props = {
  isOpen: boolean;
  onCloseAction: () => void;
  onSuccessAction?: (newStore: any) => void;
  adminUserId: string;
};

const EMPTY_FORM = {
  store_name: "",
  slug: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  description: "",
  category: "",
  facebook_url: "",
  instagram_url: "",
  theme_color: "azul" as ThemeColor,
};

export default function AddPresencaStoreModal({ isOpen, onCloseAction, onSuccessAction, adminUserId }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>(null);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM });
    setLogoFile(null);
    setLogoPreview(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setError("");
    setUploadStep(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const normalizeStoreSlug = (value: string) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "slug" ? normalizeStoreSlug(value) : value,
    }));
  };

  const handleFileSelect = (type: "logo" | "photo", file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (type === "logo") { setLogoPreview(result); setLogoFile(file); }
      else { setPhotoPreview(result); setPhotoFile(file); }
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File, storeId: string): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("ownerId", storeId);
    const res = await fetch("/api/upload-product-image", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Erro no upload de imagem");
    return data?.data?.publicUrl || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.store_name.trim()) { setError("Nome da loja é obrigatório"); return; }
    setError("");
    setLoading(true);
    setUploadStep("saving");
    try {
      const res = await fetch(`/api/admin/lojas?userId=${encodeURIComponent(adminUserId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Erro ao criar loja");
      const storeId = payload.store?.id;
      if (!storeId) throw new Error("ID da loja não retornado");

      if (logoFile || photoFile) {
        setUploadStep("uploading");
        let logoUrl: string | null = null;
        let photoUrl: string | null = null;
        if (logoFile) logoUrl = await uploadImage(logoFile, storeId);
        if (photoFile) photoUrl = await uploadImage(photoFile, storeId);

        const patchBody: any = { storeId };
        if (logoUrl) patchBody.logo_url = logoUrl;
        if (photoUrl) patchBody.landing_photo_urls = [photoUrl];

        const patchRes = await fetch(`/api/admin/lojas?userId=${encodeURIComponent(adminUserId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchBody),
        });
        const patchPayload = await patchRes.json();
        if (!patchRes.ok) throw new Error(patchPayload?.error || "Erro ao salvar imagens");
      }

      resetForm();
      if (onSuccessAction) onSuccessAction(payload.store);
      onCloseAction();
    } catch (e: any) {
      setError(e?.message || "Erro ao criar loja");
    } finally {
      setLoading(false);
      setUploadStep(null);
    }
  };

  if (!isOpen) return null;

  const themes = Object.values(PORTAL_THEMES);
  const loadingLabel =
    uploadStep === "uploading" ? "Enviando imagens..." :
    uploadStep === "saving" ? "Criando loja..." : "Aguarde...";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Adicionar Loja Presença</h2>
          <p className="text-sm text-gray-500 mt-0.5">Plano gratuito · administrado pelo portal</p>
        </div>

        <form id="add-presenca-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dados Básicos</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja *</label>
                <input type="text" name="store_name" value={formData.store_name} onChange={handleChange}
                  placeholder="ex: Loja Centro" disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereco da loja (URL)</label>
                <input type="text" name="slug" value={formData.slug || ""} onChange={handleChange}
                  placeholder="ex: restaurante-x1" disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <p className="mt-1 text-xs text-gray-500">URL: https://www.portalmodelo.tech/lojas/{formData.slug || "lojademo"}. Use apenas letras minúsculas, números e hífens.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select name="category" value={formData.category} onChange={handleChange} disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Selecione uma categoria</option>
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea name="description" value={formData.description} onChange={handleChange}
                  placeholder="Breve descrição da loja" rows={2} disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contato</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="(11) 98765-4321" disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="contato@loja.com" disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange}
                  placeholder="Rua das Flores, 123" disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange}
                    placeholder="São Paulo" disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange}
                    placeholder="SP" maxLength={2} disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input type="url" name="facebook_url" value={formData.facebook_url} onChange={handleChange}
                    placeholder="https://facebook.com/loja" disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input type="url" name="instagram_url" value={formData.instagram_url} onChange={handleChange}
                    placeholder="https://instagram.com/loja" disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Imagens</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                <button type="button" onClick={() => !loading && logoInputRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 transition overflow-hidden bg-gray-50">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-center text-gray-400"><div className="text-2xl">LOGO</div><div className="text-xs mt-1">Clique para selecionar</div></div>
                  )}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect("logo", f); }} />
                {logoPreview && (
                  <button type="button" disabled={loading}
                    onClick={() => { setLogoPreview(null); setLogoFile(null); if (logoInputRef.current) logoInputRef.current.value = ""; }}
                    className="mt-1 text-xs text-red-500 hover:text-red-700">Remover</button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto Principal</label>
                <button type="button" onClick={() => !loading && photoInputRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 transition overflow-hidden bg-gray-50">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="Foto preview" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-center text-gray-400"><div className="text-2xl">FOTO</div><div className="text-xs mt-1">Clique para selecionar</div></div>
                  )}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect("photo", f); }} />
                {photoPreview && (
                  <button type="button" disabled={loading}
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null); if (photoInputRef.current) photoInputRef.current.value = ""; }}
                    className="mt-1 text-xs text-red-500 hover:text-red-700">Remover</button>
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Aparência</h3>
            <div className="grid grid-cols-4 gap-2">
              {themes.map((theme) => (
                <button key={theme.id} type="button" disabled={loading}
                  onClick={() => setFormData((prev) => ({ ...prev, theme_color: theme.id }))}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition text-center disabled:opacity-50 ${
                    formData.theme_color === theme.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}>
                  <div className="w-8 h-8 rounded-full shadow-sm ring-1 ring-gray-200" style={{ backgroundColor: theme.preview }} />
                  <span className="text-[10px] font-medium text-gray-700 leading-tight">{theme.name}</span>
                </button>
              ))}
            </div>
          </section>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-2 flex-shrink-0">
          <button type="button" onClick={() => { resetForm(); onCloseAction(); }} disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium">
            Cancelar
          </button>
          <button type="submit" form="add-presenca-form" disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
            {loading ? loadingLabel : "Criar Loja"}
          </button>
        </div>
      </div>
    </div>
  );
}