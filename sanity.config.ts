import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { service } from "./sanity/schemaTypes/service";
import { testimony } from "./sanity/schemaTypes/testimony";
import { siteSettings } from "./sanity/schemaTypes/siteSettings";
import { legalPage } from "./sanity/schemaTypes/legalPage";
export default defineConfig({
  name: "my-project",
  title: "Courant",
  projectId: "aly50hmg",
  dataset: "production",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Contenu du site")
          .items([
            S.listItem()
              .title("Informations de l’entreprise")
              .id("siteSettings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings"),
              ),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (item) => item.getId() !== "siteSettings",
            ),
          ]),
    }),
  ],
  document: {
    actions: (actions, context) =>
      context.schemaType === "siteSettings"
        ? actions.filter(
            ({ action }) => action !== "duplicate" && action !== "delete",
          )
        : actions,
    newDocumentOptions: (options) =>
      options.filter(({ templateId }) => templateId !== "siteSettings"),
  },
  schema: {
    templates: (templates) =>
      templates.filter(({ schemaType }) => schemaType !== "siteSettings"),
    types: [
      service,
      testimony,
      siteSettings,
      legalPage,
      {
        name: "realisation",
        title: "Réalisation",
        type: "document",
        initialValue: { order: 0 },
        fields: [
          { name: "titre", title: "Titre", type: "string" },
          {
            name: "photo",
            title: "Photo",
            type: "image",
            options: { hotspot: true },
          },
          {
            name: "description",
            title: "Description de la photo",
            type: "string",
          },
          {
            name: "order",
            title: "Ordre d’affichage",
            type: "number",
            description:
              "Les plus petits nombres apparaissent en premier. À ordre égal, les plus récentes sont affichées en premier.",
            validation: (rule) => rule.integer().min(0),
          },
        ],
        orderings: [
          {
            title: "Ordre d’affichage",
            name: "displayOrder",
            by: [{ field: "order", direction: "asc" }],
          },
        ],
        preview: {
          select: { title: "titre", media: "photo", subtitle: "description" },
        },
      },
    ],
  },
});
