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
        const json = await res.json();
        if (!mounted) return;
        if (json?.count !== undefined) setVisitCount(Number(json.count));
      } catch (err) {
        console.error('Erro ao registrar visita', err);
        // fallback: keep null
      } finally {
        if (mounted) setLoading(false);
      }
    }

    registerVisit();
    return () => { mounted = false; };
  }, []);

  return (
    <footer style={{ backgroundColor: "#293B63" }} className="text-white py-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-2 px-2">
        <Image
          src="/img/logos/dkTransparente.png"
          alt="DK Tecnologia"
          width={160}
          height={90}
          className="opacity-90 hover:opacity-100 transition"
        />
        <p className="text-white text-sm text-center">
          © {new Date().getFullYear()} Portal Modelo — Todos os direitos reservados à DK Works Studio.
        </p>
        <p className="text-white/60 text-xs text-center">
          Visitas: {loading ? '...' : visitCount !== null ? visitCount.toLocaleString() : '—'}
        </p>
      </div>
    </footer>
  );
}