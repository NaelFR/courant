import { createImageUrlBuilder } from "@sanity/image-url";
import type { Work } from "./site-types";
export type { Work } from "./site-types";

// Sanity's CDN resizes and crops images without downloading originals at build time.
export function getWorkImageUrl(work: Work, width: number) {
  const [, , projectId, dataset] = new URL(work.src).pathname.split("/");
  return createImageUrlBuilder({ projectId, dataset })
    .image(work.photo ?? work.src)
    .width(width)
    .height(Math.round((width * 422) / 320))
    .fit("crop")
    .auto("format")
    .url();
}
