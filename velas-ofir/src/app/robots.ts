import type { MetadataRoute } from "next";
import { site } from "@/platform/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        "/carrinho",
        "/minha-conta",
        "/conta",
        "/compra/",
        "/boas-vindas",
        "/esta-indo-embora",
        "/sorteador",
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
