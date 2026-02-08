"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function AdminEditarPerfilPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<{ display_name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
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
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone")
        .eq("id", user.id)
        .maybeSingle();
      setForm({ 
        display_name: (data as any)?.display_name || "", 
        phone: (data as any)?.phone || "" 
      });
      setLoaded(true);
    })();
  }, [user]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setMessage(null);
  };

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await supabase
        .from("profiles")
        .update({ display_name: form.display_name, phone: form.phone })
        .eq("id", user.id);
      setMessage("Perfil atualizado com sucesso!");
    } catch (err) {
      setMessage("Erro ao salvar perfil");
    } finally {
      setSaving(false);
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
      // Verificar senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordForm.currentPassword
      });

      if (signInError) {
        setPasswordError("Senha atual incorreta");
        setSavingPassword(false);
        return;
      }

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) {
        setPasswordError(updateError.message);
      } else {
        setPasswordMessage("Senha alterada com sucesso!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
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

  if (!loaded) {
    return <div className="p-6 text-white">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Editar Perfil</h1>
        <p className="text-gray-300 text-sm">Atualize seus dados pessoais e altere sua senha.</p>
      </div>

      {/* Dados Pessoais */}
      <div className="bg-white/10 border border-white/20 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Dados Pessoais</h2>
        
        {message && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 text-green-200 rounded">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input 
              name="display_name" 
              value={form.display_name || ""} 
              onChange={onChange} 
              className="w-full border border-white/20 bg-white/5 rounded p-2 text-white placeholder-gray-400"
              placeholder="Seu nome completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input 
              name="phone" 
              value={form.phone || ""} 
              onChange={onChange} 
              className="w-full border border-white/20 bg-white/5 rounded p-2 text-white placeholder-gray-400"
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>
          <button 
            onClick={onSave} 
            disabled={saving} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Perfil"}
          </button>
        </div>
      </div>

      {/* Alterar Senha */}
      <div className="bg-white/10 border border-white/20 rounded-lg p-6">
        <button
          type="button"
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold mb-4"
        >
          {showPasswordSection ? "▼ OCULTAR ALTERAR SENHA" : "▶ ALTERAR SENHA"}
        </button>

        {showPasswordSection && (
          <div className="space-y-4">
            <h3 className="font-semibold text-md">Alterar Senha</h3>
            
            {passwordMessage && (
              <div className="p-3 bg-green-500/20 border border-green-500/50 text-green-200 rounded">
                {passwordMessage}
              </div>
            )}
            
            {passwordError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded">
                {passwordError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Senha Atual</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={onPasswordChange}
                className="w-full border border-white/20 bg-white/5 rounded p-2 text-white placeholder-gray-400"
                placeholder="Digite sua senha atual"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nova Senha</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={onPasswordChange}
                className="w-full border border-white/20 bg-white/5 rounded p-2 text-white placeholder-gray-400"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={onPasswordChange}
                className="w-full border border-white/20 bg-white/5 rounded p-2 text-white placeholder-gray-400"
                placeholder="Digite a nova senha novamente"
              />
            </div>

            <button
              type="button"
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
            >
              {savingPassword ? "Alterando..." : "Confirmar Alteração"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
