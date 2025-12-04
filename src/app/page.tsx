import Image from "next/image";
import PageBackground from "@/components/PageBackground";


export default function Home() {
	return (
				<div className="relative min-h-screen">
							{/* Background image (reusable component) */}
							<PageBackground />

					<main className="relative z-10 flex flex-col items-center text-center py-16 px-4 text-white">
				{/* Bandeira */}
				<Image
					src="/img/logos/bandeira_ml.png"
					alt="Bandeira Modelo-SC"
					width={260}
					height={170}
					className="mb-6 rounded-md shadow-md w-48 sm:w-60 md:w-72"
					priority
				/>


						<h2 className="text-4xl sm:text-5xl font-bold mb-4 drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]">
							Bem-vindo ao Portal Modelo
				</h2>


						<p className="text-lg sm:text-xl max-w-3xl mb-8 px-3 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
							O seu portal de lojas, serviços e oportunidades de Modelo-SC.
							Descubra comércios locais, encontre profissionais e fique por dentro das
							novidades da cidade!
						</p>


				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 w-full max-w-4xl">
					<a
						href="/lojas"
						className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 hover:text-blue-900 transition shadow flex items-center justify-center gap-2"
					>
						{/* shop icon */}
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
							<path d="M3 9.5h18v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
							<path d="M3 9.5L5 4h14l2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
						Ver Lojas
					</a>

					<a
						href="/classificados"
						className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 hover:text-blue-900 transition shadow flex items-center justify-center gap-2"
					>
						{/* megaphone icon */}
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
							<path d="M2 12v-2a1 1 0 0 1 1-1h6l6-3v12l-6-3H3a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
							<path d="M19 8c1 1.5 1 4 0 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
						Classificados
					</a>

					<a
						href="/profissionais"
						className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 hover:text-blue-900 transition shadow flex items-center justify-center gap-2"
					>
						{/* briefcase icon */}
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
							<rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
							<path d="M8 7V6a4 4 0 0 1 8 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
						Profissionais
					</a>

					<a
						href="/noticias"
						className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 hover:text-blue-900 transition shadow flex items-center justify-center gap-2"
					>
						{/* news icon */}
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
							<path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
							<path d="M8 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
						Notícias
					</a>
				</div>
			</main>
		</div>
	);
}