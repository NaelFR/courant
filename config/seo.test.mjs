import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { seoAssets, sitemapXml } from "./seo.mjs";

test("sitemap includes actual public pages, excludes Studio and 404, deduplicates", () => {
  const xml = sitemapXml("https://example.com", [
    { pathname: "" }, { pathname: "/" }, { pathname: "mentions-legales/" },
    { pathname: "admin/" }, { pathname: "admin/structure/" }, { pathname: "404" },
  ]);
  assert.equal((xml.match(/<url>/g) || []).length, 2);
  assert.ok(xml.includes("https://example.com/mentions-legales/"));
  assert.ok(!xml.includes("admin"));
  assert.ok(!xml.includes("404"));
  assert.ok(!xml.includes("lastmod"));
});

for (const noindex of [false, true]) {
  test(`build output applies correct indexing policy (preview=${noindex})`, async () => {
    const folder = await mkdtemp(join(tmpdir(), "courant-seo-"));
    const dir = pathToFileURL(folder + "/");
    try {
      await mkdir(new URL("admin/", dir));
      await writeFile(new URL("index.html", dir), "<html><head><title>Courant</title></head><body>Public</body></html>");
      await writeFile(new URL("admin/index.html", dir), "<html><head></head><body>Studio</body></html>");
      await seoAssets({ site: "https://example.com", noindex }).hooks["astro:build:done"]({
        dir, pages: [{ pathname: "/" }, { pathname: "admin/" }],
      });
      assert.match(await readFile(new URL("admin/index.html", dir), "utf8"), /noindex/);
      const home = await readFile(new URL("index.html", dir), "utf8");
      assert.equal(home.includes("noindex"), noindex);
      assert.ok(home.includes("<body>Public</body>"));
      const robots = await readFile(new URL("robots.txt", dir), "utf8");
      assert.equal(robots.includes("Sitemap:"), !noindex);
      assert.ok(!robots.includes("Disallow"));
      const sitemap = await readFile(new URL("sitemap.xml", dir), "utf8");
      assert.equal(sitemap.includes("<url>"), !noindex);
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });
}
