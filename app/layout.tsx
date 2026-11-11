import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Josefin_Sans, Poppins } from "next/font/google";
import { connection } from "next/server";
import { RepositoryProvider } from "@/components/providers/RepositoryProvider";
import { ReviewMode } from "@/components/providers/ReviewMode";
import { ToastProvider } from "@/components/ui/Toast";
import { SITE } from "@/lib/site";
import "./globals.css";

// Self-hosted by next/font at build time: no runtime requests to Google.
const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-josefin",
  display: "swap",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Salon Rx · Hair salon in Barrie, Ontario", template: "%s · Salon Rx Barrie" },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_CA",
    title: "Salon Rx · your prescription to beauty",
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0e12" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Render per request so the Content-Security-Policy nonce set in proxy.ts reaches the page scripts.
  await connection();
  return (
    <html lang="en" className={`${josefin.variable} ${poppins.variable} ${cormorant.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <RepositoryProvider>
          <ToastProvider>{children}</ToastProvider>
        </RepositoryProvider>
        <ReviewMode />
      </body>
    </html>
  );
}
