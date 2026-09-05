import type { Metadata } from 'next';
import { Nunito_Sans } from 'next/font/google';
import './globals.css';

const nunito = Nunito_Sans({
  variable: '--font-nunito',
  subsets: ['latin'],
});


export const metadata: Metadata = {
  title: 'CASHPER — Your friendly ghost for the onchain world',
  description: 'Cashper watches, analyzes, and helps you navigate activity across Solana. Meet your friendly onchain companion.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
