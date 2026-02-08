"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  user: any;
  store: any;
  onStoreUpdated?: (store: any) => void;
}

export default function ProfileEditorPanel({ user, store, onStoreUpdated }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [complement, setComplement] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasStore = Boolean(store?.id);
  
  // Estados para alteração de senha
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    setMessage(null);
    setError(null);
  }, [user?.id, store?.id]);

  useEffect(() => {
    if (user?.id) {
      (async () => {
        const { data } = await supabase
          .from("profiles")
          .select("display_name, phone, profile_image, address, number, neighborhood, city, state, zipcode, complement")
          .eq("id", user.id)
          .maybeSingle();
        if (data) {
          setDisplayName((data as any).display_name || "");
          setPhone((data as any).phone || "");
          setProfileImageUrl((data as any).profile_image || null);
          setAddress((data as any).address || "");
          setNumber((data as any).number || "");
          setNeighborhood((data as any).neighborhood || "");
          setCity((data as any).city || "");
          setState((data as any).state || "");
          setZipcode((data as any).zipcode || "");
          setComplement((data as any).complement || "");
        }
      })();
    }
  }, [user?.id]);

  useEffect(() => {
    setStoreName(store?.store_name || store?.name || "");
  }, [store?.id]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSavingProfile(true);
    setError(null);
    setMessage(null);
    try {
      const { error: updErr } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          phone,
          address,
          number,
          neighborhood,
          city,
          state,
          zipcode,
          complement
        })
        .eq("id", user.id);
      if (updErr) throw new Error(updErr.message);
      setMessage("Perfil atualizado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveStore = async () => {
    if (!store?.id) return;
    setSavingStore(true);
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, any> = { store_name: storeName };
      const { error: updErr } = await supabase
        .from("stores")
        .update(payload)
        .eq("id", store.id);
      if (updErr) throw new Error(updErr.message);
      const updated = { ...store, ...payload, name: storeName };
      onStoreUpdated?.(updated);
      setMessage("Dados da loja atualizados.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar loja");
    } finally {
      setSavingStore(false);
    }
  };

  const handleProfileImageUpload = async (file: File) => {
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ownerId", user.id);
      const res = await fetch("/api/upload-profile-image", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Falha no upload");
      }
      const imageUrl = json.data?.publicUrl || null;
      setProfileImageUrl(imageUrl);
      // Salvar no profile
      if (imageUrl) {
        await supabase.from("profiles").update({ profile_image: imageUrl }).eq("id", user.id);
      }
      setMessage("Imagem de perfil enviada com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload");
    }
  };

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((f) => ({ ...f, [name]: value }));
    setPasswordError(null);
    setPasswordMessage(null);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordMessage(null);

    // Validações
    if (!passwordForm.currentPassword) {
      setPasswordError("Senha atual é obrigatória");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("A nova senha deve ser diferente da atual");
      return;
    }

    setSavingPassword(true);

    try {
      // Primeiro, verificar se a senha atual está correta tentando fazer login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordForm.currentPassword
      });

      if (signInError) {
        setPasswordError("Senha atual incorreta");
        setSavingPassword(false);
        return;
      }

      // Se login bem-sucedido, atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) {
        setPasswordError(updateError.message);
      } else {
        setPasswordMessage("Senha alterada com sucesso!");
        // Limpar formulário
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        // Fechar seção após sucesso
        setTimeout(() => {
          setShowPasswordSection(false);
          setPasswordMessage(null);
        }, 2000);
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Editar Perfil</h2>
          <p className="text-sm text-gray-600">Atualize seus dados pessoais e informações da loja.</p>
        </div>
      </div>

      {message && <div className="p-3 rounded bg-green-50 text-green-800 text-sm border border-green-200">{message}</div>}
      {error && <div className="p-3 rounded bg-red-50 text-red-800 text-sm border border-red-200">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4 space-y-4">
          <h3 className="font-semibold text-lg">Dados pessoais</h3>
          <label className="block text-sm font-medium text-gray-700">
            Nome
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              placeholder="Seu nome"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Telefone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              placeholder="(xx) xxxxx-xxxx"
            />
          </label>
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-md">Endereço</h4>
            <label className="block text-sm font-medium text-gray-700">
              Rua/Logradouro
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
                placeholder="Rua / Logradouro"
              />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-gray-700">
                Número
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  placeholder="Número"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Bairro
                <input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  placeholder="Bairro"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Cidade
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  placeholder="Cidade"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Estado (UF)
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  placeholder="UF"
                  maxLength={2}
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                CEP
                <input
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  placeholder="CEP"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                Complemento
                <input
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  placeholder="Complemento"
                />
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            {savingProfile ? "Salvando..." : "Salvar perfil"}
          </button>

          {/* Botão Alterar Senha (Colapsável) */}
          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-500 w-full"
          >
            {showPasswordSection ? "▼ OCULTAR ALTERAR SENHA" : "▶ ALTERAR SENHA"}
          </button>

          {/* Seção de Alteração de Senha (Colapsável) */}
          {showPasswordSection && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-semibold text-md">Alterar Senha</h4>
              
              {passwordMessage && (
                <div className="p-3 rounded bg-green-50 text-green-800 text-sm border border-green-200">
                  {passwordMessage}
                </div>
              )}
              
              {passwordError && (
                <div className="p-3 rounded bg-red-50 text-red-800 text-sm border border-red-200">
                  {passwordError}
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700">
                Senha Atual
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={onPasswordChange}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  placeholder="Digite sua senha atual"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Nova Senha
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={onPasswordChange}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Confirmar Nova Senha
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={onPasswordChange}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  placeholder="Digite a nova senha novamente"
                />
              </label>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 w-full"
              >
                {savingPassword ? "Alterando..." : "Confirmar Alteração"}
              </button>
            </div>
          )}
        </div>

        <div className="border rounded p-4 space-y-4">
          <h3 className="font-semibold text-lg">Loja selecionada</h3>
          <p className="text-sm text-gray-600">Edite o nome da loja ativa.</p>
          {!hasStore && (
            <div className="p-3 rounded bg-yellow-50 text-yellow-800 text-sm border border-yellow-200">
              Selecione ou crie uma loja para editar estas informações.
            </div>
          )}
          <label className="block text-sm font-medium text-gray-700">
            Nome da loja
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              placeholder="Nome da loja"
              disabled={!hasStore}
            />
          </label>
          <div className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">Imagem de Perfil</span>
            {profileImageUrl ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profileImageUrl} alt="Perfil" className="w-16 h-16 rounded border object-cover" />
                <button
                  type="button"
                  onClick={() => setProfileImageUrl(null)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remover
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Nenhuma imagem enviada.</div>
            )}
            <label className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProfileImageUpload(file);
                }}
              />
              <span className="bg-blue-50 border border-blue-200 px-3 py-2 rounded hover:bg-blue-100">Enviar imagem</span>
            </label>
          </div>
          <button
            type="button"
            onClick={handleSaveStore}
            disabled={savingStore || !hasStore}
            className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
          >
            {savingStore ? "Salvando..." : "Salvar loja"}
          </button>
        </div>
      </div>
    </div>
  );
}
