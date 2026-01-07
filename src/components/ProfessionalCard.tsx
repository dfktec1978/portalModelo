import Image from 'next/image';
import { type Professional } from '@/lib/professionalQueries';
import DOMPurify from 'isomorphic-dompurify';
import Link from 'next/link';

interface ProfessionalCardProps {
  professional: Professional;
  onClick?: () => void;
}

/* helper simples para decodificar entidades */
function decodeEntities(input: string) {
  if (!input) return "";
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export default function ProfessionalCard({ professional, onClick }: ProfessionalCardProps) {
  const handleContact = () => {
    if (professional.phone) {
      const phoneNumber = professional.phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${phoneNumber}`, '_blank');
    }
  };

  const rawDesc = professional.description || "";
  const decoded = decodeEntities(rawDesc);
  const safeHtml = DOMPurify.sanitize(decoded);
  const contentSafe = DOMPurify.sanitize(professional.content || '');
  const summarySafe = DOMPurify.sanitize(professional.summary || '');
  const safe = DOMPurify.sanitize(professional.description || '');

  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
    >
      {professional.profile_image && (
        <div className="mb-4">
          <Image
            src={professional.profile_image}
            alt={professional.name}
            width={100}
            height={100}
            className="w-24 h-24 rounded-full object-cover mx-auto"
          />
        </div>
      )}
      <h3 className="text-xl font-semibold text-center text-[#003049]">{professional.name}</h3>
      <p className="text-gray-600 text-center font-medium">{professional.category}</p>
      {professional.specialty && (
        <p className="text-sm text-gray-500 text-center mt-1">{professional.specialty}</p>
      )}

      {/* Rating */}
      <div className="flex items-center justify-center gap-1 mt-2 mb-3">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-sm ${i < Math.floor(professional.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
            ⭐
          </span>
        ))}
        <span className="text-xs text-gray-500 ml-1">
          ({professional.rating.toFixed(1)})
        </span>
      </div>

      <div
        className="text-sm text-gray-600 mt-2 line-clamp-3"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">{professional.city}</p>
        {professional.neighborhood && (
          <p className="text-xs text-gray-400">{professional.neighborhood}</p>
        )}
      </div>

      {professional.phone && (
        <button
          onClick={handleContact}
          className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          📱 WhatsApp
        </button>
      )}

      <div className="text-sm text-gray-600 mt-2 line-clamp-3"
        dangerouslySetInnerHTML={{ __html: summarySafe }}
      />
      <div dangerouslySetInnerHTML={{ __html: contentSafe }} />
      <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: safe }} />

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/dashboard/produtos`} className="px-3 py-2 bg-white/10 rounded">Gerenciar Produtos</Link>
        <Link href={`/lojas/${professional.id}/editar`} className="px-3 py-2 bg-white/10 rounded">Editar Loja</Link>
        <a
          href="https://vitrine.seguradora.exemplo"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-white hover:text-yellow-400"
        >
          Vitrine Segura
        </a>
        <a
          href="https://dkworks.exemplo"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-white hover:text-yellow-400"
        >
          DKWorks
        </a>
      </div>
    </div>
  );
}
