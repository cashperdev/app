import { Hono } from 'hono';
import { analyzeWallet } from './analysis';
import { getAddressActivity, getAddressOverview } from './solana';
import { addressSchema, parseWindow } from './validation';

const requests = new Map<string, number[]>();

function meta(source: 'helius' | 'rpc', status: 'available' | 'partial' | 'unavailable', warnings: string[] = []) {
  return { generatedAt: new Date().toISOString(), source, status, warnings };
}

export const cashperApi = new Hono().basePath('/api/v1')
  .use('*', async (context, next) => {
    const ip = context.req.header('cf-connecting-ip') ?? context.req.header('x-forwarded-for')?.split(',')[0] ?? 'anonymous';
    const now = Date.now(); const windowStart = now - 60_000;
    const history = (requests.get(ip) ?? []).filter((timestamp) => timestamp > windowStart);
    if (history.length >= 30) return context.json({ error: 'Too many requests. Try again in a minute.' }, 429, { 'retry-after': '60' });
    history.push(now); requests.set(ip, history);
    await next();
  })
  .get('/address/:address', async (context) => {
    const parsed = addressSchema.safeParse(context.req.param('address'));
    if (!parsed.success) return context.json({ error: parsed.error.issues[0]?.message ?? 'Invalid address.' }, 400);
    try { const result = await getAddressOverview(parsed.data); return context.json({ data: result.overview, meta: meta(result.source, result.overview.kind === 'unknown' ? 'unavailable' : 'available') }); }
    catch { return context.json({ error: 'Solana data is taking longer than expected. Try again.' }, 503); }
  })
  .get('/address/:address/activity', async (context) => {
    const parsed = addressSchema.safeParse(context.req.param('address')); const window = parseWindow(context.req.query('window') ?? null);
    if (!parsed.success || !window.success) return context.json({ error: parsed.success ? 'Invalid time window.' : parsed.error.issues[0]?.message }, 400);
    try { const result = await getAddressActivity(parsed.data, window.data, context.req.query('cursor')); return context.json({ data: result.activity, meta: meta(result.source, result.activity.coverage.partial ? 'partial' : 'available', result.activity.coverage.partial ? ['Based on retrieved activity.'] : []) }); }
    catch { return context.json({ error: 'Detailed activity is temporarily unavailable. Try again.' }, 503); }
  })
  .get('/address/:address/analysis', async (context) => {
    const parsed = addressSchema.safeParse(context.req.param('address')); const window = parseWindow(context.req.query('window') ?? null);
    if (!parsed.success || !window.success) return context.json({ error: parsed.success ? 'Invalid time window.' : parsed.error.issues[0]?.message }, 400);
    try { const result = await getAddressActivity(parsed.data, window.data); const analysis = analyzeWallet(result.activity.activities, result.activity.coverage); return context.json({ data: { address: parsed.data, analysis, coverage: result.activity.coverage }, meta: meta(result.source, result.activity.coverage.partial ? 'partial' : 'available', result.activity.coverage.partial ? ['Based on retrieved activity.'] : []) }); }
    catch { return context.json({ error: 'Analysis is temporarily unavailable. Try again.' }, 503); }
  });
