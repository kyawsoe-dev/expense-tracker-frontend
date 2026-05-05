const STORAGE_SECRET =
  process.env.NEXT_PUBLIC_STORAGE_SECRET || "expense-tracker-web";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }

  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function createKeyStream(length: number, salt: Uint8Array): Uint8Array {
  const secretBytes = encoder.encode(STORAGE_SECRET);
  const stream = new Uint8Array(length);

  for (let i = 0; i < length; i += 1) {
    const secretByte = secretBytes[i % secretBytes.length] ?? 0;
    const saltByte = salt[i % salt.length] ?? 0;
    stream[i] = (secretByte + saltByte + i * 17) % 256;
  }

  return stream;
}

export function encryptPayload(value: string): string {
  const salt = new Uint8Array(12);
  crypto.getRandomValues(salt);
  const input = encoder.encode(value);
  const keyStream = createKeyStream(input.length, salt);
  const cipher = new Uint8Array(salt.length + input.length);

  cipher.set(salt, 0);
  for (let i = 0; i < input.length; i += 1) {
    cipher[salt.length + i] = input[i] ^ keyStream[i];
  }

  return toBase64(cipher);
}

export function decryptPayload(value: string): string {
  const payload = fromBase64(value);
  if (payload.length <= 12) {
    throw new Error("Invalid encrypted payload");
  }

  const salt = payload.slice(0, 12);
  const cipher = payload.slice(12);
  const keyStream = createKeyStream(cipher.length, salt);
  const plain = new Uint8Array(cipher.length);

  for (let i = 0; i < cipher.length; i += 1) {
    plain[i] = cipher[i] ^ keyStream[i];
  }

  return decoder.decode(plain);
}

export const encryptedStorage = {
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(key);
    if (!value) return null;
    try {
      return decryptPayload(value);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, encryptPayload(value));
  },
  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

export function setEncryptedCookie(name: string, value: string, maxAgeDays = 7) {
  if (typeof document === "undefined") return;
  const maxAge = Math.max(0, Math.floor(maxAgeDays * 24 * 60 * 60));
  document.cookie = `${name}=${encodeURIComponent(encryptPayload(value))}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function getEncryptedCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) return null;

  const value = decodeURIComponent(cookie.split("=").slice(1).join("="));
  try {
    return decryptPayload(value);
  } catch {
    return null;
  }
}

export function removeCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}
