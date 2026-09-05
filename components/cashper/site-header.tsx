'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Menu, X, Ghost } from 'lucide-react';
import styles from './site-header.module.css';

export type SiteHeaderItem = { label: string; href: string };

type SiteHeaderProps = {
  theme?: 'blue' | 'cream';
  navItems?: SiteHeaderItem[];
  currentLabel?: string;
};

export function SiteHeader({ theme = 'blue', navItems = [], currentLabel }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const themeClass = theme === 'cream' ? styles.cream : styles.blue;

  return <header className={`${styles.header} ${themeClass}`}>
    <Link href="/" className={styles.brand} aria-label="Cashper home" onClick={closeMenu}>
      <Ghost size={29} strokeWidth={2.5} />
      <span>CASHPER</span>
    </Link>
    <nav id="site-navigation" className={`${styles.nav} ${menuOpen ? styles.open : ''}`} aria-label="Main navigation">
      {navItems.map((item) => item.href.startsWith('#') ? <a href={item.href} key={item.href} onClick={closeMenu}>{item.label}</a> : <Link href={item.href} key={item.href} onClick={closeMenu}>{item.label}</Link>)}
    </nav>
    <div className={styles.actions}>
      {currentLabel && <span className={styles.currentLabel}>{currentLabel}</span>}
      <Link className={styles.docsAction} href="/docs" aria-label="Open Cashper docs"><span className={styles.buttonLabel}>Docs</span><BookOpen size={17} aria-hidden="true" /></Link>
      <Link className={styles.launchAction} href="/dashboard" aria-label="Launch Cashper app"><span className={styles.buttonLabel}>Launch App</span><ArrowUpRight size={17} aria-hidden="true" /></Link>
      <button className={styles.menuButton} type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="site-navigation">{menuOpen ? <X /> : <Menu />}</button>
    </div>
  </header>;
}
