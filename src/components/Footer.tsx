import Image from "next/image";
import { useEffect, useState } from "react";

export default function Footer() {
  const [visitCount, setVisitCount] = useState<number>(0);

  useEffect(() => {
    // Simular contador de visitas (em produção, isso viria de uma API)
    const count = localStorage.getItem('visitCount');
    const newCount = count ? parseInt(count) + 1 : 1;
    localStorage.setItem('visitCount', newCount.toString());
    setVisitCount(newCount);
  }, []);

  return (
    <footer style={{ backgroundColor: "#293B63" }} className="text-white py-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-2 px-2">
        <Image
          src="/img/logos/dk01.png"
          alt="DK Tecnologia"
          width={160}
          height={90}
          className="opacity-90 hover:opacity-100 transition"
        />
        <p className="text-white text-sm text-center">
          © {new Date().getFullYear()} Portal Modelo — Todos os direitos reservados — By Daniel Felipe Kroth.
        </p>
        <p className="text-white/60 text-xs text-center">
          Visitas: {visitCount.toLocaleString()}
        </p>
      </div>
    </footer>
  );
}