import type { Metadata } from 'next';
import { DashboardScreen } from '@/components/cashper/dashboard';

export const metadata: Metadata = {
  title: 'Solana wallet intelligence',
  description: 'Monitor and understand public Solana wallet activity with Cashper.',
  alternates: {
    canonical: '/dashboard',
  },
  openGraph: {
    title: 'Solana wallet intelligence | Cashper',
    description: 'Monitor and understand public Solana wallet activity with Cashper.',
    url: '/dashboard',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana wallet intelligence | Cashper',
    description: 'Monitor and understand public Solana wallet activity with Cashper.',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
