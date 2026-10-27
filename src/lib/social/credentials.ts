import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { RequestError } from "../auth/server";
function key() {
  const value = process.env.SOCIAL_CREDENTIALS_KEY;
  if (!value || !/^[0-9a-f]{64}$/i.test(value))
    throw new RequestError(
      "Cần cấu hình SOCIAL_CREDENTIALS_KEY trên server trước khi lưu hoặc xem thông tin đăng nhập.",
      503,
    );
  return Buffer.from(value, "hex");
}
export function sealCredentials(value: { username: string; password: string }) {
  // Store a versioned envelope so future key/encryption migrations can be explicit.
  const iv = randomBytes(12),
    actual = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    actual.update(JSON.stringify(value), "utf8"),
    actual.final(),
  ]);
  return [
    "v1",
    iv.toString("base64"),
    actual.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}
export function openCredentials(value: string): {
  username: string;
  password: string;
} {
  const parts = value.split(".");
  const [version, iv, tag, encrypted] = parts;
  const secret = key();
  try {
    if (
      parts.length !== 4 ||
      version !== "v1" ||
      Buffer.from(iv, "base64").length !== 12 ||
      Buffer.from(tag, "base64").length !== 16
    )
      throw new Error();
    const cipher = createDecipheriv(
      "aes-256-gcm",
      secret,
      Buffer.from(iv, "base64"),
      { authTagLength: 16 },
    );
    cipher.setAuthTag(Buffer.from(tag, "base64"));
    return JSON.parse(
      Buffer.concat([
        cipher.update(Buffer.from(encrypted, "base64")),
        cipher.final(),
      ]).toString("utf8"),
    );
  } catch {
    throw new RequestError(
      "Không giải mã được thông tin đăng nhập. Kiểm tra khóa mã hóa trên server.",
      503,
    );
  }
}
