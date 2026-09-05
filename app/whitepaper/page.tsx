import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/cashper/site-header';
import { ArrowRight, ArrowUpRight, Eye, Ghost, LockKeyhole, Network, ShieldCheck, Sparkles } from 'lucide-react';
import styles from '../docs/docs.module.css';

export const metadata: Metadata = {
  title: 'Whitepaper',
  description: 'Cashper whitepaper: the architecture, philosophy, and ecosystem vision for Solana on-chain intelligence.',
  alternates: { canonical: '/whitepaper' },
  openGraph: { title: 'Cashper Whitepaper', description: 'The architecture and philosophy behind Cashper.', url: '/whitepaper', type: 'article' },
  twitter: { card: 'summary_large_image', title: 'Cashper Whitepaper', description: 'The architecture and philosophy behind Cashper.' },
};

const architecture = ['Solana', 'Public Onchain Data', 'Cashper Data Layer', 'Activity Processing', 'Signal Engine', 'Ghost Intelligence', 'Ghost Report / Watch / Alerts', 'User'];
const principles = [
  { icon: Eye, title: 'Observation', body: 'Determine what happened. This is the Monitor layer.' },
  { icon: Sparkles, title: 'Interpretation', body: 'Organize activity into meaningful context. This is the Analyze layer.' },
  { icon: ShieldCheck, title: 'Awareness', body: 'Highlight events or interactions that may deserve closer inspection. This is the Protect layer.' },
];

export default function WhitepaperPage() {
  return <main className={styles.page}>
    <div className={styles.glow} aria-hidden="true" />
    <SiteHeader theme="cream" currentLabel="WHITEPAPER" navItems={[{ label: "Docs", href: "/docs" }, { label: "Roadmap", href: "/roadmap" }]} />

    <section className={styles.hero} aria-labelledby="whitepaper-title">
      <div className={styles.heroCopy}><div className={styles.eyebrow}><Network size={15} /> CASHPER WHITEPAPER V0.1</div><h1 id="whitepaper-title">Information, not guarantees.</h1><p>Cashper is a friendly intelligence layer for Solana: it monitors public on-chain activity, organizes blockchain information, and surfaces relevant signals through a simple interface.</p><div className={styles.heroActions}><a href="#abstract" className={styles.primaryButton}>Read the thesis <ArrowRight size={17} /></a><Link href="/roadmap" className={styles.secondaryButton}>See the roadmap <ArrowUpRight size={17} /></Link></div></div>
      <aside className={styles.heroCard} aria-label="Whitepaper principle"><div className={styles.cardLabel}><span className={styles.liveDot} /> CORE PRINCIPLE</div><LockKeyhole size={92} strokeWidth={1.2} color="#5574b1" /><strong>Awareness over authority.</strong><span>Cashper helps people notice. It never pretends to decide for them.</span></aside>
    </section>

    <div className={styles.layout}>
      <aside className={styles.sidebar} aria-label="Whitepaper sections"><span className={styles.sidebarLabel}>SECTIONS</span><nav><a href="#abstract">Abstract</a><a href="#approach">Approach</a><a href="#architecture">Architecture</a><a href="#philosophy">Philosophy</a><a href="#vision">Vision</a></nav></aside>
      <div className={styles.content}>
        <section id="abstract" className={styles.section} aria-labelledby="abstract-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}>01 / THE PROBLEM</span><h2 id="abstract-title">Transparency is not automatically clarity.</h2><p>Public blockchains expose enormous amounts of information, but a single wallet can generate interactions across tokens, programs, transfers, and decentralized applications. Users need help answering: What happened? What changed? What matters?</p></div></section>

        <section id="approach" className={styles.section} aria-labelledby="approach-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}>02 / THE CASHPER APPROACH</span><h2 id="approach-title">Monitor - Analyze - Protect.</h2><p>Cashper reduces information overload through three connected intelligence layers.</p></div><div className={styles.modelGrid}>{principles.map(({ icon: Icon, title, body }) => <article key={title}><Icon size={22} /><strong>{title}</strong><span>{title === 'Observation' ? 'Monitor' : title === 'Interpretation' ? 'Analyze' : 'Protect'}</span><p>{body}</p></article>)}</div></section>

        <section id="architecture" className={styles.section} aria-labelledby="architecture-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}>03 / CONCEPTUAL ARCHITECTURE</span><h2 id="architecture-title">A modular path from chain to context.</h2><p>The architecture can expand its analytical capabilities while keeping the same core purpose: making on-chain activity easier to understand.</p></div><div className={styles.architecture}>{architecture.map((item, index) => <div className={styles.architectureStep} key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong>{index < architecture.length - 1 && <ArrowRight size={17} aria-hidden="true" />}</div>)}</div></section>

        <section id="philosophy" className={styles.section} aria-labelledby="philosophy-title"><div className={styles.callout}><div className={styles.calloutIcon}><ShieldCheck size={22} /></div><div><span className={styles.eyebrow}>04 / PRODUCT PHILOSOPHY</span><h2 id="philosophy-title">Information, not guarantees.</h2><p>Cashper is not a mixer, anonymity protocol, or stealth-transaction system. It observes public information without taking custody of user assets. A signal can indicate that an interaction deserves attention, but it is not an absolute guarantee of safety.</p></div></div><div className={styles.proseGrid}><article><h3>Privacy</h3><p>The core product observes publicly available blockchain information and does not require custody of user assets.</p></article><article><h3>Security</h3><p>Cashper is built around awareness rather than authority. Users remain responsible for their decisions.</p></article><article><h3>Ecosystem role</h3><p>The Cashper token represents ecosystem participation. Any future utility is introduced only when the corresponding functionality exists. No guaranteed returns or unimplemented benefits are assumed.</p></article></div></section>

        <section id="vision" className={styles.finalSection} aria-labelledby="vision-title"><div><span className={styles.eyebrow}>05 / VISION</span><h2 id="vision-title">A recognizable intelligence interface for Solana.</h2><p>Simple enough for everyday users, structured enough for deeper investigation, and extensible enough for future developer integrations.</p></div><Link href="/docs" className={styles.primaryButton}>Read the docs <ArrowRight size={17} /></Link></section>
      </div>
    </div>
    <footer className={styles.footer}><Link href="/" className={styles.brand} aria-label="Cashper home"><Ghost size={23} strokeWidth={2.5} /><span>CASHPER</span></Link><span>MONITOR - ANALYZE - PROTECT</span><Link href="/roadmap" className={styles.footerLink}>Roadmap <ArrowUpRight size={15} /></Link></footer>
  </main>;
}
