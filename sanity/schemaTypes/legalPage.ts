import { defineField, defineType } from "sanity";

export const legalPage = defineType({
  name: "legalPage",
  title: "Page légale",
  type: "document",
  fields: [
    defineField({
      name: "slug",
      title: "Page",
      type: "string",
      options: {
        list: [
          { title: "Mentions légales", value: "mentions-legales" },
          {
            title: "Politique de confidentialité",
            value: "politique-de-confidentialite",
          },
        ],
      },
      validation: (rule) =>
        rule.required().custom(async (value, context) => {
          if (!value) return true;
          const id = context.document?._id.replace(/^drafts\./, "");
          const exists = await context
            .getClient({ apiVersion: "2026-03-01" })
            .fetch<boolean>(
              `count(*[_type == "legalPage" && slug == $slug && !(_id in [$id, $draftId])]) > 0`,
              { slug: value, id, draftId: `drafts.${id}` },
            );
          return !exists || "Une page de ce type existe déjà.";
        }),
    }),
    defineField({
      name: "title",
      title: "Titre",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "lastUpdated",
      title: "Date de dernière mise à jour",
      type: "date",
      options: { dateFormat: "DD/MM/YYYY" },
      description: "Date affichée sous le titre de la page légale.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "content",
      title: "Contenu",
      type: "text",
      rows: 20,
      description:
        "Renseigner les textes validés pour votre entreprise. Séparer les paragraphes par une ligne vide. La page et son lien apparaissent après publication et reconstruction du site.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: "title", subtitle: "slug" } },
});
