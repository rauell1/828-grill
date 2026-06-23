import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.AUTH_SECRET ?? 'dev-secret-828-grill-change-in-production';
export const COOKIE_NAME = '828-session';
export const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function signToken(userId: string): string {
  const ts = Date.now().toString(36);
  const payload = `${userId}.${ts}`;
  const sig = createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): string | null {
  try {
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return null;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const expected = createHmac('sha256', SECRET).update(payload).digest('base64url');
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return payload.split('.')[0]; // userId is the first segment
  } catch {
    return null;
  }
}
