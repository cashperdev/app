'use client';

import { type ReactNode, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, Clock3, Copy, Database, ExternalLink, Ghost, Radar, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { ActivityResponse, AddressOverview, ApiResponse, CashperActivity, Coverage, WalletAnalysis } from '@/lib/cashper/types';
import { SolanaMark } from './solana-mark';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
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

function AddressSearch({ initial, className, showHint = false }: { initial?: string; className?: string; showHint?: boolean }) {
  const router = useRouter(); const [value, setValue] = useState(initial ?? ''); const [error, setError] = useState<string | null>(null); const [isSubmitting, setIsSubmitting] = useState(false);
  function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    const address = value.trim();
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) { const message = "Paste a valid Solana wallet address or token mint."; setError(message); toast.add({ title: "Invalid Solana address", description: message, type: "error" }); setIsSubmitting(false); return; }
    setError(null); setIsSubmitting(true); router.push('/dashboard/' + address + '?tab=monitor&window=7d');
  }
  return <form className={styles.search + ' ' + (className ?? '')} onSubmit={submit} aria-busy={isSubmitting}><Search size={18}/><label className="sr-only" htmlFor="dashboard-search">Search a Solana address</label><input id="dashboard-search" value={value} onChange={(event) => { setValue(event.target.value); if (error) setError(null); }} placeholder="Paste a Solana wallet or token mint..." aria-invalid={Boolean(error)} aria-describedby={[showHint ? 'dashboard-search-hint' : '', error ? 'dashboard-search-error' : ''].filter(Boolean).join(' ') || undefined}/><button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Analyzing…' : 'Analyze'} <ArrowRight size={15} /></button>{showHint && <p id="dashboard-search-hint" className={styles.searchHint}>Use a Solana wallet address or SPL/Token-2022 token mint. For GMGN, copy the token mint/contract address, not a pool, pair, or holder address.</p>}{error && <p id="dashboard-search-error" className={styles.searchError} role="alert">{error}</p>}</form>;
}

function DataState({ error, retry }: { error?: string; retry?: () => void }) {
  if (!error) return <output className={styles.state} aria-live="polite"><span className="sr-only">Reading on-chain activity...</span><div className="grid gap-3" aria-hidden="true"><Skeleton className="mx-auto h-4 w-3/4 rounded" /><Skeleton className="mx-auto h-3 w-1/2 rounded" /></div></output>;
  return <div className={styles.state} role="alert" aria-live="assertive"><p>{error}</p>{retry && <button onClick={retry}>Try again</button>}</div>;
}


