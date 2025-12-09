"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Detectar se Supabase está configurado
const HAS_SUPABASE = 
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== 'undefined' &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Importar Supabase conditionally se disponível
let supabaseClient: any = null;
if (HAS_SUPABASE) {
  try {
    const { supabase } = require('@/lib/supabase');
    supabaseClient = supabase;
  } catch (e) {
    console.warn('[useAuth] Falha ao importar cliente Supabase:', e);
  }
}

type SignInResult = {
  cred: UserCredential | any;
  role: string | null;
  displayName: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  role: string | null;
  displayName: string | null;
  useSupabase: boolean;
  signUp: (email: string, password: string, role?: string) => Promise<UserCredential | any>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [useSupabase, setUseSupabase] = useState(false);
  const router = useRouter();

  // Detectar se usar Supabase ou Firebase
  useEffect(() => {
    const isSupabaseAvailable = HAS_SUPABASE && supabaseClient;
    console.log('[useAuth] Backend detection: Supabase available =', isSupabaseAvailable);
    setUseSupabase(isSupabaseAvailable);
  }, []);

  // Firebase listener (rodar apenas se NOT usando Supabase)
  useEffect(() => {
    if (useSupabase) {
      console.log('[useAuth] Using Supabase backend, skipping Firebase listener');
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setRole(null);
      setDisplayName(null);
      if (u) {
        try {
          const userRef = doc(db, "users", u.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data() as any;
            const r = data?.role ?? null;
            setRole(r);
            if (data?.name) setDisplayName(data.name);
            else if (data?.displayName) setDisplayName(data.displayName);
            if (r === "logista" || r === "lojista") {
              try {
                const storeSnap = await getDoc(doc(db, "stores", u.uid));
                if (storeSnap.exists()) {
                  const s = storeSnap.data() as any;
                  if (s?.ownerName || s?.store_name) setDisplayName(s.ownerName || s.store_name);
                }
              } catch (ee) {
                console.warn("Erro ao buscar dados da store:", ee);
              }
            }
          } else {
            setRole(null);
          }
        } catch (e) {
          console.warn("Erro ao buscar role do usuário:", e);
          setRole(null);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [useSupabase]);

  // Supabase listener (rodar apenas se USANDO Supabase)
  useEffect(() => {
    if (!useSupabase || !supabaseClient) {
      return;
    }

    console.log('[useAuth] Setting up Supabase listener');
    
    (async () => {
      try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        const session = sessionData?.session;

        if (session) {
          console.log('[useAuth] Supabase session found:', session.user.email);
          const supaUser = {
            uid: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.display_name || session.user.email,
            ...session.user,
          };
          setUser(supaUser as any);

          try {
            const { data, error } = await supabaseClient
              .from('profiles')
              .select('role, display_name')
              .eq('id', session.user.id)
              .single();

            if (error) {
              console.warn('[useAuth] Erro ao buscar profile:', error);
              setRole(session.user.user_metadata?.role || 'cliente');
            } else {
              setRole(data?.role || 'cliente');
              setDisplayName(data?.display_name || supaUser.displayName);
            }
          } catch (e) {
            console.warn('[useAuth] Exception ao buscar profile:', e);
            setRole(session.user.user_metadata?.role || 'cliente');
          }
        } else {
          console.log('[useAuth] No Supabase session');
          setUser(null);
          setRole(null);
          setDisplayName(null);
        }
      } catch (e) {
        console.warn('[useAuth] Erro ao buscar sessão Supabase:', e);
      } finally {
        setLoading(false);
      }
    })();

    const { subscription } = supabaseClient.auth.onAuthStateChange(
      async (_event: string, session: any) => {
        if (session?.user) {
          const supaUser = {
            uid: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.display_name || session.user.email,
            ...session.user,
          };
          setUser(supaUser as any);
          setRole(session.user.user_metadata?.role || 'cliente');
          setDisplayName(supaUser.displayName);
        } else {
          setUser(null);
          setRole(null);
          setDisplayName(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [useSupabase]);

  async function signUp(email: string, password: string, role = "cliente") {
    if (useSupabase && supabaseClient) {
      console.log('[useAuth] SignUp via Supabase');
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            display_name: email.split('@')[0],
          },
        },
      });
      if (error) throw error;
      
      if (data?.user) {
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              email,
              role,
              display_name: email.split('@')[0],
              status: role === "lojista" || role === "logista" ? "pending" : "active",
              created_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        if (profileError) console.warn('[useAuth] Erro ao criar profile Supabase:', profileError);
      }
      return data;
    } else {
      console.log('[useAuth] SignUp via Firebase');
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, "users", cred.user.uid);
      const status = role === "logista" || role === "lojista" ? "pending" : "approved";
      await setDoc(userRef, {
        email,
        role,
        status,
        createdAt: serverTimestamp(),
        approvedAt: status === "approved" ? serverTimestamp() : null,
      });
      return cred;
    }
  }

  async function signIn(email: string, password: string): Promise<SignInResult> {
    if (useSupabase && supabaseClient) {
      console.log('[useAuth] SignIn via Supabase');
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      let fetchedRole = 'cliente';
      let fetchedDisplayName = email;

      if (data?.user) {
        try {
          const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role, display_name')
            .eq('id', data.user.id)
            .single();

          if (!profileError && profileData) {
            fetchedRole = profileData.role || 'cliente';
            fetchedDisplayName = profileData.display_name || email;
          }
        } catch (e) {
          console.warn('[useAuth] Erro ao buscar profile durante SignIn:', e);
        }
      }

      return { cred: data, role: fetchedRole, displayName: fetchedDisplayName };
    } else {
      console.log('[useAuth] SignIn via Firebase');
      const cred = await signInWithEmailAndPassword(auth, email, password);

      let fetchedRole: string | null = null;
      let fetchedDisplayName: string | null = null;
      try {
        const userRef = doc(db, "users", cred.user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          fetchedRole = data?.role ?? null;
          if (data?.name) fetchedDisplayName = data.name;
          else if (data?.displayName) fetchedDisplayName = data.displayName;

          if (fetchedRole === "logista" || fetchedRole === "lojista") {
            try {
              const storeSnap = await getDoc(doc(db, "stores", cred.user.uid));
              if (storeSnap.exists()) {
                const s = storeSnap.data() as any;
                if (s?.ownerName || s?.store_name) fetchedDisplayName = s.ownerName || s.store_name;
              }
            } catch (ee) {
              console.warn("Erro ao buscar dados da store durante signIn:", ee);
            }
          }
        }
      } catch (e) {
        console.warn("Erro ao buscar perfil após signIn:", e);
      }

      return { cred, role: fetchedRole, displayName: fetchedDisplayName };
    }
  }

  async function signOut() {
    try {
      if (useSupabase && supabaseClient) {
        console.log('[useAuth] SignOut via Supabase');
        await supabaseClient.auth.signOut();
      } else {
        console.log('[useAuth] SignOut via Firebase');
        await fbSignOut(auth);
      }
    } catch (e) {
      console.error('[useAuth] Erro ao fazer logout:', e);
    } finally {
      setUser(null);
      setRole(null);
      setDisplayName(null);
      try {
        router.push("/");
      } catch (e) {
        if (typeof window !== "undefined") window.location.href = "/";
      }
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        role, 
        displayName, 
        useSupabase,
        signUp, 
        signIn, 
        signOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
