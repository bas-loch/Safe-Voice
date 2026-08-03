import type { APIRoute } from "astro";

const paths = [
  "/",
  "/carte",
  "/mentions-legales",
  "/it/",
  "/it/carte",
  "/it/mentions-legales",
  "/en/",
  "/en/carte",
  "/en/mentions-legales",
];

export const GET: APIRoute = ({ site }) => {
  const base = site?.toString().replace(/\/$/, "") ?? "";
  const urls = paths
    .map((path) => `  <url><loc>${base}${path}</loc></url>`)
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml" },
  });
};
