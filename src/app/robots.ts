import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/categories",
          "/about",
          "/faq",
          "/privacy-policy",
          "/terms",
          "/delivery-refund-policy",
        ],
        disallow: ["/admin", "/admin2", "/checkout", "/orders", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
