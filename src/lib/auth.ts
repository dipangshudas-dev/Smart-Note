import { cookies } from 'next/headers';
import crypto from 'crypto';
import { User } from '@/types';

const SESSION_COOKIE = 'smart_note_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'smart_note_secure_tamper_proof_signing_key_2026';

export interface SessionData {
  userId: string;
  name: string;
  role: 'admin' | 'staff';
  iat: number; // Issued At timestamp
}

/**
 * Creates a cryptographically signed HMAC-SHA256 token
 * Prevents cookie forgery and tampering.
 */
function signPayload(payload: string): string {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${hmac}`;
}

/**
 * Verifies the HMAC-SHA256 signature using timing-safe equality
 * Returns payload only if signature is valid.
 */
function verifyAndExtract(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [b64Payload, signature] = parts;
    const payload = Buffer.from(b64Payload, 'base64url').toString('utf-8');
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const validPayload = verifyAndExtract(sessionToken);
  if (!validPayload) return null;

  try {
    const parsed = JSON.parse(validPayload) as SessionData;
    // Expire sessions older than 7 days
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.iat > sevenDaysInMs) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function setSession(user: User): Promise<void> {
  const cookieStore = cookies();
  const sessionData: SessionData = {
    userId: user.id,
    name: user.name,
    role: user.role,
    iat: Date.now(),
  };

  const signedToken = signPayload(JSON.stringify(sessionData));

  cookieStore.set(SESSION_COOKIE, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE);
}
