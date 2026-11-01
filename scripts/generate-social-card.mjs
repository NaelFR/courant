import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Adapt the burgundy business-card front to the 1200 × 630 social format.
// Cal Sans text is outlined in the SVG so rendering is independent of system fonts.
// The original font and its license are preserved in ./fonts/.

const logo = await sharp(fileURLToPath(new URL("../src/assets/logo-orange.png", import.meta.url)))
  .resize({ width: 1200 }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#3c0a19" } })
  .composite([
    { input: logo, left: 0, top: 226 },
    { input: fileURLToPath(new URL("./social-card-text.svg", import.meta.url)), left: 0, top: 0 },
  ])
  .png().toFile(fileURLToPath(new URL("../public/social-card.png", import.meta.url)));
