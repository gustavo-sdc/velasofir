import type { MetadataRoute } from "next";
import { site } from "@/platform/site";
import { publishedPosts } from "@/platform/server/blog";
import { products, workshops } from "@/platform/server/catalog";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalog, events, blog] = await Promise.all([
    products(),
    workshops(),
    publishedPosts(),
  ]);
  return [
    "",
    "/loja",
    "/workshops",
    "/conteudos",
    "/sobre",
    "/entregas",
    ...catalog.items.map((p) => `/velas/${p.slug}`),
    ...events.items.map((w) => `/workshops/${w.slug}`),
  ]
    .map((path) => ({ url: `${site.url}${path}` }))
    .concat(
      blog.items.map((post) => ({
        url: `${site.url}/conteudos/${post.slug}`,
        lastModified: post.updated_at,
      })),
    );
}
