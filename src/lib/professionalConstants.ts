export const PROFESSIONAL_CATEGORIES = {
  SAUDE: [
    "Médico",
    "Dentista",
    "Psicólogo",
    "Fisioterapeuta",
    "Nutricionista",
    "Fonoaudiólogo"
  ],
  JURIDICO: [
    "Advogado",
    "Contador",
    "Despachante"
  ],
  CONSTRUCAO: [
    "Pedreiro",
    "Eletricista",
    "Encanador",
    "Pintor",
    "Marceneiro",
    "Arquiteto"
  ],
  BELEZA: [
    "Cabeleireiro",
    "Manicure",
    "Esteticista",
    "Maquiador",
    "Barbeiro"
  ],
  SERVICOS_GERAIS: [
    "Diarista",
    "Faxineira",
    "Cuidador(a) de idosos",
    "Babá"
  ],
  AUTOMOTIVO: [
    "Mecânico",
    "Auto Elétrica",
    "Guincho",
    "Lavação"
  ],
  EDUCACAO_TEC: [
    "Professor particular",
    "Reforço escolar",
    "Técnico em informática",
    "Designer gráfico",
    "Desenvolvedor"
  ],
  EVENTOS: [
    "Fotógrafo",
    "DJ",
    "Decorador",
    "Buffet",
    "Som e iluminação"
  ]
};

// Flatten categories for dropdown
export const ALL_CATEGORIES = Object.values(PROFESSIONAL_CATEGORIES).flat();