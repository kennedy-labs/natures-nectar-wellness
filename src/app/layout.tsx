import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import localFont from "next/font/local";

import { QueryProvider } from "@/components/providers/query-provider";
import { getWhatsAppNumber } from "@/config/env.client";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  getMetadataBase,
  getSiteUrl,
} from "@/config/site";

import "./globals.css";

const dmSans = localFont({
  src: [
    {
      path: "../../public/fonts/dm-sans-latin-ext.woff2",
      weight: "100 1000",
      style: "normal",
    },
    {
      path: "../../public/fonts/dm-sans-latin.woff2",
      weight: "100 1000",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 900,
        alt: `${SITE_NAME} herbal wellness collection`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  verification: {
    google: "Qn9y4GxgT4GnLeYHoXfkjQEYr67BRIvoGfW7PCIvEbU",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = getSiteUrl();
  const whatsappNumber = getWhatsAppNumber();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "OnlineStore",
        "@id": `${siteUrl}/#store`,
        name: SITE_NAME,
        url: siteUrl,
        description: SITE_DESCRIPTION,
        logo: `${siteUrl}${DEFAULT_OG_IMAGE}`,
        priceRange: "KSh 1,200 - KSh 5,000",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Nairobi",
          addressCountry: "KE",
        },
        areaServed: {
          "@type": "Country",
          name: "Kenya",
        },
        ...(whatsappNumber ? { telephone: `+${whatsappNumber}` } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE_NAME,
        inLanguage: "en-KE",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/products?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