function EmptyState({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return <div className={styles.empty}><p>{message}</p>{actionLabel && onAction && <button className={styles.retry} onClick={onAction}>{actionLabel}</button>}</div>;
}

function unsupportedAddressCopy(kind: AddressOverview['kind']) {
  if (kind === 'token_account') return { title: 'This is a token account, not the token mint.', body: 'Open the token page in GMGN and copy its Solana mint/contract address. A holder or token-account address cannot be used here.' };
  if (kind === 'unsupported') return { title: 'This Solana address type is not supported yet.', body: 'It may be a pool, program, bonding curve, or another account. Cashper currently supports wallets and SPL/Token-2022 token mints.' };
  return { title: 'No Solana account was found.', body: 'Check that the address is correct and still exists on Solana. If you copied it from GMGN, use the token mint/contract address rather than a pool or holder address.' };
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <article className={styles.metric}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

function SolanaLabel({ children }: { children: ReactNode }) {
  return <span className={styles.solanaLabel}><SolanaMark />{children}</span>;
}

function ActivityList({ activities, onAction }: { activities: CashperActivity[]; onAction: () => void }) {
  if (!activities.length) return <EmptyState message="No recent on-chain activity found." actionLabel="Search another address" onAction={onAction}/>;
  return <div className={styles.activityList}>{activities.map((activity) => <a key={activity.id} className={styles.activity} href={'https://explorer.solana.com/tx/' + activity.signature} target="_blank" rel="noreferrer"><span className={activity.direction === 'OUT' ? styles.out : styles.in}>{activity.direction === 'OUT' ? '↑' : activity.direction === 'IN' ? '↓' : '•'}</span><div><strong>{activity.type.replaceAll('_', ' ')}</strong><small>{activity.asset ? `${activity.direction === 'OUT' ? '−' : '+'}${activity.asset.uiAmount} ${activity.asset.symbol ?? short(activity.asset.mint, 4)}` : activity.program?.name ?? short(activity.program?.address ?? activity.signature)}</small></div><time>{timeAgo(activity.timestamp)}</time></a>)}</div>;
}

function MonitorExtras({ analysis, onTabChange }: { analysis: JsonState<{ address: string; analysis: WalletAnalysis; coverage: ActivityResponse['coverage'] }>; onTabChange: (tab: Tab) => void }) {
  if (analysis.loading) return <div className={styles.columns}><article className={styles.panel}><div className={styles.panelHead}><h2>SOL Flow</h2><span>RETRIEVED</span></div><DataState/></article><article className={styles.panel}><div className={styles.panelHead}><h2>Protocol Interactions</h2><span>RETRIEVED</span></div><DataState/></article></div>;
  if (analysis.error || !analysis.data) return <div className={styles.columns}><article className={styles.panel}><DataState error={analysis.error ?? 'Flow data unavailable.'} retry={analysis.retry}/></article></div>;
  const data = analysis.data.analysis;
  return <div className={styles.columns}>
    <article className={styles.panel}><div className={styles.panelHead}><h2><SolanaMark />SOL Flow</h2><span>RETRIEVED</span></div><div className={styles.holdings}><div><span>SOL In</span><strong>{formatRaw(data.solFlow.inLamports, 9)} SOL</strong></div><div><span>SOL Out</span><strong>{formatRaw(data.solFlow.outLamports, 9)} SOL</strong></div><div><span>Net Flow</span><strong>{data.solFlow.netLamports.startsWith('-') ? '−' : '+'}{formatRaw(data.solFlow.netLamports.replace('-', ''), 9)} SOL</strong></div></div></article>
    <article className={styles.panel}><div className={styles.panelHead}><h2>Protocol Interactions</h2><span>RETRIEVED</span></div>{data.topPrograms.length ? <div className={styles.holdings}>{data.topPrograms.map((program) => <div key={program.address}><span>{program.name ?? short(program.address, 4)}</span><strong>{program.interactions}</strong></div>)}</div> : <EmptyState message="No program interactions found." actionLabel="View recent activity" onAction={() => onTabChange('monitor')}/>}</article>
  </div>;
}
function Monitor({ overview, activity, analysis, address, window, onTabChange, onNewSearch }: { overview: AddressOverview; activity: JsonState<ActivityResponse>; analysis: JsonState<{ address: string; analysis: WalletAnalysis; coverage: ActivityResponse['coverage'] }>; address: string; window: Coverage['window']; onTabChange: (tab: Tab) => void; onNewSearch: () => void }) {
  const [additionalActivities, setAdditionalActivities] = useState<CashperActivity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(activity.data?.nextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  async function loadMore() {
    const cursor = nextCursor;
    if (!cursor || loadingMore) return;
    setLoadingMore(true); setLoadMoreError(null);
    try {
      const response = await fetch(`/api/v1/address/${address}/activity?window=${window}&cursor=${encodeURIComponent(cursor)}`);
      const body = await response.json() as ApiResponse<ActivityResponse> & { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'More activity is temporarily unavailable. Try again.');
      setAdditionalActivities((current) => [...current, ...body.data.activities]);
      setNextCursor(body.data.nextCursor);
    } catch (error) {
      setLoadMoreError(error instanceof Error ? error.message : 'More activity is temporarily unavailable. Try again.');
    } finally {
      setLoadingMore(false);
    }
  }
  const activities = [...(activity.data?.activities ?? []), ...additionalActivities];
  const sol = overview.solBalance?.uiAmount ?? '—';
  return <section className={styles.content}>
    <div className={styles.metrics}><Metric label="SOL BALANCE" value={overview.kind === 'wallet' ? `${sol} SOL` : '—'} /><Metric label="TOKEN ASSETS" value={String(overview.tokenAssets?.length ?? 0)} /><Metric label="TYPE" value={overview.kind.replace('_', ' ')} /><Metric label="LAST ACTIVITY" value={activity.data?.activities[0] ? timeAgo(activity.data.activities[0].timestamp) : '—'} /></div>
    {activity.data?.coverage.partial && <p className={styles.coverage}>Based on retrieved activity. Older records may not be included.</p>}
    <div className={styles.columns}>
      <article className={styles.panel}><div className={styles.panelHead}><h2>Recent Activity</h2><span>ON-CHAIN</span></div>{activity.loading ? <DataState/> : activity.error ? <DataState error={activity.error} retry={activity.retry}/> : <><ActivityList activities={activities} onAction={onNewSearch}/>{nextCursor && <div className={styles.activityMore}><button className={styles.retry} onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more activity'}</button>{loadMoreError && <p role="alert">{loadMoreError}</p>}</div>}</>}</article>
      <article className={styles.panel}><div className={styles.panelHead}><h2>Token Holdings</h2><span>{overview.tokenAssets?.length ?? 0} ASSETS</span></div>{overview.tokenAssets?.length ? <div className={styles.holdings}>{overview.tokenAssets.map((token) => <div key={token.mint}><span>{short(token.mint, 4)}</span><strong>{token.uiAmount}</strong></div>)}</div> : <EmptyState message="No non-zero SPL token balances found." actionLabel="View Analyze" onAction={() => onTabChange('analyze')}/>}</article>
    </div>
    <MonitorExtras analysis={analysis} onTabChange={onTabChange}/>
  </section>;
}

const breakdownItems: Array<{ key: keyof WalletAnalysis['activityBreakdown']; label: string }> = [
  { key: 'SOL_TRANSFER', label: 'SOL transfers' },
  { key: 'TOKEN_TRANSFER', label: 'Token transfers' },
  { key: 'PROGRAM_INTERACTION', label: 'Program interactions' },
  { key: 'UNKNOWN', label: 'Unclassified' },
];

function ActivityBreakdown({ breakdown }: { breakdown: WalletAnalysis['activityBreakdown'] }) {
  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const max = Math.max(1, ...breakdownItems.map(({ key }) => breakdown[key]));
  return <article className={styles.panel}><div className={styles.panelHead}><h2>Activity mix</h2><span>{total} RECORDS</span></div><div className={styles.breakdownList}>{breakdownItems.map(({ key, label }) => { const count = breakdown[key]; return <div className={styles.breakdownItem} key={key}><div className={styles.breakdownLabel}><span>{label}</span><strong>{count}</strong></div><div className={styles.breakdownTrack}><span style={{ width: (count / max) * 100 + '%' }}/></div><small>{total ? Math.round((count / total) * 100) : 0}% of retrieved activity</small></div>; })}</div></article>;
}

function CoveragePanel({ coverage }: { coverage: Coverage }) {
  return <article className={styles.panel}><div className={styles.panelHead}><h2>Data coverage</h2><span>{coverage.partial ? 'PARTIAL' : 'COMPLETE'}</span></div><div className={styles.coverageGrid}><div><span>WINDOW</span><strong>{coverage.window}</strong></div><div><span>TRANSACTIONS</span><strong>{coverage.retrievedTransactions} / {coverage.limit}</strong></div><div><span>FROM</span><strong>{new Date(coverage.from * 1000).toLocaleDateString()}</strong></div><div><span>TO</span><strong>{new Date(coverage.to * 1000).toLocaleDateString()}</strong></div></div><p className={styles.panelNote}>{coverage.partial ? 'The retrieval limit was reached. Totals represent the transactions currently available.' : 'The selected time window was fully retrieved.'}</p></article>;
}

function SolFlowPanel({ flow }: { flow: WalletAnalysis['solFlow'] }) {
  const netIsOut = flow.netLamports.startsWith('-');
  return <article className={styles.panel}><div className={styles.panelHead}><h2><SolanaMark />SOL flow</h2><span>RETRIEVED</span></div><div className={styles.flowSummary}><div><span>INFLOW</span><strong>{formatRaw(flow.inLamports, 9)} SOL</strong></div><div><span>OUTFLOW</span><strong>{formatRaw(flow.outLamports, 9)} SOL</strong></div><div><span>NET</span><strong className={netIsOut ? styles.flowOut : styles.flowIn}>{netIsOut ? '−' : '+'}{formatRaw(flow.netLamports.replace('-', ''), 9)} SOL</strong></div></div><p className={styles.panelNote}>Calculated from balance deltas in retrieved transactions.</p></article>;
}

function TokenFlowPanel({ tokenFlow, onTabChange }: { tokenFlow: WalletAnalysis['tokenFlow']; onTabChange: (tab: Tab) => void }) {
  return <article className={styles.panel}><div className={styles.panelHead}><h2>Token flow</h2><span>{tokenFlow.length} ASSETS</span></div>{tokenFlow.length ? <div className={styles.tokenFlowList}>{tokenFlow.map((item) => <div className={styles.tokenFlowRow} key={item.mint}><code title={item.mint}>{short(item.mint, 5)}</code><div><span>IN</span><strong>{formatRaw(item.inRaw, item.decimals)}</strong></div><div><span>OUT</span><strong>{formatRaw(item.outRaw, item.decimals)}</strong></div></div>)}</div> : <EmptyState message="No token transfers were found in this window." actionLabel="View Monitor" onAction={() => onTabChange('monitor')}/>}</article>;
}
function Analyze({ analysis, onTabChange }: { analysis: JsonState<{ address: string; analysis: WalletAnalysis; coverage: ActivityResponse['coverage'] }>; onTabChange: (tab: Tab) => void }) {
  if (analysis.loading) return <section className={styles.content}><DataState/></section>;
  if (analysis.error || !analysis.data) return <section className={styles.content}><DataState error={analysis.error ?? 'Analysis unavailable.'} retry={analysis.retry}/></section>;
  const data = analysis.data.analysis;
  return <section className={styles.content}>
    <article className={styles.summary}><span>WALLET SUMMARY · GHOST READOUT</span><p>{data.summary}</p></article>
    {analysis.data.coverage.partial && <p className={styles.coverage}>Based on retrieved activity. Analysis reflects the records retrieved for this window.</p>}
    <div className={styles.metrics}><Metric label="TRANSACTIONS" value={String(data.transactionCount)} /><Metric label="ACTIVITY LEVEL" value={data.activityLevel ?? 'PARTIAL'} /><Metric label="SOL IN" value={`${formatRaw(data.solFlow.inLamports, 9)} SOL`} /><Metric label="NET SOL FLOW" value={`${formatRaw(data.solFlow.netLamports.replace('-', ''), 9)} SOL${data.solFlow.netLamports.startsWith('-') ? ' out' : ' in'}`} /></div>
    <div className={styles.analysisGrid}>
      <ActivityBreakdown breakdown={data.activityBreakdown}/>
      <CoveragePanel coverage={analysis.data.coverage}/>
    </div>
    <div className={styles.analysisGrid}>
      <SolFlowPanel flow={data.solFlow}/>
      <TokenFlowPanel tokenFlow={data.tokenFlow} onTabChange={onTabChange}/>
    </div>
    <div className={styles.columns}>
      <article className={styles.panel}><div className={styles.panelHead}><h2>Key Insights</h2><span>FACTUAL</span></div>{data.insights.length ? <div className={styles.insights}>{data.insights.map((item) => <div key={item.title}><strong>{item.title}</strong><p>{item.body}</p></div>)}</div> : <EmptyState message="No deterministic insights are available yet." actionLabel="View Monitor" onAction={() => onTabChange('monitor')}/>}</article>
      <article className={styles.panel}><div className={styles.panelHead}><h2>Top Interactions</h2><span>RETRIEVED</span></div>{data.topPrograms.length ? <div className={styles.holdings}>{data.topPrograms.map((item) => <div key={item.address}><span>{item.name ?? short(item.address, 4)}</span><strong>{item.interactions}</strong></div>)}</div> : <EmptyState message="No program interactions found." actionLabel="View Monitor" onAction={() => onTabChange('monitor')}/>}</article>
    </div>
    {data.firstSeen && <p className={styles.firstSeen}>First Seen: {new Date(data.firstSeen.timestamp * 1000).toLocaleDateString()} · Estimated from the earliest retrieved transaction.</p>}
  </section>;
}

function TokenOverview({ overview }: { overview: AddressOverview }) {
  return <section className={styles.content}>
    <div className={styles.metrics}>
      <Metric label="TOTAL SUPPLY" value={overview.token?.supply.uiAmount ?? '—'} note="Read from the token mint" />
      <Metric label="DECIMALS" value={String(overview.token?.decimals ?? '—')} note="Token precision" />
      <Metric label="DATA SOURCE" value="ON-CHAIN" note="Public Solana account data" />
      <Metric label="COVERAGE" value="PARTIAL" note="Token overview only" />
    </div>
    <article className={styles.tokenNotice}>
      <div className={styles.tokenNoticeIcon}><Database size={20} /></div>
      <div>
        <span className={styles.tokenNoticeLabel}>TOKEN ACTIVITY</span>
        <h2>Holder movements are not connected yet.</h2>
        <p>Cashper can read this token’s supply and decimals today. Holder balances, transfers, market data, and token-wide analysis need a dedicated indexer.</p>
      </div>
      <div className={styles.tokenNoticeActions}><span className={styles.planned}>PLANNED</span><Link className={styles.retry} href="/dashboard">Search a wallet</Link></div>
    </article>
  </section>;
}
function DashboardSkeleton() {
  return <main className={styles.dashboard} aria-busy="true">
    <header className={styles.topbar}><Skeleton className="h-8 w-32 rounded-lg" /><Skeleton className="h-11 w-full max-w-[490px] rounded-lg" /></header>
    <section className={styles.hero}><div className="grid gap-3"><Skeleton className="h-4 w-28 rounded" /><Skeleton className="h-12 w-64 rounded-lg" /><Skeleton className="h-8 w-56 rounded-lg" /></div><Skeleton className="h-10 w-52 rounded-lg" /></section>
    <div className={styles.metrics}>{Array.from({ length: 4 }, (_, index) => <article className={styles.metric} key={index}><Skeleton className="h-3 w-20 rounded" /><Skeleton className="mt-3 h-8 w-28 rounded-lg" /></article>)}</div>
    <div className={styles.columns}><article className={styles.panel}><Skeleton className="h-5 w-36 rounded" /><Skeleton className="mt-8 h-24 w-full rounded-lg" /></article><article className={styles.panel}><Skeleton className="h-5 w-32 rounded" /><Skeleton className="mt-8 h-24 w-full rounded-lg" /></article></div>
  </main>;
}
export function DashboardScreen({ address: suppliedAddress }: { address?: string }) {
  const params = useParams<{ address?: string }>(); const searchParams = useSearchParams(); const router = useRouter();
  const address = suppliedAddress ?? params.address; const selectedTab = (searchParams.get('tab') ?? 'monitor') as Tab; const requestedTab: Tab = ['monitor', 'analyze', 'protect'].includes(selectedTab) ? selectedTab : 'monitor'; const selectedWindow = searchParams.get('window'); const window: Coverage['window'] = selectedWindow === '24h' || selectedWindow === '30d' ? selectedWindow : '7d';  const identity = useJson<AddressOverview>(address ? `/api/v1/address/${address}` : undefined);
  const isWallet = identity.data?.kind === 'wallet';
  const tab: Tab = !isWallet && requestedTab !== 'protect' ? 'monitor' : requestedTab;
  const activity = useJson<ActivityResponse>(address && identity.data?.kind === 'wallet' ? `/api/v1/address/${address}/activity?window=${window}` : undefined);
  const analysis = useJson<{ address: string; analysis: WalletAnalysis; coverage: ActivityResponse['coverage'] }>(address && identity.data?.kind === 'wallet' ? `/api/v1/address/${address}/analysis?window=${window}` : undefined);
  const title = useMemo(() => identity.data?.kind === 'token' ? 'Token Overview' : identity.data?.kind === 'wallet' ? 'Wallet Overview' : 'Address Check', [identity.data?.kind]);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [isPending, startTransition] = useTransition();
  const setTab = (next: Tab) => { if (next === tab) return; startTransition(() => router.replace('/dashboard/' + address + '?tab=' + next + '&window=' + window)); };
  if (!address) return <main className={styles.landing}>
    <div className={styles.landingGlow} aria-hidden="true" />
      <header className={styles.landingTop}><Link href="/" aria-label="Back to Cashper home" className={`wordmark ${styles.brand}`}><Ghost size={29} strokeWidth={2.5}/> <span aria-hidden="true">CASHPER</span></Link></header>
    <div className={styles.landingGrid}>
      <section className={styles.landingIntro}>
        <span className={`${styles.eyebrow} ${styles.solanaEyebrow}`}>ONCHAIN INTELLIGENCE · <SolanaMark /> SOLANA</span>
        <h1>See the signal<br/><em>behind the address.</em></h1>
        <p>Turn a public wallet or token address into a calmer, clearer view of what is happening on-chain.</p>
        <AddressSearch className={styles.landingSearch} showHint/>
        <div className={styles.landingMeta}><span><Check size={14}/> Public data only</span><span><Clock3 size={14}/> 24H · 7D · 30D views</span></div>
      </section>
      <aside className={styles.landingAside} aria-label="Cashper capabilities">
        <div className={styles.asideSticker} aria-hidden="true"><Image src="/cashper.png" width={1280} height={1280} alt="" /></div>
        <div className={styles.signalOrb}><span className={styles.orbRing}/><span className={styles.orbRing}/><span className={styles.orbCore}><Radar size={31}/></span><span className={styles.orbDot}/></div>
        <div className={styles.asideLabel}><span className={styles.liveDot}/> CASHPER intelligence</div>
        <h2>Public data.<br/><span>Clear context.</span></h2>
        <p>Start with an address. Monitor the facts, then understand the pattern.</p>
        <div className={styles.asideRows}><div><Database size={16}/><span>Monitor activity</span><Check size={15}/></div><div><Sparkles size={16}/><span>Analyze behavior</span><Check size={15}/></div><div><ShieldCheck size={16}/><span>Protect is coming</span><span className={styles.muted}>Soon</span></div></div>
      </aside>
    </div>
    <footer className={styles.landingFoot}><SolanaLabel>BUILT FOR SOLANA</SolanaLabel><span>NO WALLET CONNECTION REQUIRED</span><span>LESS NOISE · MORE CLARITY</span></footer>
  </main>;
  if (identity.loading) return <DashboardSkeleton />;
  if (identity.error || !identity.data) return <main className={styles.loading}><p>{identity.error ?? "We couldn't identify this address."}</p><Link className={styles.retry} href="/dashboard">Search another address</Link></main>;
  const overview = identity.data;
  const currentAddress = address;
  async function copyAddress() {
    try { await navigator.clipboard.writeText(currentAddress); setCopyState('copied'); }
    catch { setCopyState('error'); }
  }
  return <main className={styles.dashboard} aria-busy={isPending}>
    <header className={styles.topbar}><Link href="/" className={`wordmark ${styles.brand}`}><Ghost size={29} strokeWidth={2.5}/> CASHPER</Link><AddressSearch initial={address}/></header>
    <section className={styles.hero}><div><Link className={styles.back} href="/dashboard"><ArrowLeft size={16}/> New search</Link><span className={`${styles.eyebrow} ${styles.solanaEyebrow}`}><SolanaMark /> SOLANA {overview.kind === 'token' ? 'TOKEN' : overview.kind === 'wallet' ? 'WALLET' : 'ADDRESS'}</span><h1>{title}</h1><div className={styles.address}><code title={address}>{short(address, 7)}</code><button onClick={copyAddress} aria-label={copyState === 'copied' ? 'Address copied' : 'Copy address'}><Copy size={15}/></button>{copyState !== 'idle' && <output className={styles.copyFeedback + ' ' + (copyState === 'error' ? styles.copyError : '')} aria-live="polite">{copyState === 'copied' ? 'Copied' : 'Copy failed'}</output>}<a href={'https://explorer.solana.com/address/' + address} target="_blank" rel="noreferrer" aria-label="View on Solana Explorer"><ExternalLink size={15}/></a></div></div>{isWallet && <div className={styles.window} aria-busy={isPending}><span>WINDOW</span>{(['24h','7d','30d'] as const).map((item) => <button key={item} className={window === item ? styles.selected : ''} onClick={() => { startTransition(() => router.replace('/dashboard/' + address + '?tab=' + tab + '&window=' + item)); }} disabled={isPending} aria-pressed={window === item}>{item}</button>)}</div>}</section>
    <nav className={styles.tabs} aria-label="Product sections"><button className={tab === 'monitor' ? styles.selected : ''} onClick={() => setTab('monitor')} disabled={isPending} aria-current={tab === 'monitor' ? 'page' : undefined}><Radar size={16}/> Monitor</button><button className={!isWallet ? styles.disabledTab : tab === 'analyze' ? styles.selected : ''} onClick={() => isWallet && setTab('analyze')} disabled={!isWallet || isPending} aria-disabled={!isWallet} aria-current={tab === 'analyze' ? 'page' : undefined} title={!isWallet ? 'Analyze is currently available for wallet addresses.' : undefined}><Sparkles size={16}/> Analyze {!isWallet && <small>Wallets only</small>}</button><button className={tab === 'protect' ? styles.selected : ''} onClick={() => setTab('protect')} disabled={isPending} aria-current={tab === 'protect' ? 'page' : undefined}><ShieldCheck size={16}/> Protect <small>Coming soon</small></button></nav>
    {tab === 'protect' ? <section className={styles.protect}><ShieldCheck size={34}/><span className={styles.eyebrow}>PROTECT</span><h2>Coming Soon</h2><p>Understand potentially risky wallet interactions before taking action.</p><span>Risk awareness for on-chain activity.</span></section> : overview.kind === 'token' ? <TokenOverview overview={overview}/> : overview.kind !== 'wallet' ? <section className={styles.content}><article className={styles.lookupNotice} role="alert"><div><span className={styles.lookupNoticeLabel}>LOOKUP NEEDS A DIFFERENT ADDRESS</span><h2>{unsupportedAddressCopy(overview.kind).title}</h2><p>{unsupportedAddressCopy(overview.kind).body}</p></div><Link className={styles.retry} href="/dashboard">Search another address</Link></article></section> : tab === 'monitor' ? <Monitor key={address + ':' + window + ':' + (activity.data?.nextCursor ?? '')} overview={overview} activity={activity} analysis={analysis} address={currentAddress} window={window} onTabChange={setTab} onNewSearch={() => router.push('/dashboard')}/> : <Analyze analysis={analysis} onTabChange={setTab}/>}
  </main>;
}
