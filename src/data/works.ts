export type { Work } from "./site-types";

// Sanity's CDN resizes and crops images without downloading originals at build time.
export function getWorkImageUrl(src: string, width: number) {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("h", String(Math.round((width * 422) / 320)));
  url.searchParams.set("fit", "crop");
  url.searchParams.set("auto", "format");
  return url.toString();
}
