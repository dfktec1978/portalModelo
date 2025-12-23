"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu on Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      router.push("/");
      setMenuOpen(false);
    }
  };

  return (
    <header className="bg-gradient-to-r from-[#003049] to-[#0b4280] text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <Image
            src="/img/logos/logo.png"
            alt="Portal Modelo"
            width={40}
            height={40}
            priority
          />
          <span className="font-bold text-lg hidden sm:inline">Portal Modelo</span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/classificados" className="hover:text-yellow-400 transition">
            Classificados
          </Link>
          <Link href="/noticias" className="hover:text-yellow-400 transition">
            Notícias
          </Link>
          <Link href="/lojas" className="hover:text-yellow-400 transition">
            Lojas
          </Link>
          <Link href="/profissionais" className="hover:text-yellow-400 transition">
            Profissionais
          </Link>
        </nav>

        {/* Botão Quero Anunciar */}
        <a
          href="https://wa.me/5549999711065?text=Olá! Gostaria de anunciar no Portal Modelo."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#FDC500] hover:bg-[#E6B800] text-[#003049] px-4 py-2 rounded font-semibold text-sm transition hidden md:block"
        >
          📢 Quero Anunciar
        </a>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="bg-[#D62828] hover:bg-[#C41E1E] px-3 py-2 rounded flex items-center gap-2 transition text-sm font-semibold"
              >
                👤 {user.email?.split("@")[0] || "Menu"}
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white text-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  <div className="py-2">
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
                    >
                      📊 Dashboard
                    </Link>
                    <Link
                      href="/classificados"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
                    >
                      📢 Classificados
                    </Link>
                    <Link
                      href="/profissionais"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
                    >
                      👷 Profissionais
                    </Link>
                    <Link
                      href="/lojas"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
                    >
                      🏪 Lojas
                    </Link>
                    <Link
                      href="/noticias"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
                    >
                      📰 Notícias
                    </Link>

                    {/* Opções condicionais baseadas no role */}
                    {profile?.role === "profissional" && (
                      <Link
                        href="/dashboard/meu-perfil-profissional"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
                      >
                        👤 Meu Perfil Profissional
                      </Link>
                    )}

                    {profile?.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
                      >
                        ⚙️ Administração
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-gray-200 p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded transition font-semibold text-sm"
                    >
                      🚪 Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="text-white hover:text-yellow-400 transition font-semibold text-sm"
              >
                Login
              </Link>
              <Link
                href="/cadastro"
                className="bg-[#D62828] hover:bg-[#C41E1E] px-3 py-2 rounded transition font-semibold text-sm"
              >
                Cadastro
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 hover:bg-white/10 rounded transition"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/10 border-t border-white/20 p-4 space-y-3">
          <Link href="/noticias" className="block text-white hover:text-yellow-400">
            Notícias
          </Link>
          <Link href="/lojas" className="block text-white hover:text-yellow-400">
            Lojas
          </Link>
          <Link href="/profissionais" className="block text-white hover:text-yellow-400">
            Profissionais
          </Link>
          <Link href="/classificados" className="block text-white hover:text-yellow-400">
            Classificados
          </Link>

          <a
            href="https://wa.me/5549999711065?text=Olá! Gostaria de anunciar no Portal Modelo."
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#FDC500] text-[#003049] text-center py-2 rounded font-semibold mt-3"
          >
            📢 Quero Anunciar
          </a>

          <div className="border-t border-white/20 pt-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block text-white hover:text-yellow-400 mb-2"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded transition font-semibold"
                >
                  Sair
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="block text-center bg-white text-gray-800 py-2 rounded font-semibold"
                >
                  Login
                </Link>
                <Link
                  href="/cadastro"
                  className="block text-center bg-[#D62828] text-white py-2 rounded font-semibold"
                >
                  Cadastro
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
