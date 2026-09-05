'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Clock3, Copy, Database, ExternalLink, Ghost, LoaderCircle, Radar, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { ActivityResponse, AddressOverview, ApiResponse, CashperActivity, WalletAnalysis } from '@/lib/cashper/types';
import { SolanaMark } from './solana-mark';
import styles from './dashboard.module.css';

type Tab = 'monitor' | 'analyze' | 'protect';
type RequestState<T> = { data?: T; loading: boolean; error?: string; key?: string };
type JsonState<T> = RequestState<T> & { retry: () => void };

const short = (value: string, size = 5) => `${value.slice(0, size)}…${value.slice(-4)}`;
const formatRaw = (value: string, decimals: number) => {
  const normalized = value.padStart(decimals + 1, '0');
  return decimals ? `${normalized.slice(0, -decimals)}.${normalized.slice(-decimals).slice(0, 4).replace(/0+$/, '') || '0'}` : normalized;
};
const timeAgo = (timestamp: number | null) => {
  if (!timestamp) return 'Time unavailable';
  const minutes = Math.max(0, Math.floor((Date.now() / 1000 - timestamp) / 60));
  if (minutes < 1) return 'Just now'; if (minutes < 60) return `${minutes}m ago`; if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`; return `${Math.floor(minutes / 1440)}d ago`;
};

function useJson<T>(url?: string) {
  const [state, setState] = useState<RequestState<T>>({ loading: false });
  const [retry, setRetry] = useState(0);
  const key = `${url ?? ''}:${retry}`;
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(async (response) => { const body = await response.json() as ApiResponse<T> & { error?: string }; if (!response.ok) throw new Error(body.error ?? 'Something went wrong.'); return body.data; })
      .then((data) => setState({ data, loading: false, key }))
      .catch((error: Error) => { if (error.name !== 'AbortError') setState({ loading: false, error: error.message, key }); });
    return () => controller.abort();
  }, [url, key]);
  return { ...state, loading: Boolean(url) && state.key !== key, retry: () => setRetry((value) => value + 1) };
}

function AddressSearch({ initial, className }: { initial?: string; className?: string }) {
  const router = useRouter(); const [value, setValue] = useState(initial ?? '');
  function submit(event: { preventDefault: () => void }) { event.preventDefault(); const address = value.trim(); if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) router.push(`/dashboard/${address}?tab=monitor&window=7d`); }
  return <form className={`${styles.search} ${className ?? ''}`} onSubmit={submit}><Search size={18}/><label className="sr-only" htmlFor="dashboard-search">Search a Solana address</label><input id="dashboard-search" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Search wallet or token address..."/><button type="submit">Analyze <ArrowRight size={15}/></button></form>;
}

function DataState({ error, retry }: { error?: string; retry?: () => void }) {
  return <div className={styles.state}><p>{error ?? 'Reading on-chain activity...'}</p>{error && retry && <button onClick={retry}>Try again</button>}</div>;
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <article className={styles.metric}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

function SolanaLabel({ children }: { children: ReactNode }) {
  return <span className={styles.solanaLabel}><SolanaMark />{children}</span>;
}

function ActivityList({ activities }: { activities: CashperActivity[] }) {
  if (!activities.length) return <div className={styles.empty}>No recent on-chain activity found.</div>;
  return <div className={styles.activityList}>{activities.slice(0, 24).map((activity) => <a key={activity.id} className={styles.activity} href={`https://explorer.solana.com/tx/${activity.signature}`} target="_blank" rel="noreferrer"><span className={activity.direction === 'OUT' ? styles.out : styles.in}>{activity.direction === 'OUT' ? '↑' : activity.direction === 'IN' ? '↓' : '•'}</span><div><strong>{activity.type.replaceAll('_', ' ')}</strong><small>{activity.asset ? `${activity.direction === 'OUT' ? '−' : '+'}${activity.asset.uiAmount} ${activity.asset.symbol ?? short(activity.asset.mint, 4)}` : activity.program?.name ?? short(activity.program?.address ?? activity.signature)}</small></div><time>{timeAgo(activity.timestamp)}</time></a>)}</div>;
}

