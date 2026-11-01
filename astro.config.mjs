// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import sanity from "@sanity/astro";
import react from "@astrojs/react";
import { readSeoConfig, seoAssets } from "./config/seo.mjs";

const { site, noindex } = readSeoConfig();

// https://astro.build/config
export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // Scan the Studio and its lazy syntax-highlighting imports at startup.
      // Discovering them after an upload can invalidate already loaded chunks (504).
      include: [
        "sanity",
        "sanity/structure",
        "react-refractor",
        "refractor/bash",
        "refractor/javascript",
        "refractor/json",
        "refractor/jsx",
        "refractor/typescript",
        "@sanity/prism-groq",
      ],
    },
  },
  integrations: [
    sanity({
      projectId: "aly50hmg",
      dataset: "production",
      apiVersion: "2026-03-01",
      useCdn: false,
      studioBasePath: "/admin",
    }),
    react(),
    seoAssets({ site, noindex }),
  ],
});
