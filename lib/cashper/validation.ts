import bs58 from 'bs58';
import { z } from 'zod';

export const addressSchema = z
  .string()
  .trim()
  .min(32, "That doesn't look like a valid Solana address.")
  .max(44, "That doesn't look like a valid Solana address.")
  .refine((value) => {
    try {
      return bs58.decode(value).length === 32;
    } catch {
      return false;
    }
  }, "That doesn't look like a valid Solana address.");

export const windowSchema = z.enum(['24h', '7d', '30d']).default('7d');

export function parseWindow(value: string | null) {
  return windowSchema.safeParse(value ?? '7d');
}

export function windowStart(window: z.infer<typeof windowSchema>) {
  const hours = window === '24h' ? 24 : window === '7d' ? 24 * 7 : 24 * 30;
  return Math.floor(Date.now() / 1000) - hours * 60 * 60;
}
