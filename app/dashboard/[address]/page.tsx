import type { Metadata } from 'next';
import { DashboardScreen } from '@/components/cashper/dashboard';

type AddressPageProps = {
  params: Promise<{ address: string }>;
};

function shortenAddress(address: string) {
  return address.length > 12 ? address.slice(0, 6) + '...' + address.slice(-4) : address;
}

export async function generateMetadata({ params }: AddressPageProps): Promise<Metadata> {
  const { address } = await params;
  const label = shortenAddress(address);

  return {
    title: 'Solana address ' + label,
    description: 'A Cashper on-chain activity view for the public Solana address ' + label + '.',
    alternates: {
      canonical: '/dashboard/' + encodeURIComponent(address),
    },
    openGraph: {
      title: 'Solana address ' + label + ' | Cashper',
      description: 'A Cashper on-chain activity view for the public Solana address ' + label + '.',
      url: '/dashboard/' + encodeURIComponent(address),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Solana address ' + label + ' | Cashper',
      description: 'A Cashper on-chain activity view for the public Solana address ' + label + '.',
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function AddressDashboardPage() {
  return <DashboardScreen />;
}
