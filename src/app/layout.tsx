import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Quantum Computing Scientific Lineage — Many Worlds Capital",
  description:
    "Explore the connections between quantum computing researchers — advisors, collaborators, and co-authors.",
  openGraph: {
    title: "Quantum Computing Scientific Lineage",
    description:
      "Interactive graph mapping 80+ quantum computing researchers and their connections.",
    url: "https://lineage.manyworldscapital.com",
    siteName: "Many Worlds Capital",
    images: [
      {
        url: "/og-image.png",
        width: 512,
        height: 512,
        alt: "Many Worlds Capital",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Quantum Computing Scientific Lineage",
    description:
      "Interactive graph mapping 80+ quantum computing researchers and their connections.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
