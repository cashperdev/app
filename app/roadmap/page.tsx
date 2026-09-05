import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/cashper/site-header';
import { ArrowRight, ArrowUpRight, Ghost, Map, Sparkles } from 'lucide-react';
import styles from '../docs/docs.module.css';

export const metadata: Metadata = {
  title: 'Roadmap',
  description: 'Cashper roadmap: milestone-based product development from Monitor to Ghost Intelligence and ecosystem expansion.',
  alternates: { canonical: '/roadmap' },
  openGraph: { title: 'Cashper Roadmap', description: 'A transparent milestone-based path for Cashper.', url: '/roadmap', type: 'article' },
  twitter: { card: 'summary_large_image', title: 'Cashper Roadmap', description: 'A transparent milestone-based path for Cashper.' },
};

const phases = [
  { number: '01', title: 'The Ghost Appears', subtitle: 'Foundation and Launch', status: 'ACTIVE', items: ['Cashper identity', 'Official website', 'Social presence', 'Community foundation', 'Solana launch', 'Ghost Tools concept'] },
  { number: '02', title: 'Eyes on the Chain', subtitle: 'Monitor', status: 'PLANNED', items: ['Wallet lookup', 'Transaction activity', 'Token movements', 'SOL movements', 'Program interactions', 'Basic activity tracking', 'Wallet overview'] },
  { number: '03', title: 'Less Noise. More Clarity.', subtitle: 'Analyze and Ghost Report v1', status: 'PLANNED', items: ['Wallet analytics', 'Activity summaries', 'Inflow and outflow', 'Transaction patterns', 'Historical activity', 'Token interactions', 'Ghost Report v1'] },
  { number: '04', title: 'Stay Aware', subtitle: 'Protect and Ghost Signals', status: 'PLANNED', items: ['Activity signals', 'Unusual behavior indicators', 'Interaction awareness', 'Risk indicators', 'Transaction context', 'Ghost Signals'] },
  { number: '05', title: 'Ghost Watch', subtitle: 'Persistent Monitoring', status: 'PLANNED', items: ['Wallet watchlists', 'Token watchlists', 'Custom monitoring', 'Activity detection', 'Ghost Alerts', 'User-defined signals'] },
  { number: '06', title: 'Ghost Intelligence', subtitle: 'Advanced Interpretation', status: 'PLANNED', items: ['Advanced activity interpretation', 'Contextual reports', 'Smarter signals', 'Personalized monitoring', 'Expanded analytics'] },
  { number: '07', title: 'The Ghost Network', subtitle: 'Ecosystem Expansion', status: 'PLANNED', items: ['API access', 'Developer tools', 'Third-party integrations', 'Community-built Ghost Tools', 'Expanded ecosystem integrations'] },
];

export default function RoadmapPage() {
  return <main className={styles.page}>
    <div className={styles.glow} aria-hidden="true" />
    <SiteHeader theme="cream" currentLabel="ROADMAP" navItems={[{ label: "Docs", href: "/docs" }, { label: "Whitepaper", href: "/whitepaper" }]} />

    <section className={styles.hero} aria-labelledby="roadmap-title">
      <div className={styles.heroCopy}><div className={styles.eyebrow}><Map size={15} /> MILESTONE MAP / V0.1</div><h1 id="roadmap-title">The ghost gets sharper.</h1><p>Cashper uses milestones instead of artificial quarterly deadlines. Each phase represents a capability that can be shipped, tested, and expanded.</p><div className={styles.heroActions}><a href="#phases" className={styles.primaryButton}>Explore phases <ArrowRight size={17} /></a><Link href="/whitepaper" className={styles.secondaryButton}>Read the vision <ArrowUpRight size={17} /></Link></div></div>
      <aside className={styles.heroCard} aria-label="Roadmap philosophy"><div className={styles.cardLabel}><span className={styles.liveDot} /> NORTH STAR</div><Sparkles size={92} strokeWidth={1.2} color="#5574b1" /><strong>One product. Three layers.</strong><span>Monitor - Analyze - Protect.</span></aside>
    </section>

    <div className={styles.layout}>
      <aside className={styles.sidebar} aria-label="Roadmap sections"><span className={styles.sidebarLabel}>ROADMAP</span><nav><a href="#philosophy">Philosophy</a><a href="#phases">Phases 01 - 07</a><a href="#north-star">North Star</a></nav><div className={styles.sidebarCard}><Ghost size={21} /><strong>Status stays honest.</strong><span>Features are labeled LIVE, IN DEVELOPMENT, or PLANNED as reality catches up.</span></div></aside>
      <div className={styles.content}>
        <section id="philosophy" className={styles.section} aria-labelledby="philosophy-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}>THE ROADMAP PHILOSOPHY</span><h2 id="philosophy-title">Ship capabilities, not calendar theater.</h2><p>Milestones give the product room to be tested and expanded. Status labels remain transparent: LIVE, IN DEVELOPMENT, or PLANNED.</p></div></section>
        <section id="phases" className={styles.section} aria-labelledby="phases-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}>THE PATH AHEAD</span><h2 id="phases-title">Seven phases. One friendly ghost.</h2><p>Roadmap scope can evolve as the product learns. The intelligence model stays consistent.</p></div><ol className={styles.roadmap}>{phases.map((phase) => <li className={styles.phase} key={phase.number}><div className={styles.phaseMarker}>{phase.number}</div><div className={styles.phaseBody}><div className={styles.phaseHeading}><div><span className={styles.eyebrow}>{phase.subtitle}</span><h3>{phase.title}</h3></div><span className={phase.status === 'ACTIVE' ? styles.statusActive : styles.statusPlanned}>{phase.status}</span></div><ul>{phase.items.map((item) => <li key={item}>{item}</li>)}</ul></div></li>)}</ol></section>
        <section id="north-star" className={styles.finalSection} aria-labelledby="north-star-title"><div><span className={styles.eyebrow}>NORTH STAR</span><h2 id="north-star-title">Ghost Report ties it together.</h2><p>Ghost Report is the first core experience that unifies Monitor, Analyze, and Protect. Future phases extend the same model into persistent monitoring, alerts, advanced intelligence, and integrations.</p></div><Link href="/docs" className={styles.primaryButton}>Open docs <ArrowRight size={17} /></Link></section>
      </div>
    </div>
    <footer className={styles.footer}><Link href="/" className={styles.brand} aria-label="Cashper home"><Ghost size={23} strokeWidth={2.5} /><span>CASHPER</span></Link><span>LESS NOISE - MORE CLARITY</span><Link href="/whitepaper" className={styles.footerLink}>Whitepaper <ArrowUpRight size={15} /></Link></footer>
  </main>;
}
