import { defineField, defineType } from "sanity";

export const testimony = defineType({
  name: "testimony",
  title: "Avis client",
  type: "document",
  initialValue: { rate: 5, order: 0 },
  fields: [
    defineField({
      name: "rate",
      title: "Note sur 5",
      type: "number",
      validation: (rule) => rule.required().integer().min(1).max(5),
    }),
    defineField({
      name: "text",
      title: "Texte de l’avis",
      type: "text",
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "author",
      title: "Auteur",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "location", title: "Ville", type: "string" }),
    defineField({ name: "type", title: "Type de prestation", type: "string" }),
    defineField({
      name: "order",
      title: "Ordre d’affichage",
      type: "number",
      validation: (rule) => rule.required().integer().min(0),
    }),
  ],
  orderings: [
    {
      title: "Ordre d’affichage",
      name: "displayOrder",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: { select: { title: "author", subtitle: "text" } },
});
