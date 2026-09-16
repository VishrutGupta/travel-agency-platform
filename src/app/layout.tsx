import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Alpine & Co. Expeditions — Curated Mountain Journeys & High Passes",
    template: "%s | Alpine & Co. Expeditions",
  },
  description:
    "Boutique mountain expedition and adventure agency dedicated to mindful high-altitude treks, immersive cultural journeys, and small-group explorations across Kashmir, Spiti, Ladakh, and India's wild terrains.",
  keywords: [
    "mountain treks",
    "kashmir great lakes trek",
    "spiti valley circuit",
    "ladakh expeditions",
    "himalayan adventure",
    "travel agency",
    "certified wilderness leaders",
  ],
  authors: [{ name: "Alpine & Co. Expeditions" }],
  openGraph: {
    title: "Alpine & Co. Expeditions — Explore Beyond The Ordinary",
    description:
      "Curated high-altitude treks, mindful journeys, and small-group expeditions across the Himalayas.",
    type: "website",
    locale: "en_IN",
    siteName: "Alpine & Co. Expeditions",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#FAF9F6] text-[#1C1E21]">
        {children}
      </body>
    </html>
  );
}
