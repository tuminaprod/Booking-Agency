import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/book", "/booking", "/auth", "/wishlist", "/api"] }],
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
  };
}
