import type { CashperActivity, Coverage, WalletAnalysis } from './types';

const ZERO = BigInt(0);
const LAMPORTS_PER_SOL = BigInt(1_000_000_000);

export const ACTIVITY_THRESHOLDS = { moderatePerDay: 1, activePerDay: 10 } as const;

function formatSol(lamports: bigint) {
  const sign = lamports < ZERO ? '-' : '';
  const absolute = lamports < ZERO ? -lamports : lamports;
  const whole = absolute / LAMPORTS_PER_SOL;
  const fraction = (absolute % LAMPORTS_PER_SOL).toString().padStart(9, '0').slice(0, 4).replace(/0+$/, '');
  return `${sign}${whole}${fraction ? `.${fraction}` : ''} SOL`;
}

export function analyzeWallet(activities: CashperActivity[], coverage: Coverage): WalletAnalysis {
  let solIn = ZERO;
  let solOut = ZERO;
  const tokenFlows = new Map<string, { decimals: number; inRaw: bigint; outRaw: bigint }>();
  const activityBreakdown: WalletAnalysis['activityBreakdown'] = {
    SOL_TRANSFER: 0,
    TOKEN_TRANSFER: 0,
    PROGRAM_INTERACTION: 0,
    UNKNOWN: 0,
  };
  const programs = new Map<string, { name?: string; interactions: number }>();

  for (const activity of activities) {
    activityBreakdown[activity.type] += 1;
    if (activity.type === 'SOL_TRANSFER' && activity.asset) {
      const amount = BigInt(activity.asset.rawAmount);
      if (activity.direction === 'IN') solIn += amount;
      if (activity.direction === 'OUT') solOut += amount;
    }
    if (activity.type === 'TOKEN_TRANSFER' && activity.asset) {
      const existing = tokenFlows.get(activity.asset.mint) ?? { decimals: activity.asset.decimals, inRaw: ZERO, outRaw: ZERO };
      const amount = BigInt(activity.asset.rawAmount);
      if (activity.direction === 'IN') existing.inRaw += amount;
      if (activity.direction === 'OUT') existing.outRaw += amount;
      tokenFlows.set(activity.asset.mint, existing);
    }
    if (activity.program) {
      const existing = programs.get(activity.program.address) ?? { name: activity.program.name, interactions: 0 };
      existing.interactions += 1;
      programs.set(activity.program.address, existing);
    }
  }

  const days = Math.max(1, (coverage.to - coverage.from) / 86_400);
  const perDay = activities.length / days;
  const activityLevel = coverage.partial
    ? undefined
    : perDay >= ACTIVITY_THRESHOLDS.activePerDay
      ? 'ACTIVE'
      : perDay >= ACTIVITY_THRESHOLDS.moderatePerDay
        ? 'MODERATE'
        : 'LOW';
  const firstTimestamp = activities.reduce<number | undefined>((oldest, item) =>
    item.timestamp && (!oldest || item.timestamp < oldest) ? item.timestamp : oldest, undefined);
  const net = solIn - solOut;
  const dominant = Object.entries(activityBreakdown).sort((a, b) => b[1] - a[1])[0];
  const insights: WalletAnalysis['insights'] = [];
  if (activities.length) insights.push({ title: 'RETRIEVED ACTIVITY', body: `${activities.length} activity records were found in this period.` });
  if (net !== ZERO) insights.push({ title: net > ZERO ? 'NET SOL INFLOW' : 'NET SOL OUTFLOW', body: `${formatSol(net < ZERO ? -net : net)} ${net > ZERO ? 'more received than sent' : 'more sent than received'} in retrieved activity.` });
  if (coverage.partial) insights.push({ title: 'PARTIAL COVERAGE', body: 'Results reached the retrieval limit; totals only reflect retrieved activity.' });

  const summary = activities.length === 0
    ? 'No on-chain activity was found in the selected period.'
    : `Retrieved activity is primarily ${dominant?.[0].replaceAll('_', ' ').toLowerCase() ?? 'unclassified'}.${net !== ZERO ? ` Net SOL flow is ${formatSol(net)}.` : ''}${coverage.partial ? ' This summary is based on partial retrieved activity.' : ''}`;

  return {
    firstSeen: firstTimestamp ? { timestamp: firstTimestamp, label: 'Earliest retrieved activity', estimated: true } : undefined,
    transactionCount: new Set(activities.map((item) => item.signature)).size,
    activityLevel,
    solFlow: { inLamports: solIn.toString(), outLamports: solOut.toString(), netLamports: net.toString() },
    tokenFlow: [...tokenFlows.entries()].map(([mint, value]) => ({ mint, decimals: value.decimals, inRaw: value.inRaw.toString(), outRaw: value.outRaw.toString() })),
    activityBreakdown,
    topPrograms: [...programs.entries()].map(([address, value]) => ({ address, ...value })).sort((a, b) => b.interactions - a.interactions).slice(0, 6),
    insights,
    summary,
  };
}
