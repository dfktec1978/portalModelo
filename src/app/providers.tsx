"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Header />

      {/* FAIXA AMARELA ABAIXO DO HEADER */}
      <div className="w-full h-3" style={{ backgroundColor: "#FFD400" }} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* FAIXA AMARELA ACIMA DO FOOTER */}
      <div className="w-full h-3" style={{ backgroundColor: "#FFD400" }} />

      <Footer />
    </AuthProvider>
  );
}