function MonitorExtras({ analysis }: { analysis: JsonState<{ address: string; analysis: WalletAnalysis; coverage: ActivityResponse['coverage'] }> }) {
  if (analysis.loading) return <div className={styles.columns}><article className={styles.panel}><div className={styles.panelHead}><h2>SOL Flow</h2><span>RETRIEVED</span></div><DataState/></article><article className={styles.panel}><div className={styles.panelHead}><h2>Protocol Interactions</h2><span>RETRIEVED</span></div><DataState/></article></div>;
  if (analysis.error || !analysis.data) return <div className={styles.columns}><article className={styles.panel}><DataState error={analysis.error ?? 'Flow data unavailable.'} retry={analysis.retry}/></article></div>;
  const data = analysis.data.analysis;
  return <div className={styles.columns}>
    <article className={styles.panel}><div className={styles.panelHead}><h2><SolanaMark />SOL Flow</h2><span>RETRIEVED</span></div><div className={styles.holdings}><div><span>SOL In</span><strong>{formatRaw(data.solFlow.inLamports, 9)} SOL</strong></div><div><span>SOL Out</span><strong>{formatRaw(data.solFlow.outLamports, 9)} SOL</strong></div><div><span>Net Flow</span><strong>{data.solFlow.netLamports.startsWith('-') ? '−' : '+'}{formatRaw(data.solFlow.netLamports.replace('-', ''), 9)} SOL</strong></div></div></article>
    <article className={styles.panel}><div className={styles.panelHead}><h2>Protocol Interactions</h2><span>RETRIEVED</span></div>{data.topPrograms.length ? <div className={styles.holdings}>{data.topPrograms.map((program) => <div key={program.address}><span>{program.name ?? short(program.address, 4)}</span><strong>{program.interactions}</strong></div>)}</div> : <div className={styles.empty}>No program interactions found.</div>}</article>
  </div>;
}

function Monitor({ overview, activity, analysis }: { overview: AddressOverview; activity: JsonState<ActivityResponse>; analysis: JsonState<{ address: string; analysis: WalletAnalysis; coverage: ActivityResponse['coverage'] }> }) {
  const sol = overview.solBalance?.uiAmount ?? '—';
  return <section className={styles.content}>
    <div className={styles.metrics}><Metric label="SOL BALANCE" value={overview.kind === 'wallet' ? `${sol} SOL` : '—'} /><Metric label="TOKEN ASSETS" value={String(overview.tokenAssets?.length ?? 0)} /><Metric label="TYPE" value={overview.kind.replace('_', ' ')} /><Metric label="LAST ACTIVITY" value={activity.data?.activities[0] ? timeAgo(activity.data.activities[0].timestamp) : '—'} /></div>
    {activity.data?.coverage.partial && <p className={styles.coverage}>Based on retrieved activity. Older records may not be included.</p>}
    <div className={styles.columns}>
      <article className={styles.panel}><div className={styles.panelHead}><h2>Recent Activity</h2><span>ON-CHAIN</span></div>{activity.loading ? <DataState/> : activity.error ? <DataState error={activity.error} retry={activity.retry}/> : <ActivityList activities={activity.data?.activities ?? []}/>}</article>
      <article className={styles.panel}><div className={styles.panelHead}><h2>Token Holdings</h2><span>{overview.tokenAssets?.length ?? 0} ASSETS</span></div>{overview.tokenAssets?.length ? <div className={styles.holdings}>{overview.tokenAssets.slice(0, 12).map((token) => <div key={token.mint}><span>{short(token.mint, 4)}</span><strong>{token.uiAmount}</strong></div>)}</div> : <div className={styles.empty}>No non-zero SPL token balances found.</div>}</article>
    </div>
    <MonitorExtras analysis={analysis}/>
  </section>;
}

