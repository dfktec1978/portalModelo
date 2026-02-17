"use client";
import { useState } from "react";
import { ChevronRight, Instagram, Facebook, MapPin, Phone } from "lucide-react";
import Image from "next/image";

export default function CiceraNailsPage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const testimonials = [
    {
      text: "Adorei o atendimento! As minhas unhas ficaram perfeitas e o ambiente é muito aconchegante.",
      author: "Ana Júlia",
      service: "Esmaltação em Gel",
    },
    {
      text: "Profissionalismo de primeira qualidade. Voltarei com certeza!",
      author: "Simone",
      service: "Blindagem",
    },
  ];

  const services = [
    {
      title: "Esmaltação em Gel",
      description: "Durabilidade e brilho intenso que dura até 3 semanas.",
      benefits: ["Cores vibrantes", "Longa duração", "Acabamento perfeito"],
    },
    {
      title: "Blindagem",
      description: "Proteção e fortalecimento das unhas naturais.",
      benefits: ["Fortalece unhas", "Proteção total", "Crescimento saudável"],
    },
    {
      title: "Manicure Russa",
      description: "Técnica de cuticulagem a seco para acabamento impecável.",
      benefits: ["Precisão", "Saúde ungueal", "Acabamento premium"],
    },
    {
      title: "Pedicure",
      description: "Cuidado completo e luxuoso para seus pés.",
      benefits: ["Hidratação", "Limpeza profunda", "Relaxamento"],
    },
  ];

  const galleryImages = [
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/zQGperHeNKGFzgah.jpeg",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/UjXyvIWXZzTXcOfT.jpeg",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/VFECXThiLHRJPjlr.jpeg",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/aScOFwGPYkZofNjE.jpeg",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/ILsXxjlIeHHDtTUY.jpeg",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/MEsQTCaWtutrsyzt.jpeg",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/XUClvHqqSHFWCBVU.jpeg",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/dcNrlvfauFxORXcs.jpeg",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/QJKbhRvcYZeYyNTj.jpeg",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/xJrbxPagCEAWSlIr.jpeg",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/DmblNFbcGMksTAjE.jpeg",
    "https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/YvXWnBADcfNYwXZs.jpeg",
  ];

  const handleWhatsApp = () => {
    window.open("https://wa.me/5549999556220", "_blank");
  };

  const handleGoogleCalendar = () => {
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F5F3EF]/95 backdrop-blur border-b border-[#D4B2A7]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#3B2F2F]">Cícera Nails</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#sobre" className="text-sm hover:text-[#D8A7B1] transition">Sobre</a>
            <a href="#servicos" className="text-sm hover:text-[#D8A7B1] transition">Serviços</a>
            <a href="#galeria" className="text-sm hover:text-[#D8A7B1] transition">Galeria</a>
            <a href="https://wa.me/5549999556220" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-[#D8A7B1] transition">Contato</a>
          </nav>
          <button 
            onClick={handleGoogleCalendar}
            className="bg-[#D8A7B1] text-[#3B2F2F] px-6 py-2 rounded-lg hover:bg-[#D4B2A7] transition font-medium"
          >
            Agendar
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl md:text-6xl font-bold text-[#3B2F2F] mb-4">
                  Elegância para seus pés e mãos
                </h2>
                <p className="text-lg text-[#3B2F2F]/80">
                  Transforme suas unhas em obras de arte com nossos serviços premium de esmaltação em gel, blindagem e manicure russa.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleGoogleCalendar}
                  className="flex items-center justify-center gap-2 bg-[#D8A7B1] text-[#3B2F2F] px-8 py-3 rounded-lg hover:bg-[#D4B2A7] transition font-medium text-lg"
                >
                  Agendar Agora
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => document.getElementById('galeria')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-[#D8A7B1] text-[#D8A7B1] px-8 py-3 rounded-lg hover:bg-[#D8A7B1]/10 transition font-medium text-lg"
                >
                  Ver Portfólio
                </button>
              </div>
              <div className="flex gap-8 pt-4">
                <div>
                  <p className="text-sm text-[#3B2F2F]/60">Localização</p>
                  <p className="font-semibold text-[#3B2F2F]">Rua Nereu Ramos, 2884 - Bairro Iguaçú</p>
                </div>
                <div>
                  <p className="text-sm text-[#3B2F2F]/60">Horário</p>
                  <p className="font-semibold text-[#3B2F2F]">Agendamento</p>
                </div>
              </div>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image 
                src="/img/lojas/ciceranails/logo-hero.png"
                alt="Cícera Nails - Elegância para seus pés e mãos"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sobre Nós */}
      <section id="sobre" className="py-20 bg-[#D8A7B1]/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold text-[#3B2F2F]">Sobre Nós</h2>
            <p className="text-lg text-[#3B2F2F]/80">
              A Cícera Nails é um estúdio de esmaltação em gel dedicado a oferecer os melhores serviços de beleza para suas mãos e pés. Acreditamos que cada detalhe importa, e por isso nos comprometemos com a excelência em cada atendimento.
            </p>
            <p className="text-lg text-[#3B2F2F]/80">
              Com técnicas modernas e produtos de qualidade premium, transformamos suas unhas em verdadeiras obras de arte, transmitindo elegância e sofisticação em cada traço.
            </p>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-[#3B2F2F] mb-12 text-center">Nossos Serviços</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div key={index} className="bg-[#F9F6F2] border border-[#D8A7B1]/20 rounded-lg p-6 hover:border-[#D8A7B1]/50 transition">
                <h3 className="text-xl font-bold text-[#3B2F2F] mb-2">{service.title}</h3>
                <p className="text-[#3B2F2F]/70 mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-[#D8A7B1]">•</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria */}
      <section id="galeria" className="py-20 bg-[#D8A7B1]/5">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-[#3B2F2F] mb-12 text-center">Galeria de Trabalhos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <div key={index} className="relative overflow-hidden rounded-lg aspect-square bg-[#D8A7B1]/10 hover:shadow-lg transition">
                <Image 
                  src={image} 
                  alt={`Trabalho ${index + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition duration-300"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-[#3B2F2F] mb-12 text-center">O que Nossas Clientes Dizem</h2>
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#D8A7B1]/5 border border-[#D8A7B1]/20 rounded-lg p-8">
              <p className="text-lg text-[#3B2F2F]/80 mb-6 italic">
                &quot;{testimonials[currentTestimonial].text}&quot;
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#3B2F2F]">{testimonials[currentTestimonial].author}</p>
                  <p className="text-sm text-[#3B2F2F]/60">{testimonials[currentTestimonial].service}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                    className="border border-[#D8A7B1] px-3 py-1 rounded hover:bg-[#D8A7B1]/10 transition"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                    className="border border-[#D8A7B1] px-3 py-1 rounded hover:bg-[#D8A7B1]/10 transition"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-20 bg-[#D8A7B1]/5">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-[#3B2F2F] mb-12 text-center">Agende Seu Horário</h2>
          
          {/* Google Calendar */}
          <div className="max-w-4xl mx-auto mb-12 rounded-lg overflow-hidden">
            <iframe 
              src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1f55UFY4dEpLLjlPkUFcCQiyA4o0xCpeq96IfTV8d1ggmd0UK1Uj4GRP9b7_W1XBlAXSUG9LqG?gv=true" 
              style={{ border: 0 }} 
              width="100%" 
              height="600"
              title="Agende seu horário"
            />
          </div>

          {/* Informações de Contato */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-[#F9F6F2] border border-[#D8A7B1]/20 rounded-lg p-6">
              <h3 className="flex items-center gap-2 font-bold text-[#3B2F2F] mb-4">
                <Phone className="w-5 h-5 text-[#D8A7B1]" />
                WhatsApp
              </h3>
              <a href="https://wa.me/5549999556220" target="_blank" rel="noopener noreferrer" className="text-[#D8A7B1] hover:text-[#D4B2A7] transition">
                (49) 99955-6220
              </a>
            </div>

            <div className="bg-[#F9F6F2] border border-[#D8A7B1]/20 rounded-lg p-6">
              <h3 className="flex items-center gap-2 font-bold text-[#3B2F2F] mb-4">
                <MapPin className="w-5 h-5 text-[#D8A7B1]" />
                Localização
              </h3>
              <p className="text-[#3B2F2F]/80">Rua Nereu Ramos, 2884</p>
              <p className="text-[#3B2F2F]/80">Bairro Iguaçú - Modelo (SC)</p>
            </div>

            <div className="bg-[#F9F6F2] border border-[#D8A7B1]/20 rounded-lg p-6">
              <h3 className="flex items-center gap-2 font-bold text-[#3B2F2F] mb-4">
                <Instagram className="w-5 h-5 text-[#D8A7B1]" />
                Redes Sociais
              </h3>
              <div className="space-y-2">
                <a href="https://www.instagram.com/cicerakroth/" target="_blank" rel="noopener noreferrer" className="block text-[#D8A7B1] hover:text-[#D4B2A7] transition">
                  Instagram
                </a>
                <a href="https://www.facebook.com/cicera.kroth" target="_blank" rel="noopener noreferrer" className="block text-[#D8A7B1] hover:text-[#D4B2A7] transition">
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3B2F2F] text-[#F5F3EF] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Cícera Nails</h3>
              <p className="text-[#F5F3EF]/80">
                Elegância para seus pés e mãos
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Serviços</h4>
              <ul className="space-y-2 text-[#F5F3EF]/80">
                <li><a href="#servicos" className="hover:text-[#F5F3EF] transition">Esmaltação em Gel</a></li>
                <li><a href="#servicos" className="hover:text-[#F5F3EF] transition">Blindagem</a></li>
                <li><a href="#servicos" className="hover:text-[#F5F3EF] transition">Manicure Russa</a></li>
                <li><a href="#servicos" className="hover:text-[#F5F3EF] transition">Pedicure</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-[#F5F3EF]/80">
                <li><a href="https://wa.me/5549999556220" target="_blank" rel="noopener noreferrer" className="hover:text-[#F5F3EF] transition">WhatsApp</a></li>
                <li><a href="https://www.instagram.com/cicerakroth/" target="_blank" rel="noopener noreferrer" className="hover:text-[#F5F3EF] transition">Instagram</a></li>
                <li><a href="https://www.facebook.com/cicera.kroth" target="_blank" rel="noopener noreferrer" className="hover:text-[#F5F3EF] transition">Facebook</a></li>
                <li>Rua Nereu Ramos, 2884</li>
                <li>Bairro Iguaçú - Modelo (SC)</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#F5F3EF]/20 pt-8 text-center text-[#F5F3EF]/60">
            <p>&copy; 2026 Cícera Nails. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal de Agendamento */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#3B2F2F]">Agende Seu Horário</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <iframe 
                src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1f55UFY4dEpLLjlPkUFcCQiyA4o0xCpeq96IfTV8d1ggmd0UK1Uj4GRP9b7_W1XBlAXSUG9LqG?gv=true" 
                style={{ border: 0 }} 
                width="100%" 
                height="800" 
                frameBorder="0"
                title="Agendamento Cícera Nails"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
