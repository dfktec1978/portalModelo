"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"cliente" | "logista">("cliente");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn(email, password);
      const loggedRole = res?.role ?? null;

      if (loggedRole === "logista") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err?.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/img/background/modelo06.jpg"
          alt="Modelo"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#0f2a66] to-[#162f7a] text-white p-8">
        <div className="max-w-md w-full">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/10 w-12 h-12 flex items-center justify-center">
                  {/* small logo placeholder */}
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none"><path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h1 className="text-3xl font-bold">Entrar — {role === "cliente" ? "Cliente" : "Logista"}</h1>
              </div>

              {/* Role tabs similar to modal */}
              <div className="flex gap-2 bg-white/5 rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setSelectedRole("cliente")}
                  className={`px-3 py-1 rounded-md font-semibold ${selectedRole === "cliente" ? "bg-white text-[#CC2F30]" : "text-white/80"}`}
                >
                  Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("logista")}
                  className={`px-3 py-1 rounded-md font-semibold ${selectedRole === "logista" ? "bg-white text-[#CC2F30]" : "text-white/80"}`}
                >
                  Logista
                </button>
              </div>
            </div>

            <p className="mt-3 text-white/80">
              {selectedRole === "cliente" ? "Acesse sua conta de cliente." : "Acesse sua conta para gerenciar sua loja."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-white/80 block mb-2">
                {selectedRole === "logista" ? "E-mail ou URL da sua loja" : "E-mail"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder={selectedRole === "logista" ? "seu@exemplo.com ou sua-loja" : "seu@exemplo.com"}
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
                placeholder="********"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <a href="/recuperar-senha" className="text-sm text-white/80 underline">Esqueci minha senha</a>
            </div>

            {error && <div className="text-red-300 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#0f2a66] py-3 rounded-full font-semibold mt-2 hover:opacity-95 transition"
            >
              {loading ? "Entrando..." : "Acessar a minha loja"}
            </button>

            <div className="mt-6 border-t border-white/20 pt-4 text-center">
              <p className="text-sm text-white/80">
                {selectedRole === "logista" ? (
                  <>Ainda não tem uma loja no Portal Modelo? <a href="/cadastro-logista" className="inline-block mt-1 bg-white/10 px-3 py-2 rounded-md text-white underline">Criar loja agora</a></>
                ) : (
                  <>Ainda não tem conta? <a href="/cadastro-cliente" className="inline-block mt-1 bg-white/10 px-3 py-2 rounded-md text-white underline">Clique aqui</a></>
                )}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
