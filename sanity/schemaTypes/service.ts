import { defineArrayMember, defineField, defineType } from "sanity";
import { serviceIcons } from "../../src/data/site-types";

export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
  initialValue: { icon: "plug", order: 0 },
  fields: [
    defineField({
      name: "name",
      title: "Nom",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "icon",
      title: "Icône",
      type: "string",
      options: { list: [...serviceIcons] },
      validation: (rule) =>
        rule
          .required()
          .custom(
            (value) =>
              !value ||
              serviceIcons.some((icon) => icon.value === value) ||
              "Choisir une icône de la liste.",
          ),
    }),
    defineField({
      name: "exemples",
      title: "Exemples de prestations",
      type: "array",
      of: [
        defineArrayMember({
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "order",
      title: "Ordre d’affichage",
      description: "Les plus petits nombres apparaissent en premier.",
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
  preview: { select: { title: "name", subtitle: "description" } },
});
