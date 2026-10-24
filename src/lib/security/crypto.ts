/**
 * HacoLED Marketing OS — Enterprise Cryptographic & Privacy Firewall Engine
 * Implements:
 * - AES-256-GCM authenticated encryption with PBKDF2-HMAC-SHA256 (100,000 iterations)
 * - SHA-256 deterministic hashing for zero-PII deduplication & contact_token generation
 * - Analytics & URL PII Firewall (enforcing QA17, S07, B08-02, Law 91/2025/QH15)
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const ENVELOPE_PREFIX = "HCENC_V1";

function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error("Web Crypto API (crypto.subtle) is required for AES-256-GCM security.");
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Normalize Vietnamese phone numbers to canonical 10-digit format (e.g. +84 912.345.678 -> 0912345678)
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === "unknown") return "";
  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 11) {
    digits = "0" + digits.slice(2);
  }
  return digits;
}

/**
 * Normalize email to lowercase trimmed format
 */
export function normalizeEmail(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed === "unknown" || !trimmed.includes("@")) return "";
  return trimmed;
}

/**
 * Compute SHA-256 hex digest of any string
 */
export async function sha256Hex(input: string): Promise<string> {
  const subtle = getSubtleCrypto();
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Deterministic non-reversible contact token (for web_events.contact_token without exposing PII)
 */
export async function createContactToken(
  phoneOrEmail: string,
  orgSalt = "HACOLED_INTERNAL_SALT_V1"
): Promise<string> {
  const normPhone = normalizePhone(phoneOrEmail);
  const normMail = normalizeEmail(phoneOrEmail);
  const canonical = normPhone || normMail || phoneOrEmail.trim().toLowerCase();
  if (!canonical) return "anon_unlinked";
  const digest = await sha256Hex(`${orgSalt}:${canonical}`);
  return `ctk_${digest.slice(0, 16)}`;
}

async function deriveAesGcmKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const keyMaterial = await subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plaintext JSON/string using AES-256-GCM with PBKDF2-derived key
 */
export async function encryptVaultData(
  plaintext: string,
  passphrase: string
): Promise<{
  envelope: string;
  checksumSha256: string;
  encryptedAt: string;
  algorithm: "AES-256-GCM / PBKDF2-SHA256-100K";
}> {
  if (!passphrase || passphrase.length < 4) {
    throw new Error("Khóa bảo mật (Passphrase/PIN) phải có ít nhất 4 ký tự.");
  }
  const subtle = getSubtleCrypto();
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveAesGcmKey(passphrase, salt);

  const encodedPlaintext = new TextEncoder().encode(plaintext);
  const cipherBuffer = await subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    encodedPlaintext
  );

  const cipherBytes = new Uint8Array(cipherBuffer);
  const checksumSha256 = await sha256Hex(plaintext);
  const envelope = [
    ENVELOPE_PREFIX,
    bytesToBase64(salt),
    bytesToBase64(iv),
    bytesToBase64(cipherBytes),
    checksumSha256,
  ].join(":");

  return {
    envelope,
    checksumSha256,
    encryptedAt: new Date().toISOString(),
    algorithm: "AES-256-GCM / PBKDF2-SHA256-100K",
  };
}

/**
 * Decrypt and verify integrity of an AES-256-GCM encrypted envelope
 */
export async function decryptVaultData(
  envelope: string,
  passphrase: string
): Promise<{
  plaintext: string;
  verifiedChecksum: boolean;
}> {
  const parts = envelope.trim().split(":");
  if (parts.length !== 5 || parts[0] !== ENVELOPE_PREFIX) {
    throw new Error("Định dạng gói mã hóa không hợp lệ hoặc đã bị can thiệp.");
  }
  const [, saltB64, ivB64, cipherB64, expectedChecksum] = parts;
  const salt = base64ToBytes(saltB64);
  const iv = base64ToBytes(ivB64);
  const cipherBytes = base64ToBytes(cipherB64);

  const subtle = getSubtleCrypto();
  const key = await deriveAesGcmKey(passphrase, salt);

  let plainBuffer: ArrayBuffer;
  try {
    plainBuffer = await subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource },
      key,
      cipherBytes as unknown as BufferSource
    );
  } catch {
    throw new Error(
      "Giải mã thất bại: Sai khóa bảo mật (Passphrase) hoặc dữ liệu đã bị thay đổi trái phép."
    );
  }

  const plaintext = new TextDecoder().decode(plainBuffer);
  const actualChecksum = await sha256Hex(plaintext);
  if (actualChecksum !== expectedChecksum) {
    throw new Error("Cảnh báo bảo mật: Checksum SHA-256 không khớp sau giải mã.");
  }

  return {
    plaintext,
    verifiedChecksum: true,
  };
}

