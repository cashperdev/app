export type AddressKind = 'wallet' | 'token' | 'token_account' | 'unsupported' | 'unknown';

export type SectionStatus = 'available' | 'partial' | 'unavailable';

export type ActivityType =
  | 'SOL_TRANSFER'
  | 'TOKEN_TRANSFER'
  | 'PROGRAM_INTERACTION'
  | 'UNKNOWN';

export type Direction = 'IN' | 'OUT' | 'SELF';

export interface CashperAsset {
  mint: string;
  symbol?: string;
  name?: string;
  decimals: number;
  rawAmount: string;
  uiAmount: string;
}

export interface CashperActivity {
  id: string;
  signature: string;
  type: ActivityType;
  direction?: Direction;
  timestamp: number | null;
  asset?: CashperAsset;
  counterparty?: string;
  program?: { address: string; name?: string };
}

export interface Coverage {
  window: '24h' | '7d' | '30d';
  from: number;
  to: number;
  retrievedTransactions: number;
  limit: number;
  partial: boolean;
}

export interface ApiMeta {
  generatedAt: string;
  source: 'helius' | 'rpc';
  status: SectionStatus;
  warnings: string[];
}

export interface AddressOverview {
  address: string;
  kind: AddressKind;
  owner?: string;
  solBalance?: CashperAsset;
  tokenAssets?: CashperAsset[];
  token?: {
    decimals: number;
    supply: CashperAsset;
    name?: string;
    symbol?: string;
  };
}

export interface ActivityResponse {
  address: string;
  activities: CashperActivity[];
  nextCursor?: string;
  coverage: Coverage;
}

export interface WalletAnalysis {
  firstSeen?: { timestamp: number; label: string; estimated: true };
  transactionCount: number;
  activityLevel?: 'LOW' | 'MODERATE' | 'ACTIVE';
  solFlow: { inLamports: string; outLamports: string; netLamports: string };
  tokenFlow: Array<{ mint: string; decimals: number; inRaw: string; outRaw: string }>;
  activityBreakdown: Record<ActivityType, number>;
  topPrograms: Array<{ address: string; name?: string; interactions: number }>;
  insights: Array<{ title: string; body: string }>;
  summary: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}
