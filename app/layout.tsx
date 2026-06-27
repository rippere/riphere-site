import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
});

const SITE = "https://www.riphere.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Ben Rippere — Behavioral scientist building AI systems",
  description:
    "Behavioral scientist building AI systems that think like teams and act like operators. Neuroscience-grounded AI: agentic decision intelligence, neural content scoring, and self-healing infrastructure.",
  authors: [{ name: "Ben Rippere" }],
  alternates: { canonical: SITE },
  openGraph: {
    type: "website",
    url: SITE,
    title: "Ben Rippere — Behavioral scientist building AI systems",
    description:
      "Neuroscience-grounded AI systems: agentic decision intelligence, neural content scoring, and self-healing infrastructure. Building in public.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jbMono.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
