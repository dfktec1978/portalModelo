import Image from "next/image";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#293B63" }} className="text-white py-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-2 px-2">
        <Image
          src="/img/logos/dfk_tec.png"
          alt="DFK Tecnologia"
          width={160}
          height={90}
          className="opacity-90 hover:opacity-100 transition"
        />
        <p className="text-white text-sm text-center">
          © {new Date().getFullYear()} Portal Modelo — Todos os direitos reservados — By Daniel Felipe Kroth.
        </p>
      </div>
    </footer>
  );
}