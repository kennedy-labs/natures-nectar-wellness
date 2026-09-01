import type { Metadata } from "next";
import localFont from "next/font/local";

import { QueryProvider } from "@/components/providers/query-provider";

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
  title: {
    default: "Nature's Nectar Wellness",
    template: "%s | Nature's Nectar Wellness",
  },
  description:
    "Natural wellness products — herbal supplements, teas, and health products delivered across Kenya.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
