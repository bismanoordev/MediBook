import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { siteUrl } from "@/lib/site";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MediBook | Book doctor appointments online",
    template: "%s | MediBook",
  },
  description: "Find trusted doctors, view live appointment availability, and book your next clinic visit online with MediBook.",
  applicationName: "MediBook",
  keywords: ["doctor appointment booking", "book a doctor online", "clinic appointments", "healthcare scheduling", "MediBook"],
  category: "Healthcare",
  alternates: {
    canonical: "/",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "MediBook",
    title: "MediBook | Book doctor appointments online",
    description: "Find trusted doctors, view live appointment availability, and book your next clinic visit online.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "MediBook — healthcare appointments made simple" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MediBook | Book doctor appointments online",
    description: "Find trusted doctors, view live appointment availability, and book your next clinic visit online.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icon",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
