"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ImageUploadNews from "@/components/ImageUploadNews";
import { uploadClassifiedImage, deleteClassifiedImage } from "@/lib/classifiedQueries";

type Profile = {
  id: string;
  email?: string;
  display_name?: string;
  phone?: string;
  role?: string;
  status?: string;
  profile_image?: string;
  instagram?: string;
  facebook?: string;
};

export default function EditarPerfilPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    display_name: "",
    phone: "",
    profile_image: "",
    instagram: "",
    facebook: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  async function loadProfile() {
    try {
      setLoading(true);
      // Query básica primeiro para verificar se o perfil existe
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, phone, role, status")
        .eq("id", user?.id)
        .single();

      if (error) {
        console.error("Erro ao carregar perfil:", error);
        if (error.code === 'PGRST116') {
          // Perfil não encontrado, criar um novo
          setError("Perfil não encontrado. Criando perfil...");
          await createProfile();
        } else {
          setError("Erro ao carregar perfil: " + error.message);
        }
        return;
      }

      setProfile(data);
      setFormData({
        display_name: data.display_name || "",
        phone: data.phone || "",
        profile_image: "", // Será carregado separadamente se a coluna existir
        instagram: "", // Será carregado separadamente se a coluna existir
        facebook: "", // Será carregado separadamente se a coluna existir
      });

      // Tentar carregar os campos adicionais (se existirem)
      try {
        const { data: extendedData, error: extendedError } = await supabase
          .from("profiles")
          .select("profile_image, instagram, facebook")
          .eq("id", user?.id)
          .single();

        if (!extendedError && extendedData) {
          setFormData(prev => ({
            ...prev,
            profile_image: extendedData.profile_image || "",
            instagram: extendedData.instagram || "",
            facebook: extendedData.facebook || "",
          }));

          if (extendedData.profile_image) {
            setProfileImages([extendedData.profile_image]);
          }
        }
      } catch (extendedErr) {
        // Campos adicionais podem não existir ainda, isso é normal
        console.log("Campos adicionais não disponíveis ainda:", extendedErr.message);
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      setError("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  }

  async function createProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: user?.id,
          email: user?.email,
          display_name: user?.email?.split('@')[0] || 'Usuário',
          role: 'cliente',
          status: 'active'
        })
        .select("id, email, display_name, phone, role, status")
        .single();

      if (error) {
        console.error("Erro ao criar perfil:", error);
        setError("Erro ao criar perfil: " + error.message);
        return;
      }

      setProfile(data);
      setFormData({
        display_name: data.display_name || "",
        phone: data.phone || "",
        profile_image: "",
        instagram: "",
        facebook: "",
      });
      setProfileImages([]);
      setError(null);
    } catch (err) {
      console.error("Erro ao criar perfil:", err);
      setError("Erro ao criar perfil");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validação
    if (!formData.display_name.trim()) {
      setError("Nome de exibição é obrigatório");
      return;
    }

    if (formData.display_name.trim().length < 2) {
      setError("Nome de exibição deve ter pelo menos 2 caracteres");
      return;
    }

    if (formData.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
      setError("Telefone deve estar no formato (XX) XXXXX-XXXX");
      return;
    }

    // Validação do Instagram (opcional)
    if (formData.instagram && !/^[a-zA-Z0-9._]{1,30}$/.test(formData.instagram)) {
      setError("Instagram deve conter apenas letras, números, pontos e underscores (máx. 30 caracteres)");
      return;
    }

    // Validação do Facebook (opcional) - pode ser URL ou nome de usuário
    if (formData.facebook && !/^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9.]+\/?$|^[a-zA-Z0-9.]+$/.test(formData.facebook)) {
      setError("Facebook deve ser uma URL válida do Facebook ou um nome de usuário");
      return;
    }

    try {
      setSaving(true);

      // Primeiro, tentar atualizar apenas os campos básicos que sempre existem
      const baseUpdate = {
        display_name: formData.display_name.trim(),
        phone: formData.phone.trim() || null,
      };

      let { error } = await supabase
        .from("profiles")
        .update(baseUpdate)
        .eq("id", user?.id);

      if (error) {
        setError(error.message);
        return;
      }

      // Tentar atualizar os campos adicionais (se existirem)
      try {
        const extendedUpdate = {
          profile_image: profileImages[0] || null,
          instagram: formData.instagram.trim() || null,
          facebook: formData.facebook.trim() || null,
        };

        const { error: extendedError } = await supabase
          .from("profiles")
          .update(extendedUpdate)
          .eq("id", user?.id);

        if (extendedError) {
          console.warn("Campos adicionais não puderam ser atualizados:", extendedError.message);
          // Não falhar a operação por causa dos campos adicionais
        }
      } catch (extendedErr) {
        console.warn("Campos adicionais não disponíveis para atualização:", extendedErr.message);
        // Continuar normalmente
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function formatPhone(value: string) {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, "");

    // Aplica a máscara (XX) XXXXX-XXXX
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003049]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Você precisa estar logado
          </h1>
          <p className="text-gray-600 mb-6">
            Redirecionando para a página de login...
          </p>
          <Link href="/login" className="text-[#003049] hover:underline">
            Ir para login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-[#003049] hover:underline mb-4 inline-block">
            ← Voltar ao dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Editar Perfil</h1>
          <p className="text-gray-600 mt-2">Atualize suas informações pessoais</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              Perfil atualizado com sucesso! Redirecionando...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name */}
            <div>
              <label htmlFor="display_name" className="form-label">
                Nome de Exibição *
              </label>
              <input
                id="display_name"
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="Seu nome completo"
                maxLength={100}
                className="form-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.display_name.length}/100 caracteres
              </p>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={profile?.email || user.email}
                disabled
                className="form-input bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                O email não pode ser alterado
              </p>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="form-label">
                Telefone
              </label>
              <input
                id="phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                maxLength={15}
                className="form-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formato: (XX) XXXXX-XXXX
              </p>
            </div>

            {/* Profile Image */}
            <div>
              <label className="form-label">
                Foto de Perfil
              </label>
              <ImageUploadNews
                images={profileImages}
                heroImageIndex={0}
                onImagesChange={setProfileImages}
                onHeroImageChange={() => {}}
                disabled={saving}
                maxImages={1}
                uploadFn={async (file: File) => {
                  const res = await uploadClassifiedImage((user && user.id) || 'anon', file);
                  return { success: !!res.publicUrl, url: res.publicUrl, error: res.error?.message || (res.error ? String(res.error) : undefined) };
                }}
                deleteFn={async (url: string) => {
                  return await deleteClassifiedImage(url);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Faça upload da sua foto de perfil (opcional)
              </p>
            </div>

            {/* Instagram */}
            <div>
              <label htmlFor="instagram" className="form-label">
                Instagram
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg">
                  @
                </span>
                <input
                  id="instagram"
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="seu.usuario"
                  maxLength={30}
                  className="form-input rounded-l-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Seu nome de usuário do Instagram (opcional)
              </p>
            </div>

            {/* Facebook */}
            <div>
              <label htmlFor="facebook" className="form-label">
                Facebook
              </label>
              <input
                id="facebook"
                type="text"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/seu.perfil ou seu.perfil"
                className="form-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL do seu perfil ou nome de usuário do Facebook (opcional)
              </p>
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="form-label">
                Tipo de Conta
              </label>
              <input
                type="text"
                value={
                  profile?.role === "cliente"
                    ? "Cliente"
                    : profile?.role === "lojista"
                    ? "Lojista"
                    : profile?.role === "profissional"
                    ? "Profissional"
                    : "Admin"
                }
                disabled
                className="form-input bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Entre em contato com o suporte para alterar o tipo de conta
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-[#003049] hover:bg-[#002539] disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}