import Link from "next/link";

export default function TermosLojistaPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-8">Termos de Uso – Lojista / Profissional</h1>
          <h2 className="text-xl font-semibold mb-4">PORTAL MODELO</h2>

          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="font-semibold">1. SOBRE O PORTAL</h3>
              <p>O Portal Modelo é uma plataforma de divulgação de negócios locais.</p>
              <p>O Portal não é sócio, intermediador financeiro ou responsável pelas atividades do lojista.</p>
            </div>

            <div>
              <h3 className="font-semibold">2. CADASTRO E APROVAÇÃO</h3>
              <p>O cadastro como lojista está sujeito à aprovação manual do administrador.</p>
              <p>O Portal pode aprovar, rejeitar, suspender ou cancelar o cadastro a qualquer momento.</p>
            </div>

            <div>
              <h3 className="font-semibold">3. RESPONSABILIDADES DO LOJISTA</h3>
              <p>O lojista é inteiramente responsável pelas informações publicadas, produtos, serviços, preços, atendimento, pagamentos, entregas e obrigações legais.</p>
              <p>O Portal Modelo não se responsabiliza por transações comerciais.</p>
            </div>

            <div>
              <h3 className="font-semibold">4. USO DO DASHBOARD</h3>
              <p>O dashboard é de uso exclusivo do lojista.</p>
              <p>O administrador não edita produtos, preços ou dados internos da loja.</p>
              <p>É proibida a publicação de conteúdo falso, ilegal ou ofensivo.</p>
            </div>

            <div>
              <h3 className="font-semibold">5. CONTEÚDO E IMAGENS</h3>
              <p>O lojista declara possuir direito de uso sobre todo o conteúdo publicado.</p>
              <p>O Portal pode remover materiais que violem estes termos ou a legislação.</p>
            </div>

            <div>
              <h3 className="font-semibold">6. SUSPENSÃO E CANCELAMENTO</h3>
              <p>O Portal pode suspender ou cancelar o acesso e remover conteúdos em caso de infração.</p>
            </div>

            <div>
              <h3 className="font-semibold">7. PRIVACIDADE</h3>
              <p>Os dados serão utilizados conforme a Política de Privacidade e a LGPD.</p>
            </div>

            <div>
              <h3 className="font-semibold">8. ACEITE</h3>
              <p>Ao aceitar estes termos, o lojista declara estar ciente e de acordo com todas as regras acima.</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/cadastro" className="bg-[#003049] text-white px-6 py-2 rounded hover:bg-[#162f7a] transition">
              Voltar ao Cadastro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}