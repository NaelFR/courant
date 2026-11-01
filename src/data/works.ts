import type { ImageMetadata } from "astro";

const images = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/works/*.{png,jpg,jpeg,webp}",
  { eager: true }
);

const descriptions: Record<string, string> = {
  work1: "Salle de bain avec miroir éclairé",
  work2: "Installation électrique d’une buanderie",
  work3: "Salle de bain avec douche et meuble vasque",
  work4: "Tableau électrique",
  work5: "Baignoire et murs carrelés",
};

export const works = Object.entries(images)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, image]) => {
    const name = path.split("/").pop()!.replace(/\.[^.]+$/, "");

    return {
      id: name,
      src: image.default,
      alt: descriptions[name] ?? "",
    };
  });