function Analyze({ analysis }: { analysis: JsonState<{ address: string; analysis: WalletAnalysis; coverage: ActivityResponse['coverage'] }> }) {
  if (analysis.loading) return <section className={styles.content}><DataState/></section>;
  if (analysis.error || !analysis.data) return <section className={styles.content}><DataState error={analysis.error ?? 'Analysis unavailable.'} retry={analysis.retry}/></section>;
  const data = analysis.data.analysis;
  return <section className={styles.content}>
    <article className={styles.summary}><span>WALLET SUMMARY</span><p>{data.summary}</p></article>
    <div className={styles.metrics}><Metric label="TRANSACTIONS" value={String(data.transactionCount)} /><Metric label="ACTIVITY LEVEL" value={data.activityLevel ?? 'PARTIAL'} /><Metric label="SOL IN" value={`${formatRaw(data.solFlow.inLamports, 9)} SOL`} /><Metric label="NET SOL FLOW" value={`${formatRaw(data.solFlow.netLamports.replace('-', ''), 9)} SOL${data.solFlow.netLamports.startsWith('-') ? ' out' : ' in'}`} /></div>
    <div className={styles.columns}>
      <article className={styles.panel}><div className={styles.panelHead}><h2>Key Insights</h2><span>FACTUAL</span></div>{data.insights.length ? <div className={styles.insights}>{data.insights.map((item) => <div key={item.title}><strong>{item.title}</strong><p>{item.body}</p></div>)}</div> : <div className={styles.empty}>No deterministic insights are available yet.</div>}</article>
      <article className={styles.panel}><div className={styles.panelHead}><h2>Top Interactions</h2><span>RETRIEVED</span></div>{data.topPrograms.length ? <div className={styles.holdings}>{data.topPrograms.map((item) => <div key={item.address}><span>{item.name ?? short(item.address, 4)}</span><strong>{item.interactions}</strong></div>)}</div> : <div className={styles.empty}>No program interactions found.</div>}</article>
    </div>
    {data.firstSeen && <p className={styles.firstSeen}>First Seen: {new Date(data.firstSeen.timestamp * 1000).toLocaleDateString()} · Estimated from the earliest retrieved transaction.</p>}
  </section>;
}

