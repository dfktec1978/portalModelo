"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

export default function AuthModal({ open, onCloseAction }: { open: boolean; onCloseAction: () => void }) {
  const router = useRouter();
  const { signUp, signIn } = useAuth();
  const [tab, setTab] = useState<"cliente" | "lojista">("cliente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // fechar com ESC (o hook deve ser chamado sempre, mesmo quando o modal estiver fechado)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseAction();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCloseAction]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "cliente") {
        await signIn(email, password);
      } else {
        // lojista forma: tenta signup primeiro
        await signUp(email, password, "lojista");
      }
      onCloseAction();
    } catch (err: any) {
      alert(err?.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/50" onClick={onCloseAction} />

      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Entrar — {tab === "cliente" ? "Cliente" : "Lojista"}</h3>
          <button onClick={onCloseAction} aria-label="Fechar" className="text-gray-600 hover:text-gray-800">✕</button>
        </header>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("cliente")}
            className={`flex-1 py-2 rounded-md font-medium ${tab === "cliente" ? "bg-[#AF2828] text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Cliente
          </button>
          <button
            onClick={() => setTab("lojista")}
            className={`flex-1 py-2 rounded-md font-medium ${tab === "lojista" ? "bg-[#293B63] text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Lojista
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-sm text-gray-700">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <label className="text-sm text-gray-700">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <button type="submit" disabled={loading} className={`mt-2 w-full py-2 rounded-md font-semibold ${tab === "lojista" ? "bg-[#293B63] text-white" : "bg-[#AF2828] text-white"}`}>
            {loading ? "Carregando..." : tab === "cliente" ? "Entrar" : "Cadastrar Logista"}
          </button>

          <div className="text-center text-sm text-gray-600 mt-3">
            Ainda não tem conta?{' '}
            <button
              type="button"
              onClick={() => {
                // ir para a página de cadastro correspondente
                const path = tab === 'cliente' ? '/cadastro-cliente' : '/cadastro-logista';
                onCloseAction();
                router.push(path);
              }}
              className="text-[#AF2828] font-semibold underline"
            >
              Clique aqui
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
