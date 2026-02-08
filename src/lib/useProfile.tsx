"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  email?: string;
  display_name?: string;
  phone?: string;
  role?: string;
  status?: string;
};

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    let subscription: any;

    async function loadProfile() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Erro ao carregar perfil:", error);
          console.error("Error code:", error.code, "Error message:", error.message);
          setProfile(null);
          return;
        }

        if (data) {
          if (mounted) setProfile(data);
        } else if (user.email) {
          // Fallback: tentar pelo email
          const { data: fallback, error: fallbackError } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", user.email)
            .maybeSingle();

          if (fallbackError) {
            console.error("Erro no fallback de perfil (por email):", fallbackError);
            if (mounted) setProfile(null);
            return;
          }

          if (fallback && mounted) {
            setProfile(fallback);
          } else {
            console.warn("Perfil não encontrado para user:", user.id);
            if (mounted) setProfile(null);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    // Subscrever a mudanças em tempo real
    subscription = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload: any) => {
          console.log('📡 Mudança detectada no profile:', payload);
          if (mounted && payload.new) {
            setProfile(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [user, authLoading]);

  return { profile, loading };
}