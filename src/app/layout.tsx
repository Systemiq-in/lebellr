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
  metadataBase: new URL('https://lebellr.systemiq.in'),
  title: {
    default: 'Labellr | Industrial-Grade Label Design Studio',
    template: '%s | Labellr'
  },
  description: 'Design pixel-perfect physical sticker sheets and compile print-ready PDFs entirely in the browser with zero server overhead and complete data privacy.',
  alternates: {
    canonical: '/',
  },
  keywords: ['label design', 'barcode generator', 'thermal printing', 'avery labels', 'pdf compiler', 'inventory management', 'ghs compliance', 'sticker design'],
  authors: [{ name: 'SystemIQ' }],
  creator: 'SystemIQ',
  publisher: 'SystemIQ',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lebellr.systemiq.in',
    title: 'Labellr | Industrial-Grade Label Design Studio',
    description: 'Design pixel-perfect physical sticker sheets and compile print-ready PDFs entirely in the browser. Zero server overhead and complete data privacy.',
    siteName: 'Labellr',
    images: [
      {
        url: '/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Labellr Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Labellr | Industrial-Grade Label Design Studio',
    description: 'Design pixel-perfect physical sticker sheets and compile print-ready PDFs entirely in the browser.',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Labellr",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "WebBrowser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "Industrial-grade client-side label design studio and high-fidelity print generation workbench. Generate barcodes and sticker sheets directly in your browser.",
              "url": "https://lebellr.systemiq.in"
            })
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
