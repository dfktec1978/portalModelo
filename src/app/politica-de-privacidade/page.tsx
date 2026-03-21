import Link from "next/link";

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-8">Política de Privacidade</h1>
          <h2 className="text-xl font-semibold mb-4">PORTAL MODELO</h2>

          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="font-semibold">1. Dados coletados</h3>
              <p>Coletamos dados necessários para cadastro, autenticação e uso do portal, como nome, e-mail, telefone e dados da loja.</p>
            </div>

            <div>
              <h3 className="font-semibold">2. Finalidade do uso</h3>
              <p>Os dados são utilizados para viabilizar acesso à plataforma, gestão de conta, publicação de conteúdo e comunicação com usuários.</p>
            </div>

            <div>
              <h3 className="font-semibold">3. Compartilhamento</h3>
              <p>Não comercializamos dados pessoais. Dados podem ser compartilhados apenas quando necessário para operação do serviço ou obrigação legal.</p>
            </div>

            <div>
              <h3 className="font-semibold">4. Segurança</h3>
              <p>Adotamos medidas técnicas e administrativas para proteger os dados, sem prejuízo dos riscos inerentes à internet.</p>
            </div>

            <div>
              <h3 className="font-semibold">5. Direitos do titular</h3>
              <p>Você pode solicitar atualização, correção ou exclusão dos seus dados, observadas as hipóteses legais de retenção.</p>
            </div>

            <div>
              <h3 className="font-semibold">6. LGPD</h3>
              <p>O tratamento de dados segue os princípios e regras da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
            </div>

            <div>
              <h3 className="font-semibold">7. Atualizações desta política</h3>
              <p>Esta política pode ser atualizada periodicamente. A versão vigente estará sempre disponível nesta página.</p>
            </div>
          </div>

          <div className="text-center mt-8 flex items-center justify-center gap-3">
            <Link href="/cadastro" className="bg-[#003049] text-white px-6 py-2 rounded hover:bg-[#162f7a] transition">
              Voltar ao Cadastro
            </Link>
            <Link href="/cadastro-logista" className="bg-gray-100 text-[#003049] px-6 py-2 rounded hover:bg-gray-200 transition border border-gray-300">
              Cadastro Lojista
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
