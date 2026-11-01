import type { Service, SiteSettings } from "./site-types";

export const defaultSettings: SiteSettings = {
  phone: "06 14 81 27 13",
  email: "courant.btp@gmail.com",
  street: "24 rue du Chevalier de la Barre",
  postalCode: "59184",
  city: "Sainghin-en-Weppes",
  specialties: ["Électricité", "Dépannage", "Aménagement d’intérieur"],
  siret: "999 368 145 00010",
  siteYear: null,
};

export const defaultServices: Service[] = [
  {
    icon: "plug",
    name: "Installation électrique",
    description:
      "Création ou extension de votre installation : circuits, prises, interrupteurs, éclairage et raccordements.",
    exemples: [
      "Maison, appartement, local pro",
      "Ajout de prises et de circuits",
      "Raccordement des équipements",
    ],
  },
  {
    icon: "house-setup",
    name: "Rénovation & mise aux normes",
    description:
      "Remise à neuf d'une installation ancienne pour la rendre sûre et conforme, sans tout casser.",
    exemples: [
      "Remplacement du câblage",
      "Mise à la terre",
      "Préparation au Consuel",
    ],
  },
  {
    icon: "flash",
    name: "Dépannage & urgences",
    description:
      "Création ou extension de votre installation : circuits, prises, interrupteurs, éclairage et raccordements.",
    exemples: [
      "Maison, appartement, local pro",
      "Ajout de prises et de circuits",
      "Raccordement des équipements",
    ],
  },
  {
    icon: "electric-panel",
    name: "Tableau électrique",
    description:
      "Création ou extension de votre installation : circuits, prises, interrupteurs, éclairage et raccordements.",
    exemples: [
      "Maison, appartement, local pro",
      "Ajout de prises et de circuits",
      "Raccordement des équipements",
    ],
  },
  {
    icon: "shield",
    name: "Diagnostic & sécurité",
    description:
      "Création ou extension de votre installation : circuits, prises, interrupteurs, éclairage et raccordements.",
    exemples: [
      "Maison, appartement, local pro",
      "Ajout de prises et de circuits",
      "Raccordement des équipements",
    ],
  },
  {
    icon: "light",
    name: "Aménagement d'intérieur",
    description:
      "Création ou extension de votre installation : circuits, prises, interrupteurs, éclairage et raccordements.",
    exemples: [
      "Maison, appartement, local pro",
      "Ajout de prises et de circuits",
      "Raccordement des équipements",
    ],
  },
];
