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

    async function loadProfile() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Erro ao carregar perfil:", error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, authLoading]);

  return { profile, loading };
}