"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
export default function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, signOut, role, displayName } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // keyboard: close menu on Esc and click outside
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    function onClickOutside(ev: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(ev.target as Node)) return;
      setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener('keydown', onKey);
      document.addEventListener('mousedown', onClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [menuOpen]);

  async function logAudit(action: string, meta?: Record<string, any>) {
    try {
      if (!user) return;
      await addDoc(collection(db, 'auditLogs'), {
        userId: user.uid,
        action,
        meta: meta ? JSON.stringify(meta) : null,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Erro ao gravar auditLog:', e);
    }
  }

  return (
    <header className="shadow-md border-b border-gray-200" style={{ backgroundColor: "#CC2F30" }}>
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/img/logos/logo.png"
            alt="Portal Modelo Logo"
            width={50}
            height={50}
            className="w-16 h-auto sm:w-15"
            priority
          />
          {/* Desaticado Título  
          <h1 className="text-2xl font-bold text-white hidden sm:block">Portal Modelo</h1>*/}
        </div>

        {/* Menu Desktop */}
        <nav className="hidden md:flex gap-4 items-center text-white font-semibold">
          <a href="/" className="flex items-center gap-2 hover:text-yellow-500 transition">
            {/* home icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Início
          </a>

          <a href="/lojas" className="flex items-center gap-2 hover:text-yellow-500 transition">
            {/* shop icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 9.5h18v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 9.5L5 4h14l2.0 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Lojas
          </a>

          <a href="/classificados" className="flex items-center gap-2 hover:text-yellow-500 transition">
            {/* megaphone icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M2 12v-2a1 1 0 0 1 1-1h6l6-3v12l-6-3H3a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 8c1 1.5 1 4 0 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Classificados
          </a>

          <a href="/profissionais" className="flex items-center gap-2 hover:text-yellow-500 transition">
            {/* briefcase icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 7V6a4 4 0 0 1 8 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Profissionais
          </a>

          <a href="/noticias" className="flex items-center gap-2 hover:text-yellow-500 transition">
            {/* news icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Notícias
          </a>

          <a href="/anuncie" className="flex items-center gap-2 hover:text-yellow-500 transition">
            {/* plus/announce icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Anuncie
          </a>

          {/* quick access removed in favor of unified dropdown */}

          {/* Área de autenticação: mostra Entrar ou um dropdown com opções por papel */}
          {user ? (
            <div className="relative ml-3">
              <button
                onClick={() => setMenuOpen((s) => !s)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                className="bg-white text-[#CC2F30] px-3 py-1 rounded-md font-semibold hover:opacity-95 transition flex items-center gap-2"
              >
                <span className="max-w-[140px] truncate">{displayName ?? user.email}</span>
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {menuOpen && (
                <div ref={menuRef} className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg text-sm text-gray-800 z-50 overflow-hidden" role="menu">
                  {/* Admin (MASTER) */}
                  {user.uid === process.env.NEXT_PUBLIC_MASTER_UID ? (
                    <>
                      <Link href="/admin" onClick={() => logAudit('open_admin_panel')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8V3h-8zM3 21h8v-6H3v6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Painel Admin
                      </Link>
                      <Link href="/admin/lojas" onClick={() => logAudit('admin:open_lojas')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M3 9.5h18v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Gerenciar Lojas
                      </Link>
                      <Link href="/admin/noticias" onClick={() => logAudit('admin:open_noticias')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Gerenciar Notícias
                      </Link>
                      <Link href="/admin/classificados" onClick={() => logAudit('admin:open_classificados')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Gerenciar Classificados
                      </Link>
                      <Link href="/configuracoes" onClick={() => logAudit('admin:open_configs')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Configurações
                      </Link>
                    </>
                  ) : null}

                  {/* Logista */}
                  {role === "logista" ? (
                    <>
                      <Link href="/dashboard" onClick={() => logAudit('logista:open_dashboard')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10zM13 21h8V11h-8v10z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Meu Painel
                      </Link>
                      <Link href="/lojas" onClick={() => logAudit('logista:open_lojas')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M3 9.5h18v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Minhas Lojas
                      </Link>
                      <Link href="/noticias" onClick={() => logAudit('logista:open_noticias')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Notícias
                      </Link>
                      <Link href="/classificados" onClick={() => logAudit('logista:open_classificados')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M2 12v-2a1 1 0 0 1 1-1h6l6-3v12l-6-3H3a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Classificados
                      </Link>
                      <Link href="/configuracoes" onClick={() => logAudit('logista:open_configs')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Configurações
                      </Link>
                    </>
                  ) : null}

                  {/* Cliente (default) */}
                  {role !== "logista" && user.uid !== process.env.NEXT_PUBLIC_MASTER_UID ? (
                    <>
                      <Link href="/lojas" onClick={() => logAudit('open_lojas')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M3 9.5h18v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Lojas
                      </Link>
                      <Link href="/noticias" onClick={() => logAudit('open_noticias')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Notícias
                      </Link>
                      <Link href="/classificados" onClick={() => logAudit('open_classificados')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M2 12v-2a1 1 0 0 1 1-1h6l6-3v12l-6-3H3a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Classificados
                      </Link>
                      <Link href="/configuracoes" onClick={() => logAudit('open_configs')} className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2" role="menuitem">
                        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none"><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Configurações
                      </Link>
                    </>
                  ) : null}

                  <button
                    onClick={async () => {
                      try {
                        await signOut();
                        router.push("/");
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-3 bg-white text-[#CC2F30] px-4 py-2 rounded-md font-semibold hover:opacity-95 transition flex items-center gap-2"
              aria-label="Entrar"
            >
              {/* user icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Entrar
            </Link>
          )}
        </nav>

        {/* Botões/ícone Mobile */}
        <div className="flex items-center gap-2">
          <button
            className="md:hidden text-white text-2xl p-1"
            onClick={() => setOpen(!open)}
            aria-label="Abrir menu"
          >
            {open ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {user ? (
            <div className="md:hidden">
              <div className="mt-2 flex flex-col gap-2">
                <span className="text-white text-sm truncate max-w-[120px]">{displayName ?? user.email}</span>
                {/* mobile: links based on role */}
                {user.uid === process.env.NEXT_PUBLIC_MASTER_UID && (
                  <>
                    <Link href="/admin" className="block text-white">Painel Admin</Link>
                    <Link href="/admin/lojas" className="block text-white">Gerenciar Lojas</Link>
                    <Link href="/admin/noticias" className="block text-white">Gerenciar Notícias</Link>
                  </>
                )}
                {role === "logista" && (
                  <>
                    <Link href="/dashboard" className="block text-white">Meu Painel</Link>
                    <Link href="/lojas" className="block text-white">Minhas Lojas</Link>
                  </>
                )}
                {role !== "logista" && user.uid !== process.env.NEXT_PUBLIC_MASTER_UID && (
                  <>
                    <Link href="/lojas" className="block text-white">Lojas</Link>
                    <Link href="/noticias" className="block text-white">Notícias</Link>
                  </>
                )}
                <Link href="/classificados" className="block text-white">Classificados</Link>
                <button
                  onClick={async () => {
                    try {
                      await signOut();
                      router.push("/");
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="bg-[#AF2828] text-white px-4 py-2 rounded-md mt-2"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="md:hidden text-white px-3 py-2 rounded-md border border-white/20 flex items-center gap-2" aria-label="Entrar">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Entrar
            </Link>
          )}
        </div>
      </div>
      
      {/* Menu Mobile */}
      {open && (
        <nav className="md:hidden bg-white border-t border-gray-200 flex flex-col text-blue-900 px-6 py-4 gap-3 font-semibold shadow-md">
          <a href="/" className="flex items-center gap-3 hover:text-yellow-500">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Início
          </a>

          <a href="/lojas" className="flex items-center gap-3 hover:text-yellow-500">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M3 9.5h18v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 9.5L5 4h14l2.0 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Lojas
          </a>

          <a href="/classificados" className="flex items-center gap-3 hover:text-yellow-500">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M2 12v-2a1 1 0 0 1 1-1h6l6-3v12l-6-3H3a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Classificados
          </a>

          <a href="/profissionais" className="flex items-center gap-3 hover:text-yellow-500">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 7V6a4 4 0 0 1 8 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Profissionais
          </a>

          <a href="/noticias" className="flex items-center gap-3 hover:text-yellow-500">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Notícias
          </a>

          <a href="/anuncie" className="flex items-center gap-3 hover:text-yellow-500">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Anuncie
          </a>

          {user ? (
            <div className="mt-2 flex flex-col">
              <span className="font-semibold mb-2">{displayName ?? user.email}</span>
              {/* role-based quick links */}
              {user.uid === process.env.NEXT_PUBLIC_MASTER_UID && (
                <>
                  <Link href="/admin" className="block text-blue-900">Painel Admin</Link>
                  <Link href="/admin/lojas" className="block text-blue-900">Gerenciar Lojas</Link>
                  <Link href="/admin/noticias" className="block text-blue-900">Gerenciar Notícias</Link>
                </>
              )}
              {role === "logista" && (
                <>
                  <Link href="/dashboard" className="block text-blue-900">Meu Painel</Link>
                  <Link href="/lojas" className="block text-blue-900">Minhas Lojas</Link>
                </>
              )}
              {role !== "logista" && user.uid !== process.env.NEXT_PUBLIC_MASTER_UID && (
                <>
                  <Link href="/lojas" className="block text-blue-900">Lojas</Link>
                  <Link href="/noticias" className="block text-blue-900">Notícias</Link>
                </>
              )}
              <Link href="/classificados" className="block text-blue-900">Classificados</Link>
              <button
                onClick={async () => {
                  try {
                    await signOut();
                    router.push("/");
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="bg-[#AF2828] text-white px-4 py-2 rounded-md mt-2"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link href="/login" className="mt-2 bg-[#AF2828] text-white px-4 py-2 rounded-md flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Entrar
            </Link>
          )}
        </nav>
      )}

      {/* Antes havia um AuthModal aqui — agora a navegação vai para /login */}
    </header>
  );
}