import Image from "next/image";
import { NavButton } from "@/components/NavButton";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      {/* Bandeira centralizada acima do título */}
      <Image
        src="/img/logos/bandeira_ml.png"
        alt="Bandeira de Modelo-SC"
        width={180}
        height={120}
        className="mb-6 rounded-md shadow-md"
        priority
      />

      <h2 className="text-5xl font-bold text-azul mb-4">
        Bem-vindo ao Portal Modelo
      </h2>

      <p className="text-lg text-branco max-w-3xl mb-6">
        O seu portal de lojas, serviços e oportunidades de Modelo-SC.  
        Descubra comércios locais, encontre profissionais e fique por dentro das novidades da cidade!
      </p>

      <div className="flex flex-wrap justify-center gap-9 mt-4">
        <NavButton href="/lojas" bgColor="#AF2828">
          Ver Lojas
        </NavButton>

        <NavButton href="/classificados" bgColor="#FFD400" textColor="#111">
          Classificados
        </NavButton>

        <NavButton href="/profissionais" bgColor="#293B63">
          Profissionais
        </NavButton>

        <NavButton href="/noticias" bgColor="#AF2828">
          Notícias
        </NavButton>
      </div>
    </div>
  );
}
