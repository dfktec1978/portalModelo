import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portal Modelo",
  description: "Portal de vendas e serviços locais de Modelo-SC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.className} backrou text-preto min-h-screen flex flex-col`}
        style={{
          backgroundImage: "url('/img/background/modelo01.jpg')", // ajuste o caminho conforme sua imagem
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* HEADER */}
        <header
          className="text-branco shadow-md"
          style={{ backgroundColor: "#9F2626" }}
        >
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Image
                src="/img/logos/logo.png"
                alt="Portal Modelo"
                width={60}
                height={60}
                className="rounded-md"
              />
              <h1 className="text-5xl font-bold text-branco">Portal Modelo</h1>
            </div>

            <nav className="flex gap-8">
              <a href="/" className="hover:text-amarelo transition">Início</a>
              <a href="/lojas" className="hover:text-amarelo transition">Lojas</a>
              <a href="/classificados" className="hover:text-amarelo transition">Classificados</a>              
              <a href="/profissionais" className="hover:text-amarelo transition">Profissionais</a>
              <a href="/noticias" className="hover:text-amarelo transition">Noticias</a>                       
              <a href="/anuncie" className="hover:text-amarelo transition">Anuncie</a>
            </nav>
          </div>
        </header>

        {/* FAIXA AMARELA INSPIRADA NA BANDEIRA */}
        <div className="w-full h-2 bg-amarelo"></div>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-grow">{children}</main>

        {/* FAIXA AMARELA ACIMA DO FOOTER */}
        <div className="w-full h-2 bg-amarelo"></div>

        {/* FOOTER */}
        <footer className="bg-azul text-branco">
          <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center">
            <Image
              src="/img/logos/dfk_tec.png"
              alt="DFK TEC"
              width={120}
              height={48}
              className="opacity-90"
            />
            <p className="text-sm text-center">
              © {new Date().getFullYear()} Portal Modelo — Desenvolvido por Daniel Felipe Kroth (DFK.TEC)
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
