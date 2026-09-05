'use client';

import { useState } from 'react';
import { ArrowRight, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SolanaMark } from './solana-mark';
import styles from './search-sheet.module.css';

export type CashperPanel = 'monitor' | 'analyze' | 'protect' | 'ecosystem' | null;

const content = {
  monitor: { eyebrow: 'MONITOR', title: 'See what is happening on‑chain.', copy: 'Search any wallet or token address to view factual activity.' },
  analyze: { eyebrow: 'ANALYZE', title: 'Turn activity into clarity.', copy: 'Search an address for deterministic, evidence-backed insights.' },
} as const;

export function SearchSheet({ panel, onOpenChange }: { panel: CashperPanel; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isSearch = panel === 'monitor' || panel === 'analyze';

  function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    const value = address.trim();
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) {
      setError("That doesn't look like a valid Solana address.");
      return;
    }
    router.push(`/dashboard/${value}?tab=${panel}&window=7d`);
    onOpenChange(false);
  }

  return (
    <Sheet open={panel !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={styles.sheet}>
        {isSearch ? (
          <>
            <SheetHeader className={styles.header}>
              <span className={styles.eyebrow}>{content[panel].eyebrow}</span>
              <SheetTitle className={styles.title}>{content[panel].title}</SheetTitle>
              <SheetDescription className={styles.description}><span className={styles.solanaContext}><SolanaMark /> SOLANA</span>{content[panel].copy}</SheetDescription>
            </SheetHeader>
            <form onSubmit={submit} className={styles.form} noValidate>
              <label htmlFor="solana-address" className={styles.label}>Wallet address or token CA</label>
              <div className={styles.inputWrap}>
                <Search aria-hidden="true" size={19} />
                <input id="solana-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Search wallet or token address..." autoComplete="off" spellCheck="false" />
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button className={styles.submit} type="submit">{panel === 'monitor' ? 'Open Monitor' : 'Analyze address'} <ArrowRight size={18} /></button>
              <p className={styles.note}>Cashper reads public on-chain data. It never asks to connect your wallet.</p>
            </form>
          </>
        ) : panel === 'protect' ? (
          <div className={styles.comingSoon}>
            <span className={styles.icon}><ShieldCheck size={28} /></span>
            <span className={styles.eyebrow}>PROTECT</span>
            <SheetTitle className={styles.title}>Coming Soon</SheetTitle>
            <SheetDescription className={styles.description}>More context before you interact. CASHper Protect is being built for clearer risk awareness around on-chain activity.</SheetDescription>
            <span className={styles.disabled}>Coming Soon</span>
          </div>
        ) : (
          <div className={styles.comingSoon}>
            <span className={styles.icon}><Sparkles size={28} /></span>
            <span className={styles.eyebrow}>GHOST ECOSYSTEM</span>
            <SheetTitle className={styles.title}>Still taking shape.</SheetTitle>
            <SheetDescription className={styles.description}>This future module is not available yet. Monitor and Analyze are where CASHper starts today.</SheetDescription>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
