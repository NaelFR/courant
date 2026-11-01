import { defineArrayMember, defineField, defineType } from "sanity";
import { defaultSettings } from "../../src/data/site-defaults";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Informations de l’entreprise",
  type: "document",
  initialValue: { ...defaultSettings },
  groups: [
    { name: "contact", title: "Coordonnées", default: true },
    { name: "company", title: "Entreprise" },
  ],
  fields: [
    defineField({
      name: "phone",
      title: "Téléphone",
      type: "string",
      group: "contact",
      validation: (rule) =>
        rule
          .required()
          .regex(/^\+?[\d\s().-]{6,25}$/, { name: "numéro de téléphone" }),
    }),
    defineField({
      name: "email",
      title: "Adresse mail",
      type: "string",
      group: "contact",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "street",
      title: "Rue et numéro",
      type: "string",
      group: "contact",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "postalCode",
      title: "Code postal",
      type: "string",
      group: "contact",
      validation: (rule) =>
        rule.required().regex(/^\d{5}$/, { name: "code postal à 5 chiffres" }),
    }),
    defineField({
      name: "city",
      title: "Ville",
      type: "string",
      group: "contact",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "specialties",
      title: "Spécialités",
      type: "array",
      group: "company",
      description:
        "Affichées dans cet ordre, séparées par un point médian, sous l’introduction et dans le pied de page.",
      of: [
        defineArrayMember({
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "siret",
      title: "SIRET",
      type: "string",
      group: "company",
      validation: (rule) =>
        rule
          .required()
          .custom(
            (value) =>
              !value ||
              /^\d{14}$/.test(value.replace(/\s/g, "")) ||
              "Le SIRET doit contenir 14 chiffres (espaces acceptés).",
          ),
    }),
    defineField({
      name: "siteYear",
      title: "Année du pied de page (facultatif)",
      type: "number",
      group: "company",
      description:
        "Laisser vide pour afficher automatiquement l’année courante, sans mise à jour annuelle. Renseigner une année pour forcer sa valeur.",
      validation: (rule) => rule.integer().min(1900).max(9999),
    }),
  ],
  preview: { prepare: () => ({ title: "Informations de l’entreprise" }) },
});
