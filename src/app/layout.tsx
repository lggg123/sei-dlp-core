import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/providers/Web3Provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://yielddelta.com'),
  title: "Yield Delta - Dynamic Liquidity Vaults on SEI",
  description: "Yield Delta: AI-driven yield aggregation, concentrated liquidity optimization, and impermanent loss hedging on SEI EVM.",
  keywords: ["Yield Delta", "SEI", "DeFi", "Liquidity Vaults", "AI", "Yield Aggregation", "Concentrated Liquidity", "Impermanent Loss", "Blockchain"],
  authors: [{ name: "Yield Delta Team" }],
  creator: "Yield Delta",
  publisher: "Yield Delta",
  icons: {
    icon: [
      { url: '/favicon-16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon-32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/favicon-48.svg', sizes: '48x48', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/favicon-128.svg', sizes: '128x128', type: 'image/svg+xml' },
      { url: '/favicon-256.svg', sizes: '256x256', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Yield Delta - Dynamic Liquidity Vaults on SEI',
    description: 'Yield Delta: AI-driven yield aggregation, concentrated liquidity optimization, and impermanent loss hedging on SEI EVM.',
    url: 'https://yielddelta.com',
    siteName: 'Yield Delta',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Yield Delta - AI-driven yield aggregation and liquidity optimization on SEI',
      },
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Yield Delta Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yield Delta - Dynamic Liquidity Vaults on SEI',
    description: 'Yield Delta: AI-driven yield aggregation, concentrated liquidity optimization, and impermanent loss hedging on SEI EVM.',
    images: ['/api/og'],
  },
};

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#9b5de5',
    colorScheme: 'dark',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32.svg" sizes="32x32" type="image/svg+xml" />
        <link rel="icon" href="/favicon-16.svg" sizes="16x16" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon-128.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9b5de5" />
        <meta name="msapplication-TileColor" content="#9b5de5" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
