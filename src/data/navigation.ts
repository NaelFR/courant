export interface NavigationLink {
  href: string;
  label: string;
}

export function getNavigation(
  hasWorks: boolean,
  hasTestimonies: boolean,
): NavigationLink[] {
  return [
    { href: "/#services", label: "Services" },
    { href: "/#pourquoi", label: "Pourquoi Courant ?" },
    ...(hasWorks ? [{ href: "/#realisations", label: "Réalisations" }] : []),
    ...(hasTestimonies ? [{ href: "/#avis", label: "Avis clients" }] : []),
  ];
}

export const instagramUrl = "https://www.instagram.com/courantabc/";
