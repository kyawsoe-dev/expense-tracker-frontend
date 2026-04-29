import speakeasy from 'speakeasy';

export interface Admin2FAData {
  secret: string;
  otpauthUrl: string;
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

// Verify TOTP token
export function verifyAdminToken(token: string, secret: string): boolean {
  return speakeasy.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow some time drift
  });
}

// Generate current TOTP (for testing/setup)
export function generateCurrentToken(secret: string): string {
  return speakeasy.generateCurrentToken({
    secret,
    encoding: 'base32',
  });
}
