declare module 'speakeasy' {
  export interface GenerateSecretOptions {
    name?: string;
    issuer?: string;
    length?: number;
  }

  export interface GenerateSecretResult {
    base32: string;
    otpauth_url?: string;
  }

  export function generateSecret(options: GenerateSecretOptions): GenerateSecretResult;

  export interface VerifyOptions {
    secret: string;
    encoding?: string;
    token: string;
    window?: number;
  }

  export function verify(options: VerifyOptions): boolean;

  export interface GenerateTokenOptions {
    secret: string;
    encoding?: string;
  }

  export function generateCurrentToken(options: GenerateTokenOptions): string;
}
