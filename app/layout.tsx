import type { Metadata } from 'next';
import { Nunito_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toast';

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cashperghost.com';
const siteName = 'Cashper';
const description = 'Cashper watches, analyzes, and helps you understand public on-chain activity across Solana.';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      logo: siteUrl + '/favicon.svg',
      description,
      sameAs: ['https://x.com/ghostcashper', 'https://github.com/cashperdev/app.git'],
    },
    {
      '@type': 'WebApplication',
      name: siteName,
      url: siteUrl,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  ],
};

const nunito = Nunito_Sans({
  variable: '--font-nunito',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Cashper - Your friendly ghost for the on-chain world',
    template: '%s | Cashper',
  },
  description,
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg', apple: '/favicon.svg' },
  keywords: ['Solana wallet analytics', 'on-chain activity', 'crypto wallet monitor', 'Solana address analysis'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName,
    url: siteUrl,
    title: 'Cashper - Your friendly ghost for the on-chain world',
    description,
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Cashper Solana on-chain intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cashper - Your friendly ghost for the on-chain world',
    description,
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
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
    <html lang="en">
      <body className={nunito.variable + ' antialiased'}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
