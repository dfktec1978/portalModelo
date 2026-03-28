"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

type SupabaseUser = {
  id: string;
  email?: string | null;
  user_metadata?: any;
};

function isInvalidRefreshTokenError(error: unknown) {
  const message = String((error as any)?.message || "").toLowerCase();
  return message.includes("invalid refresh token") || message.includes("refresh token not found");
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          if (isInvalidRefreshTokenError(error)) {
            // Limpa credenciais locais inválidas para evitar loop de erro.
            await supabase.auth.signOut({ scope: "local" });
            if (!mounted) return;
            setUser(null);
            return;
          }
          throw error;
        }

        if (!mounted) return;
        if (data?.session?.user) {
          const sessionUser = data.session.user;
          setUser({ id: sessionUser.id, email: sessionUser.email, user_metadata: sessionUser.user_metadata });
        } else {
          setUser(null);
        }
      } catch (e) {
        if (!isInvalidRefreshTokenError(e)) {
          console.error('Erro ao obter sessão Supabase', e);
        }
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email, user_metadata: session.user.user_metadata });
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string) {
    const res = await supabase.auth.signUp({ email, password });
    return res;
  }

  async function signIn(email: string, password: string) {
    const res = await supabase.auth.signInWithPassword({ email, password });
    return res;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return { user, loading, signUp, signIn, signOut } as const;
}
