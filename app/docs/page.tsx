import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/components/cashper/site-header';
import { ArrowRight, ArrowUpRight, BookOpen, Code2, Database, Ghost, HeartPulse, ShieldCheck, Sparkles, Terminal, WalletCards, Zap } from 'lucide-react';
import styles from './docs.module.css';

export const metadata: Metadata = {
  title: 'Docs',
  description: 'Learn how Cashper monitors, analyzes, and explains public Solana on-chain activity.',
  alternates: { canonical: '/docs' },
  openGraph: { title: 'Cashper Docs', description: 'The friendly ghost manual for Solana wallet intelligence.', url: '/docs', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Cashper Docs', description: 'The friendly ghost manual for Solana wallet intelligence.' },
};

const quickStart = [
  { icon: WalletCards, step: '01', title: 'Bring an address', body: 'Paste a public Solana wallet or token address. No wallet connection required.' },
  { icon: HeartPulse, step: '02', title: 'Read the pulse', body: 'Monitor recent activity, SOL flow, token holdings, and retrieval coverage.' },
  { icon: Sparkles, step: '03', title: 'Find the pattern', body: 'Open Analyze for deterministic summaries, activity mix, and top interactions.' },
];
const apiRoutes = [
  { method: 'GET', path: '/api/v1/address/:address', body: 'Identity, balance, token holdings, and high-level wallet context.' },
  { method: 'GET', path: '/api/v1/address/:address/activity?window=7d', body: 'Recent transactions, activity categories, SOL flow, and coverage metadata.' },
  { method: 'GET', path: '/api/v1/address/:address/analysis?window=7d', body: 'Readable signal summary built from the same public activity window.' },
];
const responseExample = JSON.stringify({ data: { address: 'your-public-address', activities: [], coverage: { window: '7d', retrievedTransactions: 42, limit: 100, partial: false } }, meta: { source: 'helius', status: 'available' } }, null, 2);

export default function DocsPage() {
  return <main className={styles.page}>
    <div className={styles.glow} aria-hidden="true" />
    <SiteHeader theme="cream" currentLabel="DOCS" navItems={[{ label: "Quick start", href: "#quickstart" }, { label: "API", href: "#api" }, { label: "Coverage", href: "#coverage" }]} />
    <section className={styles.hero} aria-labelledby="docs-title">
      <div className={styles.heroCopy}><div className={styles.eyebrow}><BookOpen size={15} /> THE GHOST MANUAL</div><h1 id="docs-title">Read the signal. Keep the spirit.</h1><p>Cashper turns public Solana activity into a calmer, more useful view. Here is the tiny manual for the ghost in your browser.</p><div className={styles.heroActions}><a href="#quickstart" className={styles.primaryButton}>Start here <ArrowRight size={17} /></a><Link href="/dashboard" className={styles.secondaryButton}>Open dashboard <ArrowUpRight size={17} /></Link></div></div>
      <aside className={styles.heroCard} aria-label="Cashper documentation status"><div className={styles.cardLabel}><span className={styles.liveDot} /> LIVE MANUAL</div><Image src="/cashper.png" width={180} height={180} className={styles.mascot} alt="" priority /><strong>Public data in. Clear context out.</strong><span>Bring a public address. Leave with fewer question marks.</span></aside>
    </section>
    <div className={styles.layout}>
      <aside className={styles.sidebar} aria-label="On this page"><span className={styles.sidebarLabel}>ON THIS PAGE</span><nav><a href="#quickstart">Quick start</a><a href="#mental-model">The mental model</a><a href="#api">API routes</a><a href="#coverage">Data coverage</a><a href="#safety">Safety notes</a></nav><div className={styles.sidebarCard}><Ghost size={21} /><strong>Lost in the fog?</strong><span>Try a public address in the app and let the ghost do the sorting.</span><Link href="/dashboard">Try Cashper <ArrowUpRight size={15} /></Link></div></aside>
      <div className={styles.content}>
        <section id="quickstart" className={styles.section} aria-labelledby="quickstart-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}>THE SHORT VERSION</span><h2 id="quickstart-title">Three moves to clarity.</h2><p>Start with an address, then let the data become a story.</p></div><div className={styles.quickGrid}>{quickStart.map(({ icon: Icon, step, title, body }) => <article className={styles.quickCard} key={step}><div className={styles.cardTop}><span>{step}</span><Icon size={21} /></div><h3>{title}</h3><p>{body}</p></article>)}</div></section>
        <section id="mental-model" className={styles.section} aria-labelledby="mental-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}>HOW TO READ CASHPER</span><h2 id="mental-title">Evidence first. Vibes second.</h2><p>Every tab has a job, so the output feels useful instead of mysteriously decorative.</p></div><div className={styles.modelGrid}><article><Database size={22} /><strong>Monitor</strong><span>What happened?</span><p>Recent public transactions, flows, and activity categories.</p></article><article><Sparkles size={22} /><strong>Analyze</strong><span>What does it mean?</span><p>A concise readout of patterns found in the selected time window.</p></article><article><ShieldCheck size={22} /><strong>Protect</strong><span>What should I notice?</span><p>Context and caution before you act. Cashper never signs for you.</p></article></div></section>
        <section id="api" className={styles.section} aria-labelledby="api-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}><Terminal size={15} /> FOR BUILDERS WITH GOOD INTENTIONS</span><h2 id="api-title">Small API. Useful payload.</h2><p>All routes are read-only and address-scoped. Windows support <code>24h</code>, <code>7d</code>, and <code>30d</code>.</p></div><div className={styles.apiList}>{apiRoutes.map((route) => <div className={styles.apiRow} key={route.path}><span className={styles.method}>{route.method}</span><code>{route.path}</code><p>{route.body}</p></div>)}</div><div className={styles.codeCard}><div className={styles.codeHeader}><span><Code2 size={16} /> Example response</span><span>JSON</span></div><pre><code>{responseExample}</code></pre></div></section>
        <section id="coverage" className={styles.section} aria-labelledby="coverage-title"><div className={styles.callout}><div className={styles.calloutIcon}><Zap size={22} /></div><div><span className={styles.eyebrow}>IMPORTANT LITTLE DETAIL</span><h2 id="coverage-title">Partial means partial.</h2><p>The API exposes retrieval coverage so the UI can be honest. A partial result is still useful, but it should never pretend to be the whole chain.</p></div></div><div className={styles.coverageGrid}><div><strong><code>retrievedTransactions</code></strong><span>How many records were returned.</span></div><div><strong><code>limit</code></strong><span>The maximum records requested for the window.</span></div><div><strong><code>partial</code></strong><span>Whether the result may not represent the full window.</span></div><div><strong><code>meta.status</code></strong><span>Whether the upstream source is available.</span></div></div></section>
        <section id="library" className={styles.section} aria-labelledby="library-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}>THE LONGER READS</span><h2 id="library-title">Pick your flavor of ghost lore.</h2><p>The product docs explain the tools. The whitepaper explains the why. The roadmap explains what comes next.</p></div><div className={styles.proseGrid}><article><h3>Whitepaper</h3><p>Architecture, philosophy, privacy, security, token role, and long-term vision.</p><Link href="/whitepaper" className={styles.footerLink}>Read whitepaper <ArrowUpRight size={15} /></Link></article><article><h3>Roadmap</h3><p>Seven milestones from foundation and Monitor to Ghost Intelligence and ecosystem expansion.</p><Link href="/roadmap" className={styles.footerLink}>See roadmap <ArrowUpRight size={15} /></Link></article></div></section><section id="safety" className={styles.finalSection} aria-labelledby="safety-title"><div><span className={styles.eyebrow}><ShieldCheck size={15} /> KEEP YOUR WITS</span><h2 id="safety-title">Look twice. Sign once.</h2><p>Cashper reads public on-chain information. It does not custody funds, request your seed phrase, or approve transactions.</p></div><Link href="/dashboard" className={styles.primaryButton}>Analyze an address <ArrowRight size={17} /></Link></section>
      </div>
    </div>
    <footer className={styles.footer}><Link href="/" className={styles.brand} aria-label="Cashper home"><Ghost size={23} strokeWidth={2.5} /><span>CASHPER</span></Link><span>LESS NOISE - MORE CLARITY</span><Link href="/dashboard" className={styles.footerLink}>Launch App <ArrowUpRight size={15} /></Link></footer>
  </main>;
}
