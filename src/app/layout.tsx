import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ToastProvider } from "@/components/ui/toast";
import { SITE, organizationJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-cormorant", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Oriel — Luxury hotels, trips & experiences", template: "%s | Oriel" },
  description: SITE.description,
  applicationName: "Oriel",
  openGraph: { type: "website", siteName: "Oriel", locale: "en_US", url: SITE.url, title: "Oriel — Luxury hotels, trips & experiences", description: SITE.description },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1b2a4a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <JsonLd data={organizationJsonLd()} />
        <ToastProvider>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
