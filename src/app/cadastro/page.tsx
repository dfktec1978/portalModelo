"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function CadastroPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [userType, setUserType] = useState<"cliente" | "lojista">("cliente");

  // Campos comuns
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Campos específicos
  const [displayName, setDisplayName] = useState(""); // Para cliente
  const [storeName, setStoreName] = useState(""); // Para lojista
  const [ownerName, setOwnerName] = useState(""); // Para lojista

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validações
    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (!acceptedTerms) {
      setError("Você deve aceitar os Termos de Uso");
      return;
    }

    // Validações específicas
    if (userType === "cliente") {
      if (!displayName.trim()) {
        setError("Nome completo é obrigatório");
        return;
      }
    } else {
      if (!storeName.trim()) {
        setError("Nome da loja é obrigatório");
        return;
      }
      if (!ownerName.trim()) {
        setError("Nome do responsável é obrigatório");
        return;
      }
    }

    // Verificar se o e-mail já está cadastrado
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("email", email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Erro ao verificar e-mail:", checkError);
        setError("Erro ao verificar disponibilidade do e-mail");
        return;
      }

      if (existingUser) {
        setError(`Este e-mail já está cadastrado como ${existingUser.role === 'cliente' ? 'Cliente' : 'Lojista'}. Use outro e-mail ou faça login.`);
        return;
      }
    } catch (err) {
      console.error("Erro na verificação de e-mail:", err);
      setError("Erro ao verificar disponibilidade do e-mail");
      return;
    }

    // Mostrar modal de confirmação
    setShowConfirmModal(true);
  }

  async function processRegistration() {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      // Sign up com Supabase Auth
      const { error: signUpError } = await signUp(email, password, {
        display_name: userType === "cliente" ? displayName : ownerName,
        phone,
      });

      if (signUpError) {
        setError(signUpError.message || "Erro ao criar conta");
        return;
      }

      // Criar perfil na tabela profiles
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        const profileData: any = {
          id: authData.user.id,
          email,
          display_name: userType === "cliente" ? displayName : ownerName,
          phone,
          role: userType,
          status: userType === "cliente" ? "active" : "pending",
          accepted_terms: true,
          terms_version: "v1.0",
          accepted_at: new Date().toISOString(),
        };

        if (userType === "lojista") {
          profileData.metadata = { store_name: storeName };
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(profileData, { onConflict: 'id' });

        if (profileError) {
          console.error("Erro ao criar perfil:", profileError);
          setError("Conta criada, mas houve erro no perfil. Contate o suporte.");
          return;
        }

        // Para lojista, criar entrada na tabela stores
        if (userType === "lojista") {
          const { error: storeError } = await supabase
            .from("stores")
            .insert({
              owner_id: authData.user.id,
              store_name: storeName,
              phone,
              status: "pending",
            });

          if (storeError) {
            console.error("Erro ao criar loja:", storeError);
            // Não bloquear, pois perfil foi criado
          }
        }
      }

      setSuccess(true);

      // Limpar campos
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setDisplayName("");
      setStoreName("");
      setOwnerName("");
      setAcceptedTerms(false);

      // Redirecionar
      setTimeout(() => {
        if (userType === "cliente") {
          router.push("/dashboard");
        } else {
          router.push("/login?message=Cadastro enviado para aprovação. Você será notificado por email quando aprovado.");
        }
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#003049] to-[#162f7a] text-white p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Image
              src="/img/logos/logo.png"
              alt="Portal Modelo"
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold">Portal Modelo</h1>
            <p className="text-gray-300 mt-2">Crie sua conta e comece agora</p>
          </div>

          {/* Form */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-8">
            {/* Seleção de Tipo - Cards Visuais */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-4">Tipo de Conta</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card Cliente */}
                <div
                  onClick={() => setUserType("cliente")}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                    userType === "cliente"
                      ? "border-[#FDC500] bg-[#FDC500]/10 shadow-lg"
                      : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      name="userType"
                      value="cliente"
                      checked={userType === "cliente"}
                      onChange={() => setUserType("cliente")}
                      className="mr-3 w-4 h-4 text-[#FDC500] focus:ring-[#FDC500]"
                    />
                    <span className="text-2xl mr-2">👤</span>
                    <span className="font-semibold text-lg">Cliente</span>
                  </div>
                  <p className="text-sm text-gray-300 ml-9">
                    Acesso imediato para compras e navegação no portal
                  </p>
                  <div className="mt-2 ml-9">
                    <span className="inline-block bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">
                      ✅ Ativo imediatamente
                    </span>
                  </div>
                </div>

                {/* Card Lojista */}
                <div
                  onClick={() => setUserType("lojista")}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                    userType === "lojista"
                      ? "border-[#D62828] bg-[#D62828]/10 shadow-lg"
                      : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      name="userType"
                      value="lojista"
                      checked={userType === "lojista"}
                      onChange={() => setUserType("lojista")}
                      className="mr-3 w-4 h-4 text-[#D62828] focus:ring-[#D62828]"
                    />
                    <span className="text-2xl mr-2">🏪</span>
                    <span className="font-semibold text-lg">Lojista</span>
                  </div>
                  <p className="text-sm text-gray-300 ml-9">
                    Cadastro de loja para vender produtos no portal
                  </p>
                  <div className="mt-2 ml-9">
                    <span className="inline-block bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">
                      ⏳ Aguarda aprovação
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded">
                  ✅ Conta criada com sucesso! {userType === "lojista" ? "Aguardando aprovação." : "Redirecionando..."}
                </div>
              )}

              {/* Campos específicos */}
              {userType === "cliente" ? (
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium mb-1">
                    Nome Completo
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-white/50"
                    required
                    disabled={loading}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="storeName" className="block text-sm font-medium mb-1">
                      Nome da Loja
                    </label>
                    <input
                      id="storeName"
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Nome da sua loja"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-white/50"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="ownerName" className="block text-sm font-medium mb-1">
                      Nome do Responsável
                    </label>
                    <input
                      id="ownerName"
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-white/50"
                      required
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-white/50"
                  required
                  disabled={loading}
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-white/50"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-white/50"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Confirmar Senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-white/50"
                  required
                  disabled={loading}
                />
              </div>

              {/* Termos de Uso */}
              <div className="flex items-start space-x-2">
                <input
                  id="acceptedTerms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1"
                  required
                />
                <label htmlFor="acceptedTerms" className="text-sm">
                  Li e aceito os{" "}
                  <Link
                    href={userType === "cliente" ? "/termos-cliente" : "/termos-lojista"}
                    target="_blank"
                    className="text-[#FDC500] hover:underline"
                  >
                    Termos de Uso
                  </Link>{" "}
                  e a Política de Privacidade
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D62828] hover:bg-[#C41E1E] disabled:bg-gray-500 text-white font-semibold py-2 rounded transition mt-6"
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-gray-300 mt-6">
              Já tem conta?{" "}
              <Link href="/login" className="text-[#FDC500] hover:underline font-semibold">
                Faça login
              </Link>
            </p>
          </div>

          {/* Help */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-gray-400 hover:text-white text-sm">
              ← Voltar ao início
            </Link>
          </div>
        </div>
      </div>

      {/* Right image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/img/background/modelo05.jpg"
          alt="Modelo"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Modal de Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Confirmar Cadastro
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {userType === "cliente" ? "👤" : "🏪"}
                  </span>
                  <span className="font-semibold text-gray-900">
                    Tipo: {userType === "cliente" ? "Cliente" : "Lojista"}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Email:</strong> {email}</p>
                  <p><strong>Telefone:</strong> {phone}</p>

                  {userType === "cliente" ? (
                    <p><strong>Nome:</strong> {displayName}</p>
                  ) : (
                    <>
                      <p><strong>Loja:</strong> {storeName}</p>
                      <p><strong>Responsável:</strong> {ownerName}</p>
                    </>
                  )}
                </div>

                <div className={`p-3 rounded-lg ${
                  userType === "cliente"
                    ? "bg-green-50 border border-green-200"
                    : "bg-yellow-50 border border-yellow-200"
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className={userType === "cliente" ? "text-green-600" : "text-yellow-600"}>
                      {userType === "cliente" ? "✅" : "⏳"}
                    </span>
                    <div className="text-sm">
                      <p className={`font-semibold ${userType === "cliente" ? "text-green-800" : "text-yellow-800"}`}>
                        {userType === "cliente" ? "Conta ativa imediatamente" : "Conta aguardando aprovação"}
                      </p>
                      <p className="text-gray-600">
                        {userType === "cliente"
                          ? "Você poderá fazer login e acessar o portal imediatamente."
                          : "Sua conta será revisada por nossa equipe. Você será notificado por email quando aprovado."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  Voltar
                </button>
                <button
                  onClick={processRegistration}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition ${
                    userType === "cliente"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-[#D62828] hover:bg-[#C41E1E]"
                  } disabled:opacity-50`}
                >
                  {loading ? "Criando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}