export function DashboardScreen({ address: suppliedAddress }: { address?: string }) {
  const params = useParams<{ address?: string }>(); const searchParams = useSearchParams(); const router = useRouter();
  const address = suppliedAddress ?? params.address; const selectedTab = (searchParams.get('tab') ?? 'monitor') as Tab; const tab: Tab = ['monitor', 'analyze', 'protect'].includes(selectedTab) ? selectedTab : 'monitor'; const window = searchParams.get('window') === '24h' || searchParams.get('window') === '30d' ? searchParams.get('window')! : '7d';
  const identity = useJson<AddressOverview>(address ? `/api/v1/address/${address}` : undefined);
  const activity = useJson<ActivityResponse>(address && identity.data?.kind === 'wallet' ? `/api/v1/address/${address}/activity?window=${window}` : undefined);
  const analysis = useJson<{ address: string; analysis: WalletAnalysis; coverage: ActivityResponse['coverage'] }>(address && identity.data?.kind === 'wallet' ? `/api/v1/address/${address}/analysis?window=${window}` : undefined);
  const title = useMemo(() => identity.data?.kind === 'token' ? 'Token Overview' : 'Wallet Overview', [identity.data?.kind]);
  const setTab = (next: Tab) => router.replace(`/dashboard/${address}?tab=${next}&window=${window}`);
  if (!address) return <main className={styles.landing}>
    <div className={styles.landingGlow} aria-hidden="true" />
      <header className={styles.landingTop}><Link href="/" aria-label="Back to Cashper home" className={`wordmark ${styles.brand}`}><Ghost size={29} strokeWidth={2.5}/> <span aria-hidden="true">CASHPER</span></Link></header>
    <div className={styles.landingGrid}>
      <section className={styles.landingIntro}>
        <span className={`${styles.eyebrow} ${styles.solanaEyebrow}`}>ONCHAIN INTELLIGENCE · <SolanaMark /> SOLANA</span>
        <h1>See the signal<br/><em>behind the address.</em></h1>
        <p>Turn a public wallet or token address into a calmer, clearer view of what is happening on-chain.</p>
        <AddressSearch className={styles.landingSearch}/>
        <div className={styles.landingMeta}><span><Check size={14}/> Public data only</span><span><Clock3 size={14}/> 24H · 7D · 30D views</span></div>
      </section>
      <aside className={styles.landingAside} aria-label="Cashper capabilities">
        <div className={styles.asideSticker} aria-hidden="true"><img src="/cashper.png" alt="" /></div>
        <div className={styles.signalOrb}><span className={styles.orbRing}/><span className={styles.orbRing}/><span className={styles.orbCore}><Radar size={31}/></span><span className={styles.orbDot}/></div>
        <div className={styles.asideLabel}><span className={styles.liveDot}/> CASHPER intelligence</div>
        <h2>Public data.<br/><span>Clear context.</span></h2>
        <p>Start with an address. Monitor the facts, then understand the pattern.</p>
        <div className={styles.asideRows}><div><Database size={16}/><span>Monitor activity</span><Check size={15}/></div><div><Sparkles size={16}/><span>Analyze behavior</span><Check size={15}/></div><div><ShieldCheck size={16}/><span>Protect is coming</span><span className={styles.muted}>Soon</span></div></div>
      </aside>
    </div>
    <footer className={styles.landingFoot}><SolanaLabel>BUILT FOR SOLANA</SolanaLabel><span>NO WALLET CONNECTION REQUIRED</span><span>LESS NOISE · MORE CLARITY</span></footer>
  </main>;
  if (identity.loading) return <main className={styles.loading}><LoaderCircle className={styles.spin}/><p>Reading on-chain activity...</p></main>;
  if (identity.error || !identity.data) return <main className={styles.loading}><p>{identity.error ?? "We couldn't identify this address."}</p><Link className={styles.retry} href="/dashboard">Search another address</Link></main>;
  const overview = identity.data;
  return <main className={styles.dashboard}>
    <header className={styles.topbar}><Link href="/" className={`wordmark ${styles.brand}`}><Ghost size={29} strokeWidth={2.5}/> CASHPER</Link><AddressSearch initial={address}/></header>
    <section className={styles.hero}><div><Link className={styles.back} href="/dashboard"><ArrowLeft size={16}/> New search</Link><span className={`${styles.eyebrow} ${styles.solanaEyebrow}`}><SolanaMark /> SOLANA {overview.kind === 'token' ? 'TOKEN' : 'WALLET'}</span><h1>{title}</h1><div className={styles.address}><code title={address}>{short(address, 7)}</code><button onClick={() => navigator.clipboard.writeText(address)} aria-label="Copy address"><Copy size={15}/></button><a href={`https://explorer.solana.com/address/${address}`} target="_blank" rel="noreferrer" aria-label="View on Solana Explorer"><ExternalLink size={15}/></a></div></div><div className={styles.window}><span>WINDOW</span>{(['24h','7d','30d'] as const).map((item) => <button key={item} className={window === item ? styles.selected : ''} onClick={() => router.replace(`/dashboard/${address}?tab=${tab}&window=${item}`)}>{item}</button>)}</div></section>
    <nav className={styles.tabs} aria-label="Product sections"><button className={tab === 'monitor' ? styles.selected : ''} onClick={() => setTab('monitor')}><Radar size={16}/> Monitor</button><button className={tab === 'analyze' ? styles.selected : ''} onClick={() => setTab('analyze')}><Sparkles size={16}/> Analyze</button><button className={tab === 'protect' ? styles.selected : ''} onClick={() => setTab('protect')}><ShieldCheck size={16}/> Protect <small>Coming soon</small></button></nav>
    {tab === 'protect' ? <section className={styles.protect}><ShieldCheck size={34}/><span className={styles.eyebrow}>PROTECT</span><h2>Coming Soon</h2><p>Understand potentially risky wallet interactions before taking action.</p><span>Risk awareness for on-chain activity.</span></section> : overview.kind !== 'wallet' ? <section className={styles.content}><div className={styles.empty}>{overview.kind === 'token' ? `On-chain supply: ${overview.token?.supply.uiAmount ?? '—'} tokens with ${overview.token?.decimals ?? '—'} decimals. Token-wide activity and market data need a dedicated supported indexer.` : "We couldn't identify this address as a wallet or token mint."}</div></section> : tab === 'monitor' ? <Monitor overview={overview} activity={activity} analysis={analysis}/> : <Analyze analysis={analysis}/>} 
  </main>;
}
