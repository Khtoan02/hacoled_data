import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [algorithm, salt, hex] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !hex || !/^[a-f0-9]{128}$/.test(hex))
    return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(hex, "hex"), actual);
}

export function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 12 && value.length <= 128;
}
