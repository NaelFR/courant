import { sanityClient } from "sanity:client";
import { defaultServices, defaultSettings } from "../data/site-defaults";
import type {
  Service,
  SiteSettings,
  Testimony,
  Work,
  LegalPage,
} from "../data/site-types";

export const siteContentQuery = `{
  "settings": *[_type == "siteSettings" && _id == "siteSettings"][0]{
    phone, email, street, postalCode, city, specialties, siret, siteYear
  },
  "services": *[_type == "service"] | order(coalesce(order, 0) asc, _createdAt asc, _id asc){
    icon, name, description, "exemples": coalesce(exemples, [])
  },
  "testimonies": *[_type == "testimony"] | order(coalesce(order, 0) asc, _createdAt asc, _id asc){
    rate, text, author, "location": coalesce(location, ""), "type": coalesce(type, "")
  },
  "works": *[_type == "realisation" && defined(photo.asset->url)]
    | order(coalesce(order, 0) asc, _createdAt desc, _id asc){
      "id": _id,
      "src": photo.asset->url,
      photo,
      "alt": coalesce(description, titre, "Réalisation Courant")
  },
  "legalPages": *[_type == "legalPage" && slug in ["mentions-legales", "politique-de-confidentialite"] && length(title) > 0 && length(content) > 0]
    | order(_updatedAt desc){slug, title, lastUpdated, content}
}`;

interface SiteContent {
  settings: Partial<SiteSettings> | null;
  services: Service[];
  testimonies: Testimony[];
  works: Work[];
  legalPages: LegalPage[];
}

export async function getSiteContent() {
  const content = await sanityClient.fetch<SiteContent>(
    siteContentQuery,
    {},
    { perspective: "published" },
  );
  // Keep the current site usable until the first company settings and services are published.
  const settings = { ...defaultSettings };
  for (const key of Object.keys(defaultSettings) as (keyof SiteSettings)[]) {
    const value = content.settings?.[key];
    if (value !== null && value !== undefined)
      Object.assign(settings, { [key]: value });
  }
  return {
    settings,
    services: content.services.length ? content.services : defaultServices,
    // Only show reviews explicitly published in Sanity.
    testimonies: content.testimonies,
    works: content.works,
    legalPages: content.legalPages.filter(
      (page, index, pages) =>
        pages.findIndex((candidate) => candidate.slug === page.slug) === index,
    ),
  };
}

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
