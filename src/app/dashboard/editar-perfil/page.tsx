"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function EditarPerfilPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<{
    display_name?: string;
    phone?: string;
    address?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    complement?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // Estados para alteração de senha
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone, address, number, neighborhood, city, state, zipcode, complement")
        .eq("id", user.id)
        .maybeSingle?.();
      setForm({
        display_name: (data as any)?.display_name || "",
        phone: (data as any)?.phone || "",
        address: (data as any)?.address || "",
        number: (data as any)?.number || "",
        neighborhood: (data as any)?.neighborhood || "",
        city: (data as any)?.city || "",
        state: (data as any)?.state || "",
        zipcode: (data as any)?.zipcode || "",
        complement: (data as any)?.complement || ""
      });
      setLoaded(true);
    })();
  }, [user]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        display_name: form.display_name,
        phone: form.phone,
        address: form.address,
        number: form.number,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        zipcode: form.zipcode,
        complement: form.complement
      })
      .eq("id", user.id);
    setSaving(false);
  };

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((f) => ({ ...f, [name]: value }));
    setPasswordError(null);
    setPasswordMessage(null);
  };

  const onChangePassword = async () => {
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
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading || !loaded) {
    return <div className="p-6 text-white">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-white mb-6">Editar Perfil</h1>
        
        {/* Seção: Dados Pessoais */}
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Dados Pessoais</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input name="display_name" value={form.display_name || ""} onChange={onChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input name="phone" value={form.phone || ""} onChange={onChange} className="w-full border rounded p-2" />
          </div>

          <div className="border-t pt-4 mt-6">
            <h3 className="text-md font-semibold mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Rua/Logradouro</label>
                <input name="address" value={form.address || ""} onChange={onChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Número</label>
                <input name="number" value={form.number || ""} onChange={onChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bairro</label>
                <input name="neighborhood" value={form.neighborhood || ""} onChange={onChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cidade</label>
                <input name="city" value={form.city || ""} onChange={onChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado (UF)</label>
                <input name="state" value={form.state || ""} onChange={onChange} maxLength={2} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CEP</label>
                <input name="zipcode" value={form.zipcode || ""} onChange={onChange} className="w-full border rounded p-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Complemento</label>
                <input name="complement" value={form.complement || ""} onChange={onChange} className="w-full border rounded p-2" />
              </div>
            </div>
          </div>
          <button onClick={onSave} disabled={saving} className="bg-[#FDC500] text-black px-4 py-2 rounded font-semibold hover:bg-[#E8B500]">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>

        {/* Seção: Alterar Senha */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Alterar Senha</h2>
          
          {passwordMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
              {passwordMessage}
            </div>
          )}
          
          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {passwordError}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Senha Atual</label>
            <input 
              type="password" 
              name="currentPassword" 
              value={passwordForm.currentPassword} 
              onChange={onPasswordChange} 
              className="w-full border rounded p-2"
              placeholder="Digite sua senha atual"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nova Senha</label>
            <input 
              type="password" 
              name="newPassword" 
              value={passwordForm.newPassword} 
              onChange={onPasswordChange} 
              className="w-full border rounded p-2"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Confirmar Nova Senha</label>
            <input 
              type="password" 
              name="confirmPassword" 
              value={passwordForm.confirmPassword} 
              onChange={onPasswordChange} 
              className="w-full border rounded p-2"
              placeholder="Digite a nova senha novamente"
            />
          </div>
          
          <button 
            onClick={onChangePassword} 
            disabled={savingPassword} 
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {savingPassword ? "Alterando..." : "Alterar Senha"}
          </button>
        </div>
      </div>
    </div>
  );
}
