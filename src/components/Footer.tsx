import Image from "next/image";
import { useEffect, useState } from "react";

export default function Footer() {
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function registerVisit() {
      try {
        const res = await fetch('/api/visitas', { method: 'POST' });
        if (!res.ok) {
          // Silenciar erro se endpoint não estiver configurado (503) ou indisponível
          if (mounted) setLoading(false);
          return;
        }
        const json = await res.json();
        if (!mounted) return;
        if (json?.count !== undefined) setVisitCount(Number(json.count));
      } catch (err) {
        // Silenciar erro no console (endpoint opcional)
      } finally {
        if (mounted) setLoading(false);
      }
    }

    registerVisit();
    return () => { mounted = false };
  }, []);

  return (
    <footer style={{ backgroundColor: "#293B63" }} className="text-white py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex flex-col items-center gap-5 md:flex-row md:items-center md:gap-8">
          <div className="flex-shrink-0">
            <Image
              src="/img/logos/dkTransparente.png"
              alt="DK Works Studio"
              width={156}
              height={54}
              className="opacity-90 hover:opacity-100 transition"
              style={{ width: "auto", height: "auto" }}
            />
          </div>

          <div className="hidden md:block h-20 w-px bg-white/30" aria-hidden="true" />

          <div className="w-full text-center md:text-left space-y-2">
            <p className="text-white text-xl font-semibold leading-tight">DK Works Studio</p>

            <div className="flex flex-col items-center gap-1 text-xs text-white/85 md:flex-row md:flex-wrap md:items-center md:gap-3 md:text-sm">
              <span>Daniel Felipe Kroth</span>
              <span className="hidden md:inline text-white/50">|</span>
              <span>CNPJ: 64.413.001/0001-40</span>
              <span className="hidden md:inline text-white/50">|</span>
              <span>Telefone: (49) 98923-2307</span>
            </div>

            <p className="text-white text-sm">
              © {new Date().getFullYear()} Portal Modelo - Todos os direitos reservados a DK Works Studio.
            </p>
          </div>
        </div>

        <p className="mt-4 text-white/60 text-xs text-center md:text-right">
          Visitas: {loading ? '...' : visitCount !== null ? visitCount.toLocaleString() : '-'}
        </p>
      </div>
    </footer>
  );
}