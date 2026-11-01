export const serviceIcons = [
  { title: "Prise", value: "plug" },
  { title: "Maison", value: "house-setup" },
  { title: "Éclair", value: "flash" },
  { title: "Tableau électrique", value: "electric-panel" },
  { title: "Bouclier", value: "shield" },
  { title: "Éclairage", value: "light" },
] as const;

export interface Service {
  icon: (typeof serviceIcons)[number]["value"];
  name: string;
  description: string;
  exemples: string[];
}

export interface Testimony {
  rate: number;
  text: string;
  author: string;
  location: string;
  type: string;
}

export interface Work {
  id: string;
  src: string;
  alt: string;
}

export interface SiteSettings {
  phone: string;
  email: string;
  street: string;
  postalCode: string;
  city: string;
  specialties: string[];
  siret: string;
  siteYear: number | null;
}
