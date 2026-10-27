import "server-only";
import { database, RequestError } from "./server";
import { verifyPassword } from "./password";

// Small internal team: verify salted hashes rather than storing an additional
// fast, deterministic password lookup that would weaken offline protection.
export async function uniquePasswordSnapshot(
  password: string,
  excludeId?: string,
) {
  const [row] = await database()`SELECT COALESCE(
    jsonb_agg(jsonb_build_object('id', id, 'password_hash', password_hash) ORDER BY id),
    '[]'::jsonb) AS credentials FROM app_members`;
  const credentials = row.credentials as {
    id: string;
    password_hash: string;
  }[];
  for (const member of credentials) {
    if (
      member.id !== excludeId &&
      (await verifyPassword(password, member.password_hash))
    ) {
      throw new RequestError(
        "Mật khẩu này đã được cấp cho thành viên khác. Hãy chọn mật khẩu riêng.",
        409,
      );
    }
  }
  // The write compares this snapshot under the account transaction lock.
  // Concurrent password changes cannot slip through the duplicate check.
  return JSON.stringify(credentials);
}