/**
 * PII Firewall for Analytics Events & URLs (Enforces QA17 & S07: No PII in GA4/Analytics)
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?84|0)(?:\d[\s.-]?){8,10}\d/g;
const FORBIDDEN_PII_KEYS = new Set([
  "phone",
  "phone_normalized",
  "phone_number",
  "tel",
  "mobile",
  "email",
  "email_normalized",
  "full_name",
  "display_name",
  "customer_name",
  "contact_name",
  "address",
  "cccd",
  "cmnd",
  "password",
  "token",
]);

export function sanitizeAnalyticsPayload<T extends Record<string, unknown>>(
  payload: T
): {
  sanitized: Record<string, unknown>;
  piiRemovedCount: number;
  blockedKeys: string[];
} {
  const sanitized: Record<string, unknown> = {};
  const blockedKeys: string[] = [];
  let piiRemovedCount = 0;

  for (const [key, rawVal] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_PII_KEYS.has(lowerKey)) {
      blockedKeys.push(key);
      piiRemovedCount++;
      continue;
    }

    if (typeof rawVal === "string") {
      let cleaned = rawVal;
      if (EMAIL_REGEX.test(cleaned)) {
        cleaned = cleaned.replace(EMAIL_REGEX, "[REDACTED_EMAIL]");
        piiRemovedCount++;
      }
      if (PHONE_REGEX.test(cleaned)) {
        cleaned = cleaned.replace(PHONE_REGEX, "[REDACTED_PHONE]");
        piiRemovedCount++;
      }
      sanitized[key] = cleaned;
    } else {
      sanitized[key] = rawVal;
    }
  }

  return { sanitized, piiRemovedCount, blockedKeys };
}

/**
 * Validate and build safe UTM URL (Enforces B08-02 & QA17):
 * 1. Never attaches UTM to internal website links (to prevent overwriting GA4 session source).
 * 2. Strips any accidental PII in query parameters.
 */
export function buildSafePublicationUrl(params: {
  targetUrl: string;
  isInternalNavigation: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}): {
  finalUrl: string;
  isAllowed: boolean;
  warning?: string;
} {
  const {
    targetUrl,
    isInternalNavigation,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
  } = params;

  if (isInternalNavigation) {
    // B08-02: Không gắn UTM vào link nội bộ website để tránh sai nguồn
    const cleanUrl = targetUrl.split("?")[0];
    return {
      finalUrl: cleanUrl,
      isAllowed: true,
      warning:
        "Đã tự động lược bỏ UTM vì đây là liên kết nội bộ trên website (Quy tắc B08-02).",
    };
  }

  let urlObj: URL;
  try {
    urlObj = new URL(
      targetUrl.startsWith("http")
        ? targetUrl
        : `https://hacoled.com/${targetUrl.replace(/^\/+/, "")}`
    );
  } catch {
    return {
      finalUrl: "",
      isAllowed: false,
      warning: "URL đích không hợp lệ.",
    };
  }

  // Remove any accidental PII query parameters
  for (const key of Array.from(urlObj.searchParams.keys())) {
    const val = urlObj.searchParams.get(key) || "";
    if (
      FORBIDDEN_PII_KEYS.has(key.toLowerCase()) ||
      EMAIL_REGEX.test(val) ||
      PHONE_REGEX.test(val)
    ) {
      urlObj.searchParams.delete(key);
    }
  }

  if (utmSource) urlObj.searchParams.set("utm_source", utmSource.trim());
  if (utmMedium) urlObj.searchParams.set("utm_medium", utmMedium.trim());
  if (utmCampaign) urlObj.searchParams.set("utm_campaign", utmCampaign.trim());
  if (utmContent) urlObj.searchParams.set("utm_content", utmContent.trim());

  return {
    finalUrl: urlObj.toString(),
    isAllowed: true,
  };
}
