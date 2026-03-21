import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Instagram, Facebook, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      text: "Adorei o atendimento! As minhas unhas ficaram perfeitas e o ambiente é muito aconchegante.",
      author: "Maria Silva",
      service: "Esmaltação em Gel",
    },
    {
      text: "A Manicure Russa foi uma experiência incrível. Minhas unhas nunca estiveram tão bonitas!",
      author: "Ana Costa",
      service: "Manicure Russa",
    },
    {
      text: "Profissionalismo de primeira qualidade. Voltarei com certeza!",
      author: "Juliana Oliveira",
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
    window.open("https://calendar.google.com/calendar/appointments/schedules/AcZssZ1f55UFY4dEpLLjlPkUFcCQiyA4o0xCpeq96IfTV8d1ggmd0UK1Uj4GRP9b7_W1XBlAXSUG9LqG?gv=true", "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">Cícera Nails</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#sobre" className="text-sm hover:text-accent transition">Sobre</a>
            <a href="#servicos" className="text-sm hover:text-accent transition">Serviços</a>
            <a href="#galeria" className="text-sm hover:text-accent transition">Galeria</a>
            <a href="#contato" className="text-sm hover:text-accent transition">Contato</a>
          </nav>
          <Button onClick={handleGoogleCalendar} className="bg-accent text-accent-foreground hover:bg-secondary">
            Agendar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl md:text-6xl font-bold text-primary mb-4">
                  Elegância para seus pés e mãos
                </h2>
                <p className="text-lg text-foreground/80">
                  Transforme suas unhas em obras de arte com nossos serviços premium de esmaltação em gel, blindagem e manicure russa.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleGoogleCalendar}
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-secondary"
                >
                  Agendar Agora
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  onClick={() => document.getElementById('galeria')?.scrollIntoView({ behavior: 'smooth' })}
                  variant="outline"
                  size="lg"
                  className="border-accent text-accent hover:bg-accent/10"
                >
                  Ver Portfólio
                </Button>
              </div>
              <div className="flex gap-8 pt-4">
                <div>
                  <p className="text-sm text-foreground/60">Localização</p>
                  <p className="font-semibold text-foreground">Modelo, SC</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Horário</p>
                  <p className="font-semibold text-foreground">Seg-Sab: 9h-18h</p>
                </div>
              </div>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden bg-accent/20">
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663336310004/qgHJuZJWorBPZOwo.png"
                alt="Cícera Nails - Trabalho em Gel"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sobre Nós */}
      <section id="sobre" className="py-20 bg-accent/5">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold text-primary">Sobre Nós</h2>
            <p className="text-lg text-foreground/80">
              A Cícera Nails é um estúdio de esmaltação em gel dedicado a oferecer os melhores serviços de beleza para suas mãos e pés. Acreditamos que cada detalhe importa, e por isso nos comprometemos com a excelência em cada atendimento.
            </p>
            <p className="text-lg text-foreground/80">
              Com técnicas modernas e produtos de qualidade premium, transformamos suas unhas em verdadeiras obras de arte, transmitindo elegância e sofisticação em cada traço.
            </p>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="py-20">
        <div className="container">
          <h2 className="text-4xl font-bold text-primary mb-12 text-center">Nossos Serviços</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="border-accent/20 hover:border-accent/50 transition">
                <CardHeader>
                  <CardTitle className="text-primary">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-accent">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria */}
      <section id="galeria" className="py-20 bg-accent/5">
        <div className="container">
          <h2 className="text-4xl font-bold text-primary mb-12 text-center">Galeria de Trabalhos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <div key={index} className="relative overflow-hidden rounded-lg aspect-square bg-accent/10 hover:shadow-lg transition">
                <img 
                  src={image} 
                  alt={`Trabalho ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-4xl font-bold text-primary mb-12 text-center">O que Nossas Clientes Dizem</h2>
          <div className="max-w-2xl mx-auto">
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="pt-8">
                <p className="text-lg text-foreground/80 mb-6 italic">
                  "{testimonials[currentTestimonial].text}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary">{testimonials[currentTestimonial].author}</p>
                    <p className="text-sm text-foreground/60">{testimonials[currentTestimonial].service}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                    >
                      →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contato - Google Calendar Appointment Scheduling */}
      <section id="contato" className="py-20 bg-accent/5">
        <div className="container">
          <h2 className="text-4xl font-bold text-primary mb-12 text-center">Agende Seu Horário</h2>
          
          {/* Google Calendar Appointment Scheduling */}
          <div className="max-w-4xl mx-auto mb-12">
            <iframe 
              src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1f55UFY4dEpLLjlPkUFcCQiyA4o0xCpeq96IfTV8d1ggmd0UK1Uj4GRP9b7_W1XBlAXSUG9LqG?gv=true" 
              style={{ border: 0 }} 
              width="100%" 
              height="600" 
              frameBorder="0"
            />
          </div>

          {/* Informações de Contato */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-accent" />
                  WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a href="https://wa.me/5549999556220" className="text-accent hover:text-secondary transition">
                  (49) 99955-6220
                </a>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80">Modelo, SC</p>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="w-5 h-5 text-accent" />
                  Redes Sociais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a href="https://www.instagram.com/cicerakroth/" target="_blank" rel="noopener noreferrer" className="block text-accent hover:text-secondary transition">
                  Instagram
                </a>
                <a href="https://www.facebook.com/cicera.kroth" target="_blank" rel="noopener noreferrer" className="block text-accent hover:text-secondary transition">
                  Facebook
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Cícera Nails</h3>
              <p className="text-primary-foreground/80">
                Elegância para seus pés e mãos
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Serviços</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="#servicos" className="hover:text-primary-foreground transition">Esmaltação em Gel</a></li>
                <li><a href="#servicos" className="hover:text-primary-foreground transition">Blindagem</a></li>
                <li><a href="#servicos" className="hover:text-primary-foreground transition">Manicure Russa</a></li>
                <li><a href="#servicos" className="hover:text-primary-foreground transition">Pedicure</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="https://wa.me/5549999556220" className="hover:text-primary-foreground transition">WhatsApp</a></li>
                <li><a href="https://www.instagram.com/cicerakroth/" className="hover:text-primary-foreground transition">Instagram</a></li>
                <li><a href="https://www.facebook.com/cicera.kroth" className="hover:text-primary-foreground transition">Facebook</a></li>
                <li>Modelo, SC</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 pt-8 text-center text-primary-foreground/60">
            <p>&copy; 2026 Cícera Nails. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
