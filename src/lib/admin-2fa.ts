import * as speakeasy from 'speakeasy';

export interface Admin2FAData {
  secret: string;
  otpauthUrl: string;
}

function normalizeBase32Secret(secret: string): string {
  return secret.replace(/\s+/g, '').replace(/=+$/g, '').toUpperCase();
}

function decodeBase32(secret: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = normalizeBase32Secret(secret);
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

function counterToBytes(counter: number): Uint8Array {
  const bytes = new Uint8Array(8);
  let remaining = Math.floor(counter);

  for (let i = 7; i >= 0; i -= 1) {
    bytes[i] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }

  return bytes;
}

async function generateTotp(secret: string, time = Date.now()): Promise<string> {
  const stepSeconds = 30;
  const digits = 6;
  const counter = Math.floor(time / 1000 / stepSeconds);
  const keyBytes = decodeBase32(secret);
  const keyBuffer = keyBytes.slice().buffer as ArrayBuffer;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );

  const hmac = new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      counterToBytes(counter).slice().buffer as ArrayBuffer,
    ),
  );
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 10 ** digits).padStart(digits, '0');
}

// Generate new secret for admin
export function generateAdminSecret(email: string): Admin2FAData {
  const secret = speakeasy.generateSecret({
    name: `ExpenseTracker Admin (${email})`,
    issuer: 'ExpenseTracker',
    length: 20,
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url!,
  };
}

// Verify TOTP token in the browser without relying on Node crypto polyfills
export async function verifyAdminToken(
  token: string,
  secret: string,
): Promise<boolean> {
  const normalizedToken = token.replace(/\D/g, '').slice(0, 6);
  const normalizedSecret = normalizeBase32Secret(secret);
  const windows = [-2, -1, 0, 1, 2];

  for (const window of windows) {
    const candidate = await generateTotp(
      normalizedSecret,
      Date.now() + window * 30_000,
    );
    if (candidate === normalizedToken) {
      return true;
    }
  }

  return false;
}

// Generate current TOTP (for testing/setup)
export async function generateCurrentToken(secret: string): Promise<string> {
  return generateTotp(secret);
}
