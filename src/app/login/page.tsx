"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError.message || "Credenciais inválidas");
        return;
      }

      // Login bem-sucedido
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Erro ao fazer login");
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
            <p className="text-gray-300 mt-2">Faça login na sua conta</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D62828] hover:bg-[#C41E1E] disabled:bg-gray-500 text-white font-semibold py-2 rounded transition"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-white/20"></div>
            <div className="px-3 text-gray-300 text-sm">ou</div>
            <div className="flex-1 border-t border-white/20"></div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-300">
            Não tem conta?{" "}
            <Link href="/cadastro" className="text-[#FDC500] hover:underline font-semibold">
              Cadastre-se
            </Link>
          </p>

          {/* Help */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-gray-400 hover:text-white text-sm">
              ← Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
