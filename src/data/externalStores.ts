export type ExternalStore = {
  id: string;
  store_name: string;
  description?: string;
  logo?: string;
  external_url?: string;
  category?: string;
  location?: string;
};

// Lojas externas configuradas via código. Adicione aqui as lojas que já
// possuem site próprio e que você quer agregar ao portal.
const externalStores: ExternalStore[] = [
  {
    id: "dkworks",
    store_name: "DKWorks Studio",
    description: "Criação de sites profissionais, marketing digital, consultoria empresarial em TI e treinamentos",
    logo: "/img/logos/dkLogo.png",
    external_url: "https://dkworksstudio.base44.app/",
    category: "Serviços",
    location: "Modelo-SC",
  },
  {
    id: "vitrine-segura",
    store_name: "Vitrine Segura",
    description: "Achadinhos Úteis - Os melhores produtos do Mercado Livre hoje",
    logo: "/img/logos/vitrineSegura.png",
    external_url: "https://vitrine-segura.vercel.app/",
    category: "Produtos",
    location: "Modelo-SC",
  },
];

export default externalStores;
