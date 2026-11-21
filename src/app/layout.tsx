import type { Metadata } from "next";
import localFont from "next/font/local";

import { QueryProvider } from "@/components/providers/query-provider";
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
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    logo: `${siteUrl}${DEFAULT_OG_IMAGE}`,
    areaServed: {
      "@type": "Country",
      name: "Kenya",
    },
    ...(whatsappNumber ? { telephone: whatsappNumber } : {}),
  };

  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
