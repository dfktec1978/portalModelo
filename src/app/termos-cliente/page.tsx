import Link from "next/link";

export default function TermosClientePage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-8">Termos de Uso – Cliente</h1>
          <h2 className="text-xl font-semibold mb-4">PORTAL MODELO</h2>

          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="font-semibold">1. SOBRE O PORTAL</h3>
              <p>O Portal Modelo é uma plataforma digital destinada à divulgação de lojas, profissionais, serviços e classificados locais.</p>
              <p>O Portal não vende produtos nem presta serviços diretamente, atuando apenas como meio de divulgação e aproximação.</p>
            </div>

            <div>
              <h3 className="font-semibold">2. USO DA PLATAFORMA</h3>
              <p>Como cliente, você pode visualizar anúncios, lojas, profissionais e conteúdos do portal, além de entrar em contato com anunciantes por telefone, WhatsApp, e-mail ou redes sociais.</p>
              <p>Compras e contratações são feitas diretamente com o lojista ou profissional.</p>
            </div>

            <div>
              <h3 className="font-semibold">3. CLASSIFICADOS</h3>
              <p>Clientes não publicam anúncios diretamente.</p>
              <p>Para anunciar, é necessário enviar uma solicitação via formulário, com informações e até 3 imagens.</p>
              <p>Todos os anúncios passam por análise e aprovação do administrador.</p>
            </div>

            <div>
              <h3 className="font-semibold">4. RESPONSABILIDADES</h3>
              <p>O cliente é responsável pelas informações fornecidas no cadastro.</p>
              <p>Pagamentos, entregas, garantias e serviços são de responsabilidade exclusiva do anunciante.</p>
              <p>O Portal Modelo não se responsabiliza por prejuízos, atrasos ou conflitos comerciais.</p>
            </div>

            <div>
              <h3 className="font-semibold">5. MODERAÇÃO</h3>
              <p>O Portal pode remover conteúdos, suspender ou excluir contas e alterar regras a qualquer momento.</p>
            </div>

            <div>
              <h3 className="font-semibold">6. PRIVACIDADE</h3>
              <p>Os dados fornecidos serão utilizados conforme a Política de Privacidade e a LGPD.</p>
            </div>

            <div>
              <h3 className="font-semibold">7. ACEITE</h3>
              <p>Ao aceitar estes termos, o cliente declara estar ciente e de acordo com todas as regras acima.</p>
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