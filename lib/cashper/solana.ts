import { cached } from './cache';
import { windowStart } from './validation';
import type { ActivityResponse, AddressOverview, AddressKind, CashperActivity, CashperAsset, Coverage } from './types';

const SYSTEM_PROGRAM = '11111111111111111111111111111111';
const TOKEN_PROGRAMS = new Set(['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'TokenzQdYhAHwi5X88tq8R8zZKDLQ9ZCxgLrnu8yQZB']);
const KNOWN_PROGRAMS: Record<string, string> = {
  'JUP6LkbZbjS1jkkw8T4K8W7HYh8mJ2NvCJKdUMWZ5zP': 'Jupiter',
  '675kPX9MHTjS2zt1qfr1NYHuzefQwSkKAnYQn3oS7GJY': 'Raydium',
  [SYSTEM_PROGRAM]: 'System Program',
};

type RpcResult<T> = { result?: T; error?: { message?: string } };
type AccountInfo = { owner: string; data?: { parsed?: { type?: string; info?: Record<string, unknown> } } } | null;
type SignatureInfo = { signature: string; blockTime: number | null; err: unknown };
type ParsedTransaction = { transaction: { message: { accountKeys: Array<{ pubkey: string }>; instructions: Array<{ programId?: string }> } }; meta: { err: unknown; preBalances: number[]; postBalances: number[]; preTokenBalances?: TokenBalance[]; postTokenBalances?: TokenBalance[] } | null; blockTime: number | null };
type TokenBalance = { owner?: string; mint: string; uiTokenAmount: { amount: string; decimals: number; uiAmountString?: string } };

function rpcUrls() {
  const custom = process.env.SOLANA_RPC_URL;
  const helius = process.env.HELIUS_API_KEY;
  const fallback = process.env.SOLANA_FALLBACK_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
  let primary = helius ? `https://mainnet.helius-rpc.com/?api-key=${helius}` : fallback;
  if (custom) {
    const url = new URL(custom);
    if (helius && url.hostname.endsWith('helius-rpc.com') && !url.searchParams.has('api-key')) url.searchParams.set('api-key', helius);
    primary = url.toString();
  }
  return [...new Set([primary, fallback])];
}

function source() { return process.env.HELIUS_API_KEY ? 'helius' as const : 'rpc' as const; }

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  let lastError: unknown;
  for (const endpoint of rpcUrls()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }), signal: controller.signal });
      if (!response.ok) throw new Error(`RPC responded with ${response.status}`);
      const payload = await response.json() as RpcResult<T>;
      if (payload.error) throw new Error(payload.error.message ?? 'RPC request failed');
      return payload.result as T;
    } catch (error) {
      lastError = error;
    } finally { clearTimeout(timeout); }
  }
  throw lastError instanceof Error ? lastError : new Error('Solana RPC unavailable');
}

function asAsset(mint: string, rawAmount: string, decimals: number, symbol?: string): CashperAsset {
  const normalized = rawAmount.padStart(decimals + 1, '0');
  const integer = decimals ? normalized.slice(0, -decimals) : normalized;
  const fraction = decimals ? normalized.slice(-decimals).replace(/0+$/, '') : '';
  return { mint, symbol, decimals, rawAmount, uiAmount: fraction ? `${integer}.${fraction}` : integer };
}

export async function getAddressOverview(address: string): Promise<{ overview: AddressOverview; source: ReturnType<typeof source> }> {
  return cached(`overview:${address}`, 15, async () => {
    const account = await rpc<{ value: AccountInfo }>('getAccountInfo', [address, { encoding: 'jsonParsed', commitment: 'finalized' }]);
    const value = account.value;
    if (!value) return { overview: { address, kind: 'unknown' as AddressKind }, source: source() };
    const parsed = typeof value.data === 'object' && value.data ? (value.data as { parsed?: { type?: string; info?: Record<string, unknown> } }).parsed : undefined;
    const accountType = parsed?.type;
    if (TOKEN_PROGRAMS.has(value.owner) && accountType === 'mint') {
      const info = parsed?.info ?? {};
      const decimals = Number(info.decimals ?? 0);
      const supply = typeof info.supply === 'string' ? info.supply : '0';
      return { overview: { address, kind: 'token', owner: value.owner, token: { decimals, supply: asAsset(address, supply, decimals) } }, source: source() };
    }
    if (TOKEN_PROGRAMS.has(value.owner) && accountType === 'account') return { overview: { address, kind: 'token_account', owner: value.owner }, source: source() };
    if (value.owner !== SYSTEM_PROGRAM) return { overview: { address, kind: 'unsupported', owner: value.owner }, source: source() };

    const [balance, legacyTokens, token2022] = await Promise.all([
      rpc<{ value: number }>('getBalance', [address, { commitment: 'finalized' }]),
      rpc<{ value: Array<{ account: { data: { parsed: { info: { mint: string; tokenAmount: { amount: string; decimals: number } } } } } }> }>('getTokenAccountsByOwner', [address, { programId: [...TOKEN_PROGRAMS][0] }, { encoding: 'jsonParsed' }]),
      rpc<{ value: Array<{ account: { data: { parsed: { info: { mint: string; tokenAmount: { amount: string; decimals: number } } } } } }> }>('getTokenAccountsByOwner', [address, { programId: [...TOKEN_PROGRAMS][1] }, { encoding: 'jsonParsed' }]),
    ]);
    const tokens = [...legacyTokens.value, ...token2022.value].map((item) => item.account.data.parsed.info).filter((item) => item.tokenAmount.amount !== '0').map((item) => asAsset(item.mint, item.tokenAmount.amount, item.tokenAmount.decimals));
    return { overview: { address, kind: 'wallet', owner: value.owner, solBalance: asAsset('So11111111111111111111111111111111111111111', String(balance.value), 9, 'SOL'), tokenAssets: tokens }, source: source() };
  });
}

