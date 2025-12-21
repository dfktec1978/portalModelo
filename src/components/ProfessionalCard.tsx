import Image from 'next/image';
import { type Professional } from '@/lib/professionalQueries';

interface ProfessionalCardProps {
  professional: Professional;
}

export default function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const handleContact = () => {
    if (professional.phone) {
      const phoneNumber = professional.phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${phoneNumber}`, '_blank');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
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

      <p className="text-sm text-gray-600 mt-2 line-clamp-3">{professional.description}</p>

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
    </div>
  );
}