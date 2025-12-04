"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type SupabaseUser = {
  id: string;
  email?: string | null;
  user_metadata?: any;
};

export function useSupabaseAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        if (data?.user) {
          setUser({ id: data.user.id, email: data.user.email, user_metadata: data.user.user_metadata });
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Erro ao obter usuário Supabase', e);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
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
