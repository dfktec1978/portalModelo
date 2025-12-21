"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import supabase from "@/lib/supabase";

const HAS_SUPABASE =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== "undefined" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function CadastroLogistaPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!ownerName.trim()) return "Informe o nome do responsável.";
    if (!storeName.trim()) return "Informe o nome da loja.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "E-mail inválido.";
    if (password.length < 6) return "Senha deve ter ao menos 6 caracteres.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
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

    setLoading(true);
    try {
      // cria usuário com role 'lojista'
      const cred = await signUp(email, password, "lojista");
      
      // Salvar dados da loja e perfil no backend apropriado
      try {
        const uid = (cred as any)?.user?.uid || (cred as any)?.user?.id;
        if (uid) {
          if (HAS_SUPABASE) {
            // Supabase: atualizar profiles + criar stores
            console.log("[cadastro-logista] Salvando no Supabase:", uid);
            
            // Atualizar profiles
            const { error: profileError } = await supabase
              .from("profiles")
              .upsert({
                id: uid,
                email,
                display_name: ownerName,
                role: "lojista",
              });
            if (profileError) {
              console.warn("Erro ao salvar profile no Supabase:", profileError);
            }

            // Criar store
            const { error: storeError } = await supabase
              .from("stores")
              .insert({
                owner_id: uid,
                store_name: storeName,
                phone,
                status: "pending",
              });
            if (storeError) {
              console.warn("Erro ao salvar store no Supabase:", storeError);
              setError("Não foi possível salvar dados da loja no Supabase.");
              setLoading(false);
              return;
            }
          } else {
            // Firebase: salvar em users e stores collections
            console.log("[cadastro-logista] Salvando no Firebase:", uid);
            
            await setDoc(doc(db, "users", uid), {
              email,
              role: "lojista",
              name: ownerName,
              createdAt: new Date().toISOString(),
            });

            await setDoc(doc(db, "stores", uid), {
              ownerUid: uid,
              storeName,
              ownerName,
              phone,
              ownerEmail: email,
              status: "pending",
              createdAt: serverTimestamp(),
            });
          }
        }
      } catch (e: any) {
        console.error("Não foi possível salvar dados da loja:", e?.code, e?.message || e);
        if (e?.code === "permission-denied" || e?.code === "auth/insufficient-permission") {
          setError("Permissão negada ao salvar dados da loja.");
        } else {
          setError("Não foi possível salvar dados da loja: " + (e?.message || "erro desconhecido"));
        }
        setLoading(false);
        return;
      }

      router.push("/");
    } catch (err: any) {
      console.error("Erro ao cadastrar lojista:", err?.code, err?.message || err);
      // mensagens amigáveis para códigos comuns
      if (err?.code === "auth/email-already-in-use") {
        setError("Este e-mail já está em uso. Deseja entrar? ");
      } else if (err?.code === "auth/weak-password") {
        setError("Senha muito fraca. Use ao menos 6 caracteres.");
      } else {
        setError((err?.code ? `${err.code} — ` : "") + (err?.message || "Erro ao cadastrar lojista"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: form panel */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#0f2a66] to-[#162f7a] text-white p-8">
        <div className="max-w-md w-full">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 w-12 h-12 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none"><path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h1 className="text-3xl font-bold">Cadastro — Lojista</h1>
            </div>
            <p className="mt-3 text-white/80">Crie sua loja no Portal Modelo e comece a vender.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-white/80 block mb-2">Nome do responsável</label>
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Nome completo"
                required
              />
            </div>

            <div>
              <label className="text-sm text-white/80 block mb-2">Nome da loja</label>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Nome da loja"
                required
              />
            </div>

            <div>
              <label className="text-sm text-white/80 block mb-2">Telefone / WhatsApp (opcional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="(48) 9xxxx-xxxx"
              />
            </div>

            <div>
              <label className="text-sm text-white/80 block mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="seu@exemplo.com"
                required
              />
            </div>

            <div>
              <label className="text-sm text-white/80 block mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="min. 6 caracteres"
                required
              />
            </div>

            {error && <div className="text-red-300 text-sm">{error}</div>}
        {error && (
          <div className="text-red-600 text-sm">
            {error}{' '}
            {error.includes('Entrar') || error.includes('uso') ? (
              <>
                <a href="/login" className="underline font-semibold">Entrar</a>
                <span className="mx-1">ou</span>
                <a href="/recuperar-senha" className="underline">Esqueci minha senha</a>
              </>
            ) : null}
          </div>
        )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#0f2a66] py-3 rounded-full font-semibold mt-2 hover:opacity-95 transition"
            >
              {loading ? "Cadastrando..." : "Criar conta lojista"}
            </button>

            <div className="mt-6 border-t border-white/20 pt-4 text-center">
              <p className="text-sm text-white/80">
                Já tem conta? <a href="/login" className="underline">Entrar</a>
              </p>
            </div>
          </form>
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
    </div>
  );
}
