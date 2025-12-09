import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/AuthContext";


export const metadata: Metadata = {
  title: "Portal Modelo",
  description: "Portal de lojas, serviços e oportunidades de Modelo-SC",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
    {/* suppressHydrationWarning: some browser extensions (e.g. sidebar/assistants) inject attributes into the DOM
      which cause hydration mismatches during development. Keep this flag while debugging such issues. */}
    <body suppressHydrationWarning={true} className="bg-gray-100 text-gray-800 flex flex-col min-h-screen">
        <AuthProvider>
          <Header />

        {/* FAIXA AMARELA ABAIXO DO HEADER */}
        <div className="w-full h-3" style={{ backgroundColor: "#FFD400" }} />

  <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</main>

        {/* FAIXA AMARELA ACIMA DO FOOTER */}
        <div className="w-full h-3" style={{ backgroundColor: "#FFD400" }} />

          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}