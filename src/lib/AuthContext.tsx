"use client";
import { createContext, useContext, ReactNode } from "react";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { supabase } from "./supabase";

type User = {
  id: string;
  email?: string | null;
  user_metadata?: any;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithOAuth: (provider: "github" | "google") => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useSupabaseAuth();

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (signupError) {
        return { error: signupError };
      }

      // Se signup bem-sucedido, criar profile se não existir
      if (authData?.user?.id) {
        const userId = authData.user.id;
        
        // Criar profile com dados do metadata
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email,
            display_name: metadata?.display_name || email.split("@")[0],
            phone: metadata?.phone || null,
            role: "cliente",
            status: "active",
          })
          .select()
          .single();

        // Se profile já existe, apenas atualizar
        if (profileError?.code === "23505") {
          // Duplicate key error - profile já existe
          console.log("Profile já existe, pulando criação");
        } else if (profileError) {
          console.warn("Erro ao criar profile:", profileError);
          // Não bloqueia o signup
        }
      }

      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const signInWithOAuth = async (provider: "github" | "google") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      });
      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithOAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
