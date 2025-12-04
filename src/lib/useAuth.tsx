"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
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

type SignInResult = {
  cred: UserCredential;
  role: string | null;
  displayName: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  role: string | null;
  displayName: string | null;
  signUp: (email: string, password: string, role?: string) => Promise<UserCredential>;
  // signIn agora resolve com credenciais e o perfil (role + displayName)
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
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
            // prefer name stored in users doc
            if (data?.name) setDisplayName(data.name);
            else if (data?.displayName) setDisplayName(data.displayName);
            // if role is logista and no name in users, try stores collection
            if (r === "logista") {
              try {
                const storeSnap = await getDoc(doc(db, "stores", u.uid));
                if (storeSnap.exists()) {
                  const s = storeSnap.data() as any;
                  if (s?.ownerName) setDisplayName(s.ownerName);
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
  }, []);

  async function signUp(email: string, password: string, role = "cliente") {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // criar documento do usuário no Firestore com role
    const userRef = doc(db, "users", cred.user.uid);
    // definir status: lojista -> pending, cliente -> approved
    const status = role === "logista" ? "pending" : "approved";
    await setDoc(userRef, {
      email,
      role,
      status,
      createdAt: serverTimestamp(),
      approvedAt: status === "approved" ? serverTimestamp() : null,
    });
    return cred;
  }

  async function signIn(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // buscar perfil (role e displayName) imediatamente e retornar junto
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
      }

      // se for lojista, tentar buscar nome no documento da store
      if (fetchedRole === "logista") {
        try {
          const storeSnap = await getDoc(doc(db, "stores", cred.user.uid));
          if (storeSnap.exists()) {
            const s = storeSnap.data() as any;
            if (s?.ownerName) fetchedDisplayName = s.ownerName;
          }
        } catch (ee) {
          console.warn("Erro ao buscar dados da store durante signIn:", ee);
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar perfil após signIn:", e);
    }

    return { cred, role: fetchedRole, displayName: fetchedDisplayName };
  }

  async function signOut() {
    await fbSignOut(auth);
    try {
      // redirecionar para a home após logout (garante cliente/lojista/admin)
      router.push("/");
    } catch (e) {
      // fallback para location
      if (typeof window !== "undefined") window.location.href = "/";
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, role, displayName, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