async function withConcurrency<T, R>(items: T[], worker: (item: T) => Promise<R>, max = 4) {
  const output: R[] = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(max, items.length) }, async () => {
    while (next < items.length) { const index = next++; output[index] = await worker(items[index]); }
  }));
  return output;
}

function normalizeTransaction(address: string, signature: string, transaction: ParsedTransaction, timestamp: number | null): CashperActivity[] {
  if (!transaction?.meta || transaction.meta.err) return [];
  const { meta } = transaction;
  const accountIndex = transaction.transaction.message.accountKeys.findIndex((item) => item.pubkey === address);
  const activities: CashperActivity[] = [];
  if (accountIndex >= 0) {
    const delta = BigInt(meta.postBalances[accountIndex] ?? 0) - BigInt(meta.preBalances[accountIndex] ?? 0);
    if (delta !== BigInt(0)) activities.push({ id: `${signature}:sol`, signature, type: 'SOL_TRANSFER', direction: delta > BigInt(0) ? 'IN' : 'OUT', timestamp, asset: asAsset('So11111111111111111111111111111111111111111', (delta < BigInt(0) ? -delta : delta).toString(), 9, 'SOL') });
  }
  const tokenDeltas = new Map<string, { decimals: number; before: bigint; after: bigint }>();
  for (const balance of meta.preTokenBalances ?? []) if (balance.owner === address) tokenDeltas.set(balance.mint, { decimals: balance.uiTokenAmount.decimals, before: BigInt(balance.uiTokenAmount.amount), after: BigInt(0) });
  for (const balance of meta.postTokenBalances ?? []) if (balance.owner === address) { const item = tokenDeltas.get(balance.mint) ?? { decimals: balance.uiTokenAmount.decimals, before: BigInt(0), after: BigInt(0) }; item.after += BigInt(balance.uiTokenAmount.amount); tokenDeltas.set(balance.mint, item); }
  for (const [mint, item] of tokenDeltas) { const delta = item.after - item.before; if (delta !== BigInt(0)) activities.push({ id: `${signature}:${mint}`, signature, type: 'TOKEN_TRANSFER', direction: delta > BigInt(0) ? 'IN' : 'OUT', timestamp, asset: asAsset(mint, (delta < BigInt(0) ? -delta : delta).toString(), item.decimals) }); }
  const programIds = [...new Set(transaction.transaction.message.instructions.map((item) => item.programId).filter((item): item is string => typeof item === 'string'))];
  for (const programId of programIds) activities.push({ id: `${signature}:program:${programId}`, signature, type: 'PROGRAM_INTERACTION', timestamp, program: { address: programId, name: KNOWN_PROGRAMS[programId] } });
  if (!activities.length) activities.push({ id: `${signature}:unknown`, signature, type: 'UNKNOWN', timestamp });
  return activities;
}

export async function getAddressActivity(address: string, window: Coverage['window'], cursor?: string): Promise<{ activity: ActivityResponse; source: ReturnType<typeof source> }> {
  const from = windowStart(window); const to = Math.floor(Date.now() / 1000); const limit = 100;
  return cached(`activity:${address}:${window}:${cursor ?? ''}`, 60, async () => {
    const signatures = await rpc<SignatureInfo[]>('getSignaturesForAddress', [address, { limit, before: cursor, commitment: 'finalized' }]);
    const relevant = signatures.filter((item) => !item.err && (!item.blockTime || item.blockTime >= from));
    const transactions = await withConcurrency(relevant, async (item) => ({ item, transaction: await rpc<ParsedTransaction | null>('getTransaction', [item.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'finalized' }]).catch(() => null) }));
    const activities = transactions.flatMap(({ item, transaction }) => transaction ? normalizeTransaction(address, item.signature, transaction, transaction.blockTime ?? item.blockTime) : []);
    const last = signatures.at(-1);
    const partial = signatures.length === limit || Boolean(last?.blockTime && last.blockTime >= from);
    return { activity: { address, activities, nextCursor: signatures.length === limit ? last?.signature : undefined, coverage: { window, from, to, retrievedTransactions: relevant.length, limit, partial } }, source: source() };
  });
}
